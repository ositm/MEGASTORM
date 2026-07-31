import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import {
    OPEN_PARTNER_APPLICATION_STATUSES,
    PartnerApplicationInput,
    PartnerDocument,
    buildPartnerReference,
    partnerApplicationInputSchema,
    partnerDisplayName,
} from '@lablink/core';
import { adminApp, adminDb } from './firebase-admin';
import { HttpError } from './orders';
import { EmailAttachment, sendEmail } from './notifications';
import {
    escapeHtml,
    renderApplicantAcknowledgement,
    renderPartnerDossier,
    renderPartnerDossierDocument,
} from './partner-dossier';

// ---------------------------------------------------------------------------
// Partner (laboratory) onboarding.
//
// Applications are server-written only: the client uploads its documents to
// Storage under its own uid, then POSTs the form. This module validates it,
// stores the case in `partner_applications`, raises it on the admin dashboard,
// and emails the formatted dossier — documents attached — to the ops inbox.
//
// Approval creates (or updates, when claiming an existing listing) the
// `labs/{labId}` record and grants the applicant `lab_admin` scoped to it.
// ---------------------------------------------------------------------------

/** Where completed applications are delivered. Overridable per environment. */
const OPS_INBOX = process.env.PARTNER_APPLICATIONS_EMAIL || 'healthesphere@gmail.com';

/** Resend caps a message at 40MB; stay well under once base64 inflates ~33%. */
const MAX_TOTAL_ATTACHMENT_BYTES = 18 * 1024 * 1024;

const COLLECTION = 'partner_applications';

function adminAppUrl(path: string): string {
    const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    return base ? `${base}${path}` : '';
}

/**
 * Downloads uploaded documents so they ride along with the email. Files are
 * fetched through their tokened download URLs, so no bucket wiring is needed.
 * Oversized or unreachable files are skipped — the dossier still links them.
 */
async function collectAttachments(documents: PartnerDocument[]): Promise<EmailAttachment[]> {
    const attachments: EmailAttachment[] = [];
    let total = 0;

    for (const doc of documents) {
        if (total + doc.size > MAX_TOTAL_ATTACHMENT_BYTES) continue;
        try {
            const res = await fetch(doc.fileUrl);
            if (!res.ok) {
                console.error('Could not fetch partner document for attachment:', doc.storagePath, res.status);
                continue;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            if (total + buffer.byteLength > MAX_TOTAL_ATTACHMENT_BYTES) continue;
            total += buffer.byteLength;
            attachments.push({ filename: doc.fileName, content: buffer.toString('base64') });
        } catch (e) {
            console.error('Attachment download failed:', doc.storagePath, e);
        }
    }
    return attachments;
}

/** Raises the new application in every platform admin's notification feed. */
async function notifyAdmins(reference: string, facilityName: string): Promise<void> {
    const db = adminDb();
    const admins = await db.collection('users').where('role', '==', 'admin').get();
    if (admins.empty) return;

    const batch = db.batch();
    admins.forEach((admin) => {
        batch.set(db.collection('notifications').doc(), {
            userId: admin.id,
            message: `New partner application from ${facilityName} (${reference}).`,
            link: '/admin/partners',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
}

export interface SubmitPartnerApplicationResult {
    id: string;
    reference: string;
    /** False when no email provider is configured — the case is still queued. */
    emailed: boolean;
}

/**
 * Validates and files a partner application. Rejects a second submission while
 * one is still open so the review queue holds one live case per applicant.
 */
export async function submitPartnerApplication(
    applicant: { uid: string; email: string },
    input: unknown
): Promise<SubmitPartnerApplicationResult> {
    const parsed = partnerApplicationInputSchema.safeParse(input);
    if (!parsed.success) {
        const first = parsed.error.errors[0];
        throw new HttpError(400, first ? `${first.path.join('.')}: ${first.message}` : 'Invalid application.');
    }
    const application: PartnerApplicationInput = parsed.data;

    const db = adminDb();
    const open = await db
        .collection(COLLECTION)
        .where('applicantUid', '==', applicant.uid)
        .where('status', 'in', OPEN_PARTNER_APPLICATION_STATUSES)
        .limit(1)
        .get();
    if (!open.empty) {
        throw new HttpError(409, 'You already have an application awaiting review.');
    }

    // Every document must live under this applicant's own Storage prefix —
    // otherwise a caller could attach someone else's uploads to their case.
    const prefix = `partner_applications/${applicant.uid}/`;
    const stray = application.documents.find((d) => !d.storagePath.startsWith(prefix));
    if (stray) {
        throw new HttpError(400, 'Uploaded documents must belong to your own application.');
    }

    // Claiming an existing listing only works if that listing exists.
    const existingLabId = application.facility.existingLabId?.trim() || null;
    if (existingLabId) {
        const lab = await db.collection('labs').doc(existingLabId).get();
        if (!lab.exists) throw new HttpError(400, 'The lab you selected is no longer listed.');
    }

    const ref = db.collection(COLLECTION).doc();
    const submittedAt = new Date();
    const reference = buildPartnerReference(ref.id, submittedAt);

    await ref.set({
        ...application,
        facility: { ...application.facility, existingLabId: existingLabId ?? '' },
        reference,
        status: 'submitted',
        applicantUid: applicant.uid,
        applicantEmail: applicant.email,
        submittedAt: FieldValue.serverTimestamp(),
    });

    // Everything below is best-effort: the case is already in the queue, and a
    // mail outage must not cost the applicant their submission.
    let emailed = false;
    try {
        const attachments = await collectAttachments(application.documents);
        const meta = {
            reference,
            submittedAt,
            applicantEmail: applicant.email,
            applicantUid: applicant.uid,
            reviewUrl: adminAppUrl('/admin/partners'),
            attachedFileNames: attachments.map((a) => a.filename),
        };
        const facilityName = partnerDisplayName(application.facility);

        emailed = await sendEmail({
            to: OPS_INBOX,
            replyTo: application.contact.contactEmail,
            subject: `New partner application — ${facilityName} (${reference})`,
            html: renderPartnerDossier(application, meta),
            attachments: [
                {
                    filename: `partner-application-${reference}.html`,
                    content: Buffer.from(renderPartnerDossierDocument(application, meta), 'utf8').toString('base64'),
                },
                ...attachments,
            ],
        });

        await sendEmail({
            to: application.contact.contactEmail,
            subject: `We've received your LabLink application (${reference})`,
            html: renderApplicantAcknowledgement(application, meta),
        });

        await ref.update({ opsEmailSent: emailed, opsEmailedAt: FieldValue.serverTimestamp() });
    } catch (e) {
        console.error('Partner application email failed:', reference, e);
    }

    try {
        await notifyAdmins(reference, partnerDisplayName(application.facility));
    } catch (e) {
        console.error('Could not notify admins of partner application:', reference, e);
    }

    return { id: ref.id, reference, emailed };
}

/** Builds the `labs/{labId}` payload an approved application publishes. */
function labProfileFrom(application: PartnerApplicationInput): Record<string, unknown> {
    const { facility, contact, location, operations, regulatory } = application;
    const address = [location.street, location.city, location.state]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(', ');

    return {
        name: partnerDisplayName(facility),
        legalName: facility.legalName,
        partnerType: facility.partnerType,
        rcNumber: facility.rcNumber,
        address,
        city: location.city,
        lga: location.lga,
        state: location.state,
        landmark: location.landmark || '',
        ...(typeof location.latitude === 'number' && typeof location.longitude === 'number'
            ? { latitude: location.latitude, longitude: location.longitude }
            : {}),
        phone: contact.contactPhone,
        email: contact.contactEmail,
        website: facility.website || '',
        openingHours: {
            weekday: operations.weekdayHours,
            saturday: operations.saturdayHours || '',
            sunday: operations.sundayHours || '',
        },
        acceptsWalkIns: operations.acceptsWalkIns,
        acceptsHomeCollection: operations.acceptsHomeCollection,
        standardTurnaroundHours: operations.standardTurnaroundHours,
        testCategories: operations.testCategories,
        accreditations: regulatory.accreditations,
        licence: {
            mlscnNumber: regulatory.mlscnLicenceNumber,
            expiry: regulatory.licenceExpiry,
            premisesPermitNumber: regulatory.premisesPermitNumber || '',
        },
        labDirector: {
            name: regulatory.directorName,
            registrationNumber: regulatory.directorRegistrationNumber,
            email: regulatory.directorEmail,
            phone: regulatory.directorPhone,
        },
        verified: true,
        status: 'active',
    };
}

/**
 * Admin decision on a partner application. `approve` publishes the facility as
 * a lab, grants the applicant `lab_admin` scoped to it, and mirrors the role
 * onto their user doc. `reject` records the decision and the reason. The
 * applicant is emailed either way.
 */
export async function decidePartnerApplication(
    applicationId: string,
    action: 'approve' | 'reject',
    decidedBy: string,
    note?: string
): Promise<{ labId?: string }> {
    const db = adminDb();
    const ref = db.collection(COLLECTION).doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Application not found');

    const stored = snap.data()!;
    if (stored.status === 'approved' || stored.status === 'rejected') {
        throw new HttpError(409, 'This application has already been decided.');
    }

    const application = stored as unknown as PartnerApplicationInput;
    const facilityName = partnerDisplayName(application.facility);
    const contactEmail = application.contact?.contactEmail || stored.applicantEmail;

    if (action === 'reject') {
        await ref.update({
            status: 'rejected',
            decidedAt: FieldValue.serverTimestamp(),
            decidedBy,
            decisionNote: note || '',
        });

        await sendEmail({
            to: contactEmail,
            subject: `Update on your LabLink partner application (${stored.reference})`,
            html: `<p>Hello,</p>
                   <p>Thank you for your interest in joining the LabLink network with <strong>${escapeHtml(facilityName)}</strong>.
                   After reviewing your application (reference ${escapeHtml(stored.reference)}), we're unable to approve it at this time.</p>
                   ${note ? `<p><strong>Reviewer note:</strong> ${escapeHtml(note)}</p>` : ''}
                   <p>You're welcome to reapply once the outstanding items are resolved — just reply to this email if you'd like guidance.</p>
                   <p>— The LabLink partnerships team</p>`,
        });
        return {};
    }

    if (!stored.applicantUid) {
        throw new HttpError(400, 'Application is missing its applicant account.');
    }

    const existingLabId = application.facility?.existingLabId?.trim();
    const labRef = existingLabId ? db.collection('labs').doc(existingLabId) : db.collection('labs').doc();

    // Never overwrite a claimed lab's curated test catalog.
    await labRef.set(
        {
            ...labProfileFrom(application),
            partnerApplicationId: applicationId,
            updatedAt: FieldValue.serverTimestamp(),
            ...(existingLabId ? {} : { createdAt: FieldValue.serverTimestamp(), tests: [] }),
        },
        { merge: true }
    );

    // The custom claim is what the rules and lab endpoints actually trust.
    await getAuth(adminApp()).setCustomUserClaims(stored.applicantUid, {
        role: 'lab_admin',
        labId: labRef.id,
    });
    await db.collection('users').doc(stored.applicantUid).set(
        { role: 'lab_admin', labId: labRef.id },
        { merge: true }
    );
    await db.collection('labs').doc(labRef.id).collection('staff').doc(stored.applicantUid).set(
        {
            uid: stored.applicantUid,
            email: stored.applicantEmail || contactEmail,
            role: 'lab_admin',
            addedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    await ref.update({
        status: 'approved',
        labId: labRef.id,
        decidedAt: FieldValue.serverTimestamp(),
        decidedBy,
        decisionNote: note || '',
    });

    const portalUrl = process.env.NEXT_PUBLIC_LAB_APP_URL || '';
    await sendEmail({
        to: contactEmail,
        subject: `${facilityName} is now live on LabLink`,
        html: `<p>Hello,</p>
               <p>Great news — <strong>${escapeHtml(facilityName)}</strong> has been approved and is now part of the LabLink network
               (reference ${escapeHtml(stored.reference)}).</p>
               <p>Sign in with <strong>${escapeHtml(stored.applicantEmail || contactEmail)}</strong> to set up your test catalog and pricing,
               invite your staff, and start receiving orders.</p>
               ${portalUrl ? `<p><a href="${escapeHtml(portalUrl)}">Open your lab portal</a></p>` : ''}
               <p>— The LabLink partnerships team</p>`,
    });

    return { labId: labRef.id };
}

/** Marks an application as actively being reviewed (queue hygiene). */
export async function markPartnerApplicationUnderReview(applicationId: string, adminUid: string): Promise<void> {
    const ref = adminDb().collection(COLLECTION).doc(applicationId);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'Application not found');
    if (snap.data()!.status !== 'submitted') return;
    await ref.update({ status: 'under_review', reviewerUid: adminUid });
}

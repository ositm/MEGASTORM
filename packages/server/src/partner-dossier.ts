import {
    PARTNER_DOCUMENT_LABELS,
    PARTNER_TYPE_LABELS,
    PartnerApplicationInput,
    PartnerDocument,
    partnerDisplayName,
} from '@lablink/core';

// ---------------------------------------------------------------------------
// Renders a submitted partner application as a self-contained, printable
// document. The same markup is used twice: inline as the email body, and as an
// .html attachment the ops team can archive or print to PDF. Everything is
// table-based with inline styles because email clients strip <style> blocks
// and ignore flex/grid.
// ---------------------------------------------------------------------------

const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const BRAND = '#2563eb';

export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Human date in the operating timezone; falls back to the raw value. */
function formatDate(value: string | Date, withTime = false): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' } : {}),
        timeZone: 'Africa/Lagos',
    }).format(date);
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const dash = (value: unknown): string => {
    const text = String(value ?? '').trim();
    return text.length ? escapeHtml(text) : `<span style="color:${MUTED}">—</span>`;
};

/** One label/value row of a section table. */
function row(label: string, value: string, opts: { wide?: boolean } = {}): string {
    return `<tr>
      <td style="padding:9px 16px 9px 0;vertical-align:top;width:${opts.wide ? '34%' : '38%'};color:${MUTED};font-size:13px;border-bottom:1px solid ${LINE};">${escapeHtml(label)}</td>
      <td style="padding:9px 0;vertical-align:top;color:${INK};font-size:13px;font-weight:600;border-bottom:1px solid ${LINE};">${value}</td>
    </tr>`;
}

function section(index: number, title: string, rows: string): string {
    return `<tr><td style="padding:26px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr><td colspan="2" style="padding-bottom:10px;">
          <span style="display:inline-block;min-width:22px;height:22px;line-height:22px;text-align:center;background:${BRAND};color:#ffffff;border-radius:11px;font-size:12px;font-weight:700;">${index}</span>
          <span style="margin-left:10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${INK};">${escapeHtml(title)}</span>
        </td></tr>
        ${rows}
      </table>
    </td></tr>`;
}

function documentRows(documents: PartnerDocument[], attachedNames: Set<string>): string {
    if (!documents.length) {
        return row('Documents', `<span style="color:#b91c1c">None uploaded</span>`);
    }
    return documents
        .map((doc) => {
            const label = PARTNER_DOCUMENT_LABELS[doc.type] || doc.type;
            const attached = attachedNames.has(doc.fileName)
                ? `<span style="color:#15803d;font-weight:600;">attached to this email</span>`
                : `<span style="color:${MUTED};">link only — too large to attach</span>`;
            return row(
                label,
                `<a href="${escapeHtml(doc.fileUrl)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(doc.fileName)}</a>
                 <div style="font-weight:400;color:${MUTED};font-size:12px;margin-top:3px;">${formatBytes(doc.size)} · ${attached}</div>`
            );
        })
        .join('');
}

export interface DossierMeta {
    reference: string;
    submittedAt: Date;
    applicantEmail: string;
    applicantUid: string;
    /** Deep link to the admin review queue. */
    reviewUrl?: string;
    /** File names that were successfully attached to the email. */
    attachedFileNames?: string[];
}

/**
 * The dossier body (an email-safe table). `renderPartnerDossierDocument`
 * wraps this in a full HTML page for the attachment.
 */
export function renderPartnerDossier(application: PartnerApplicationInput, meta: DossierMeta): string {
    const { facility, contact, location, operations, regulatory, declaration, documents } = application;
    const attached = new Set(meta.attachedFileNames ?? []);
    const name = partnerDisplayName(facility);

    const services = [
        operations.acceptsWalkIns ? 'Walk-in patients' : null,
        operations.acceptsHomeCollection ? 'Home collection' : null,
    ].filter(Boolean).join(' · ') || 'Not stated';

    const coordinates =
        typeof location.latitude === 'number' && typeof location.longitude === 'number'
            ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
               <div style="font-weight:400;margin-top:3px;"><a href="https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}" style="color:${BRAND};text-decoration:none;font-size:12px;">Open in Google Maps</a></div>`
            : `<span style="color:#b45309;">Not pinned — set coordinates before the lab goes live in search</span>`;

    return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:24px 12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="680" style="max-width:680px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">

      <!-- Header -->
      <tr><td style="background:${INK};padding:26px 32px;">
        <div style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">LabLink · Partner onboarding</div>
        <div style="color:#ffffff;font-size:23px;font-weight:700;margin-top:8px;">New partner application</div>
        <div style="color:#cbd5e1;font-size:13px;margin-top:6px;">
          Reference <strong style="color:#ffffff;font-family:'SFMono-Regular',Consolas,monospace;">${escapeHtml(meta.reference)}</strong>
          &nbsp;·&nbsp; Submitted ${escapeHtml(formatDate(meta.submittedAt, true))}
        </div>
      </td></tr>

      <!-- Applicant summary -->
      <tr><td style="padding:22px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
          <tr><td style="padding:16px 18px;">
            <div style="font-size:18px;font-weight:700;color:${INK};">${escapeHtml(name)}</div>
            <div style="font-size:13px;color:#1d4ed8;margin-top:4px;">
              ${escapeHtml(PARTNER_TYPE_LABELS[facility.partnerType] || facility.partnerType)}
              &nbsp;·&nbsp; ${escapeHtml(location.city)}, ${escapeHtml(location.state)}
            </div>
            <div style="font-size:13px;color:${MUTED};margin-top:10px;">
              ${escapeHtml(contact.contactName)} (${escapeHtml(contact.contactRole)})
              &nbsp;·&nbsp; ${escapeHtml(contact.contactEmail)}
              &nbsp;·&nbsp; ${escapeHtml(contact.contactPhone)}
            </div>
            ${facility.existingLabId
                ? `<div style="margin-top:10px;font-size:12px;color:#92400e;background:#fef3c7;border-radius:6px;padding:8px 10px;">Claiming an existing LabLink listing (<code>${escapeHtml(facility.existingLabId)}</code>) — approval updates that lab rather than creating a new one.</div>`
                : ''}
          </td></tr>
        </table>
      </td></tr>

      ${section(1, 'Facility & registration', [
          row('Registered (legal) name', dash(facility.legalName)),
          row('Trading name', dash(facility.tradingName)),
          row('Facility type', dash(PARTNER_TYPE_LABELS[facility.partnerType] || facility.partnerType)),
          row('CAC / RC number', dash(facility.rcNumber)),
          row('Tax identification number', dash(facility.tin)),
          row('Year established', dash(facility.yearEstablished)),
          row('Website', facility.website ? `<a href="${escapeHtml(facility.website)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(facility.website)}</a>` : dash('')),
      ].join(''))}

      ${section(2, 'Primary contact', [
          row('Full name', dash(contact.contactName)),
          row('Position', dash(contact.contactRole)),
          row('Email', `<a href="mailto:${escapeHtml(contact.contactEmail)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(contact.contactEmail)}</a>`),
          row('Phone', dash(contact.contactPhone)),
          row('Operations email', dash(contact.supportEmail)),
          row('Operations phone', dash(contact.supportPhone)),
          row('LabLink account', `${escapeHtml(meta.applicantEmail)}<div style="font-weight:400;color:${MUTED};font-size:12px;margin-top:3px;">uid ${escapeHtml(meta.applicantUid)}</div>`),
      ].join(''))}

      ${section(3, 'Location & access', [
          row('Street address', dash(location.street)),
          row('City / town', dash(location.city)),
          row('LGA', dash(location.lga)),
          row('State', dash(location.state)),
          row('Nearest landmark', dash(location.landmark)),
          row('Map coordinates', coordinates),
      ].join(''))}

      ${section(4, 'Regulatory & leadership', [
          row('MLSCN facility licence', dash(regulatory.mlscnLicenceNumber)),
          row('Licence expiry', dash(formatDate(regulatory.licenceExpiry))),
          row('State premises permit', dash(regulatory.premisesPermitNumber)),
          row('Accreditations', dash(regulatory.accreditations.join(', '))),
          row('Laboratory director', dash(regulatory.directorName)),
          row('Director registration no.', dash(regulatory.directorRegistrationNumber)),
          row('Director email', dash(regulatory.directorEmail)),
          row('Director phone', dash(regulatory.directorPhone)),
      ].join(''))}

      ${section(5, 'Operating capability', [
          row('Test categories', dash(operations.testCategories.join(' · '))),
          row('Daily sample capacity', dash(`${operations.dailySampleCapacity} samples/day`)),
          row('Standard turnaround', dash(`${operations.standardTurnaroundHours} hours`)),
          row('Licensed scientists on staff', dash(operations.licensedScientists)),
          row('Services offered', dash(services)),
          row('Opening hours', `Mon–Fri: ${dash(operations.weekdayHours)}<div style="font-weight:400;color:${MUTED};font-size:12px;margin-top:3px;">Sat: ${dash(operations.saturdayHours)} · Sun: ${dash(operations.sundayHours)}</div>`),
          row('Key equipment / analysers', dash(operations.equipment)),
      ].join(''))}

      ${section(6, 'Supporting documents', documentRows(documents, attached))}

      ${section(7, 'Declaration', [
          row('Authorised signatory', dash(declaration.signatoryName)),
          row('Position', dash(declaration.signatoryPosition)),
          row('Accuracy confirmed', declaration.confirmedAccuracy ? '<span style="color:#15803d;">Yes</span>' : '<span style="color:#b91c1c;">No</span>'),
          row('Partner terms accepted', declaration.agreedToTerms ? '<span style="color:#15803d;">Yes</span>' : '<span style="color:#b91c1c;">No</span>'),
          row('Signed on', dash(formatDate(meta.submittedAt, true))),
      ].join(''))}

      <!-- Action -->
      <tr><td style="padding:28px 32px 32px 32px;">
        ${meta.reviewUrl
            ? `<a href="${escapeHtml(meta.reviewUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;">Review in the admin dashboard</a>`
            : ''}
        <div style="margin-top:18px;padding-top:16px;border-top:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:1.6;">
          This application is already queued in your admin dashboard under <strong>Partner applications</strong> — approving there grants the applicant lab-admin access and publishes the facility.
          <br />This document contains confidential business and regulatory information. Handle accordingly.
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>`;
}

/** The same dossier wrapped as a standalone, printable HTML file. */
export function renderPartnerDossierDocument(application: PartnerApplicationInput, meta: DossierMeta): string {
    const title = `LabLink partner application — ${partnerDisplayName(application.facility)} (${meta.reference})`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; background: #f1f5f9; }
  @media print { body { background: #ffffff; } a { color: ${INK} !important; } }
</style>
</head>
<body>
${renderPartnerDossier(application, meta)}
</body>
</html>`;
}

/** Short plain-text digest used for the applicant acknowledgement email. */
export function renderApplicantAcknowledgement(
    application: PartnerApplicationInput,
    meta: DossierMeta
): string {
    const name = partnerDisplayName(application.facility);
    return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9;padding:24px 12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
      <tr><td style="background:${INK};padding:24px 30px;">
        <div style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">LabLink</div>
        <div style="color:#ffffff;font-size:21px;font-weight:700;margin-top:8px;">We've received your application</div>
      </td></tr>
      <tr><td style="padding:26px 30px;color:${INK};font-size:14px;line-height:1.7;">
        <p style="margin:0 0 14px 0;">Hello ${escapeHtml(application.contact.contactName)},</p>
        <p style="margin:0 0 14px 0;">
          Thank you for applying to join the LabLink network with <strong>${escapeHtml(name)}</strong>.
          Our team is now verifying your facility's registration, licensing and documents.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid ${LINE};border-radius:10px;margin:6px 0 18px 0;">
          <tr><td style="padding:14px 16px;font-size:13px;color:${MUTED};">
            Your reference
            <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:17px;font-weight:700;color:${INK};margin-top:4px;">${escapeHtml(meta.reference)}</div>
          </td></tr>
        </table>
        <p style="margin:0 0 14px 0;">
          Verification usually takes <strong>2–5 business days</strong>. We'll email you as soon as a decision is made, and
          may contact you on ${escapeHtml(application.contact.contactPhone)} if we need anything else.
          Once approved, this account unlocks your lab portal — orders, results, staff and pricing.
        </p>
        <p style="margin:0;color:${MUTED};font-size:13px;">— The LabLink partnerships team</p>
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

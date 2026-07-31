'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { collection, doc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
    NIGERIAN_STATES,
    OPEN_PARTNER_APPLICATION_STATUSES,
    PARTNER_ACCREDITATIONS,
    PARTNER_DOCUMENT_ACCEPT,
    PARTNER_DOCUMENT_MAX_BYTES,
    PARTNER_DOCUMENT_SPECS,
    PARTNER_TEST_CATEGORIES,
    PARTNER_TYPES,
    PARTNER_TYPE_LABELS,
    PartnerApplicationInput,
    PartnerDocument,
    PartnerDocumentType,
    PartnerType,
    partnerApplicationInputSchema,
    partnerContactSchema,
    partnerDeclarationSchema,
    partnerFacilitySchema,
    partnerLocationSchema,
    partnerOperationsSchema,
    partnerRegulatorySchema,
} from '@lablink/core';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { submitPartnerApplicationViaApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Building2,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    Loader2,
    MapPin,
    Send,
    ShieldCheck,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// The partner (lab) onboarding wizard.
//
// One continuous flow: create the account if needed, capture the facility's
// identity, location, regulatory standing and capability, upload the
// supporting documents, then review and sign. Documents upload as soon as
// they're chosen so the final submit is a single fast request, and the draft
// is mirrored to localStorage so a refresh never costs the applicant work.
// ---------------------------------------------------------------------------

const DRAFT_KEY = 'lablink:partner-application:v1';

interface Draft {
    partnerType: PartnerType;
    legalName: string;
    tradingName: string;
    rcNumber: string;
    tin: string;
    yearEstablished: string;
    website: string;
    existingLabId: string;
    existingLabName: string;

    contactName: string;
    contactRole: string;
    contactEmail: string;
    contactPhone: string;
    supportEmail: string;
    supportPhone: string;

    street: string;
    city: string;
    lga: string;
    state: string;
    landmark: string;
    latitude: number | null;
    longitude: number | null;

    weekdayHours: string;
    saturdayHours: string;
    sundayHours: string;
    acceptsWalkIns: boolean;
    acceptsHomeCollection: boolean;
    dailySampleCapacity: string;
    standardTurnaroundHours: string;
    licensedScientists: string;
    testCategories: string[];
    equipment: string;

    mlscnLicenceNumber: string;
    licenceExpiry: string;
    premisesPermitNumber: string;
    accreditations: string[];
    directorName: string;
    directorRegistrationNumber: string;
    directorEmail: string;
    directorPhone: string;

    signatoryName: string;
    signatoryPosition: string;
    confirmedAccuracy: boolean;
    agreedToTerms: boolean;
}

const EMPTY_DRAFT: Draft = {
    partnerType: 'laboratory',
    legalName: '',
    tradingName: '',
    rcNumber: '',
    tin: '',
    yearEstablished: '',
    website: '',
    existingLabId: '',
    existingLabName: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    contactPhone: '',
    supportEmail: '',
    supportPhone: '',
    street: '',
    city: '',
    lga: '',
    state: '',
    landmark: '',
    latitude: null,
    longitude: null,
    weekdayHours: '08:00 – 17:00',
    saturdayHours: '09:00 – 14:00',
    sundayHours: 'Closed',
    acceptsWalkIns: true,
    acceptsHomeCollection: true,
    dailySampleCapacity: '',
    standardTurnaroundHours: '24',
    licensedScientists: '',
    testCategories: [],
    equipment: '',
    mlscnLicenceNumber: '',
    licenceExpiry: '',
    premisesPermitNumber: '',
    accreditations: [],
    directorName: '',
    directorRegistrationNumber: '',
    directorEmail: '',
    directorPhone: '',
    signatoryName: '',
    signatoryPosition: '',
    confirmedAccuracy: false,
    agreedToTerms: false,
};

/** An upload in flight or finished; `doc` is set once Storage has the file. */
interface UploadState {
    fileName: string;
    size: number;
    progress: number;
    error?: string;
    doc?: PartnerDocument;
}

type Uploads = Partial<Record<PartnerDocumentType, UploadState>>;

type Errors = Record<string, string>;

interface StepDef {
    id: string;
    title: string;
    blurb: string;
    icon: typeof Building2;
}

const ACCOUNT_STEP: StepDef = {
    id: 'account',
    title: 'Your account',
    blurb: 'This becomes the admin login for your lab portal.',
    icon: ShieldCheck,
};

const STEPS: StepDef[] = [
    { id: 'facility', title: 'Facility', blurb: 'How your laboratory is registered.', icon: Building2 },
    { id: 'location', title: 'Location', blurb: 'Where patients and couriers will find you.', icon: MapPin },
    { id: 'regulatory', title: 'Licensing', blurb: 'Your regulatory standing and laboratory director.', icon: ShieldCheck },
    { id: 'operations', title: 'Capability', blurb: 'What you run, how fast, and how much.', icon: ClipboardCheck },
    { id: 'documents', title: 'Documents', blurb: 'Proof of registration and licensing.', icon: FileText },
    { id: 'review', title: 'Review & sign', blurb: 'Check everything, then submit.', icon: Send },
];

/** Maps zod issues onto flat field keys the inputs can look up. */
function toErrors(error: z.ZodError): Errors {
    const out: Errors = {};
    for (const issue of error.errors) {
        const key = String(issue.path[issue.path.length - 1] ?? 'form');
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}

const num = (raw: string): number => (raw.trim() === '' ? NaN : Number(raw));
const trimmed = (raw: string) => raw.trim();

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

export function PartnerApplicationForm() {
    const { auth, firestore, storage, user, isUserLoading } = useFirebase();

    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [uploads, setUploads] = useState<Uploads>({});
    const [stepIndex, setStepIndex] = useState(0);
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<{ reference: string; emailed: boolean } | null>(null);
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [openApplication, setOpenApplication] = useState<{ reference: string; status: string } | null>(null);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const topRef = useRef<HTMLDivElement>(null);

    // Account-creation state (only used while signed out).
    const [accountEmail, setAccountEmail] = useState('');
    const [accountPassword, setAccountPassword] = useState('');
    const [accountName, setAccountName] = useState('');
    const [creatingAccount, setCreatingAccount] = useState(false);

    const steps = useMemo(() => (user ? STEPS : [ACCOUNT_STEP, ...STEPS]), [user]);
    const step = steps[Math.min(stepIndex, steps.length - 1)];

    const set = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: '' } : prev));
    }, []);

    // --- Draft persistence -------------------------------------------------
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(DRAFT_KEY);
            if (saved) setDraft({ ...EMPTY_DRAFT, ...(JSON.parse(saved) as Partial<Draft>) });
        } catch {
            /* a corrupt draft is not worth surfacing — start fresh */
        }
        setDraftLoaded(true);
    }, []);

    useEffect(() => {
        if (!draftLoaded) return;
        try {
            window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch {
            /* storage full or blocked — the form still works in-memory */
        }
    }, [draft, draftLoaded]);

    // Prefill from the signed-in account so nothing is typed twice.
    useEffect(() => {
        if (!user) return;
        setDraft((prev) => ({
            ...prev,
            contactEmail: prev.contactEmail || user.email || '',
            contactName: prev.contactName || user.displayName || '',
        }));
    }, [user]);

    // --- One open application per applicant --------------------------------
    useEffect(() => {
        if (isUserLoading) return;
        if (!user || !firestore) {
            setCheckingExisting(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDocs(
                    query(
                        collection(firestore, 'partner_applications'),
                        where('applicantUid', '==', user.uid),
                        where('status', 'in', [...OPEN_PARTNER_APPLICATION_STATUSES]),
                        limit(1)
                    )
                );
                if (!cancelled && !snap.empty) {
                    const data = snap.docs[0].data();
                    setOpenApplication({ reference: data.reference, status: data.status });
                }
            } catch (e) {
                console.error('Could not check for an existing application:', e);
            } finally {
                if (!cancelled) setCheckingExisting(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user, firestore, isUserLoading]);

    // --- Existing-listing lookup (claiming a lab already on LabLink) -------
    const [labSearch, setLabSearch] = useState('');
    const [labOptions, setLabOptions] = useState<{ id: string; name: string; address?: string }[]>([]);

    useEffect(() => {
        if (!firestore) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDocs(collection(firestore, 'labs'));
                if (cancelled) return;
                setLabOptions(
                    snap.docs.map((d) => ({ id: d.id, name: d.data().name || 'Unnamed lab', address: d.data().address }))
                );
            } catch (e) {
                console.error('Could not load existing labs:', e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [firestore]);

    const labMatches = useMemo(() => {
        const term = labSearch.trim().toLowerCase();
        if (term.length < 2) return [];
        return labOptions.filter((l) => l.name.toLowerCase().includes(term)).slice(0, 5);
    }, [labSearch, labOptions]);

    // --- Section payload builders -----------------------------------------
    const facilityPayload = () => ({
        partnerType: draft.partnerType,
        legalName: trimmed(draft.legalName),
        tradingName: trimmed(draft.tradingName),
        rcNumber: trimmed(draft.rcNumber),
        tin: trimmed(draft.tin),
        yearEstablished: num(draft.yearEstablished),
        website: trimmed(draft.website),
        existingLabId: trimmed(draft.existingLabId),
    });

    const contactPayload = () => ({
        contactName: trimmed(draft.contactName),
        contactRole: trimmed(draft.contactRole),
        contactEmail: trimmed(draft.contactEmail),
        contactPhone: trimmed(draft.contactPhone),
        supportEmail: trimmed(draft.supportEmail),
        supportPhone: trimmed(draft.supportPhone),
    });

    const locationPayload = () => ({
        street: trimmed(draft.street),
        city: trimmed(draft.city),
        lga: trimmed(draft.lga),
        state: trimmed(draft.state),
        landmark: trimmed(draft.landmark),
        ...(draft.latitude !== null && draft.longitude !== null
            ? { latitude: draft.latitude, longitude: draft.longitude }
            : {}),
    });

    const operationsPayload = () => ({
        weekdayHours: trimmed(draft.weekdayHours),
        saturdayHours: trimmed(draft.saturdayHours),
        sundayHours: trimmed(draft.sundayHours),
        acceptsWalkIns: draft.acceptsWalkIns,
        acceptsHomeCollection: draft.acceptsHomeCollection,
        dailySampleCapacity: num(draft.dailySampleCapacity),
        standardTurnaroundHours: num(draft.standardTurnaroundHours),
        licensedScientists: num(draft.licensedScientists),
        testCategories: draft.testCategories,
        equipment: trimmed(draft.equipment),
    });

    const regulatoryPayload = () => ({
        mlscnLicenceNumber: trimmed(draft.mlscnLicenceNumber),
        licenceExpiry: draft.licenceExpiry,
        premisesPermitNumber: trimmed(draft.premisesPermitNumber),
        accreditations: draft.accreditations,
        directorName: trimmed(draft.directorName),
        directorRegistrationNumber: trimmed(draft.directorRegistrationNumber),
        directorEmail: trimmed(draft.directorEmail),
        directorPhone: trimmed(draft.directorPhone),
    });

    const declarationPayload = () => ({
        signatoryName: trimmed(draft.signatoryName),
        signatoryPosition: trimmed(draft.signatoryPosition),
        confirmedAccuracy: draft.confirmedAccuracy,
        agreedToTerms: draft.agreedToTerms,
    });

    const uploadedDocuments = (): PartnerDocument[] =>
        PARTNER_DOCUMENT_SPECS.map((spec) => uploads[spec.type]?.doc).filter(
            (d): d is PartnerDocument => !!d
        );

    // --- Step validation ---------------------------------------------------
    const validateStep = (id: string): boolean => {
        let result: z.SafeParseReturnType<any, any> | null = null;

        if (id === 'facility') {
            const facility = partnerFacilitySchema.safeParse(facilityPayload());
            const contact = partnerContactSchema.safeParse(contactPayload());
            const merged: Errors = {
                ...(facility.success ? {} : toErrors(facility.error)),
                ...(contact.success ? {} : toErrors(contact.error)),
            };
            setErrors(merged);
            return Object.keys(merged).length === 0;
        }
        if (id === 'location') result = partnerLocationSchema.safeParse(locationPayload());
        if (id === 'regulatory') result = partnerRegulatorySchema.safeParse(regulatoryPayload());
        if (id === 'operations') result = partnerOperationsSchema.safeParse(operationsPayload());
        if (id === 'review') result = partnerDeclarationSchema.safeParse(declarationPayload());

        if (id === 'documents') {
            const missing = PARTNER_DOCUMENT_SPECS.filter((s) => s.required && !uploads[s.type]?.doc);
            const pending = PARTNER_DOCUMENT_SPECS.filter(
                (s) => uploads[s.type] && !uploads[s.type]?.doc && !uploads[s.type]?.error
            );
            if (pending.length) {
                setErrors({ documents: 'Please wait for your uploads to finish.' });
                return false;
            }
            if (missing.length) {
                setErrors({ documents: `Still needed: ${missing.map((m) => m.label).join(', ')}.` });
                return false;
            }
            setErrors({});
            return true;
        }

        if (!result) return true;
        if (result.success) {
            setErrors({});
            return true;
        }
        setErrors(toErrors(result.error));
        return false;
    };

    const goTo = (index: number) => {
        setStepIndex(index);
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const next = () => {
        if (!validateStep(step.id)) {
            toast.error('Please fix the highlighted fields.');
            return;
        }
        goTo(Math.min(stepIndex + 1, steps.length - 1));
    };

    const back = () => {
        setErrors({});
        goTo(Math.max(stepIndex - 1, 0));
    };

    // --- Account creation (signed-out applicants) --------------------------
    const createAccount = async () => {
        if (!auth || !firestore) return;
        if (!accountName.trim()) return setErrors({ accountName: 'Please enter your full name.' });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(accountEmail.trim()))
            return setErrors({ accountEmail: 'Enter a valid work email address.' });
        if (accountPassword.length < 8)
            return setErrors({ accountPassword: 'Use at least 8 characters.' });

        setCreatingAccount(true);
        setErrors({});
        try {
            const credential = await createUserWithEmailAndPassword(auth, accountEmail.trim(), accountPassword);
            await updateProfile(credential.user, { displayName: accountName.trim() });
            // Plain user until an admin approves the application and grants lab_admin.
            await setDoc(
                doc(firestore, 'users', credential.user.uid),
                {
                    uid: credential.user.uid,
                    email: accountEmail.trim(),
                    displayName: accountName.trim(),
                    role: 'user',
                },
                { merge: true }
            );
            setDraft((prev) => ({
                ...prev,
                contactName: prev.contactName || accountName.trim(),
                contactEmail: prev.contactEmail || accountEmail.trim(),
            }));
            // `steps` drops the account step once `user` lands, so the index
            // already points at the facility step.
            setStepIndex(0);
            toast.success('Account created — let’s get your lab registered.');
        } catch (e: any) {
            const message =
                e?.code === 'auth/email-already-in-use'
                    ? 'That email already has a LabLink account. Sign in instead.'
                    : e?.code === 'auth/weak-password'
                      ? 'Please choose a stronger password.'
                      : 'Could not create your account. Please try again.';
            setErrors({ accountEmail: message });
        } finally {
            setCreatingAccount(false);
        }
    };

    // --- Uploads -----------------------------------------------------------
    const startUpload = (type: PartnerDocumentType, file: File) => {
        if (!storage || !user) return;
        // Storage rules reject anything at or above the cap, so match them here.
        if (file.size >= PARTNER_DOCUMENT_MAX_BYTES) {
            setUploads((prev) => ({
                ...prev,
                [type]: { fileName: file.name, size: file.size, progress: 0, error: 'File is larger than 10MB.' },
            }));
            return;
        }

        const path = `partner_applications/${user.uid}/${type}_${Date.now()}_${sanitizeFileName(file.name)}`;
        const task = uploadBytesResumable(storageRef(storage, path), file, { contentType: file.type });

        setUploads((prev) => ({ ...prev, [type]: { fileName: file.name, size: file.size, progress: 0 } }));
        setErrors((prev) => ({ ...prev, documents: '' }));

        task.on(
            'state_changed',
            (snap) => {
                const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                setUploads((prev) => ({ ...prev, [type]: { ...prev[type]!, progress } }));
            },
            (error) => {
                console.error('Document upload failed:', error);
                setUploads((prev) => ({
                    ...prev,
                    [type]: { ...prev[type]!, error: 'Upload failed. Please try again.' },
                }));
            },
            async () => {
                try {
                    const fileUrl = await getDownloadURL(task.snapshot.ref);
                    setUploads((prev) => ({
                        ...prev,
                        [type]: {
                            ...prev[type]!,
                            progress: 100,
                            doc: {
                                type,
                                fileName: file.name.slice(-300),
                                fileUrl,
                                storagePath: path,
                                contentType: file.type || 'application/octet-stream',
                                size: file.size,
                            },
                        },
                    }));
                } catch (e) {
                    console.error('Could not read the uploaded file URL:', e);
                    setUploads((prev) => ({
                        ...prev,
                        [type]: { ...prev[type]!, error: 'Upload failed. Please try again.' },
                    }));
                }
            }
        );
    };

    const clearUpload = (type: PartnerDocumentType) =>
        setUploads((prev) => {
            const copy = { ...prev };
            delete copy[type];
            return copy;
        });

    // --- Geolocation -------------------------------------------------------
    const [pinning, setPinning] = useState(false);
    const pinLocation = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            toast.error('Your browser cannot share a location.');
            return;
        }
        setPinning(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setDraft((prev) => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                }));
                setPinning(false);
                toast.success('Facility location pinned.');
            },
            () => {
                setPinning(false);
                toast.error('Could not read your location. You can still continue.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // --- Submit ------------------------------------------------------------
    // Which step owns each top-level section, so a late validation failure can
    // send the applicant straight back to the field that needs fixing.
    const SECTION_STEP: Record<string, string> = {
        facility: 'facility',
        contact: 'facility',
        location: 'location',
        regulatory: 'regulatory',
        operations: 'operations',
        documents: 'documents',
        declaration: 'review',
    };

    const submit = async () => {
        if (!user) return;
        if (!validateStep('review')) {
            toast.error('Please complete the declaration.');
            return;
        }

        const application = {
            facility: facilityPayload(),
            contact: contactPayload(),
            location: locationPayload(),
            operations: operationsPayload(),
            regulatory: regulatoryPayload(),
            declaration: declarationPayload(),
            documents: uploadedDocuments(),
        } as PartnerApplicationInput;

        // The server re-validates too, but catching it here keeps the applicant
        // on the offending step instead of showing a bare API error.
        const whole = partnerApplicationInputSchema.safeParse(application);
        if (!whole.success) {
            const issue = whole.error.errors[0];
            const target = SECTION_STEP[String(issue.path[0])];
            setErrors(toErrors(whole.error));
            toast.error(issue.message);
            const index = steps.findIndex((s) => s.id === target);
            if (index >= 0) goTo(index);
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitPartnerApplicationViaApi(user, application);
            window.localStorage.removeItem(DRAFT_KEY);
            setSubmitted({ reference: result.reference, emailed: result.emailed });
        } catch (e: any) {
            toast.error(e.message || 'Could not submit your application.');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Screens -----------------------------------------------------------
    if (isUserLoading || (user && checkingExisting) || !draftLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (submitted) {
        return (
            <Shell>
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-green-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Application submitted</h1>
                    <p className="mt-3 text-slate-600">
                        Your application is with our partnerships team. Verification usually takes 2–5 business days,
                        and we&apos;ll email you as soon as there&apos;s a decision.
                    </p>
                    <div className="mt-6 rounded-xl bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your reference</p>
                        <p className="mt-1 font-mono text-xl font-bold text-slate-900">{submitted.reference}</p>
                    </div>
                    <Button asChild className="mt-8">
                        <Link href="/signin">Back to sign in</Link>
                    </Button>
                </div>
            </Shell>
        );
    }

    if (openApplication) {
        return (
            <Shell>
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <ClipboardCheck className="mx-auto mb-5 h-14 w-14 text-amber-500" />
                    <h1 className="text-2xl font-bold text-slate-900">Your application is under review</h1>
                    <p className="mt-3 text-slate-600">
                        We already have an application on file for this account (reference{' '}
                        <span className="font-mono font-semibold text-slate-900">{openApplication.reference}</span>).
                        We&apos;ll be in touch by email as soon as it&apos;s been reviewed.
                    </p>
                    <Button asChild variant="outline" className="mt-8">
                        <Link href="/signin">Back to sign in</Link>
                    </Button>
                </div>
            </Shell>
        );
    }

    const isLast = step.id === 'review';

    return (
        <Shell>
            <div ref={topRef} className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <div className="relative mx-auto mb-4 h-12 w-12">
                        <Image src="/lab-link-logo.png" alt="LabLink" fill className="object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Join the LabLink network</h1>
                    <p className="mt-2 text-slate-600">
                        Tell us about your laboratory. It takes about 10 minutes, and your progress is saved as you go.
                    </p>
                </div>

                <Stepper steps={steps} current={stepIndex} onSelect={(i) => i < stepIndex && goTo(i)} />

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-7 py-5">
                        <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                                <step.icon className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{step.title}</h2>
                                <p className="text-sm text-slate-500">{step.blurb}</p>
                            </div>
                        </div>
                    </div>

                    <form
                        className="space-y-6 px-7 py-7"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (step.id === 'account') createAccount();
                            else if (isLast) submit();
                            else next();
                        }}
                    >
                        {step.id === 'account' && (
                            <>
                                <Field label="Your full name" error={errors.accountName} required>
                                    <Input
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="e.g. Adaeze Nwosu"
                                        autoComplete="name"
                                    />
                                </Field>
                                <Field label="Work email" error={errors.accountEmail} required>
                                    <Input
                                        type="email"
                                        value={accountEmail}
                                        onChange={(e) => setAccountEmail(e.target.value)}
                                        placeholder="admin@yourlab.com"
                                        autoComplete="email"
                                    />
                                </Field>
                                <Field
                                    label="Password"
                                    error={errors.accountPassword}
                                    hint="At least 8 characters."
                                    required
                                >
                                    <Input
                                        type="password"
                                        value={accountPassword}
                                        onChange={(e) => setAccountPassword(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                </Field>
                                <p className="text-sm text-slate-500">
                                    Already registered?{' '}
                                    <Link href="/signin" className="font-semibold text-blue-600 hover:underline">
                                        Sign in
                                    </Link>{' '}
                                    and we&apos;ll pick up where you left off.
                                </p>
                            </>
                        )}

                        {step.id === 'facility' && (
                            <>
                                <Field label="Type of facility" required>
                                    <Select
                                        value={draft.partnerType}
                                        onValueChange={(v) => set('partnerType', v as PartnerType)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PARTNER_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {PARTNER_TYPE_LABELS[t]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Registered (legal) name"
                                        error={errors.legalName}
                                        hint="Exactly as it appears on your CAC certificate."
                                        required
                                    >
                                        <Input
                                            value={draft.legalName}
                                            onChange={(e) => set('legalName', e.target.value)}
                                            placeholder="e.g. Bright Path Diagnostics Ltd"
                                        />
                                    </Field>
                                    <Field label="Trading name" hint="If patients know you by a different name.">
                                        <Input
                                            value={draft.tradingName}
                                            onChange={(e) => set('tradingName', e.target.value)}
                                            placeholder="e.g. BrightPath Labs"
                                        />
                                    </Field>
                                    <Field label="CAC / RC number" error={errors.rcNumber} required>
                                        <Input
                                            value={draft.rcNumber}
                                            onChange={(e) => set('rcNumber', e.target.value)}
                                            placeholder="e.g. RC 1234567"
                                        />
                                    </Field>
                                    <Field label="Tax identification number (TIN)">
                                        <Input
                                            value={draft.tin}
                                            onChange={(e) => set('tin', e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </Field>
                                    <Field label="Year established" error={errors.yearEstablished} required>
                                        <Input
                                            inputMode="numeric"
                                            value={draft.yearEstablished}
                                            onChange={(e) => set('yearEstablished', e.target.value)}
                                            placeholder="e.g. 2016"
                                        />
                                    </Field>
                                    <Field label="Website" error={errors.website}>
                                        <Input
                                            value={draft.website}
                                            onChange={(e) => set('website', e.target.value)}
                                            placeholder="https://…"
                                        />
                                    </Field>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Is your lab already listed on LabLink?
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Link this application to your existing listing so approval takes over that
                                        profile instead of creating a duplicate. Skip if you&apos;re new here.
                                    </p>
                                    {draft.existingLabId ? (
                                        <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                                            <span className="text-sm font-medium text-blue-900">
                                                {draft.existingLabName}
                                            </span>
                                            <button
                                                type="button"
                                                className="text-blue-700 hover:text-blue-900"
                                                onClick={() => {
                                                    set('existingLabId', '');
                                                    set('existingLabName', '');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                className="mt-3"
                                                value={labSearch}
                                                onChange={(e) => setLabSearch(e.target.value)}
                                                placeholder="Search existing listings by name…"
                                            />
                                            {labMatches.length > 0 && (
                                                <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                    {labMatches.map((lab) => (
                                                        <li key={lab.id}>
                                                            <button
                                                                type="button"
                                                                className="w-full px-4 py-3 text-left hover:bg-slate-50"
                                                                onClick={() => {
                                                                    set('existingLabId', lab.id);
                                                                    set('existingLabName', lab.name);
                                                                    setLabSearch('');
                                                                }}
                                                            >
                                                                <span className="block text-sm font-medium text-slate-900">
                                                                    {lab.name}
                                                                </span>
                                                                {lab.address && (
                                                                    <span className="block text-xs text-slate-500">
                                                                        {lab.address}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>

                                <SectionHeading>Primary contact</SectionHeading>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Full name" error={errors.contactName} required>
                                        <Input
                                            value={draft.contactName}
                                            onChange={(e) => set('contactName', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Position" error={errors.contactRole} required>
                                        <Input
                                            value={draft.contactRole}
                                            onChange={(e) => set('contactRole', e.target.value)}
                                            placeholder="e.g. Managing Director"
                                        />
                                    </Field>
                                    <Field label="Email" error={errors.contactEmail} required>
                                        <Input
                                            type="email"
                                            value={draft.contactEmail}
                                            onChange={(e) => set('contactEmail', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Phone" error={errors.contactPhone} required>
                                        <Input
                                            value={draft.contactPhone}
                                            onChange={(e) => set('contactPhone', e.target.value)}
                                            placeholder="e.g. 0803 000 0000"
                                        />
                                    </Field>
                                    <Field label="Operations email" error={errors.supportEmail} hint="Where order alerts should go, if different.">
                                        <Input
                                            type="email"
                                            value={draft.supportEmail}
                                            onChange={(e) => set('supportEmail', e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </Field>
                                    <Field label="Operations phone">
                                        <Input
                                            value={draft.supportPhone}
                                            onChange={(e) => set('supportPhone', e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </Field>
                                </div>
                            </>
                        )}

                        {step.id === 'location' && (
                            <>
                                <Field label="Street address" error={errors.street} required>
                                    <Input
                                        value={draft.street}
                                        onChange={(e) => set('street', e.target.value)}
                                        placeholder="e.g. 14 Awolowo Road"
                                    />
                                </Field>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="City / town" error={errors.city} required>
                                        <Input value={draft.city} onChange={(e) => set('city', e.target.value)} />
                                    </Field>
                                    <Field label="Local government area" error={errors.lga} required>
                                        <Input value={draft.lga} onChange={(e) => set('lga', e.target.value)} />
                                    </Field>
                                    <Field label="State" error={errors.state} required>
                                        <Select value={draft.state} onValueChange={(v) => set('state', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {NIGERIAN_STATES.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                    <Field label="Nearest landmark" hint="Helps couriers find you first time.">
                                        <Input
                                            value={draft.landmark}
                                            onChange={(e) => set('landmark', e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </Field>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-sm font-semibold text-slate-900">Pin your facility on the map</p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Do this from the lab itself if you can — it&apos;s what puts you in
                                        &ldquo;labs near me&rdquo; results for patients.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <Button type="button" variant="outline" onClick={pinLocation} disabled={pinning}>
                                            {pinning ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating…
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin className="mr-2 h-4 w-4" /> Use my current location
                                                </>
                                            )}
                                        </Button>
                                        {draft.latitude !== null && draft.longitude !== null ? (
                                            <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
                                                <CheckCircle2 className="h-4 w-4" />
                                                {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-slate-500">Not pinned yet (optional)</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {step.id === 'regulatory' && (
                            <>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field
                                        label="MLSCN facility licence number"
                                        error={errors.mlscnLicenceNumber}
                                        required
                                    >
                                        <Input
                                            value={draft.mlscnLicenceNumber}
                                            onChange={(e) => set('mlscnLicenceNumber', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Licence expiry date" error={errors.licenceExpiry} required>
                                        <Input
                                            type="date"
                                            value={draft.licenceExpiry}
                                            onChange={(e) => set('licenceExpiry', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="State premises permit number" hint="Where your state issues one.">
                                        <Input
                                            value={draft.premisesPermitNumber}
                                            onChange={(e) => set('premisesPermitNumber', e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </Field>
                                </div>

                                <Field label="Quality accreditations" hint="Select all that apply.">
                                    <ChipGroup
                                        options={[...PARTNER_ACCREDITATIONS]}
                                        selected={draft.accreditations}
                                        onToggle={(value) =>
                                            set(
                                                'accreditations',
                                                draft.accreditations.includes(value)
                                                    ? draft.accreditations.filter((a) => a !== value)
                                                    : [...draft.accreditations, value]
                                            )
                                        }
                                    />
                                </Field>

                                <SectionHeading>Laboratory director</SectionHeading>
                                <p className="-mt-3 text-sm text-slate-500">
                                    The registered professional accountable for results released by this facility.
                                </p>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Full name" error={errors.directorName} required>
                                        <Input
                                            value={draft.directorName}
                                            onChange={(e) => set('directorName', e.target.value)}
                                        />
                                    </Field>
                                    <Field
                                        label="MLSCN / MDCN registration number"
                                        error={errors.directorRegistrationNumber}
                                        required
                                    >
                                        <Input
                                            value={draft.directorRegistrationNumber}
                                            onChange={(e) => set('directorRegistrationNumber', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Email" error={errors.directorEmail} required>
                                        <Input
                                            type="email"
                                            value={draft.directorEmail}
                                            onChange={(e) => set('directorEmail', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Phone" error={errors.directorPhone} required>
                                        <Input
                                            value={draft.directorPhone}
                                            onChange={(e) => set('directorPhone', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </>
                        )}

                        {step.id === 'operations' && (
                            <>
                                <Field
                                    label="Test categories you run in-house"
                                    error={errors.testCategories}
                                    hint="Select all that apply — this drives which orders we route to you."
                                    required
                                >
                                    <ChipGroup
                                        options={[...PARTNER_TEST_CATEGORIES]}
                                        selected={draft.testCategories}
                                        onToggle={(value) =>
                                            set(
                                                'testCategories',
                                                draft.testCategories.includes(value)
                                                    ? draft.testCategories.filter((c) => c !== value)
                                                    : [...draft.testCategories, value]
                                            )
                                        }
                                    />
                                </Field>

                                <div className="grid gap-5 sm:grid-cols-3">
                                    <Field
                                        label="Daily sample capacity"
                                        error={errors.dailySampleCapacity}
                                        hint="Average samples/day."
                                        required
                                    >
                                        <Input
                                            inputMode="numeric"
                                            value={draft.dailySampleCapacity}
                                            onChange={(e) => set('dailySampleCapacity', e.target.value)}
                                            placeholder="e.g. 120"
                                        />
                                    </Field>
                                    <Field
                                        label="Standard turnaround"
                                        error={errors.standardTurnaroundHours}
                                        hint="In hours."
                                        required
                                    >
                                        <Input
                                            inputMode="numeric"
                                            value={draft.standardTurnaroundHours}
                                            onChange={(e) => set('standardTurnaroundHours', e.target.value)}
                                            placeholder="e.g. 24"
                                        />
                                    </Field>
                                    <Field
                                        label="Licensed scientists"
                                        error={errors.licensedScientists}
                                        hint="On staff today."
                                        required
                                    >
                                        <Input
                                            inputMode="numeric"
                                            value={draft.licensedScientists}
                                            onChange={(e) => set('licensedScientists', e.target.value)}
                                            placeholder="e.g. 6"
                                        />
                                    </Field>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-3">
                                    <Field label="Weekday hours" error={errors.weekdayHours} required>
                                        <Input
                                            value={draft.weekdayHours}
                                            onChange={(e) => set('weekdayHours', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Saturday hours">
                                        <Input
                                            value={draft.saturdayHours}
                                            onChange={(e) => set('saturdayHours', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Sunday hours">
                                        <Input
                                            value={draft.sundayHours}
                                            onChange={(e) => set('sundayHours', e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Toggle
                                        label="We accept walk-in patients"
                                        checked={draft.acceptsWalkIns}
                                        onChange={(v) => set('acceptsWalkIns', v)}
                                    />
                                    <Toggle
                                        label="We accept home-collected samples"
                                        checked={draft.acceptsHomeCollection}
                                        onChange={(v) => set('acceptsHomeCollection', v)}
                                    />
                                </div>

                                <Field label="Key equipment / analysers" hint="Optional, but it speeds up verification.">
                                    <Textarea
                                        rows={3}
                                        value={draft.equipment}
                                        onChange={(e) => set('equipment', e.target.value)}
                                        placeholder="e.g. Mindray BC-5150, Cobas c111, GeneXpert IV"
                                    />
                                </Field>
                            </>
                        )}

                        {step.id === 'documents' && (
                            <>
                                <p className="text-sm text-slate-600">
                                    Upload clear scans or photos — PDF, PNG or JPEG, up to 10MB each. Files upload as
                                    soon as you choose them.
                                </p>
                                {errors.documents && <ErrorText>{errors.documents}</ErrorText>}

                                <div className="space-y-4">
                                    {PARTNER_DOCUMENT_SPECS.map((spec) => (
                                        <UploadRow
                                            key={spec.type}
                                            label={spec.label}
                                            hint={spec.hint}
                                            required={spec.required}
                                            state={uploads[spec.type]}
                                            onSelect={(file) => startUpload(spec.type, file)}
                                            onClear={() => clearUpload(spec.type)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        {step.id === 'review' && (
                            <>
                                <Summary draft={draft} documents={uploadedDocuments()} onEdit={goTo} steps={steps} />

                                <SectionHeading>Declaration</SectionHeading>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Field label="Authorised signatory" error={errors.signatoryName} required>
                                        <Input
                                            value={draft.signatoryName}
                                            onChange={(e) => set('signatoryName', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Position" error={errors.signatoryPosition} required>
                                        <Input
                                            value={draft.signatoryPosition}
                                            onChange={(e) => set('signatoryPosition', e.target.value)}
                                            placeholder="e.g. Managing Director"
                                        />
                                    </Field>
                                </div>

                                <Check
                                    checked={draft.confirmedAccuracy}
                                    onChange={(v) => set('confirmedAccuracy', v)}
                                    error={errors.confirmedAccuracy}
                                >
                                    I confirm the information and documents provided are accurate, current, and relate
                                    to the facility named above.
                                </Check>
                                <Check
                                    checked={draft.agreedToTerms}
                                    onChange={(v) => set('agreedToTerms', v)}
                                    error={errors.agreedToTerms}
                                >
                                    I accept LabLink&apos;s partner terms, and consent to LabLink verifying these
                                    details with the relevant regulatory authorities.
                                </Check>
                            </>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                            {stepIndex > 0 ? (
                                <Button type="button" variant="ghost" onClick={back}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                </Button>
                            ) : (
                                <span />
                            )}

                            {step.id === 'account' ? (
                                <Button type="submit" disabled={creatingAccount}>
                                    {creatingAccount ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                                        </>
                                    ) : (
                                        <>
                                            Create account <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            ) : isLast ? (
                                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" /> Submit application
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button type="submit">
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Your progress is saved on this device. Applications are reviewed by the LabLink partnerships team.
                </p>
            </div>
        </Shell>
    );
}

// ---------------------------------------------------------------------------
// Presentational helpers
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">{children}</div>;
}

function Stepper({
    steps,
    current,
    onSelect,
}: {
    steps: StepDef[];
    current: number;
    onSelect: (index: number) => void;
}) {
    const pct = Math.round(((current + 1) / steps.length) * 100);
    return (
        <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                {steps.map((s, i) => {
                    const done = i < current;
                    return (
                        <li key={s.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(i)}
                                disabled={!done}
                                className={`flex items-center gap-1.5 font-medium ${
                                    i === current
                                        ? 'text-blue-700'
                                        : done
                                          ? 'text-slate-600 hover:text-blue-700'
                                          : 'cursor-default text-slate-400'
                                }`}
                            >
                                {done ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                    <span
                                        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] ${
                                            i === current ? 'border-blue-600 text-blue-700' : 'border-slate-300'
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                )}
                                {s.title}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="border-t border-slate-100 pt-6 text-xs font-bold uppercase tracking-wider text-slate-500">
            {children}
        </h3>
    );
}

function ErrorText({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-start gap-1.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {children}
        </p>
    );
}

function Field({
    label,
    hint,
    error,
    required,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-slate-700">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </Label>
            {children}
            {error ? <ErrorText>{error}</ErrorText> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
    );
}

function ChipGroup({
    options,
    selected,
    onToggle,
}: {
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const active = selected.includes(option);
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onToggle(option)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            active
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
                        }`}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 hover:border-slate-300">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">{label}</span>
        </label>
    );
}

function Check({
    checked,
    onChange,
    error,
    children,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex cursor-pointer items-start gap-3">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm leading-relaxed text-slate-700">{children}</span>
            </label>
            {error && <ErrorText>{error}</ErrorText>}
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadRow({
    label,
    hint,
    required,
    state,
    onSelect,
    onClear,
}: {
    label: string;
    hint: string;
    required: boolean;
    state?: UploadState;
    onSelect: (file: File) => void;
    onClear: () => void;
}) {
    const done = !!state?.doc;
    const failed = !!state?.error;
    const busy = !!state && !done && !failed;

    return (
        <div
            className={`rounded-xl border p-4 transition-colors ${
                done ? 'border-green-200 bg-green-50/50' : failed ? 'border-red-200 bg-red-50/50' : 'border-slate-200'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {label}
                        {required ? (
                            <span className="ml-0.5 text-red-500">*</span>
                        ) : (
                            <span className="ml-2 text-xs font-normal text-slate-400">Optional</span>
                        )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                </div>
                {done && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
            </div>

            {state ? (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 ring-1 ring-slate-200">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-700">{state.fileName}</p>
                        {failed ? (
                            <p className="text-xs text-red-600">{state.error}</p>
                        ) : busy ? (
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all"
                                    style={{ width: `${state.progress}%` }}
                                />
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">{formatBytes(state.size)} · uploaded</p>
                        )}
                    </div>
                    <button type="button" onClick={onClear} className="text-slate-400 hover:text-red-600" aria-label="Remove file">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="relative mt-3 rounded-lg border-2 border-dashed border-slate-200 px-4 py-5 text-center transition-colors hover:border-blue-400">
                    <input
                        type="file"
                        accept={PARTNER_DOCUMENT_ACCEPT}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onSelect(file);
                            e.target.value = '';
                        }}
                    />
                    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <Upload className="h-4 w-4" /> Click to upload
                    </span>
                </div>
            )}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-6 py-2 text-sm">
            <span className="shrink-0 text-slate-500">{label}</span>
            <span className="text-right font-medium text-slate-900">{value || '—'}</span>
        </div>
    );
}

function Summary({
    draft,
    documents,
    steps,
    onEdit,
}: {
    draft: Draft;
    documents: PartnerDocument[];
    steps: StepDef[];
    onEdit: (index: number) => void;
}) {
    const indexOf = (id: string) => steps.findIndex((s) => s.id === id);

    const blocks: { id: string; title: string; rows: [string, React.ReactNode][] }[] = [
        {
            id: 'facility',
            title: 'Facility & contact',
            rows: [
                ['Facility', draft.tradingName || draft.legalName],
                ['Type', PARTNER_TYPE_LABELS[draft.partnerType]],
                ['CAC / RC number', draft.rcNumber],
                ['Contact', `${draft.contactName} · ${draft.contactPhone}`],
                ['Email', draft.contactEmail],
            ],
        },
        {
            id: 'location',
            title: 'Location',
            rows: [
                ['Address', `${draft.street}, ${draft.city}`],
                ['State / LGA', `${draft.state} · ${draft.lga}`],
                [
                    'Map pin',
                    draft.latitude !== null && draft.longitude !== null ? (
                        `${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`
                    ) : (
                        <span className="text-amber-600">Not pinned</span>
                    ),
                ],
            ],
        },
        {
            id: 'regulatory',
            title: 'Licensing',
            rows: [
                ['MLSCN licence', draft.mlscnLicenceNumber],
                ['Expires', draft.licenceExpiry],
                ['Director', draft.directorName],
                ['Accreditations', draft.accreditations.join(', ')],
            ],
        },
        {
            id: 'operations',
            title: 'Capability',
            rows: [
                ['Categories', draft.testCategories.join(', ')],
                ['Capacity', draft.dailySampleCapacity && `${draft.dailySampleCapacity} samples/day`],
                ['Turnaround', draft.standardTurnaroundHours && `${draft.standardTurnaroundHours} hours`],
                ['Scientists', draft.licensedScientists],
            ],
        },
        {
            id: 'documents',
            title: 'Documents',
            rows: documents.length
                ? documents.map((d): [string, React.ReactNode] => [
                      PARTNER_DOCUMENT_SPECS.find((s) => s.type === d.type)?.label ?? d.type,
                      d.fileName,
                  ])
                : [['Uploaded', <span key="none" className="text-amber-600">None</span>]],
        },
    ];

    return (
        <div className="space-y-4">
            {blocks.map((block) => (
                <div key={block.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
                        <button
                            type="button"
                            onClick={() => onEdit(indexOf(block.id))}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {block.rows.map(([label, value], i) => (
                            <SummaryRow key={`${label}-${i}`} label={label} value={value} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

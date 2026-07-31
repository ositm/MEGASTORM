import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Partner onboarding. A laboratory (or other diagnostic partner) applies to
// join the network by submitting a single application: facility identity,
// regulatory licensing, leadership, location, operating capability, and
// supporting documents.
//
// Applications are written ONLY by the server (`partner_applications`), which
// also emails the formatted dossier to the ops inbox. Approval creates or
// updates the `labs/{labId}` record and grants the applicant `lab_admin`.
//
// This schema is the single source of truth: the wizard validates each step
// against it and the API re-validates the whole submission before storing.
// ---------------------------------------------------------------------------

export const PARTNER_TYPES = [
    'laboratory',
    'diagnostic_centre',
    'hospital_lab',
    'collection_centre',
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
    laboratory: 'Independent medical laboratory',
    diagnostic_centre: 'Diagnostic / imaging centre',
    hospital_lab: 'Hospital-based laboratory',
    collection_centre: 'Sample collection centre',
};

/** Application lifecycle. `under_review` is set when an admin opens the case. */
export const PARTNER_APPLICATION_STATUSES = ['submitted', 'under_review', 'approved', 'rejected'] as const;

export type PartnerApplicationStatus = (typeof PARTNER_APPLICATION_STATUSES)[number];

export const PARTNER_APPLICATION_STATUS_LABELS: Record<PartnerApplicationStatus, string> = {
    submitted: 'Awaiting review',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
};

/** Statuses that still need a decision from the platform admin. */
export const OPEN_PARTNER_APPLICATION_STATUSES: readonly PartnerApplicationStatus[] = [
    'submitted',
    'under_review',
];

// ---------------------------------------------------------------------------
// Supporting documents
// ---------------------------------------------------------------------------

export const PARTNER_DOCUMENT_TYPES = [
    'cac_certificate',
    'operating_licence',
    'director_licence',
    'premises_permit',
    'accreditation_certificate',
    'facility_photo',
] as const;

export type PartnerDocumentType = (typeof PARTNER_DOCUMENT_TYPES)[number];

export interface PartnerDocumentSpec {
    type: PartnerDocumentType;
    label: string;
    /** Shown under the upload box so applicants know exactly what to attach. */
    hint: string;
    required: boolean;
}

export const PARTNER_DOCUMENT_SPECS: readonly PartnerDocumentSpec[] = [
    {
        type: 'cac_certificate',
        label: 'CAC certificate of registration',
        hint: 'Certificate of incorporation or business-name registration from the Corporate Affairs Commission.',
        required: true,
    },
    {
        type: 'operating_licence',
        label: 'Facility practising licence (MLSCN)',
        hint: 'Current MLSCN facility registration / annual practising licence for the laboratory.',
        required: true,
    },
    {
        type: 'director_licence',
        label: "Laboratory director's professional licence",
        hint: 'Current MLSCN or MDCN practising licence of the named laboratory director.',
        required: true,
    },
    {
        type: 'premises_permit',
        label: 'State premises permit',
        hint: 'State Ministry of Health premises/operating permit, where your state issues one.',
        required: false,
    },
    {
        type: 'accreditation_certificate',
        label: 'Accreditation certificate',
        hint: 'ISO 15189, SANAS, WHO-NEQAS or other quality accreditation, if you hold one.',
        required: false,
    },
    {
        type: 'facility_photo',
        label: 'Photo of the facility',
        hint: 'A clear photo of the laboratory frontage or main bench area. Helps us verify faster.',
        required: false,
    },
];

export const PARTNER_DOCUMENT_LABELS = PARTNER_DOCUMENT_SPECS.reduce(
    (acc, spec) => ({ ...acc, [spec.type]: spec.label }),
    {} as Record<PartnerDocumentType, string>
);

export const REQUIRED_PARTNER_DOCUMENT_TYPES: readonly PartnerDocumentType[] = PARTNER_DOCUMENT_SPECS
    .filter((s) => s.required)
    .map((s) => s.type);

/** Upload limits mirrored by the Storage rules. */
export const PARTNER_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const PARTNER_DOCUMENT_ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp';

// ---------------------------------------------------------------------------
// Capability declarations
// ---------------------------------------------------------------------------

export const PARTNER_TEST_CATEGORIES = [
    'Haematology',
    'Clinical chemistry',
    'Microbiology',
    'Serology & immunology',
    'Molecular / PCR',
    'Histopathology & cytology',
    'Endocrinology & hormones',
    'Parasitology',
    'Toxicology & drug screening',
    'Genetics',
] as const;

export const PARTNER_ACCREDITATIONS = [
    'ISO 15189',
    'ISO 9001',
    'SANAS',
    'WHO-NEQAS',
    'NHIA-accredited',
    'None yet',
] as const;

export const NIGERIAN_STATES = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara',
] as const;

// ---------------------------------------------------------------------------
// Validation schema — shared by the wizard (per step) and the API (whole form)
// ---------------------------------------------------------------------------

const requiredString = (field: string, max = 200) =>
    z.string().trim().min(2, `${field} is required.`).max(max, `${field} is too long.`);

// Nigerian numbers are entered in many shapes (0803…, +234803…, spaced). Accept
// digits with optional +, and check the digit count rather than the format.
const phone = (field: string) =>
    z
        .string()
        .trim()
        .min(7, `${field} is required.`)
        .max(20)
        .regex(/^\+?[0-9\s()-]{7,20}$/, `${field} must be a valid phone number.`);

const isoDate = (field: string) =>
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${field} must be a valid date.`);

// Blank/garbled numeric inputs arrive as NaN, which zod reports as an
// invalid_type — give those the same friendly wording as the other fields.
const requiredNumber = (field: string) =>
    z.number({ invalid_type_error: `${field} is required.`, required_error: `${field} is required.` });

export const partnerFacilitySchema = z.object({
    partnerType: z.enum(PARTNER_TYPES),
    legalName: requiredString('Registered facility name'),
    tradingName: z.string().trim().max(200).optional().or(z.literal('')),
    rcNumber: requiredString('CAC / RC number', 40),
    tin: z.string().trim().max(40).optional().or(z.literal('')),
    yearEstablished: requiredNumber('Year established')
        .int()
        .min(1900, 'Year established looks incorrect.')
        .max(new Date().getFullYear(), 'Year established cannot be in the future.'),
    website: z.string().trim().url('Enter a full URL, e.g. https://example.com').max(200).optional().or(z.literal('')),
    /** Set when the applicant is claiming a facility already listed on LabLink. */
    existingLabId: z.string().trim().max(200).optional().or(z.literal('')),
});

export const partnerContactSchema = z.object({
    contactName: requiredString('Contact name'),
    contactRole: requiredString('Contact role/position', 120),
    contactEmail: z.string().trim().email('Enter a valid email address.').max(200),
    contactPhone: phone('Contact phone'),
    supportEmail: z.string().trim().email('Enter a valid email address.').max(200).optional().or(z.literal('')),
    supportPhone: z.string().trim().max(20).optional().or(z.literal('')),
});

export const partnerLocationSchema = z.object({
    street: requiredString('Street address', 300),
    city: requiredString('City / town', 120),
    lga: requiredString('Local government area', 120),
    state: requiredString('State', 120),
    landmark: z.string().trim().max(200).optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

export const partnerOperationsSchema = z.object({
    weekdayHours: requiredString('Weekday opening hours', 80),
    saturdayHours: z.string().trim().max(80).optional().or(z.literal('')),
    sundayHours: z.string().trim().max(80).optional().or(z.literal('')),
    acceptsWalkIns: z.boolean(),
    acceptsHomeCollection: z.boolean(),
    dailySampleCapacity: requiredNumber('Daily sample capacity')
        .int()
        .min(1, 'Enter your average daily sample capacity.')
        .max(100000, 'That capacity looks too high — please check.'),
    standardTurnaroundHours: requiredNumber('Standard turnaround time')
        .int()
        .min(1, 'Enter your standard turnaround time.')
        .max(720, 'Turnaround time cannot exceed 30 days.'),
    licensedScientists: requiredNumber('Number of licensed scientists')
        .int()
        .min(1, 'A partner lab needs at least one licensed scientist.')
        .max(1000, 'That headcount looks too high — please check.'),
    testCategories: z.array(z.string().max(120)).min(1, 'Select at least one test category you run.'),
    equipment: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const partnerRegulatorySchema = z.object({
    mlscnLicenceNumber: requiredString('MLSCN facility licence number', 80),
    licenceExpiry: isoDate('Licence expiry'),
    premisesPermitNumber: z.string().trim().max(80).optional().or(z.literal('')),
    accreditations: z.array(z.string().max(120)).default([]),
    directorName: requiredString("Laboratory director's name"),
    directorRegistrationNumber: requiredString("Director's registration number", 80),
    directorEmail: z.string().trim().email('Enter a valid email address.').max(200),
    directorPhone: phone("Director's phone"),
});

export const partnerDeclarationSchema = z.object({
    signatoryName: requiredString('Name of authorised signatory'),
    signatoryPosition: requiredString('Position of authorised signatory', 120),
    confirmedAccuracy: z.literal(true, {
        errorMap: () => ({ message: 'Please confirm the information provided is accurate.' }),
    }),
    agreedToTerms: z.literal(true, {
        errorMap: () => ({ message: 'Please accept the partner terms to continue.' }),
    }),
});

export const partnerDocumentSchema = z.object({
    type: z.enum(PARTNER_DOCUMENT_TYPES),
    fileName: z.string().min(1).max(300),
    fileUrl: z.string().url(),
    storagePath: z.string().min(1).max(500),
    contentType: z.string().max(120),
    size: z.number().int().min(1).max(PARTNER_DOCUMENT_MAX_BYTES),
});

export const partnerApplicationInputSchema = z.object({
    facility: partnerFacilitySchema,
    contact: partnerContactSchema,
    location: partnerLocationSchema,
    operations: partnerOperationsSchema,
    regulatory: partnerRegulatorySchema,
    declaration: partnerDeclarationSchema,
    documents: z
        .array(partnerDocumentSchema)
        .min(REQUIRED_PARTNER_DOCUMENT_TYPES.length)
        .max(PARTNER_DOCUMENT_SPECS.length)
        .refine(
            (docs) => REQUIRED_PARTNER_DOCUMENT_TYPES.every((t) => docs.some((d) => d.type === t)),
            { message: 'Please upload all required documents.' }
        ),
});

export type PartnerFacility = z.infer<typeof partnerFacilitySchema>;
export type PartnerContact = z.infer<typeof partnerContactSchema>;
export type PartnerLocation = z.infer<typeof partnerLocationSchema>;
export type PartnerOperations = z.infer<typeof partnerOperationsSchema>;
export type PartnerRegulatory = z.infer<typeof partnerRegulatorySchema>;
export type PartnerDeclaration = z.infer<typeof partnerDeclarationSchema>;
export type PartnerDocument = z.infer<typeof partnerDocumentSchema>;
export type PartnerApplicationInput = z.infer<typeof partnerApplicationInputSchema>;

/** The stored document: the submitted form plus server-owned metadata. */
export interface PartnerApplication extends PartnerApplicationInput {
    id?: string;
    /** Human-quotable case number, e.g. `LL-PA-202607-9F3A21`. */
    reference: string;
    status: PartnerApplicationStatus;
    applicantUid: string;
    applicantEmail: string;
    submittedAt: Timestamp;
    decidedAt?: Timestamp;
    decidedBy?: string;
    /** Reason shown to the applicant when an application is rejected. */
    decisionNote?: string;
    /** Set once approved — the lab the applicant now administers. */
    labId?: string;
}

/** The display name to use for a facility (trading name wins when present). */
export function partnerDisplayName(facility: PartnerFacility): string {
    return facility.tradingName?.trim() || facility.legalName;
}

/** Builds the case reference stored on the application. */
export function buildPartnerReference(applicationId: string, at: Date = new Date()): string {
    const stamp = `${at.getUTCFullYear()}${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
    return `LL-PA-${stamp}-${applicationId.slice(0, 6).toUpperCase()}`;
}

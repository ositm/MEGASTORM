'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase/FirebaseProvider';
import { decidePartnerApplicationViaApi } from '@/lib/api-client';
import {
    OPEN_PARTNER_APPLICATION_STATUSES,
    PARTNER_APPLICATION_STATUS_LABELS,
    PARTNER_DOCUMENT_LABELS,
    PARTNER_TYPE_LABELS,
    PartnerApplication,
    PartnerApplicationStatus,
    partnerDisplayName,
} from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertTriangle,
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    FileText,
    Handshake,
    Loader2,
    MapPin,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

type Row = PartnerApplication & { id: string };

const OPEN: PartnerApplicationStatus[] = [...OPEN_PARTNER_APPLICATION_STATUSES];

const STATUS_STYLES: Record<PartnerApplicationStatus, string> = {
    submitted: 'bg-amber-100 text-amber-800 border-amber-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-gray-100 text-gray-600 border-gray-200',
};

function formatDate(value: any): string {
    const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-medium text-gray-900">{value || '—'}</dd>
        </div>
    );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
        </div>
    );
}

export default function AdminPartnersPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDecided, setShowDecided] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);
        const base = collection(firestore, 'partner_applications');
        const q = showDecided
            ? query(base, orderBy('submittedAt', 'desc'))
            : query(base, where('status', 'in', OPEN), orderBy('submittedAt', 'desc'));

        const unsub = onSnapshot(
            q,
            (snap) => {
                setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Row));
                setLoading(false);
            },
            (err) => {
                console.error('Partner applications watch failed:', err);
                toast.error('Could not load partner applications.');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [firestore, showDecided]);

    const openCount = useMemo(() => rows.filter((r) => OPEN.includes(r.status)).length, [rows]);

    const decide = async (row: Row, action: 'approve' | 'reject' | 'review') => {
        if (!user) return;
        if (action === 'reject' && !notes[row.id]?.trim()) {
            toast.error('Add a short reason — it goes to the applicant.');
            return;
        }
        setBusyId(row.id);
        try {
            await decidePartnerApplicationViaApi(user, row.id, action, notes[row.id]?.trim() || undefined);
            toast.success(
                action === 'approve'
                    ? `${partnerDisplayName(row.facility)} approved and published.`
                    : action === 'reject'
                      ? 'Application rejected — the applicant has been emailed.'
                      : 'Marked as under review.'
            );
        } catch (e: any) {
            toast.error(e.message || 'Could not update the application.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                        <Handshake className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Partner applications</h1>
                        <p className="text-gray-500">
                            New labs applying to join the network. Approving publishes the facility and grants the
                            applicant lab-admin access.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowDecided((v) => !v)}>
                    {showDecided ? `Show open only (${openCount})` : 'Show all applications'}
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                    <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-gray-500">
                        {showDecided ? 'No applications yet.' : 'No applications waiting on you.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rows.map((row) => {
                        const isOpen = expanded === row.id;
                        const decided = row.status === 'approved' || row.status === 'rejected';
                        const unpinned =
                            typeof row.location?.latitude !== 'number' ||
                            typeof row.location?.longitude !== 'number';

                        return (
                            <Card key={row.id} className="overflow-hidden border-gray-100 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : row.id)}
                                    className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-gray-50"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {partnerDisplayName(row.facility)}
                                            </h3>
                                            <Badge className={`h-6 border px-2 ${STATUS_STYLES[row.status]}`}>
                                                {PARTNER_APPLICATION_STATUS_LABELS[row.status]}
                                            </Badge>
                                            {row.facility?.existingLabId && (
                                                <Badge className="h-6 border border-purple-200 bg-purple-100 px-2 text-purple-800">
                                                    Claiming existing listing
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {PARTNER_TYPE_LABELS[row.facility?.partnerType] ?? row.facility?.partnerType}
                                            {' · '}
                                            {row.location?.city}, {row.location?.state}
                                            {' · '}
                                            {row.contact?.contactName} ({row.contact?.contactPhone})
                                        </p>
                                        <p className="mt-1 font-mono text-xs text-gray-400">
                                            {row.reference} · submitted {formatDate(row.submittedAt)}
                                        </p>
                                    </div>
                                    {isOpen ? (
                                        <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400" />
                                    )}
                                </button>

                                {isOpen && (
                                    <div className="space-y-4 border-t border-gray-100 bg-white p-5">
                                        <Block title="Facility & registration">
                                            <Detail label="Registered name" value={row.facility?.legalName} />
                                            <Detail label="Trading name" value={row.facility?.tradingName} />
                                            <Detail label="CAC / RC number" value={row.facility?.rcNumber} />
                                            <Detail label="TIN" value={row.facility?.tin} />
                                            <Detail label="Established" value={row.facility?.yearEstablished} />
                                            <Detail
                                                label="Website"
                                                value={
                                                    row.facility?.website ? (
                                                        <a
                                                            href={row.facility.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {row.facility.website}
                                                        </a>
                                                    ) : null
                                                }
                                            />
                                        </Block>

                                        <Block title="Contact">
                                            <Detail label="Name" value={row.contact?.contactName} />
                                            <Detail label="Position" value={row.contact?.contactRole} />
                                            <Detail
                                                label="Email"
                                                value={
                                                    <a
                                                        href={`mailto:${row.contact?.contactEmail}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {row.contact?.contactEmail}
                                                    </a>
                                                }
                                            />
                                            <Detail label="Phone" value={row.contact?.contactPhone} />
                                            <Detail label="Ops email" value={row.contact?.supportEmail} />
                                            <Detail label="LabLink account" value={row.applicantEmail} />
                                        </Block>

                                        <Block title="Location">
                                            <Detail label="Address" value={row.location?.street} />
                                            <Detail
                                                label="City / LGA"
                                                value={`${row.location?.city} · ${row.location?.lga}`}
                                            />
                                            <Detail label="State" value={row.location?.state} />
                                            <Detail label="Landmark" value={row.location?.landmark} />
                                            <Detail
                                                label="Map pin"
                                                value={
                                                    unpinned ? (
                                                        <span className="inline-flex items-center gap-1 text-amber-600">
                                                            <AlertTriangle className="h-3.5 w-3.5" /> Not pinned
                                                        </span>
                                                    ) : (
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${row.location.latitude},${row.location.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                                        >
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            {row.location.latitude!.toFixed(4)},{' '}
                                                            {row.location.longitude!.toFixed(4)}
                                                        </a>
                                                    )
                                                }
                                            />
                                        </Block>

                                        <Block title="Licensing & leadership">
                                            <Detail label="MLSCN licence" value={row.regulatory?.mlscnLicenceNumber} />
                                            <Detail label="Expires" value={row.regulatory?.licenceExpiry} />
                                            <Detail
                                                label="Premises permit"
                                                value={row.regulatory?.premisesPermitNumber}
                                            />
                                            <Detail
                                                label="Accreditations"
                                                value={row.regulatory?.accreditations?.join(', ')}
                                            />
                                            <Detail label="Lab director" value={row.regulatory?.directorName} />
                                            <Detail
                                                label="Director reg. no."
                                                value={row.regulatory?.directorRegistrationNumber}
                                            />
                                            <Detail label="Director email" value={row.regulatory?.directorEmail} />
                                            <Detail label="Director phone" value={row.regulatory?.directorPhone} />
                                        </Block>

                                        <Block title="Capability">
                                            <Detail
                                                label="Test categories"
                                                value={row.operations?.testCategories?.join(', ')}
                                            />
                                            <Detail
                                                label="Daily capacity"
                                                value={`${row.operations?.dailySampleCapacity} samples/day`}
                                            />
                                            <Detail
                                                label="Turnaround"
                                                value={`${row.operations?.standardTurnaroundHours} hours`}
                                            />
                                            <Detail
                                                label="Licensed scientists"
                                                value={row.operations?.licensedScientists}
                                            />
                                            <Detail
                                                label="Services"
                                                value={[
                                                    row.operations?.acceptsWalkIns ? 'Walk-in' : null,
                                                    row.operations?.acceptsHomeCollection ? 'Home collection' : null,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            />
                                            <Detail
                                                label="Hours"
                                                value={`Mon–Fri ${row.operations?.weekdayHours}${
                                                    row.operations?.saturdayHours
                                                        ? ` · Sat ${row.operations.saturdayHours}`
                                                        : ''
                                                }`}
                                            />
                                            <Detail label="Equipment" value={row.operations?.equipment} />
                                        </Block>

                                        <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
                                            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                                                Documents
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(row.documents ?? []).map((d) => (
                                                    <a
                                                        key={d.storagePath}
                                                        href={d.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        {PARTNER_DOCUMENT_LABELS[d.type] ?? d.type}
                                                        <ExternalLink className="h-3 w-3 text-gray-400" />
                                                    </a>
                                                ))}
                                                {!row.documents?.length && (
                                                    <span className="text-sm text-gray-400">
                                                        No documents uploaded.
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Block title="Declaration">
                                            <Detail label="Signatory" value={row.declaration?.signatoryName} />
                                            <Detail label="Position" value={row.declaration?.signatoryPosition} />
                                            <Detail label="Signed" value={formatDate(row.submittedAt)} />
                                        </Block>

                                        {decided ? (
                                            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                                                {PARTNER_APPLICATION_STATUS_LABELS[row.status]} on{' '}
                                                {formatDate(row.decidedAt)}
                                                {row.decisionNote ? ` — “${row.decisionNote}”` : ''}
                                                {row.labId ? ` · lab ${row.labId}` : ''}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 border-t border-gray-100 pt-4">
                                                <Textarea
                                                    rows={2}
                                                    placeholder="Reviewer note — required when rejecting, emailed to the applicant."
                                                    value={notes[row.id] || ''}
                                                    onChange={(e) =>
                                                        setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                                                    }
                                                />
                                                <div className="flex flex-wrap gap-3">
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700"
                                                        disabled={busyId === row.id}
                                                        onClick={() => decide(row, 'approve')}
                                                    >
                                                        {busyId === row.id ? (
                                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="mr-1 h-4 w-4" />
                                                        )}
                                                        Approve &amp; publish lab
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                                        disabled={busyId === row.id}
                                                        onClick={() => decide(row, 'reject')}
                                                    >
                                                        <X className="mr-1 h-4 w-4" /> Reject
                                                    </Button>
                                                    {row.status === 'submitted' && (
                                                        <Button
                                                            variant="ghost"
                                                            disabled={busyId === row.id}
                                                            onClick={() => decide(row, 'review')}
                                                        >
                                                            Mark under review
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import { useLabOrders } from '@/hooks/use-lab-orders';
import { useFirebase, useUser, useStorage } from '@/firebase/FirebaseProvider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { appendOrderEventViaApi } from '@/lib/api-client';

export default function AdminResultsPage() {
    const { orders } = useLabOrders();
    const { firestore } = useFirebase();
    const { user } = useUser();
    const storage = useStorage();

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    const [file, setFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState('');
    const [technician, setTechnician] = useState('');
    const [summary, setSummary] = useState('');
    const [error, setError] = useState('');

    // Only orders whose testing is complete are ready for a result upload.
    const eligibleOrders = orders.filter((o) => o.status === 'TESTING_COMPLETED');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExternalUrl('');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const order = eligibleOrders.find((o) => o.id === selectedOrderId);
        if (!order) return setError('Please select an order.');
        if (!file && !externalUrl) return setError('Please upload a file OR provide an external link.');
        if (!user || !firestore || (!externalUrl && !storage)) {
            return setError('Services not ready. Please refresh and try again.');
        }

        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) return setError('Invalid file type (PDF, JPG, or PNG).');
            if (file.size > 10 * 1024 * 1024) return setError('File exceeds 10MB limit.');
        }

        setIsLoading(true);
        try {
            let fileUrl = externalUrl;
            if (file && storage) {
                // Owner-scoped path so patients (and only their lab) can read it.
                const storageRef = ref(storage, `results/${order.patientId}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(snapshot.ref);
            }

            // Patient-visible result document (read by the patient via userId).
            await addDoc(collection(firestore, 'results'), {
                userId: order.patientId,
                orderId: order.id,
                labId: order.labId,
                labName: order.labName ?? '',
                testName: order.items?.map((i) => i.name).join(', ') ?? 'Lab test',
                date: Timestamp.now(),
                summary,
                technician,
                fileUrl,
                status: 'ready',
                aiSummary: summary,
            });

            // Record the custody event; validate + release happen from the Orders page.
            await appendOrderEventViaApi(user, order.id, 'RESULT_UPLOADED');

            setIsSuccess(true);
            setFile(null);
            setExternalUrl('');
            setSelectedOrderId('');
            setSummary('');
            setTechnician('');
            setTimeout(() => setIsSuccess(false), 4000);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload result.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Test Results</h1>
                <p className="text-gray-500 mt-2">
                    Attach a report to an order whose testing is complete, then validate
                    and release it from the Orders page.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8">
                {isSuccess ? (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Uploaded</h2>
                        <p className="text-gray-500 mb-6">
                            Go to Orders to validate and release it to the patient.
                        </p>
                        <Button onClick={() => setIsSuccess(false)}>Upload Another</Button>
                    </div>
                ) : (
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Select Order (testing complete)</Label>
                            <Select onValueChange={setSelectedOrderId} value={selectedOrderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an order awaiting a result…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleOrders.map((order) => (
                                        <SelectItem key={order.id} value={order.id}>
                                            #{order.id.slice(0, 6)} — {order.items?.map((i) => i.name).join(', ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {eligibleOrders.length === 0 && (
                                <p className="text-xs text-gray-500">
                                    No orders are ready. Mark an order's testing complete on the Orders page first.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Lab Technician</Label>
                            <Input placeholder="Enter name…" value={technician} onChange={(e) => setTechnician(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Summary / Interpretation</Label>
                            <Textarea
                                placeholder="Clinical interpretation shown to the patient…"
                                className="h-32"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Result File</Label>
                            <div className="flex gap-4 mb-4">
                                <Button type="button" variant={file ? 'default' : 'outline'} onClick={() => { setFile(null); setExternalUrl(''); }} className="flex-1 gap-2">
                                    <Upload className="h-4 w-4" /> Upload File
                                </Button>
                                <Button type="button" variant={!file && externalUrl ? 'default' : 'outline'} onClick={() => setFile(null)} className="flex-1 gap-2">
                                    <LinkIcon className="h-4 w-4" /> External Link
                                </Button>
                            </div>

                            {!externalUrl && (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative">
                                    <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">{file ? file.name : 'Click to upload or drag and drop'}</p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG (MAX. 10MB)</p>
                                </div>
                            )}

                            {(!file || externalUrl) && (
                                <div className="space-y-2">
                                    <Label>External File URL</Label>
                                    <Input placeholder="e.g., Google Drive, Dropbox…" value={externalUrl} onChange={(e) => { setExternalUrl(e.target.value); setFile(null); }} />
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading || !selectedOrderId || (!file && !externalUrl)}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                                ) : (
                                    <><FileText className="mr-2 h-4 w-4" /> Upload Result</>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

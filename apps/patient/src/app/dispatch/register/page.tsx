'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser, useStorage } from '@/firebase/FirebaseProvider';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CourierDocumentType } from '@lablink/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DOC_TYPES: { type: CourierDocumentType; label: string }[] = [
    { type: 'government_id', label: 'Government ID' },
    { type: 'drivers_license', label: "Driver's License" },
];

export default function CourierRegisterPage() {
    const { firestore, user } = useFirebase();
    const { isUserLoading } = useUser();
    const storage = useStorage();
    const router = useRouter();

    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [files, setFiles] = useState<Partial<Record<CourierDocumentType, File>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!isUserLoading && user) setDisplayName((n) => n || user.displayName || '');
    }, [user, isUserLoading]);

    const setFile = (type: CourierDocumentType, file: File | undefined) =>
        setFiles((prev) => ({ ...prev, [type]: file }));

    const allUploaded = DOC_TYPES.every((d) => files[d.type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !storage) return;
        if (!displayName.trim() || !phone.trim()) return toast.error('Please fill in your name and phone.');
        if (!allUploaded) return toast.error('Please upload both documents.');

        setSubmitting(true);
        try {
            await setDoc(
                doc(firestore, 'couriers', user.uid),
                {
                    uid: user.uid,
                    displayName: displayName.trim(),
                    phone: phone.trim(),
                    vehicleType: vehicleType.trim() || null,
                    verificationStatus: 'unverified',
                    createdAt: serverTimestamp(),
                },
                { merge: true }
            );

            for (const { type } of DOC_TYPES) {
                const file = files[type]!;
                const storageRef = ref(storage, `couriers/${user.uid}/documents/${type}_${Date.now()}_${file.name}`);
                const snap = await uploadBytes(storageRef, file);
                const fileUrl = await getDownloadURL(snap.ref);
                await addDoc(collection(firestore, 'couriers', user.uid, 'documents'), {
                    type,
                    fileUrl,
                    status: 'pending',
                    uploadedAt: serverTimestamp(),
                });
            }

            await setDoc(doc(firestore, 'couriers', user.uid), { verificationStatus: 'pending_review' }, { merge: true });

            setDone(true);
            setTimeout(() => router.push('/dispatch'), 2500);
        } catch (err: any) {
            console.error('Courier registration failed:', err);
            toast.error(err.message || 'Could not submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="max-w-lg mx-auto text-center py-16 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <h1 className="text-2xl font-bold text-gray-900">Application submitted</h1>
                <p className="text-gray-500">We'll review your documents and let you know once you're approved.</p>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Courier Application</h1>
            <p className="text-gray-500 mb-6">Apply to deliver samples between collectors and laboratories.</p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white border rounded-lg p-6">
                <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0803…" />
                </div>
                <div className="space-y-2">
                    <Label>Vehicle (optional)</Label>
                    <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Motorcycle, Car" />
                </div>

                {DOC_TYPES.map(({ type, label }) => (
                    <div key={type} className="space-y-2">
                        <Label>{label}</Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-500 transition-colors relative">
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={(e) => setFile(type, e.target.files?.[0])}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <Upload className="h-4 w-4" />
                                {files[type]?.name || 'Click to upload (PDF or image)'}
                            </div>
                        </div>
                    </div>
                ))}

                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                    ) : (
                        'Submit application'
                    )}
                </Button>
            </form>
        </div>
    );
}

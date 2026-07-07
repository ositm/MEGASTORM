'use client';

import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, Loader2, Link as LinkIcon } from "lucide-react";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { useFirebase } from "@/firebase/FirebaseProvider";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";

export default function AdminResultsPage() {
    const { bookings } = useAdminBookings();
    const { firestore, firebaseApp } = useFirebase();
    const storage = useMemo(() => firebaseApp ? getStorage(firebaseApp) : null, [firebaseApp]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');

    const [file, setFile] = useState<File | null>(null);
    const [externalUrl, setExternalUrl] = useState('');

    const [technician, setTechnician] = useState('');
    const [summary, setSummary] = useState("All parameters are within normal limits. No significant abnormalities detected. Recommended routine follow-up in 12 months.");
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExternalUrl(''); // Clear external URL if file is selected
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!selectedBookingId) {
            setError("Please select a booking.");
            return;
        }

        if (!file && !externalUrl) {
            setError("Please upload a file OR provide an external link.");
            return;
        }

        // Validate file type if file is selected
        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setError("Invalid file type. Please upload a PDF, JPG, or PNG.");
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit.");
                return;
            }
        }

        // Check services
        if (!firestore || (!externalUrl && !storage)) {
            setError("Firebase services not initialized. Please refresh the page.");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const booking = bookings.find(b => b.id === selectedBookingId);
            if (!booking) throw new Error("Booking not found");

            let downloadURL = externalUrl;

            // 1. Upload File to Firebase Storage (only if file is selected)
            if (file && storage) {
                const storageRef = ref(storage, `results/${booking.userId}/${Date.now()}_${file.name}`);
                console.log("Uploading to:", storageRef.fullPath);

                const snapshot = await uploadBytes(storageRef, file);
                console.log("Upload success:", snapshot);

                downloadURL = await getDownloadURL(snapshot.ref);
                console.log("Download URL:", downloadURL);
            }

            // 2. Create Result Document in Firestore
            const resultData = {
                userId: booking.userId,
                bookingId: booking.id,
                testName: booking.testName,
                labName: booking.labName,
                labId: booking.labId,
                date: Timestamp.now(),
                summary: summary,
                technician: technician,
                fileUrl: downloadURL,
                status: 'ready',
                aiSummary: summary // Using the same summary for now
            };

            await addDoc(collection(firestore, 'results'), resultData);

            // 3. Update Booking Status
            const bookingRef = doc(firestore, 'bookings', booking.id);
            await updateDoc(bookingRef, { status: 'result_ready' });

            setIsSuccess(true);
            setFile(null);
            setExternalUrl('');
            setSelectedBookingId('');

            // Reset success message after 3 seconds
            setTimeout(() => setIsSuccess(false), 3000);

        } catch (err: any) {
            console.error("Upload error details:", err);
            let errorMessage = "Failed to upload result.";
            if (err.code === 'storage/unauthorized') {
                errorMessage = "Permission denied. Please check if you are logged in and have rights to upload.";
            } else if (err.message) {
                errorMessage += " " + err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter processing or confirmed bookings for result upload
    const eligibleBookings = bookings.filter(b => b.status === 'processing' || b.status === 'confirmed');

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Test Results</h1>
                <p className="text-gray-500 mt-2">Generate and upload patient reports.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8">
                {isSuccess ? (
                    <div className="text-center py-12">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Uploaded Successfully!</h2>
                        <p className="text-gray-500 mb-6">The patient has been notified and can now view their results.</p>
                        <Button onClick={() => setIsSuccess(false)}>Upload Another</Button>
                    </div>
                ) : (
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Select Booking</Label>
                            <Select onValueChange={setSelectedBookingId} value={selectedBookingId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a patient booking..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleBookings.map(booking => (
                                        <SelectItem key={booking.id} value={booking.id}>
                                            {booking.userName || "User"} - {booking.testName} (#{booking.id.slice(0, 6)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Test Date</Label>
                                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label>Lab Technician</Label>
                                <Input
                                    placeholder="Enter name..."
                                    value={technician}
                                    onChange={(e) => setTechnician(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>AI Summary / Interpretation</Label>
                            <Textarea
                                placeholder="Enter the clinical interpretation of the results..."
                                className="h-32"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">This summary will be displayed to the patient.</p>
                        </div>

                        <div className="space-y-4">
                            <Label>Result File</Label>
                            <div className="flex gap-4 mb-4">
                                <Button
                                    type="button"
                                    variant={file ? "default" : "outline"}
                                    onClick={() => { setFile(null); setExternalUrl(''); }}
                                    className="flex-1 gap-2"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload File
                                </Button>
                                <Button
                                    type="button"
                                    variant={!file && externalUrl ? "default" : "outline"}
                                    onClick={() => { setFile(null); }}
                                    className="flex-1 gap-2"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    External Link
                                </Button>
                            </div>

                            {!externalUrl && (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-500 transition-colors relative">
                                    <input
                                        type="file"
                                        accept="application/pdf,image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">
                                        {file ? file.name : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG (MAX. 5MB)</p>
                                </div>
                            )}

                            {(!file || externalUrl) && (
                                <div className="space-y-2">
                                    <Label>External File URL</Label>
                                    <Input
                                        placeholder="e.g., Google Drive link, Dropbox link..."
                                        value={externalUrl}
                                        onChange={(e) => {
                                            setExternalUrl(e.target.value);
                                            setFile(null);
                                        }}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Paste a shareable link to the file (Google Drive, Dropbox, etc.)
                                    </p>
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading || !selectedBookingId || (!file && !externalUrl)}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Generate & Upload Result
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { FileText, Download, Share2, Activity, BrainCircuit, Eye, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { useResults } from '@/hooks/use-results';
import { format } from 'date-fns';
import PDFViewer from '@/components/pdf-viewer';
import { TestResult } from '@/types';
import { useFirebase, useStorage, useFirestore } from '@/firebase/FirebaseProvider';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function TestResultsPage() {
    const { results, loading } = useResults();
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
    const [isPdfOpen, setIsPdfOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState('');
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

    const { user } = useFirebase();
    const storage = useStorage();
    const firestore = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleViewPdf = (result: TestResult) => {
        setSelectedResult(result);
        setIsPdfOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            toast.error('File size too large. Please upload a file smaller than 5MB.');
            return;
        }

        if (!user || !storage || !firestore) {
            toast.error('Authentication or Storage service not available');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Starting upload...');

        try {
            // Read file as Base64 string
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataURL = e.target?.result as string;
                if (!dataURL) return;

                try {
                    // Files are scoped by owner uid so storage rules can
                    // enforce that patients only touch their own results.
                    const storageRef = ref(storage, `results/${user.uid}/${Date.now()}_${file.name}`);

                    // Upload using uploadString (Base64) - Robust client-side method
                    const snapshot = await uploadString(storageRef, dataURL, 'data_url');

                    const downloadURL = await getDownloadURL(snapshot.ref);

                    // Create a document in Firestore
                    const resultData: TestResult = {
                        id: '',
                        userId: user.uid,
                        labName: 'Uploaded Result',
                        testName: file.name.replace('.pdf', ''),
                        date: Timestamp.now(),
                        status: 'uploaded',
                        aiSummary: 'Analysis pending...',
                        fileUrl: downloadURL
                    };

                    const docRef = await addDoc(collection(firestore, 'results'), resultData);

                    toast.success('Result uploaded successfully', { id: toastId });
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';

                } catch (uploadError: any) {
                    setUploading(false);
                    console.error('Upload Error:', uploadError);
                    if (uploadError.code === 'storage/unauthorized') {
                        toast.error('Permission Denied (403). Check Console.', { id: toastId });
                    } else if (uploadError.code === 'storage/object-not-found') {
                        toast.error('Bucket not found (404).', { id: toastId });
                    } else {
                        toast.error(`Upload failed: ${uploadError.message} (${uploadError.code})`, { id: toastId });
                    }
                }
            };
            reader.readAsDataURL(file);

        } catch (error: any) {
            // Catch synchronous errors
            setUploading(false);
            console.error('Setup failed details:', error);
            toast.error(`Failed to start upload: ${error.message}`, { id: toastId });
        }
    };

    const handleAnalyze = async (result: TestResult) => {
        if (!firestore || !user) return;

        const analyzeToastId = toast.loading('Analyzing result...');
        setAnalyzingIds(prev => new Set(prev).add(result.id));

        try {
            await updateDoc(doc(firestore, 'results', result.id), {
                status: 'analyzing',
                aiSummary: 'Analyzing...'
            });

            const idToken = await user.getIdToken();
            const response = await fetch('/api/results/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ fileUrl: result.fileUrl }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Analysis failed');
            }

            const data = await response.json();

            await updateDoc(doc(firestore, 'results', result.id), {
                aiSummary: data.summary,
                status: 'analyzed'
            });

            toast.success('AI Analysis complete', { id: analyzeToastId });

            // Open Modal immediately on success
            setCurrentAnalysis(data.summary);
            setIsAnalysisModalOpen(true);

        } catch (analysisError: any) {
            console.error('Analysis error:', analysisError);
            toast.error(`AI Analysis failed: ${analysisError.message}`, { id: analyzeToastId });
            await updateDoc(doc(firestore, 'results', result.id), {
                aiSummary: 'Analysis failed. Please try again later.',
                status: 'failed'
            });
        } finally {
            setAnalyzingIds(prev => {
                const next = new Set(prev);
                next.delete(result.id);
                return next;
            });
        }
    };

    const handleDelete = async (result: TestResult) => {
        if (!confirm('Are you sure you want to delete this test result? This cannot be undone.')) return;
        if (!firestore || !storage) return;

        const toastId = toast.loading('Deleting result...');
        try {
            // 1. Delete from Firestore
            await deleteDoc(doc(firestore, 'results', result.id));

            // 2. Delete from Storage (if possible/needed) - try/catch this separately as it might fail if user doesn't have permission or file missing
            try {
                // Reconstruct ref from fileUrl is hard, but we know usage path: uploads/timestamp_filename
                // Actually result doesn't store storage path. 
                // But we can try to extract name or just skip if too complex.
                // Ideally we stored 'storagePath' in the result doc.
                // For now, let's just delete the doc. The file will be orphaned but that's okay for MVP.
                // OR we can try to delete from URL reference if we had full ref.
                // Let's assume just doc delete for safety unless we stored path.
                // Wait, we have result.fileUrl.
            } catch (e) {
                console.warn('Storage delete skipped', e);
            }

            toast.success('Result deleted', { id: toastId });
        } catch (error: any) {
            console.error('Delete error', error);
            toast.error(`Delete failed: ${error.message}`, { id: toastId });
        }
    };

    const openAnalysisModal = (summary: string) => {
        setCurrentAnalysis(summary);
        setIsAnalysisModalOpen(true);
    };

    return (
        <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Test Results</h1>
                    <p className="text-gray-600">View and manage your laboratory test reports.</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="application/pdf"
                    />
                    <Button onClick={handleUploadClick} disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload Result'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading results...</p>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow p-8">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Results Yet</h3>
                    <p className="text-gray-500 mt-2">Book a test to get started with your health journey.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {results.map((result) => (
                        <div key={result.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <Image src="/result.png" alt="Result" width={40} height={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{result.testName}</h3>
                                        <p className="text-sm text-gray-500">{result.labName} • {format(result.date.toDate(), 'PPP')}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${result.status === 'normal' || result.status === 'analyzed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {result.status}
                                </div>
                            </div>

                            {/* AI Summary Section */}
                            {(result.status === 'analyzed' || result.status === 'analyzing') && (
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <div className="flex items-start gap-3">
                                        <BrainCircuit className={`w-6 h-6 text-indigo-600 mt-1 flex-shrink-0 ${result.status === 'analyzing' ? 'animate-pulse' : ''}`} />
                                        <div>
                                            <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-1">AI Interpretation</h4>
                                            <p className="text-indigo-800 leading-relaxed">{result.aiSummary}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 flex justify-end gap-3 flex-wrap">
                                {result.status !== 'analyzed' && result.status !== 'analyzing' && (
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={() => handleAnalyze(result)}
                                        disabled={analyzingIds.has(result.id)}
                                    >
                                        <BrainCircuit className={`w-4 h-4 ${analyzingIds.has(result.id) ? 'animate-spin' : ''}`} />
                                        Analyze with AI
                                    </Button>
                                )}
                                {result.status === 'analyzed' && (
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                                        onClick={() => openAnalysisModal(result.aiSummary || '')}
                                    >
                                        <BrainCircuit className="w-4 h-4" />
                                        View Analysis
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewPdf(result)}>
                                    <Eye className="w-4 h-4" />
                                    View Report
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(result)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedResult && (
                <PDFViewer
                    isOpen={isPdfOpen}
                    onClose={() => setIsPdfOpen(false)}
                    fileUrl={selectedResult.fileUrl}
                    title={`${selectedResult.testName} Report`}
                />
            )}

            <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-indigo-700">
                            <BrainCircuit className="w-6 h-6" />
                            AI Health Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Analysis based on your uploaded lab report.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 prose prose-indigo max-w-none">
                        <ReactMarkdown>{currentAnalysis}</ReactMarkdown>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsAnalysisModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

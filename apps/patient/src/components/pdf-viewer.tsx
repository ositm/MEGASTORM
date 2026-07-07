'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface PDFViewerProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    title: string;
}

export default function PDFViewer({ isOpen, onClose, fileUrl, title }: PDFViewerProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 bg-gray-100 rounded-md border flex flex-col items-center justify-center overflow-hidden relative">
                    {fileUrl && fileUrl !== '#' ? (
                        <>
                            <iframe
                                src={fileUrl}
                                className="w-full h-full"
                                title="PDF Viewer"
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <Button variant="secondary" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Open / Download
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Preview Not Available</h3>
                            <p className="text-gray-500 mb-6">This is a mock result. In a real app, the PDF would load here.</p>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Report
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

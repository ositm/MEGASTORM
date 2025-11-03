
'use client';

import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TestResultsPage() {
    const router = useRouter();

    // Dummy data for demonstration
    const results = [
        {
            labName: "Marvel Labs",
            date: "February 11, 2025",
            tests: [""],
            downloadUrl: "https://firebasestorage.googleapis.com/v0/b/lab-link-2025.firebasestorage.app/o/results%2F4KtRgNNAyWfZkz4jTtdgTFsLmRr2%2FW82EzQVNBSDM9WGsJjhL%2Fproof_english.pdf?alt=media&token=05362fb4-594a-44ca-9105-ebae90123f6f"
        }
    ];

    return (
        <div className="p-4">
            <div className="flex items-center space-x-4 mb-6 p-4 border-b">
                <button 
                    onClick={() => router.back()} 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">Medical Results History</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {results.map((result, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-gray-800">{result.labName}</h3>
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">{result.date}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {result.tests.map((test, i) => (
                                    <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs">
                                        {test}
                                    </span>
                                ))}
                            </div>
                            <a 
                                href={result.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full flex items-center justify-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Results
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


'use client'

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FindALab from '@/components/find-a-lab';

export default function FindALabPage() {
    const router = useRouter();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center space-x-4 mb-6 p-4 border-b">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">Find a Lab</h1>
            </div>
            <FindALab />
        </div>
    );
}

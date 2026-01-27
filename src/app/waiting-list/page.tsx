'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase/provider';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function WaitingListPage() {
    const { firestore } = useFirebase();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!firestore) {
            // Fallback for demo/no-firebase mode
            setTimeout(() => {
                setSubmitted(true);
                setLoading(false);
            }, 1000);
            return;
        }

        try {
            await addDoc(collection(firestore, 'waitingList'), {
                name,
                email,
                message, // Optional message/question
                type: 'support_or_faq',
                createdAt: Timestamp.now()
            });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-lg text-center space-y-6">
                    <div className="mx-auto bg-green-100 h-16 w-16 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">You're on the list!</h1>
                    <p className="text-gray-600">
                        Thanks for reaching out. Our support team has received your details and will get back to you shortly.
                    </p>
                    <Link href="/home">
                        <Button className="w-full">Return Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-lg space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">Support & FAQ</h1>
                    <p className="text-gray-600">
                        Our full support center is coming soon. Please join our waiting list or leave your question below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <Input
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <Input
                            required
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Your Question / Message (Optional)</label>
                        <Textarea
                            placeholder="How can I...?"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                        {loading ? 'Submitting...' : 'Join Waiting List'}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 pt-4 border-t">
                    <p>Direct Support:</p>
                    <p className="font-semibold text-gray-700">healthesphere@gmail.com</p>
                    <p className="font-semibold text-gray-700">08058765439</p>
                </div>
            </div>
        </div>
    );
}

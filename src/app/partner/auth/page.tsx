'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PartnerAuthPage() {
    const { auth } = useFirebase();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!auth) return;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Verify if user is actually a partner? For now, just let them into the dashboard, redirect logic can check role.
            router.push('/partner/dashboard');
        } catch (err: any) {
            console.error(err);
            setError('Invalid credentials or partner account not found.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto bg-blue-600 h-12 w-12 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-white font-bold text-xl">LP</span>
                    </div>
                    <CardTitle className="text-2xl">Partner Portal</CardTitle>
                    <CardDescription>Sign in to manage your lab and appointments</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="lab@partner.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In to Dashboard'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/auth/signin" className="text-sm text-gray-500 hover:text-blue-600">
                        Not a partner? Go to user sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, TestTube2, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebase } from '@/firebase/FirebaseProvider';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useUserProfile } from '@/hooks/use-user-profile';

const formSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(1, { message: 'Password is required.' }),
});

type FormData = z.infer<typeof formSchema>;

export function LabSignInForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const { auth, user, isUserLoading } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (!isUserLoading && user && !profileLoading && profile) {
            // Redirect logic
            if (profile.role === 'lab_admin' || profile.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                // If a regular user tries to sign in here, warn them or redirect home
                // For now, just redirect to home, or maybe show an error "Not a lab account"
                router.push('/home');
            }
        }
    }, [user, isUserLoading, router, profile, profileLoading]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        if (!auth) return;
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
        } catch (error: any) {
            let errorMessage = 'Invalid credentials.';
            if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            }
            setError(errorMessage);
        }
    };

    if (isUserLoading || user) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <TestTube2 className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    Partner Portal
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Sign in to manage your lab, tests, and bookings.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="text-gray-700">Work Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@labname.com"
                            {...register('email')}
                            className="mt-1 bg-gray-50"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                        <div className="relative mt-1">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pr-10 bg-gray-50"
                                {...register('password')}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg shadow-lg shadow-blue-200"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Accessing Portal...' : 'Access Portal'}
                </Button>

                <div className="text-center text-sm">
                    <span className="text-gray-500">New Partner? </span>
                    <Link href="/auth/lab-registration" className="font-semibold text-blue-600 hover:text-blue-500">
                        Register your Lab
                    </Link>
                </div>
            </form>

            <div className="mt-10 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
                <div className="flex flex-col items-center gap-1">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Real-time Analytics</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span>Secure Data</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <TestTube2 className="h-5 w-5 text-blue-600" />
                    <span>Test Management</span>
                </div>
            </div>
        </div>
    );
}

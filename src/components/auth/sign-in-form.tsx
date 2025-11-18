'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirebase } from '@/firebase/provider';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width="24px"
      height="24px"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.84,44,30.338,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormData = z.infer<typeof formSchema>;

export function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { auth, user, isUserLoading } = useFirebase();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/home');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Let the useEffect handle the redirect
    } catch (error: any) {
      setError(error.message);
      console.error('Google Sign-In Error:', error);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!auth) return;
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      // Let the useEffect handle the redirect
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = 'Failed to sign in. Please try again.';
            break;
        }
      }
      setError(errorMessage);
      console.error('Email Sign-In Error:', error);
    }
  };

  if (isUserLoading || user) {
     return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 pt-0">
            <h1 className="text-xl font-semibold mb-4 py-2 text-start">Sign In</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="space-y-2">
                        <Input id="email" type="email" placeholder="Enter your email address" {...register('email')} />
                         {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="relative">
                        <Label htmlFor="password">Password</Label>
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="pr-10"
                                {...register('password')}
                                />
                                <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 h-9 w-9"
                                onClick={() => setShowPassword(!showPassword)}
                                >
                                {showPassword ? (
                                    <EyeOff className="h-[18px] w-[18px]" />
                                ) : (
                                    <Eye className="h-[18px] w-[18px]" />
                                )}
                                </Button>
                            </div>
                             {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>
                    </div>
                </div>
                 {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                <Button type="submit" className="w-full lg:w-auto mt-5 min-w-[140px] py-4 px-8 flex items-center justify-center gap-2 rounded-[24px] text-white" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
            </form>

            <div className="mt-4 w-full space-y-3">
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">Or sign in with</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <div className="w-full">
                    <Button variant="outline" className="flex w-full items-center justify-center gap-1" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                        <GoogleIcon className="w-5 h-5" />
                        Continue with Google
                    </Button>
                </div>
            </div>
        </CardContent>
        <CardFooter className="text-center py-4 block">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
                Sign Up
            </Link>
      </CardFooter>
    </Card>
  );
}

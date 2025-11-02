'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login
    router.push('/home');
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 pt-0">
            <h1 className="text-xl font-semibold mb-4 py-2 text-start">Sign In</h1>
            <form onSubmit={handleSignIn}>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="space-y-2">
                        <Input id="email" type="email" name="email" placeholder="Enter your email address" required />
                        </div>
                    </div>

                    <div className="relative">
                        <Label htmlFor="password">Password</Label>
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="pr-10"
                                required
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
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full lg:w-auto mt-5 min-w-[140px] py-4 px-8 flex items-center justify-center gap-2 rounded-[24px] text-white">
                    Sign In
                </Button>
            </form>

            <div className="mt-4 w-full space-y-3">
                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">Or sign in with</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <div className="w-full">
                    <Button variant="outline" className="flex w-full items-center justify-center gap-1" onClick={() => router.push('/home')}>
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

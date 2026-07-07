import { LabSignInForm } from '@/components/auth/lab-sign-in-form';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function LabSignInPage() {
    return (
        <FirebaseClientProvider>
            <div className="flex min-h-screen w-full">
                {/* Left Side - Form */}
                <div className="flex w-full flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <LabSignInForm />
                    </div>
                </div>

                {/* Right Side - Visuals */}
                <div className="hidden w-1/2 bg-slate-900 lg:block relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-slate-900 opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center p-12 text-white z-10">
                        <div className="max-w-lg space-y-6">
                            <h1 className="text-4xl font-bold tracking-tight">
                                Empowering Modern Diagnostics
                            </h1>
                            <p className="text-lg text-blue-100">
                                Join thousands of top-tier laboratories managing their operations with LabLink.
                                Streamline bookings, manage test catalogs, and deliver results faster.
                            </p>
                            <div className="grid grid-cols-2 gap-6 pt-8">
                                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                                    <div className="text-2xl font-bold">500+</div>
                                    <div className="text-sm text-blue-200">Partner Labs</div>
                                </div>
                                <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                                    <div className="text-2xl font-bold">1M+</div>
                                    <div className="text-sm text-blue-200">Tests Processed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Abstract shapes or pattern */}
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500 blur-3xl opacity-20" />
                    <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-500 blur-3xl opacity-20" />
                </div>
            </div>
        </FirebaseClientProvider>
    );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebase } from '@/firebase/FirebaseProvider';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail } from "lucide-react";

export default function SecuritySettingsPage() {
    const { auth, user } = useFirebase();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!auth || !user || !user.email) return;
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: "Email Sent",
                description: "We've sent a password reset link to your email address.",
            });
        } catch (error: any) {
            console.error("Error sending password reset email:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to send password reset email.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Security Settings</h2>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Password</CardTitle>
                        <CardDescription>
                            Manage your password and account security.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <Lock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Change Password</p>
                                    <p className="text-sm text-muted-foreground">
                                        Receive an email to reset your password.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handlePasswordReset}
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Reset Password"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Two-Factor Authentication</CardTitle>
                        <CardDescription>
                            Add an extra layer of security to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="bg-gray-200 p-2 rounded-full">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-500">Two-Factor Authentication</p>
                                    <p className="text-sm text-muted-foreground">
                                        This feature is currently under development.
                                    </p>
                                </div>
                            </div>
                            <Button disabled variant="secondary">Coming Soon</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

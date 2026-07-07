'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFirebase } from '@/firebase/FirebaseProvider';
import { deleteUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function PrivacySettingsPage() {
    const { user } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (!user) return;
        setLoading(true);

        try {
            await deleteUser(user);
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            });
            router.push('/');
        } catch (error: any) {
            console.error("Error deleting account:", error);
            // Re-authentication might be required
            toast({
                title: "Error",
                description: error.message || "Failed to delete account. You may need to re-login first.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Privacy Settings</h2>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Privacy</CardTitle>
                        <CardDescription>
                            Manage how your data is used and shared.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-muted-foreground">
                                We value your privacy. Your medical data is encrypted and only shared with the labs you book appointments with.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Irreversible actions regarding your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50">
                            <div>
                                <p className="font-medium text-red-900">Delete Account</p>
                                <p className="text-sm text-red-700">
                                    Permanently delete your account and all associated data.
                                </p>
                            </div>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={loading}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your
                                            account and remove your data from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteAccount}
                                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                        >
                                            {loading ? "Deleting..." : "Yes, delete my account"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

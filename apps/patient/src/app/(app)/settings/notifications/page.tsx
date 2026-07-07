'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFirebase } from '@/firebase/FirebaseProvider';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare } from "lucide-react";

export default function NotificationsSettingsPage() {
    const { firestore, user } = useFirebase();
    const { profile, loading: profileLoading } = useUserProfile();
    const { toast } = useToast();

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        smsNotifications: false
    });

    useEffect(() => {
        if (profile?.preferences) {
            setPreferences({
                emailNotifications: profile.preferences.emailNotifications ?? true,
                smsNotifications: profile.preferences.smsNotifications ?? false
            });
        }
    }, [profile]);

    const handleToggle = async (key: 'emailNotifications' | 'smsNotifications', value: boolean) => {
        if (!firestore || !user) return;

        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const userRef = doc(firestore, 'users', user.uid);
            // Use setDoc with merge: true to ensure nested fields are updated correctly without overwriting the whole doc
            // and to create the doc if it doesn't exist (though it should)
            await setDoc(userRef, {
                preferences: {
                    ...preferences, // keep other preferences
                    [key]: value
                }
            }, { merge: true });

            toast({
                title: "Preferences Saved",
                description: "Your notification settings have been updated.",
            });
        } catch (error) {
            console.error("Error updating preferences:", error);
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !value }));
            toast({
                title: "Error",
                description: "Failed to save preferences.",
                variant: "destructive",
            });
        }
    };

    if (profileLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Notifications Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Choose how you want to receive updates and alerts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive booking confirmations and test results via email.
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="email-notifications"
                            checked={preferences.emailNotifications}
                            onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-2 rounded-full">
                                <MessageSquare className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive instant alerts via SMS (Carrier rates may apply).
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="sms-notifications"
                            checked={preferences.smsNotifications}
                            onCheckedChange={(checked) => handleToggle('smsNotifications', checked)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

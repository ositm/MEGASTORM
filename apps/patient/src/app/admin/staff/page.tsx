'use client';

import { useState } from 'react';
import { useLabStaff } from '@/hooks/use-lab-staff';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUser } from '@/firebase/FirebaseProvider';
import { addLabStaffViaApi, removeLabStaffViaApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStaffPage() {
    const { profile } = useUserProfile();
    const { staff, loading } = useLabStaff();
    const { user } = useUser();
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    if (profile && profile.role !== 'lab_admin') {
        return (
            <div className="text-center py-16 text-gray-500">
                Staff management is available to lab administrators.
            </div>
        );
    }

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !email.trim()) return;
        setAdding(true);
        try {
            await addLabStaffViaApi(user, email.trim());
            toast.success('Staff member added');
            setEmail('');
        } catch (err: any) {
            toast.error(err.message || 'Could not add staff');
        } finally {
            setAdding(false);
        }
    };

    const remove = async (uid: string) => {
        if (!user) return;
        setBusyId(uid);
        try {
            await removeLabStaffViaApi(user, uid);
            toast.success('Staff member removed');
        } catch (err: any) {
            toast.error(err.message || 'Could not remove staff');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lab Staff</h1>
                    <p className="text-gray-500">Add scientists who can process samples and results for your lab.</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-5">
                    <form onSubmit={add} className="flex gap-3">
                        <Input
                            type="email"
                            placeholder="staff member's email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button type="submit" disabled={adding || !email.trim()}>
                            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> Add</>}
                        </Button>
                    </form>
                    <p className="text-xs text-gray-400 mt-2">The person must already have a LabLink account.</p>
                </CardContent>
            </Card>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                ) : staff.length === 0 ? (
                    <p className="text-gray-400 text-sm">No staff added yet.</p>
                ) : (
                    staff.map((m) => (
                        <Card key={m.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <span className="text-gray-900">{m.email}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    disabled={busyId === m.uid}
                                    onClick={() => remove(m.uid)}
                                >
                                    {busyId === m.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

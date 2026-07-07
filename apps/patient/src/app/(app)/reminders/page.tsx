'use client';
import { useState, useEffect } from 'react';
import { useFirebase, useFirestore } from '@/firebase/FirebaseProvider';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Bell, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Reminder {
    id: string;
    title: string;
    date: any; // Timestamp
    type: 'medication' | 'appointment' | 'general';
}

export default function RemindersPage() {
    const { user, firestore } = useFirebase();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(''); // ISO string yyyy-mm-dd
    const [time, setTime] = useState('09:00');

    const fetchReminders = async () => {
        if (!user || !firestore) return;
        setLoading(true);
        try {
            const q = query(
                collection(firestore, 'reminders'),
                where('userId', '==', user.uid),
                orderBy('date', 'asc')
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
            setReminders(data);
        } catch (error) {
            console.error('Fetch reminders error:', error);
            // Index might be required for compound query userId + date
            // Fallback to client sorting if index error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders();
    }, [user, firestore]);

    const handleAddReminder = async () => {
        if (!title || !date || !user || !firestore) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            const [hours, minutes] = time.split(':').map(Number);
            const reminderDate = new Date(date);
            reminderDate.setHours(hours, minutes);

            await addDoc(collection(firestore, 'reminders'), {
                userId: user.uid,
                title,
                date: reminderDate,
                type: 'general',
                createdAt: serverTimestamp()
            });

            toast.success('Reminder added');
            setOpen(false);
            setTitle('');
            setDate('');
            fetchReminders();

        } catch (error) {
            console.error('Add reminder error:', error);
            toast.error('Failed to add reminder');
        }
    };

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'reminders', id));
            toast.success('Reminder deleted');
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            toast.error('Failed to delete reminder');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Health Reminders</h1>
                    <p className="text-gray-600">Stay on top of your health schedule.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Add Reminder
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. Take Vitamin D"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleAddReminder}>Save Reminder</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4">
                {reminders.map(reminder => (
                    <Card key={reminder.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full mt-1">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <CalendarIcon className="w-3 h-3" />
                                    {reminder.date?.seconds ? format(new Date(reminder.date.seconds * 1000), 'PPP p') : 'Invalid Date'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(reminder.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </Card>
                ))}
                {!loading && reminders.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No reminders yet. Add one to get started!</p>
                    </div>
                )}
                {loading && <div className="text-center py-8">Loading...</div>}
            </div>
        </div>
    );
}

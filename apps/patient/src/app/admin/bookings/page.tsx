'use client';

import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AdminBookingsPage() {
    const { bookings, updateStatus } = useAdminBookings();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'confirmed': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
                    <p className="text-gray-500 mt-2">View and manage patient appointments.</p>
                </div>
                <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Patient Name</TableHead>
                            <TableHead>Test Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">#{booking.id}</TableCell>
                                <TableCell>{booking.userName}</TableCell>
                                <TableCell>{booking.testName}</TableCell>
                                <TableCell>{booking.date}</TableCell>
                                <TableCell>${booking.price}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(booking.status)} variant="secondary">
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {booking.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => updateStatus(booking.id, 'confirmed')}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => updateStatus(booking.id, 'cancelled')}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => updateStatus(booking.id, 'completed')}
                                            >
                                                Complete & Upload
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

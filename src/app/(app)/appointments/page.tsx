import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck2 } from "lucide-react";

export default function AppointmentsPage() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold font-headline mb-6">My Appointments</h1>
            <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <CalendarCheck2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-headline">Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        This is where you will see and manage your scheduled appointments.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

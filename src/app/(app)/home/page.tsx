'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplets, FileText, HeartPulse } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const metrics = [
    { title: "Upcoming Appointments", value: "2", icon: Activity, description: "Next: Annual Check-up" },
    { title: "Recent Test Results", value: "View", icon: FileText, description: "Blood Panel - Normal" },
    { title: "Heart Rate", value: "72 bpm", icon: HeartPulse, description: "Resting" },
    { title: "Blood Sugar", value: "98 mg/dL", icon: Droplets, description: "Fasting" },
]

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col">
        <header className="p-6 border-b">
            <h1 className="text-3xl font-bold font-headline">Welcome, chukwu!</h1>
            <p className="text-muted-foreground">Your personal health monitoring dashboard.</p>
            <Button className="mt-4" onClick={() => router.push('/schedule')}>Make an Appointment</Button>
        </header>
        <main className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold font-headline">Your Health at a Glance</h2>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">View All &gt;</Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric) => (
                    <Card key={metric.title} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                            <metric.icon className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metric.value}</div>
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    </div>
  )
}

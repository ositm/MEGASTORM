'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  FileText,
  Building2,
  Plus,
  ChevronRight,
  CircleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    Welcome back, Ugochukwu
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Here's what's happening with your health monitoring
                  </p>
                </div>
                <Button asChild>
                  <Link href="/schedule">Make an appointment</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Link
                  href="/schedule"
                  className="p-4 rounded-xl bg-white border hover:border-blue-500 transition-all duration-200 text-left group"
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg w-fit">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mt-3 text-gray-800 group-hover:text-blue-500">
                    Schedule Test
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Book a new lab appointment
                  </p>
                </Link>
                <Link
                  href="/results"
                  className="p-4 rounded-xl bg-white border hover:border-blue-500 transition-all duration-200 text-left group"
                >
                  <div className="bg-green-100 text-green-600 p-2 rounded-lg w-fit">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mt-3 text-gray-800 group-hover:text-blue-500">
                    View Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Check your test results
                  </p>
                </Link>
                <Link
                  href="/find-a-lab"
                  className="p-4 rounded-xl bg-white border hover:border-blue-500 transition-all duration-200 text-left group"
                >
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-lg w-fit">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mt-3 text-gray-800 group-hover:text-blue-500">
                    Find Lab
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Locate nearest lab
                  </p>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Next Appointment
                  </h2>
                  <Link
                    href="/appointments"
                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <Button asChild variant="outline" className="w-full p-4 border-2 border-dashed rounded-lg text-center hover:border-blue-500 group">
                  <Link href="/schedule" className='flex items-center justify-center gap-2 text-gray-600 group-hover:text-blue-500'>
                    <Plus className="h-5 w-5" />
                    <span>Schedule New Appointment</span>
                  </Link>
                </Button>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Recent Results
                  </h2>
                  <Link
                    href="/results"
                    className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-500 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h1 className="font-medium text-green-600">
                          Marvel Labs
                        </h1>
                        <h3 className="font-medium text-gray-800"></h3>
                        <p className="text-sm text-gray-600">2025-02-11</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/3">
          <div className="lg:w-80 w-full space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 text-center">
                    No new notifications
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Health Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CircleAlert className="text-blue-500 mt-0.5 h-4 w-4" />
                    <p className="text-sm text-gray-600">
                      Schedule annual physical examination
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

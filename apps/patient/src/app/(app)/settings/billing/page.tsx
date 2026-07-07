'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, History } from "lucide-react";

export default function BillingSettingsPage() {
    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Billing Settings</h2>

            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle>Payment Methods</CardTitle>
                            <CardDescription>
                                Manage your saved payment cards.
                            </CardDescription>
                        </div>
                        <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Method
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                                <CreditCard className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">No payment methods added</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add a card to speed up your checkout process.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Transaction History</CardTitle>
                        </div>
                        <CardDescription>
                            View your past payments and invoices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            No transactions found.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

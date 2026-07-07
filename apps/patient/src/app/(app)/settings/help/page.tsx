'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

export default function HelpSettingsPage() {
    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Help & Support</h2>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Support</CardTitle>
                        <CardDescription>
                            Need help? Reach out to our support team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <a href="mailto:support@lablink.com">
                                <Mail className="h-6 w-6 mb-1" />
                                <span className="font-medium">Email Support</span>
                                <span className="text-xs text-muted-foreground">support@lablink.com</span>
                            </a>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                            <a href="tel:+2348000000000">
                                <Phone className="h-6 w-6 mb-1" />
                                <span className="font-medium">Call Us</span>
                                <span className="text-xs text-muted-foreground">+234 800 000 0000</span>
                            </a>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                        <CardDescription>
                            Quick answers to common questions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>How do I book a test?</AccordionTrigger>
                                <AccordionContent>
                                    You can book a test by navigating to the "Schedule Appointment" page, selecting a lab, choosing your desired test, and picking a date and time.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>When will I get my results?</AccordionTrigger>
                                <AccordionContent>
                                    Result turnaround times vary by test and lab. Typically, you will receive a notification when your results are ready to view in the "Test Results" section.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Can I cancel an appointment?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, you can cancel an appointment from the "My Appointments" page, provided it is at least 24 hours before the scheduled time.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                                <AccordionContent>
                                    Yes, we take data security seriously. Your medical information is encrypted and stored securely, accessible only to you and the authorized labs.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

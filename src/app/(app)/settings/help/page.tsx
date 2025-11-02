import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function HelpSettingsPage() {
    return (
        <div>
            <h2 className="text-2xl font-semibold font-headline mb-6">Help Settings</h2>
            <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[300px]">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <HelpCircle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 text-2xl font-headline">Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Our help center and FAQ section are being built.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

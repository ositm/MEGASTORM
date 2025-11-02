import SymptomChecker from "@/components/symptom-checker";

export default function SchedulePage() {
    return (
        <div className="p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold font-headline">Schedule an Appointment</h1>
                <p className="text-muted-foreground mt-1">
                    Use our AI Symptom Checker or browse tests to get started.
                </p>
            </header>
            <main>
                <SymptomChecker />
            </main>
        </div>
    );
}

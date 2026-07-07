import { LabRegistrationForm } from '@/components/auth/lab-registration-form';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function LabRegistrationPage() {
    return (
        <FirebaseClientProvider>
            <LabRegistrationForm />
        </FirebaseClientProvider>
    );
}

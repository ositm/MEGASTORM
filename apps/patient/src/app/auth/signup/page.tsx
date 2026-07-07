import { SignUpForm } from '@/components/auth/sign-up-form';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function SignUpPage() {
  return (
    <FirebaseClientProvider>
      <SignUpForm />
    </FirebaseClientProvider>
  );
}

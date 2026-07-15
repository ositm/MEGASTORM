import { redirect } from 'next/navigation';

// The portal layout handles auth: signed-out users bounce to /signin,
// non-lab accounts see the request-access screen.
export default function RootPage() {
    redirect('/dashboard');
}

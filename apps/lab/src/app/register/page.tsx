import type { Metadata } from 'next';
import { PartnerApplicationForm } from '@/components/auth/partner-application-form';

export const metadata: Metadata = {
    title: 'Join the LabLink network',
    description: 'Apply to onboard your laboratory as a LabLink partner.',
};

export default function PartnerApplicationPage() {
    return <PartnerApplicationForm />;
}

'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

const IMAGING_PACKAGES = [
    {
        name: 'Whole Body MRI Scan',
        description: 'Comprehensive magnetic resonance imaging for full body assessment. Includes brain, spine, chest, abdomen, and pelvis screening.',
        category: 'Imaging',
        icon: '🧘',
        price: 150000,
        currency: 'NGN',
        discount: 0,
        popular: true,
        tests: [], // In a real app, we'd link to actual test IDs
        includes: [
            'Brain MRI',
            'Whole Spine Screening',
            'Abdominal MRI',
            'Pelvic MRI'
        ]
    },
    {
        name: 'Chest X-Ray Package',
        description: 'Standard chest radiography for lung and heart health assessment. Useful for screening respiratory conditions.',
        category: 'Imaging',
        icon: '🩻',
        price: 15000,
        currency: 'NGN',
        discount: 0,
        popular: false,
        tests: [],
        includes: [
            'PA View',
            'Lateral View',
            'Radiologist Report'
        ]
    },
    {
        name: 'Obstetric Ultrasound',
        description: 'Detailed ultrasound scan for expectant mothers to monitor fetal development and health.',
        category: 'Imaging',
        icon: '👶',
        price: 25000,
        currency: 'NGN',
        discount: 0,
        popular: true,
        tests: [],
        includes: [
            'Fetal Biometry',
            'Placental Localization',
            'Amniotic Fluid Assessment',
            'Fetal Heart Rate'
        ]
    }
];

export default function SeederPage() {
    const { firestore } = useFirebase();
    const [status, setStatus] = useState('');

    const seedPackages = async () => {
        if (!firestore) return;
        setStatus('Seeding...');

        try {
            const packagesRef = collection(firestore, 'testPackages');

            for (const pkg of IMAGING_PACKAGES) {
                await addDoc(packagesRef, pkg);
            }

            setStatus('Success! 3 Imaging Packages added.');
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Data Seeder</h1>
            <Button onClick={seedPackages}>Seed Imaging Packages</Button>
            <p className="mt-4">{status}</p>
        </div>
    );
}

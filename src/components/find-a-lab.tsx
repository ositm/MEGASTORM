'use client';

import { useState } from 'react';
import { Search, Building2, MapPin, Phone, Clock, Beaker, CalendarCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const states = [
    "Abia", "Adamawa", "AkwaIbom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "CrossRiver", "Delta", "Ebonyi", "Edo", "Ekiti",
    "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
    "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
];

const allLabs = [
    {
        id: 1,
        name: "Marvel Labs",
        building: "Mvarvel Towers",
        address: "Nsukka, Enugu",
        phone: "08034476993",
        hours: "07:00 - 17:00",
        tests: ["HIV Test (ELISA, Western Blot, PCR)", "Complete Blood Count (CBC) Test"],
    },
    {
        id: 2,
        name: "NeoMed Lab",
        building: "20/33 Chime Avenue,New Haven,Beside first Bank, Enugu, Enugu, Nigeria",
        address: "Enugu North, Enugu",
        phone: "08115442533",
        hours: "08:00 - 17:00",
        tests: [],
    }
]

export default function FindALab() {
    const [selectedState, setSelectedState] = useState('');
    const [selectedTown, setSelectedTown] = useState('');
    const [labs, setLabs] = useState(allLabs);

    const handleSearch = () => {
        // In a real app, you'd fetch labs based on selectedState and selectedTown
        console.log("Searching for labs in:", selectedState, selectedTown);
        // For now, we just filter the existing list.
        // This is a placeholder for a real search implementation.
        if (!selectedState) {
            setLabs(allLabs);
            return;
        }
        setLabs(allLabs.filter(lab => lab.address.includes(selectedState)));
    };

    return (
        <>
            <div className="bg-white flex flex-col rounded-lg shadow-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mx-auto">
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <select
                            id="state"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select a state</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">Town</label>
                        <select
                            id="town"
                            value={selectedTown}
                            onChange={(e) => setSelectedTown(e.target.value)}
                            disabled={!selectedState}
                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select a town</option>
                            {/* Town options would be populated based on selected state */}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={handleSearch}
                        disabled={!selectedState}
                        className="flex-1 max-w-md flex items-center justify-center gap-2"
                    >
                        <Search className="h-5 w-5" />
                        Find Labs
                    </Button>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">All Available Labs</h2>
                <p className="text-gray-600">Browse all labs or search by location to find specific labs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {labs.map(lab => (
                    <div key={lab.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{lab.name}</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building2 className="w-[18px] h-[18px]" />
                                    <p>{lab.building}</p>
                                </div>
                                <div className="flex items-start gap-2 text-gray-600">
                                    <MapPin className="w-[18px] h-[18px] mt-1" />
                                    <p>{lab.address}</p>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="w-[18px] h-[18px]" />
                                    <p>{lab.phone}</p>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-[18px] h-[18px]" />
                                    <p>{lab.hours}</p>
                                </div>
                                {lab.tests.length > 0 && (
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <Beaker className="w-[18px] h-[18px] mt-1" />
                                        <div>
                                            <p className="font-medium mb-1">Available Tests:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {lab.tests.map(test => (
                                                    <span key={test} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">{test}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button className="flex-1 flex items-center justify-center gap-2">
                                    <CalendarCheck className="w-[18px] h-[18px]" />
                                    Book Appointment
                                </Button>
                                <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                                    <MapPin className="w-[18px] h-[18px]" />
                                    Get Directions
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {labs.length === 0 && (
                 <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No labs found in this location.</p>
                    <p className="text-gray-400">Try searching in a different area.</p>
                </div>
            )}
        </>
    );
}

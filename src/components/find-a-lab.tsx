'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const states = [
    "Abia", "Adamawa", "AkwaIbom", "Anambra", "Bauchi", "Bayelsa", 
    "Benue", "Borno", "CrossRiver", "Delta", "Ebonyi", "Edo", "Ekiti", 
    "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", 
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", 
    "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", 
    "Yobe", "Zamfara"
];

export default function FindALab() {
    const [selectedState, setSelectedState] = useState('');
    const [selectedTown, setSelectedTown] = useState('');
    const [labs, setLabs] = useState([]); // Placeholder for lab results

    const handleSearch = () => {
        // In a real app, you'd fetch labs based on selectedState and selectedTown
        console.log("Searching for labs in:", selectedState, selectedTown);
        setLabs([]); // Reset labs for now
    };

    return (
        <div className="max-w-7xl mx-auto">
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
                <div className="mt-6 text-center">
                    <Button 
                        onClick={handleSearch}
                        disabled={!selectedState}
                        className="w-full max-w-md flex items-center justify-center gap-2"
                    >
                        <Search className="h-5 w-5" />
                        Find Labs
                    </Button>
                </div>
            </div>

            {labs.length === 0 && (
                 <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No labs found in this location.</p>
                    <p className="text-gray-400">Try searching in a different area.</p>
                </div>
            )}

            {/* This is where you would map over and display lab results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 
                {labs.map(lab => (
                    <div key={lab.id} className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold">{lab.name}</h3>
                        <p>{lab.address}</p>
                    </div>
                ))}
                */}
            </div>
        </div>
    );
}

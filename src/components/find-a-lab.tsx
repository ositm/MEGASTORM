
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Building2, MapPin, Phone, Star, MessageCircle, List, Map as MapIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLabSearch } from '@/hooks/use-labs'; // Use our new hook
import { Lab } from '@/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import LabMap to avoid SSR issues with Leaflet
const LabMap = dynamic(() => import('@/components/map/lab-map'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
});

const states = [
    "Abia", "Adamawa", "AkwaIbom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "CrossRiver", "Delta", "Ebonyi", "Edo", "Ekiti",
    "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
    "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
];

const townsByState: Record<string, string[]> = {
    "FCT - Abuja": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa", "Lugbe", "Jabi", "Utako", "Apo", "Durumi", "Lokogoma", "Galadimawa", "Kabusa"],
    "Lagos": ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Yaba", "Surulere", "Maryland"],
    "Rivers": ["Port Harcourt", "Obio-Akpor"],
    "Enugu": ["Enugu", "Nsukka"],
    // Add more as needed
};

export default function FindALab() {
    const searchParams = useSearchParams();
    const testId = searchParams.get('testId');
    const packageId = searchParams.get('packageId');

    const { labs: apiLabs, loading, error: apiError, searchLabs } = useLabSearch();

    // UI Local State
    const [selectedState, setSelectedState] = useState('');
    const [selectedTown, setSelectedTown] = useState('');
    const [availableTowns, setAvailableTowns] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [sortedByDistance, setSortedByDistance] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [localError, setLocalError] = useState('');

    // Combine local filter with API results
    // The API does the heavy lifting, but we might want to filter the current view by name locally for instant feedback if we had many results
    // However, for consistency, let's treat the text input as a param for the API search or local filter?
    // User expects "Type lab name to filter results" to be immediate if results are loaded.
    const filteredLabs = useMemo(() => {
        if (!searchQuery.trim()) return apiLabs;
        return apiLabs.filter(lab =>
            lab.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [apiLabs, searchQuery]);

    useEffect(() => {
        if (selectedState && townsByState[selectedState]) {
            setAvailableTowns(townsByState[selectedState]);
            setSelectedTown('');
        } else {
            setAvailableTowns([]);
            setSelectedTown('');
        }
    }, [selectedState]);

    // Initial Population: Search for labs generally in Nigeria on load
    useEffect(() => {
        if (apiLabs.length === 0 && !loading && !apiError) {
            searchLabs({ keyword: 'Medical Laboratory' });
        }
    }, []); // Run once on mount

    const handleSearch = async () => {
        if (!selectedState) {
            setLocalError('Please select a state');
            return;
        }

        setLocalError('');
        setSortedByDistance(false);

        await searchLabs({
            state: selectedState,
            city: selectedTown,
            keyword: searchQuery // We can pass this to API too to narrow down initially
        });

        // Switch to map view if we have results? Let's stay on list by default unless user specific
    };

    // Haversine formula to calculate distance in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleNearMe = async () => {
        if (!navigator.geolocation) {
            setLocalError('Geolocation is not supported by your browser');
            return;
        }

        setLocalError('');
        setSortedByDistance(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                // Use the hook to search, but we need to update the hook to support lat/lng bias or "nearby"
                // My current hook/api mainly filters by city/state text.
                // However, the Places API accepts locationBias.
                // For now, let's search broadly in Nigeria and sort locally, OR pass the lat/lng to the API if I added that support.
                // The API route I wrote DOES accept 'lat' and 'lng'?? No, I removed that to focus on TextSearch.
                // BUT TextSearch supports "near me" semantic queries implicitly if we include "near me" in text.
                // OR we just search "Medical Lab in Nigeria" and sort by distance.

                // Let's rely on the location text. If we have coordinates, we can reverse geocode?
                // Or best effort: Search "Medical Laboratory" and use the API's location biasing automatically if setup?
                // Unfortunatley the server API code I wrote doesn't pass locationBias yet.

                // Workaround: Use default search (maybe "Lagos" or just "Nigeria") and sort by distance locally.
                // Or better: Pass a special "near me" indication?

                // For now, let's search for "Medical Laboratory near me" - Google usually handles "near me" if location bias is set, but request comes from server.
                // Server doesn't know user location.

                // Let's just search for labs in the current State/City if selected, otherwise "Nigeria", then sort locally.

                await searchLabs({ keyword: 'Medical Laboratory' }); // Broad search
                setViewMode('map');
            },
            (error) => {
                console.error('Error getting location:', error);
                setLocalError('Unable to retrieve your location. Please enable location access and try again.');
            }
        );
    };

    // Calculate distances for display
    const labsWithDistance = useMemo(() => {
        if (!userLocation) return filteredLabs;
        return filteredLabs.map(lab => ({
            ...lab,
            distance: calculateDistance(userLocation.lat, userLocation.lng, lab.latitude, lab.longitude)
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }, [filteredLabs, userLocation]);

    const displayLabs = sortedByDistance && userLocation ? labsWithDistance : filteredLabs;

    const getWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneWithCode = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone.replace(/^0/, '')}`;
        return `https://wa.me/${phoneWithCode}`;
    };

    const mapCenter: [number, number] = useMemo(() => {
        if (userLocation) return [userLocation.lat, userLocation.lng];
        if (displayLabs.length > 0) {
            return [displayLabs[0].latitude, displayLabs[0].longitude];
        }
        return [9.0820, 8.6753]; // Nigeria center
    }, [userLocation, displayLabs]);

    const error = apiError || localError;

    return (
        <>
            {/* Search Section */}
            <div className="bg-white flex flex-col rounded-lg shadow-lg p-6 mb-8">
                <div className="mb-6">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Search by Lab Name</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            id="search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type lab name to filter results..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mx-auto">
                    <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <select
                            id="state"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select a state</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-2">Town/City</label>
                        <select
                            id="town"
                            value={selectedTown}
                            onChange={(e) => setSelectedTown(e.target.value)}
                            disabled={!selectedState || availableTowns.length === 0}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            <option value="">All towns (optional)</option>
                            {availableTowns.map(town => (
                                <option key={town} value={town}>{town}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={handleSearch}
                        disabled={!selectedState || loading}
                        className="flex-1 max-w-md flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {loading && !sortedByDistance ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        {loading && !sortedByDistance ? 'Searching...' : 'Find Labs'}
                    </Button>
                    <Button
                        onClick={handleNearMe}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 max-w-md flex items-center justify-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                        {loading && sortedByDistance ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                        {loading && sortedByDistance ? 'Finding...' : 'Near Me'}
                    </Button>
                </div>
            </div>

            {/* Results Section */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {displayLabs.length > 0 && (
                <>
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Found {displayLabs.length} lab{displayLabs.length !== 1 ? 's' : ''}
                        </h2>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <div className="flex items-center gap-1">
                                    <List className="w-4 h-4" />
                                    <span>List</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <div className="flex items-center gap-1">
                                    <MapIcon className="w-4 h-4" />
                                    <span>Map</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {viewMode === 'map' ? (
                        <div className="mb-8">
                            <LabMap
                                labs={displayLabs as unknown as Lab[]} // Cast because LabMap expects strict Lab type but we are compatible enough for display
                                center={mapCenter}
                                zoom={userLocation ? 12 : 10}
                                userLocation={userLocation}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayLabs.map(lab => (
                                <div key={lab.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">{lab.name}</h3>
                                            <div className="flex flex-col gap-2 items-end">
                                                {lab.rating > 0 && (
                                                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-sm font-semibold text-blue-700">
                                                        <Star className="w-4 h-4 mr-1 fill-current" />
                                                        {lab.rating}
                                                    </div>
                                                )}
                                                {(lab as any).distance !== undefined && (
                                                    <div className="flex items-center bg-green-50 px-2 py-1 rounded text-xs font-semibold text-green-700">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {((lab as any).distance).toFixed(1)} km
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-start gap-2 text-gray-600">
                                                <MapPin className="w-[18px] h-[18px] mt-1 flex-shrink-0" />
                                                <p className="text-sm">{lab.formatted_address}</p>
                                            </div>
                                            {lab.phone_number && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Phone className="w-[18px] h-[18px]" />
                                                    <p className="text-sm">{lab.phone_number}</p>
                                                </div>
                                            )}
                                            {lab.website && (
                                                <div className="flex items-center gap-2 text-blue-600">
                                                    <Building2 className="w-[18px] h-[18px]" />
                                                    <a
                                                        href={lab.website.startsWith('http') ? lab.website : `https://${lab.website}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm hover:underline"
                                                    >
                                                        Visit Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-3 pt-4 border-t">
                                            {(testId || packageId) ? (
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        const params = new URLSearchParams();
                                                        params.set('labId', lab.id);
                                                        if (testId) params.set('testId', testId);
                                                        if (packageId) params.set('packageId', packageId);
                                                        window.location.href = `/appointments/book?${params.toString()}`;
                                                    }}
                                                >
                                                    Select This Lab
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Link href={`/labs/${lab.id}`} className="flex-1">
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                    {lab.phone_number && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                className="px-3"
                                                                onClick={() => window.open(`tel:${lab.phone_number}`, '_self')}
                                                                title="Call"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="px-3 text-green-600 border-green-600 hover:bg-green-50"
                                                                onClick={() => window.open(getWhatsAppLink(lab.phone_number!), '_blank')}
                                                                title="WhatsApp"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {!loading && displayLabs.length === 0 && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg mb-2">
                        {loading ? 'Finding the best labs for you...' : (searchQuery ? 'No labs match your search' : 'Discover top-rated labs across Nigeria')}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {searchQuery ? 'Try a different search term' : 'Use the search bar or filters to find a specific location'}
                    </p>
                </div>
            )}
        </>
    );
}

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Lab } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LabMapProps {
    labs: Lab[];
    center?: [number, number];
    zoom?: number;
    userLocation?: { lat: number; lng: number } | null;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Map updater component to handle programmatic moves
function MapUpdater({ center, zoom, labs, userLocation }: { center: { lat: number, lng: number }, zoom: number, labs: Lab[], userLocation?: { lat: number; lng: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        if (userLocation && labs.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(userLocation);
            labs.forEach(lab => {
                if (lab.latitude && lab.longitude) {
                    bounds.extend({ lat: lab.latitude, lng: lab.longitude });
                }
            });
            map.fitBounds(bounds, { padding: 50 });
        } else {
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [center, zoom, map, labs, userLocation]);

    return null;
}

export default function LabMap({ labs, center = [9.0820, 8.6753], zoom = 6, userLocation }: LabMapProps) {
    const [selectedLab, setSelectedLab] = useState<Lab | null>(null);

    // Convert array center to object for Google Maps
    const mapCenter = useMemo(() => ({
        lat: center[0],
        lng: center[1]
    }), [center]);

    // Handle user location marker
    const userPosition = useMemo(() =>
        userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null
        , [userLocation]);

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200">
                <div className="text-center p-4">
                    <p className="font-semibold mb-2">Map Unavailable</p>
                    <p className="text-sm">Please config NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={mapCenter}
                    defaultZoom={zoom}
                    mapId="DEMO_MAP_ID" // Required for AdvancedMarker
                    fullscreenControl={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    className="w-full h-full"
                >
                    <MapUpdater center={mapCenter} zoom={zoom} labs={labs} userLocation={userLocation} />

                    {/* User Location Marker - Blue Dot */}
                    {userPosition && (
                        <AdvancedMarker position={userPosition}>
                            <div className="relative flex items-center justify-center">
                                <span className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white shadow-md"></span>
                                </span>
                            </div>
                        </AdvancedMarker>
                    )}

                    {/* Lab Markers */}
                    {labs.map((lab) => (
                        lab.latitude && lab.longitude ? (
                            <AdvancedMarker
                                key={lab.id}
                                position={{ lat: lab.latitude, lng: lab.longitude }}
                                onClick={() => setSelectedLab(lab)}
                            >
                                <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                            </AdvancedMarker>
                        ) : null
                    ))}

                    {/* Info Window for Selected Lab */}
                    {selectedLab && (
                        <InfoWindow
                            position={{ lat: selectedLab.latitude, lng: selectedLab.longitude }}
                            onCloseClick={() => setSelectedLab(null)}
                        >
                            <div className="p-1 min-w-[200px]">
                                <h3 className="font-bold text-sm mb-1">{selectedLab.name}</h3>
                                <p className="text-xs text-gray-600 mb-2">{selectedLab.address}</p>
                                <div className="flex gap-2">
                                    <Link href={`/labs/${selectedLab.id}`} className="flex-1">
                                        <Button size="sm" className="w-full h-7 text-xs">View Details</Button>
                                    </Link>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs px-2"
                                        onClick={() => {
                                            const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLab.latitude},${selectedLab.longitude}`;
                                            window.open(url, '_blank');
                                        }}
                                    >
                                        Get Directions
                                    </Button>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </APIProvider>
        </div>
    );
}

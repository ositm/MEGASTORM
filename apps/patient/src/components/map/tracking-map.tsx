'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface TrackingMapProps {
    position: { latitude: number; longitude: number } | null;
}

/** Shows the collector's live position; degrades to coordinates without a key. */
export default function TrackingMap({ position }: TrackingMapProps) {
    if (!position) {
        return (
            <div className="h-[320px] w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border">
                <p className="text-sm">Waiting for the collector to share their location…</p>
            </div>
        );
    }

    const center = { lat: position.latitude, lng: position.longitude };

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="h-[320px] w-full bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 border gap-1">
                <p className="font-semibold">Collector location</p>
                <p className="text-sm">{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</p>
                <a
                    className="text-blue-600 text-sm underline"
                    href={`https://www.google.com/maps?q=${center.lat},${center.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open in Google Maps
                </a>
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full rounded-lg overflow-hidden border">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    center={center}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    fullscreenControl={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    className="w-full h-full"
                >
                    <AdvancedMarker position={center}>
                        <span className="relative flex h-5 w-5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
                        </span>
                    </AdvancedMarker>
                </Map>
            </APIProvider>
        </div>
    );
}

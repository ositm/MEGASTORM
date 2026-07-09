export interface LatLng {
    latitude: number;
    longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
        Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface EtaEstimate {
    distanceKm: number;
    minutes: number;
}

// Straight-line distance underestimates road distance, so scale by a factor
// and assume an average urban speed. This is an estimate, not a routed ETA.
const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 25;

/** Rough travel estimate from a straight-line distance. */
export function estimateEta(from: LatLng, to: LatLng, avgSpeedKmh = AVG_SPEED_KMH): EtaEstimate {
    const roadKm = haversineKm(from, to) * ROAD_FACTOR;
    const minutes = Math.max(1, Math.round((roadKm / avgSpeedKmh) * 60));
    return { distanceKm: Math.round(roadKm * 10) / 10, minutes };
}

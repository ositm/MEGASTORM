
import { NextResponse } from 'next/server';

// Google Places API (New) details endpoint
// https://places.googleapis.com/v1/places/{PLACE_ID}
const BASE_URL = 'https://places.googleapis.com/v1/places';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_PLACES_API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    if (!id) {
        return NextResponse.json({ error: 'Missing Lab ID' }, { status: 400 });
    }

    try {
        // Construct the resource name. If the ID doesn't start with 'places/', assume it's just the ID
        // Actually the API expects resource name like "places/ChIJ..." if using the GET method, 
        // BUT usually the new API is "places/ID". 
        // Let's try appending 'places/' if missing, or just using the ID if it looks like a resource name.

        // However, if we click a result from our search, the ID is just the alpha-numeric string.
        // The Google API endpoint is `https://places.googleapis.com/v1/places/PLACE_ID`

        const response = await fetch(`${BASE_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,businessStatus,types,regularOpeningHours,internationalPhoneNumber,websiteUri'
            }
        });

        if (!response.ok) {
            // If 404, it might not be a google place ID (maybe firestore ID passed here by mistake, though the page handles firestore first)
            const errorData = await response.json();
            console.error('Google Place Details Error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch place details' }, { status: response.status });
        }

        const place = await response.json();

        // Normalize to Lab interface
        const lab = {
            id: place.id,
            name: place.displayName?.text || place.id,
            address: place.formattedAddress,
            rating: place.rating || 0,
            user_ratings_total: place.userRatingCount || 0,
            location: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0
            },
            latitude: place.location?.latitude || 0,
            longitude: place.location?.longitude || 0,
            open_now: place.regularOpeningHours?.openNow,
            status: place.businessStatus,
            types: place.types || [],
            phone: place.internationalPhoneNumber,
            website: place.websiteUri,
            // Add empty tests array since Google doesn't provide this
            tests: [],
            source: 'google_places'
        };

        return NextResponse.json(lab);

    } catch (error) {
        console.error('API Details Handler Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

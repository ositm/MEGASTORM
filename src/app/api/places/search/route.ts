import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Google Places API key not configured' },
            { status: 500 }
        );
    }

    try {
        let endpoint = 'https://places.googleapis.com/v1/places:searchText';
        let body: any = {
            languageCode: 'en',
            maxResultCount: 20,
        };

        if (lat && lng) {
            // Near Me Search
            // We use searchText with "medical laboratory" and bias towards the user's location
            // Using rankPreference="DISTANCE" would be ideal but requires strict location handling
            // For now, we'll use locationBias with a tighter radius
            body.textQuery = "medical laboratory";
            body.locationBias = {
                circle: {
                    center: {
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng)
                    },
                    radius: 5000.0 // 5km radius bias
                }
            };
        } else if (state) {
            // City/State Search
            // If city is missing, search in the whole state
            const locationString = city ? `${city}, ${state}, Nigeria` : `${state}, Nigeria`;
            body.textQuery = `medical laboratory diagnostic center in ${locationString}`;

            // Remove locationBias as textQuery is specific enough and large radius causes 400 error

        } else {
            return NextResponse.json(
                { error: 'Either city/state OR lat/lng must be provided' },
                { status: 400 }
            );
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Places API Error:', errorData);
            return NextResponse.json(
                { error: 'Failed to fetch places from Google' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Transform Google Places data to match our Lab interface
        const labs = (data.places || []).map((place: any) => ({
            id: place.id,
            name: place.displayName?.text || 'Unknown Lab',
            address: place.formattedAddress || '',
            city: city || '', // Might not matches exactly if searching by state, but mostly for UI
            state: state || '',
            phone: place.nationalPhoneNumber || place.internationalPhoneNumber || 'N/A',
            email: '', // Google Places doesn't provide email
            latitude: place.location?.latitude || 0,
            longitude: place.location?.longitude || 0,
            rating: place.rating || 0,
            reviewCount: place.userRatingCount || 0,
            website: place.websiteUri || '',
            googleMapsUrl: place.googleMapsUri || '',
            tests: [] // Will be populated separately if needed
        }));

        return NextResponse.json({ labs, count: labs.length });
    } catch (error) {
        console.error('Error fetching places:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

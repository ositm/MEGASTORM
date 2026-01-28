
import { NextResponse } from 'next/server';

const BASE_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_BASE_URL = 'https://places.googleapis.com/v1/places';

// Use a simplified local interface that aligns with requirements and can be mapped to domain types
// or import the domain type if it fits perfectly.
// For now, we return exactly what was requested, but flat lat/lng.
export interface LabResponseItem {
    id: string;
    name: string;
    formatted_address: string;
    rating: number;
    user_ratings_total: number;
    latitude: number;
    longitude: number;
    open_now?: boolean;
    business_status: string;
    types: string[];
    phone_number?: string;
    website?: string;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const keyword = searchParams.get('keyword');
    const typeFilter = searchParams.get('type');
    const openNow = searchParams.get('open_now') === 'true';
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const pageToken = searchParams.get('pageToken');

    const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_PLACES_API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    let textQuery = `medical laboratory`;
    if (keyword) {
        textQuery = keyword;
    }

    if (city && state) {
        textQuery += ` in ${city}, ${state}, Nigeria`;
    } else if (state) {
        textQuery += ` in ${state}, Nigeria`;
    } else {
        if (!textQuery.toLowerCase().includes('nigeria')) {
            textQuery += ` in Nigeria`;
        }
    }

    if (!keyword) {
        textQuery += ` OR diagnostic centre OR pathology laboratory`;
    }

    try {
        const requestBody: any = {
            textQuery: textQuery,
            languageCode: 'en',
            maxResultCount: 20,
        };

        if (pageToken) {
            requestBody.pageToken = pageToken;
        }

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName,places.formattedAddress,places.id,places.location,places.rating,places.userRatingCount,places.businessStatus,places.types,places.regularOpeningHours.openNow,nextPageToken'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Places Search Error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch places' }, { status: response.status });
        }

        const data = await response.json();
        let places = data.places || [];

        if (typeFilter) {
            places = places.filter((place: any) =>
                place.types?.some((t: string) => t.toLowerCase().includes(typeFilter.toLowerCase())) ||
                place.displayName?.text?.toLowerCase().includes(typeFilter.toLowerCase())
            );
        }

        if (openNow) {
            places = places.filter((place: any) => place.regularOpeningHours?.openNow === true);
        }

        if (minRating > 0) {
            places = places.filter((place: any) => (place.rating || 0) >= minRating);
        }

        const enrichedPlaces = await Promise.all(places.map(async (place: any) => {
            try {
                const detailsResponse = await fetch(`${DETAILS_BASE_URL}/${place.name}?fields=internationalPhoneNumber,websiteUri`, {
                    headers: {
                        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                        'X-Goog-FieldMask': 'internationalPhoneNumber,websiteUri'
                    }
                });

                if (detailsResponse.ok) {
                    const details = await detailsResponse.json();
                    return { ...place, ...details };
                }
                return place;
            } catch (e) {
                console.error(`Failed to fetch details for ${place.name}`, e);
                return place;
            }
        }));

        const formattedLabs: LabResponseItem[] = enrichedPlaces.map((place: any) => ({
            id: place.id || place.name.split('/').pop(),
            name: place.displayName?.text || place.name,
            formatted_address: place.formattedAddress,
            rating: place.rating || 0,
            user_ratings_total: place.userRatingCount || 0,
            latitude: place.location?.latitude || 0,
            longitude: place.location?.longitude || 0,
            open_now: place.regularOpeningHours?.openNow,
            business_status: place.businessStatus,
            types: place.types || [],
            phone_number: place.internationalPhoneNumber,
            website: place.websiteUri
        }));

        return NextResponse.json({
            labs: formattedLabs,
            nextPageToken: data.nextPageToken
        });

    } catch (error) {
        console.error('API Handler Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Try both keys
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1/places:searchText';

if (!GOOGLE_PLACES_API_KEY) {
    console.error("Error: GOOGLE_PLACES_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing in .env.local");
    process.exit(1);
}

async function searchLabs() {
    const textQuery = "medical laboratory or diagnostic centre in Lagos, Nigeria";
    console.log(`Searching for: "${textQuery}"...`);

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName,places.formattedAddress,places.id,places.location,places.rating,places.userRatingCount,places.businessStatus,places.types,places.regularOpeningHours.openNow'
            },
            body: JSON.stringify({
                textQuery: textQuery,
                languageCode: 'en',
                maxResultCount: 5,
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`API Error (${response.status}):`, text);
            return;
        }

        const data = await response.json();
        console.log("Success! Found places:", data.places?.length || 0);

        if (data.places && data.places.length > 0) {
            const place = data.places[0];
            console.log("Sample Place:", JSON.stringify(place, null, 2));

            // Correct Field Check
            console.log("Name:", place.displayName?.text);
            console.log("Address:", place.formattedAddress);
            console.log("ID:", place.name.split('/').pop()); // Resource ID
        }

    } catch (error) {
        console.error("Script exception:", error);
    }
}

searchLabs();

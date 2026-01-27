
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

console.log('Testing Google Places API...');
console.log('Using API Key:', GOOGLE_PLACES_API_KEY ? `${GOOGLE_PLACES_API_KEY.substring(0, 10)}...` : 'MISSING');

if (!GOOGLE_PLACES_API_KEY) {
    console.error('ERROR: No API Key found.');
    process.exit(1);
}

const BASE_URL = 'https://places.googleapis.com/v1/places:searchText';

async function testSearch() {
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': 'places.name,places.displayName'
            },
            body: JSON.stringify({
                textQuery: 'Medical Laboratory in Lagos, Nigeria',
                maxResultCount: 1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('\nFAILED (HTTP ' + response.status + ')');
            console.error('Error Details:', errorText);
        } else {
            const data = await response.json();
            console.log('\nSUCCESS!');
            console.log('Found:', data.places?.length || 0, 'places.');
            if (data.places && data.places.length > 0) {
                console.log('Sample:', data.places[0].displayName.text);
            }
        }

    } catch (error) {
        console.error('Network/Script Error:', error);
    }
}

testSearch();

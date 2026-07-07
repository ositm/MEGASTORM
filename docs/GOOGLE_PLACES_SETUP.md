# Google Places API Integration

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API (New)**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API (New)"
   - Click "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

### 2. Configure Environment Variable

1. Create a `.env.local` file in the root directory of your project (if it doesn't exist)
2. Add the following line:
   ```
   GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual Google Places API key

### 3. Restart Development Server

After adding the API key, restart your Next.js development server:
```bash
# Stop the current server (Ctrl+C)
# Then restart it
npx next dev -p 9002
```

## How It Works

1. **User Selection**: Users select a state and then a city/town from the dropdown
2. **API Call**: When both are selected, the app calls `/api/places/search?city={city}&state={state}`
3. **Google Places Search**: The API route searches Google Places for "medical laboratory diagnostic center in {city}, {state}, Nigeria"
4. **Results Display**: Real labs and hospitals from Google Maps are displayed with:
   - Name
   - Address
   - Phone number
   - Rating and review count
   - Google Maps link
   - Distance (if "Near Me" is used)

## Features

- **Real-time Data**: Fetches actual labs and hospitals from Google Maps
- **Location-based**: Results are specific to the selected city and state
- **Rich Information**: Includes ratings, reviews, contact info, and more
- **Google Maps Integration**: Direct links to view locations on Google Maps

## API Costs

Google Places API (New) pricing:
- Text Search: $32 per 1,000 requests
- Consider implementing caching to reduce costs

## Troubleshooting

If you see "Failed to load labs. Please check your Google Places API key":
1. Verify the API key is correctly set in `.env.local`
2. Ensure Places API (New) is enabled in Google Cloud Console
3. Check that your API key has no restrictions preventing server-side use
4. Restart your development server after adding the key

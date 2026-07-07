// Mints a Google OAuth access token from the Firebase CLI's stored login
// (same credentials as `firebase deploy`). Requires a prior `firebase login`.
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Public OAuth constants shipped inside firebase-tools (not secrets).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

export async function getAccessToken() {
    const storePath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
    let refreshToken;
    try {
        refreshToken = JSON.parse(readFileSync(storePath, 'utf8')).tokens?.refresh_token;
    } catch {
        throw new Error(`Could not read ${storePath}. Run: npx firebase login`);
    }
    if (!refreshToken) throw new Error('No refresh token found. Run: npx firebase login');

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });
    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    return (await res.json()).access_token;
}

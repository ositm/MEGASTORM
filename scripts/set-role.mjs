// Manage LabLink roles (Firebase Auth custom claims — the authoritative source
// for security rules) plus the display mirror on the user's Firestore doc.
//
// Usage:
//   node scripts/set-role.mjs --list
//   node scripts/set-role.mjs <email> admin
//   node scripts/set-role.mjs <email> lab_admin <labId>
//   node scripts/set-role.mjs <email> user            (revokes elevated role)
//
// Note: the user must sign out/in (or refresh their ID token) for new claims
// to take effect in an existing session.
import { getAccessToken } from './lib/google-auth.mjs';

const PROJECT = 'lablink-df67e';
const IDTK = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const [, , arg1, roleArg, labIdArg] = process.argv;
const VALID_ROLES = ['user', 'lab_admin', 'admin'];

const token = await getAccessToken();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function api(url, body) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${url.split('/').pop()} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

if (!arg1 || arg1 === '--list') {
    let pageToken = '';
    do {
        const url = `${IDTK}/accounts:batchGet?maxResults=100${pageToken ? `&nextPageToken=${pageToken}` : ''}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`batchGet failed: ${res.status} ${await res.text()}`);
        const data = await res.json();
        for (const u of data.users || []) {
            const claims = u.customAttributes ? JSON.parse(u.customAttributes) : {};
            console.log(`${(u.email || '(no email)').padEnd(40)} role=${claims.role || '-'} labId=${claims.labId || '-'} uid=${u.localId}`);
        }
        pageToken = data.nextPageToken || '';
    } while (pageToken);
    process.exit(0);
}

const email = arg1;
const role = roleArg;
if (!VALID_ROLES.includes(role)) {
    console.error(`Role must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
}
if (role === 'lab_admin' && !labIdArg) {
    console.error('lab_admin requires a labId: node scripts/set-role.mjs <email> lab_admin <labId>');
    process.exit(1);
}

// 1. Find the Auth user
const lookup = await api(`${IDTK}/accounts:lookup`, { email: [email] });
const user = lookup.users?.[0];
if (!user) {
    console.error(`No Auth account found for ${email}`);
    process.exit(1);
}

// 2. Set custom claims (authoritative for rules)
const claims = role === 'user' ? {} : { role, ...(labIdArg ? { labId: labIdArg } : {}) };
await api(`${IDTK}/accounts:update`, {
    localId: user.localId,
    customAttributes: JSON.stringify(claims),
});

// 3. Mirror onto the Firestore user doc (display only; rules ignore it)
const fields = {
    role: { stringValue: role },
    ...(role === 'lab_admin' ? { labId: { stringValue: labIdArg } } : {}),
};
const mask = ['role', ...(role === 'lab_admin' ? ['labId'] : [])]
    .map((f) => `updateMask.fieldPaths=${f}`).join('&');
const patch = await fetch(`${FS}/users/${user.localId}?${mask}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
});
if (!patch.ok) console.warn(`Warning: Firestore mirror update failed: ${patch.status} ${await patch.text()}`);

console.log(`OK: ${email} (uid ${user.localId}) -> claims ${JSON.stringify(claims)}`);
console.log('The user must sign out and back in for the new role to take effect.');

/**
 * e2e: full lab-side lifecycle through the DEPLOYED lab portal's API routes.
 *
 *   node --import tsx scripts/e2e-lab-portal.mts [labAppUrl]
 *
 * Seeds a paid walk-in order locally via @lablink/server (system actor), then
 * drives LAB_RECEIVED → … → RESULT_RELEASED over HTTP against the lab app with
 * disposable custom-token accounts, asserting the role matrix on the way:
 * lab_staff works the bench, only lab_admin validates/releases, cross-lab and
 * double-release are refused. Cleans up everything it created.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LAB_APP = process.argv[2] ?? 'https://megastorm-lab-eight.vercel.app';
const WEB_API_KEY = 'AIzaSyASV6AlViz9sajWW4ic52fmen9_cZf0gHU'; // lablink-df67e web key
const LAB_ID = 'e2e-lab-portal';
const RUN = Date.now().toString(36);

const env = readFileSync(join(ROOT, 'apps/lab/.env.local'), 'utf8');
process.env.FIREBASE_SERVICE_ACCOUNT = env.match(/^FIREBASE_SERVICE_ACCOUNT=(.+)$/m)![1].trim();

const { getAuth } = await import('firebase-admin/auth');
const { adminApp, adminDb } = await import('@lablink/server/firebase-admin');
const { createOrder, appendOrderEvent } = await import('@lablink/server/orders');

const auth = getAuth(adminApp());
const db = adminDb();

let passed = 0, failed = 0;
function check(name: string, ok: boolean, detail = '') {
    ok ? passed++ : failed++;
    console.log(`${ok ? 'ok' : 'NOT OK'} - ${name}${detail ? ` (${detail})` : ''}`);
}

async function idTokenFor(uid: string, claims: object): Promise<string> {
    const custom = await auth.createCustomToken(uid, claims);
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${WEB_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: custom, returnSecureToken: true }),
    });
    const body = await res.json();
    if (!body.idToken) throw new Error(`sign-in failed for ${uid}: ${JSON.stringify(body.error)}`);
    return body.idToken;
}

async function postEvent(orderId: string, token: string, type: string): Promise<{ status: number; body: string }> {
    const res = await fetch(`${LAB_APP}/api/orders/${orderId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
    });
    return { status: res.status, body: await res.text() };
}

const PATIENT = `e2e-patient-${RUN}`;
const STAFF = `e2e-staff-${RUN}`;
const OTHER_STAFF = `e2e-otherstaff-${RUN}`;
const LAB_ADMIN = `e2e-labadmin-${RUN}`;
let orderId = '';

try {
    // -- seed: paid walk-in order owned by the disposable patient --
    orderId = await createOrder(PATIENT, {
        labId: LAB_ID,
        labName: 'E2E Portal Lab',
        type: 'walk_in',
        items: [{ name: 'Full Blood Count', price: 5000 }],
    });
    await appendOrderEvent({ uid: 'e2e-system', role: 'system' }, orderId, 'PAYMENT_CONFIRMED');
    console.log(`seeded paid order ${orderId} for lab ${LAB_ID}\n`);

    const staff = await idTokenFor(STAFF, { role: 'lab_staff', labId: LAB_ID });
    const otherStaff = await idTokenFor(OTHER_STAFF, { role: 'lab_staff', labId: 'someone-elses-lab' });
    const labAdmin = await idTokenFor(LAB_ADMIN, { role: 'lab_admin', labId: LAB_ID });

    // -- negative: another lab's staff cannot touch this order --
    let r = await postEvent(orderId, otherStaff, 'LAB_RECEIVED');
    check('cross-lab staff refused', r.status === 403, `${r.status} ${r.body}`);

    // -- staff work the bench through the deployed lab app --
    for (const type of ['LAB_RECEIVED', 'TESTING_STARTED', 'TESTING_COMPLETED', 'RESULT_UPLOADED']) {
        r = await postEvent(orderId, staff, type);
        check(`staff ${type}`, r.status === 200, `${r.status} ${r.body}`);
    }

    // -- two-step control: staff may not validate or release --
    r = await postEvent(orderId, staff, 'RESULT_VALIDATED');
    check('staff refused RESULT_VALIDATED (lab_admin only)', r.status === 403, `${r.status} ${r.body}`);

    // -- lab admin validates and releases --
    r = await postEvent(orderId, labAdmin, 'RESULT_VALIDATED');
    check('lab_admin RESULT_VALIDATED', r.status === 200, `${r.status} ${r.body}`);
    r = await postEvent(orderId, labAdmin, 'RESULT_RELEASED');
    check('lab_admin RESULT_RELEASED', r.status === 200, `${r.status} ${r.body}`);

    // -- negative: releasing twice is an illegal transition --
    r = await postEvent(orderId, labAdmin, 'RESULT_RELEASED');
    check('double release refused', r.status === 409, `${r.status} ${r.body}`);

    // -- verify the chain in Firestore --
    const orderSnap = await db.collection('orders').doc(orderId).get();
    const status = orderSnap.data()!.status;
    check('final status RESULT_RELEASED or PATIENT_NOTIFIED', ['RESULT_RELEASED', 'PATIENT_NOTIFIED'].includes(status), status);

    const events = await db.collection('orders').doc(orderId).collection('events').get();
    const byId = new Map(events.docs.map((d) => [d.id, d.data()]));
    const types = events.docs.map((d) => d.data().type).sort();
    const expected = ['LAB_RECEIVED', 'ORDER_CREATED', 'PAYMENT_CONFIRMED', 'RESULT_RELEASED', 'RESULT_UPLOADED', 'RESULT_VALIDATED', 'TESTING_COMPLETED', 'TESTING_STARTED'];
    const gotCore = expected.every((t) => types.includes(t));
    check('all 8 lifecycle events present', gotCore, types.join(','));

    // every event except the first links to an existing previous event
    const roots = events.docs.filter((d) => !d.data().prevEventId);
    const linked = events.docs.filter((d) => d.data().prevEventId && byId.has(d.data().prevEventId));
    check('hash chain intact (1 root, rest linked)', roots.length === 1 && roots.length + linked.length === events.size,
        `${roots.length} root, ${linked.length}/${events.size - 1} linked`);
} finally {
    // -- cleanup: everything this run created --
    if (orderId) {
        const events = await db.collection('orders').doc(orderId).collection('events').get();
        await Promise.all(events.docs.map((d) => d.ref.delete()));
        await db.collection('orders').doc(orderId).delete();
    }
    const notifs = await db.collection('notifications').doc(PATIENT).collection('items').get().catch(() => null);
    if (notifs) await Promise.all(notifs.docs.map((d) => d.ref.delete()));
    await db.collection('notifications').doc(PATIENT).delete().catch(() => {});
    for (const uid of [PATIENT, STAFF, OTHER_STAFF, LAB_ADMIN]) {
        await auth.deleteUser(uid).catch(() => {});
        await db.collection('users').doc(uid).delete().catch(() => {});
    }
    console.log('\ncleanup done');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

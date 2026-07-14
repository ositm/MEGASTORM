// Firestore security rules tests. Run with:  npm run test:rules
// (wraps `firebase emulators:exec` so FIRESTORE_EMULATOR_HOST is set)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { test, before, after } from 'node:test';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let env;

const PATIENT_A = 'patient-a';
const PATIENT_B = 'patient-b';

const anon = () => env.unauthenticatedContext().firestore();
const patientA = () => env.authenticatedContext(PATIENT_A).firestore();
const patientB = () => env.authenticatedContext(PATIENT_B).firestore();
const lab1Admin = () => env.authenticatedContext('lab1-admin', { role: 'lab_admin', labId: 'LAB1' }).firestore();
const platformAdmin = () => env.authenticatedContext('root-admin', { role: 'admin' }).firestore();
const collectorA = () => env.authenticatedContext('collector-a', { role: 'collector' }).firestore();
const collectorB = () => env.authenticatedContext('collector-b', { role: 'collector' }).firestore();
const dispatchA = () => env.authenticatedContext('dispatch-a', { role: 'dispatch' }).firestore();

before(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-lablink',
        firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    });

    await env.withSecurityRulesDisabled(async (ctx) => {
        const db = ctx.firestore();
        await db.collection('labs').doc('LAB1').set({ name: 'Alpha Lab' });
        await db.collection('users').doc(PATIENT_A).set({ email: 'a@x.com', firstName: 'A', role: 'user' });
        await db.collection('bookings').doc('bk-a-lab1').set({ userId: PATIENT_A, labId: 'LAB1', status: 'pending', testName: 'FBC' });
        await db.collection('bookings').doc('bk-b-lab2').set({ userId: PATIENT_B, labId: 'LAB2', status: 'pending', testName: 'LFT' });
        await db.collection('results').doc('res-a').set({ userId: PATIENT_A, labId: 'LAB1', status: 'ready', fileUrl: 'x' });
        await db.collection('reminders').doc('rem-a').set({ userId: PATIENT_A, title: 'take sample' });
        await db.collection('orders').doc('ord-a').set({ patientId: PATIENT_A, labId: 'LAB1', status: 'ORDER_CREATED', amount: 5000 });
        await db.collection('orders').doc('ord-a').collection('events').doc('ev-1')
            .set({ type: 'ORDER_CREATED', patientId: PATIENT_A, labId: 'LAB1', prevEventId: null });
        await db.collection('collectors').doc('collector-a').set({ uid: 'collector-a', verificationStatus: 'unverified', rating: 5 });
        await db.collection('collectors').doc('collector-a').collection('documents').doc('doc-1')
            .set({ type: 'government_id', status: 'approved', fileUrl: 'x' });
        await db.collection('jobs').doc('job-open').set({ orderId: 'ord-a', patientId: PATIENT_A, labId: 'LAB1', status: 'pending', collectorId: null });
        await db.collection('jobs').doc('job-mine').set({ orderId: 'ord-a', patientId: PATIENT_A, labId: 'LAB1', status: 'accepted', collectorId: 'collector-a' });
        await db.collection('jobs').doc('job-other').set({ orderId: 'ord-b', patientId: PATIENT_B, labId: 'LAB2', status: 'accepted', collectorId: 'collector-b' });
        await db.collection('jobs').doc('job-transit').set({ orderId: 'ord-a', patientId: PATIENT_A, labId: 'LAB1', status: 'handed_over', collectorId: 'collector-a', dispatchId: null });
    });
});

after(async () => {
    await env.cleanup();
});

// ---------- public catalog ----------
test('anonymous can read the labs catalog', async () => {
    await assertSucceeds(anon().collection('labs').doc('LAB1').get());
});

test('anonymous cannot read bookings or results', async () => {
    await assertFails(anon().collection('bookings').doc('bk-a-lab1').get());
    await assertFails(anon().collection('results').doc('res-a').get());
});

// ---------- bookings ----------
test('patient can create a pending booking for themselves', async () => {
    await assertSucceeds(patientA().collection('bookings').add({ userId: PATIENT_A, labId: 'LAB1', status: 'pending' }));
});

test('patient cannot create a booking that skips the pending state', async () => {
    await assertFails(patientA().collection('bookings').add({ userId: PATIENT_A, labId: 'LAB1', status: 'result_ready' }));
});

test('patient cannot create a booking for someone else', async () => {
    await assertFails(patientA().collection('bookings').add({ userId: PATIENT_B, labId: 'LAB1', status: 'pending' }));
});

test('patient can read own booking but not another patient\'s', async () => {
    await assertSucceeds(patientA().collection('bookings').doc('bk-a-lab1').get());
    await assertFails(patientA().collection('bookings').doc('bk-b-lab2').get());
});

test('patient cannot update booking status', async () => {
    await assertFails(patientA().collection('bookings').doc('bk-a-lab1').update({ status: 'confirmed' }));
});

test('lab admin can read and update bookings for their own lab only', async () => {
    await assertSucceeds(lab1Admin().collection('bookings').doc('bk-a-lab1').get());
    await assertSucceeds(lab1Admin().collection('bookings').doc('bk-a-lab1').update({ status: 'confirmed' }));
    await assertFails(lab1Admin().collection('bookings').doc('bk-b-lab2').get());
    await assertFails(lab1Admin().collection('bookings').doc('bk-b-lab2').update({ status: 'confirmed' }));
});

test('lab admin can list only their own lab\'s bookings', async () => {
    await assertSucceeds(lab1Admin().collection('bookings').where('labId', '==', 'LAB1').get());
    await assertFails(lab1Admin().collection('bookings').get());
});

test('platform admin can read any booking', async () => {
    await assertSucceeds(platformAdmin().collection('bookings').doc('bk-b-lab2').get());
});

// ---------- users / privilege escalation ----------
test('user cannot grant themselves a role (the role-switcher hole stays closed)', async () => {
    await assertFails(patientA().collection('users').doc(PATIENT_A).update({ role: 'lab_admin', labId: 'LAB1' }));
    await assertFails(patientA().collection('users').doc(PATIENT_A).update({ role: 'admin' }));
});

test('user can edit their own profile fields', async () => {
    await assertSucceeds(patientA().collection('users').doc(PATIENT_A).update({ firstName: 'Ada' }));
});

test('new accounts can only be created as plain users', async () => {
    await assertSucceeds(patientB().collection('users').doc(PATIENT_B).set({ email: 'b@x.com', role: 'user' }));
    await assertFails(patientB().collection('users').doc(PATIENT_B).set({ email: 'b@x.com', role: 'admin' }));
});

test('users cannot read other users\' profiles', async () => {
    await assertFails(patientB().collection('users').doc(PATIENT_A).get());
});

// ---------- results ----------
test('patient can read and delete own result; stranger cannot read it', async () => {
    await assertSucceeds(patientA().collection('results').doc('res-a').get());
    await assertFails(patientB().collection('results').doc('res-a').get());
    await assertSucceeds(patientA().collection('results').doc('res-a').delete());
});

test('lab admin can create a result for their lab; not for another lab', async () => {
    await assertSucceeds(lab1Admin().collection('results').add({ userId: PATIENT_A, labId: 'LAB1', status: 'ready' }));
    await assertFails(lab1Admin().collection('results').add({ userId: PATIENT_B, labId: 'LAB2', status: 'ready' }));
});

// ---------- reminders ----------
test('reminders are owner-only', async () => {
    await assertSucceeds(patientA().collection('reminders').doc('rem-a').get());
    await assertFails(patientB().collection('reminders').doc('rem-a').get());
});

// ---------- orders (schema v2) ----------
test('order and its custody events are readable by owner, owning lab, and admin only', async () => {
    await assertSucceeds(patientA().collection('orders').doc('ord-a').get());
    await assertSucceeds(patientA().collection('orders').doc('ord-a').collection('events').doc('ev-1').get());
    await assertSucceeds(lab1Admin().collection('orders').doc('ord-a').get());
    await assertSucceeds(platformAdmin().collection('orders').doc('ord-a').collection('events').doc('ev-1').get());
    await assertFails(patientB().collection('orders').doc('ord-a').get());
    await assertFails(patientB().collection('orders').doc('ord-a').collection('events').doc('ev-1').get());
});

test('no client can write orders or custody events — not even admins', async () => {
    await assertFails(patientA().collection('orders').add({ patientId: PATIENT_A, labId: 'LAB1', status: 'ORDER_CREATED' }));
    await assertFails(patientA().collection('orders').doc('ord-a').update({ status: 'PAYMENT_CONFIRMED' }));
    await assertFails(lab1Admin().collection('orders').doc('ord-a').update({ status: 'LAB_RECEIVED' }));
    await assertFails(platformAdmin().collection('orders').doc('ord-a').collection('events').add({ type: 'CANCELLED' }));
    await assertFails(patientA().collection('orders').doc('ord-a').collection('events').doc('ev-1').delete());
});

// ---------- collectors ----------
test('collector can create their own unverified profile but cannot self-verify', async () => {
    await assertSucceeds(collectorB().collection('collectors').doc('collector-b').set({ uid: 'collector-b', verificationStatus: 'unverified' }));
    await assertFails(collectorB().collection('collectors').doc('collector-b').set({ uid: 'collector-b', verificationStatus: 'verified' }));
});

test('collector cannot self-verify but can submit for review', async () => {
    await assertFails(collectorA().collection('collectors').doc('collector-a').update({ verificationStatus: 'verified' }));
    await assertFails(collectorA().collection('collectors').doc('collector-a').update({ verificationStatus: 'rejected' }));
    await assertFails(collectorA().collection('collectors').doc('collector-a').update({ rating: 1 }));
    await assertSucceeds(collectorA().collection('collectors').doc('collector-a').update({ phone: '0800' }));
    await assertSucceeds(collectorA().collection('collectors').doc('collector-a').update({ verificationStatus: 'pending_review' }));
});

test('collector documents: owner uploads pending, only admin reviews', async () => {
    await assertSucceeds(collectorA().collection('collectors').doc('collector-a').collection('documents').add({ type: 'qualification', status: 'pending', fileUrl: 'y' }));
    await assertFails(collectorA().collection('collectors').doc('collector-a').collection('documents').add({ type: 'qualification', status: 'approved', fileUrl: 'y' }));
    await assertSucceeds(platformAdmin().collection('collectors').doc('collector-a').collection('documents').doc('doc-1').update({ status: 'approved' }));
});

test('a collector cannot read another collector\'s profile or documents', async () => {
    await assertFails(collectorB().collection('collectors').doc('collector-a').get());
    await assertFails(collectorB().collection('collectors').doc('collector-a').collection('documents').doc('doc-1').get());
});

// ---------- lab staff roster ----------
test('lab staff roster is readable by the lab admin, not others; never client-writable', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().collection('labs').doc('LAB1').collection('staff').doc('s1').set({ uid: 's1', email: 's@x.com' });
    });
    await assertSucceeds(lab1Admin().collection('labs').doc('LAB1').collection('staff').doc('s1').get());
    await assertSucceeds(platformAdmin().collection('labs').doc('LAB1').collection('staff').doc('s1').get());
    await assertFails(patientA().collection('labs').doc('LAB1').collection('staff').doc('s1').get());
    await assertFails(lab1Admin().collection('labs').doc('LAB1').collection('staff').add({ uid: 'x' }));
});

// ---------- jobs ----------
test('collectors can read open jobs and their own; not other collectors\' jobs', async () => {
    await assertSucceeds(collectorA().collection('jobs').doc('job-open').get());
    await assertSucceeds(collectorA().collection('jobs').doc('job-mine').get());
    await assertFails(collectorA().collection('jobs').doc('job-other').get());
});

test('the patient can read the job for their own order (tracking)', async () => {
    await assertSucceeds(patientA().collection('jobs').doc('job-open').get());
    await assertFails(patientB().collection('jobs').doc('job-open').get());
});

test('no client can write custody fields or create/delete jobs (server-only)', async () => {
    await assertFails(collectorA().collection('jobs').doc('job-mine').update({ status: 'collected' }));
    await assertFails(collectorA().collection('jobs').doc('job-open').update({ status: 'accepted', collectorId: 'collector-a' }));
    await assertFails(collectorA().collection('jobs').add({ orderId: 'x', patientId: PATIENT_A, labId: 'LAB1', status: 'pending' }));
    await assertFails(platformAdmin().collection('jobs').doc('job-open').update({ status: 'cancelled' }));
});

test('dispatch can read handed-over jobs but not other in-progress jobs', async () => {
    await assertSucceeds(dispatchA().collection('jobs').doc('job-transit').get());
    await assertFails(dispatchA().collection('jobs').doc('job-mine').get());
    await assertFails(dispatchA().collection('jobs').doc('job-open').get());
    // Dispatch still cannot write jobs directly (server-only).
    await assertFails(dispatchA().collection('jobs').doc('job-transit').update({ status: 'delivered' }));
});

test('the assigned collector may update only their live location', async () => {
    await assertSucceeds(collectorA().collection('jobs').doc('job-mine').update({ collectorLocation: { latitude: 9.05, longitude: 7.49 }, locationUpdatedAt: new Date() }));
    // Cannot piggyback a status change onto a location update:
    await assertFails(collectorA().collection('jobs').doc('job-mine').update({ collectorLocation: { latitude: 9.1, longitude: 7.5 }, status: 'collected' }));
    // Cannot update another collector's job location:
    await assertFails(collectorA().collection('jobs').doc('job-other').update({ collectorLocation: { latitude: 9.05, longitude: 7.49 } }));
    // A patient cannot write location:
    await assertFails(patientA().collection('jobs').doc('job-open').update({ collectorLocation: { latitude: 9.05, longitude: 7.49 } }));
});

// ---------- catalog writes and unknown collections ----------
test('signed-in users cannot write the catalog', async () => {
    await assertFails(patientA().collection('labs').doc('LAB1').update({ name: 'hacked' }));
    await assertFails(patientA().collection('labTests').doc('t1').set({ name: 'x' }));
});

test('unknown collections are denied by default', async () => {
    await assertFails(patientA().collection('somethingElse').doc('x').set({ a: 1 }));
    await assertFails(anon().collection('somethingElse').doc('x').get());
});

// Seeds the labTests and testPackages collections from the static catalog
// (apps/patient/src/data/default-tests.ts), using the same document ids the
// UI links with. Idempotent — re-running overwrites the same docs.
//
// Usage:
//   node --import tsx scripts/seed-catalog.mts             (default: lablink-df67e)
//   node --import tsx scripts/seed-catalog.mts lablink-staging
import { getAccessToken } from './lib/google-auth.mjs';
import { DEFAULT_TESTS, DEFAULT_PACKAGES } from '../apps/patient/src/data/default-tests';

const project = process.argv[2] || 'lablink-df67e';
const FS = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

function toValue(v: unknown): Record<string, unknown> {
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
    if (v === null || v === undefined) return { nullValue: null };
    throw new Error(`Unsupported value type: ${typeof v}`);
}

function toFields(obj: Record<string, unknown>): Record<string, unknown> {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k === 'id' || v === undefined) continue; // id is the doc id
        fields[k] = toValue(v);
    }
    return fields;
}

const token = await getAccessToken();
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function seed(collection: string, docs: { id: string }[]) {
    let ok = 0;
    for (const d of docs) {
        const res = await fetch(`${FS}/${collection}/${d.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ fields: toFields(d as unknown as Record<string, unknown>) }),
        });
        if (res.ok) ok++;
        else console.error(`  FAILED ${collection}/${d.id}: ${res.status} ${(await res.text()).slice(0, 120)}`);
    }
    console.log(`${collection}: ${ok}/${docs.length} seeded`);
}

console.log(`Seeding catalog into ${project}…`);
await seed('labTests', DEFAULT_TESTS);
await seed('testPackages', DEFAULT_PACKAGES);
console.log('Done.');

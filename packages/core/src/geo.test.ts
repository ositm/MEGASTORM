import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, estimateEta } from './geo';

const abuja = { latitude: 9.0579, longitude: 7.4951 };
const nearby = { latitude: 9.0679, longitude: 7.5051 }; // ~1.5 km away

test('haversine is zero for the same point', () => {
    assert.equal(haversineKm(abuja, abuja), 0);
});

test('haversine gives a sensible short distance', () => {
    const d = haversineKm(abuja, nearby);
    assert.ok(d > 1 && d < 2, `expected ~1.5km, got ${d}`);
});

test('haversine matches a known long distance (Abuja–Lagos ~ 525km)', () => {
    const lagos = { latitude: 6.5244, longitude: 3.3792 };
    const d = haversineKm(abuja, lagos);
    assert.ok(d > 490 && d < 560, `expected ~525km, got ${d}`);
});

test('estimateEta returns distance and a positive minute estimate', () => {
    const eta = estimateEta(abuja, nearby);
    assert.ok(eta.distanceKm > 0);
    assert.ok(eta.minutes >= 1);
});

test('estimateEta never returns less than 1 minute', () => {
    const eta = estimateEta(abuja, { latitude: 9.058, longitude: 7.4952 });
    assert.equal(eta.minutes >= 1, true);
});

test('a farther point yields a larger ETA', () => {
    const near = estimateEta(abuja, nearby);
    const far = estimateEta(abuja, { latitude: 9.2, longitude: 7.7 });
    assert.ok(far.minutes > near.minutes);
});

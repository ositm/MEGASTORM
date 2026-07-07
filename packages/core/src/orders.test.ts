import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    ORDER_EVENT_TYPES,
    ORDER_TRANSITIONS,
    EVENT_ACTOR_ROLES,
    canTransition,
    assertTransition,
    IllegalTransitionError,
    roleMayEmit,
    isTerminal,
} from './orders';

test('every event type has transitions and an actor-role entry', () => {
    for (const t of ORDER_EVENT_TYPES) {
        assert.ok(t in ORDER_TRANSITIONS, `missing transitions for ${t}`);
        assert.ok(EVENT_ACTOR_ROLES[t]?.length >= 0, `missing actor roles for ${t}`);
    }
});

test('transition targets are all valid event types', () => {
    for (const [from, targets] of Object.entries(ORDER_TRANSITIONS)) {
        for (const to of targets) {
            assert.ok(ORDER_EVENT_TYPES.includes(to), `${from} -> ${to} targets unknown type`);
        }
    }
});

test('happy path: home collection end to end', () => {
    const path = [
        'ORDER_CREATED', 'PAYMENT_CONFIRMED', 'COLLECTOR_ASSIGNED', 'COLLECTOR_ARRIVED',
        'SAMPLE_COLLECTED', 'HANDED_TO_DISPATCH', 'DISPATCH_DELIVERED', 'LAB_RECEIVED',
        'TESTING_STARTED', 'TESTING_COMPLETED', 'RESULT_UPLOADED', 'RESULT_VALIDATED',
        'RESULT_RELEASED', 'PATIENT_NOTIFIED',
    ] as const;
    for (let i = 1; i < path.length; i++) {
        assert.ok(canTransition(path[i - 1], path[i]), `${path[i - 1]} -> ${path[i]}`);
    }
});

test('happy path: walk-in skips the collector chain', () => {
    assert.ok(canTransition('PAYMENT_CONFIRMED', 'LAB_RECEIVED'));
});

test('collector can be reassigned', () => {
    assert.ok(canTransition('COLLECTOR_ASSIGNED', 'COLLECTOR_ASSIGNED'));
});

test('results cannot be released before validation', () => {
    assert.equal(canTransition('RESULT_UPLOADED', 'RESULT_RELEASED'), false);
    assert.throws(() => assertTransition('RESULT_UPLOADED', 'RESULT_RELEASED'), IllegalTransitionError);
});

test('unpaid orders cannot enter the custody chain', () => {
    assert.equal(canTransition('ORDER_CREATED', 'COLLECTOR_ASSIGNED'), false);
    assert.equal(canTransition('ORDER_CREATED', 'LAB_RECEIVED'), false);
});

test('cancellation is only possible before sample collection', () => {
    assert.ok(canTransition('ORDER_CREATED', 'CANCELLED'));
    assert.ok(canTransition('COLLECTOR_ARRIVED', 'CANCELLED'));
    assert.equal(canTransition('SAMPLE_COLLECTED', 'CANCELLED'), false);
    assert.equal(canTransition('LAB_RECEIVED', 'CANCELLED'), false);
});

test('terminal states accept no further events', () => {
    assert.ok(isTerminal('CANCELLED'));
    assert.ok(isTerminal('DISPUTED'));
    assert.equal(isTerminal('ORDER_CREATED'), false);
});

test('actor roles: patients cannot emit lab or collector events', () => {
    assert.equal(roleMayEmit('patient', 'LAB_RECEIVED'), false);
    assert.equal(roleMayEmit('patient', 'SAMPLE_COLLECTED'), false);
    assert.ok(roleMayEmit('patient', 'ORDER_CREATED'));
    assert.ok(roleMayEmit('patient', 'CANCELLED'));
});

test('actor roles: only lab_admin validates and releases results', () => {
    assert.equal(roleMayEmit('lab_staff', 'RESULT_VALIDATED'), false);
    assert.equal(roleMayEmit('collector', 'RESULT_RELEASED'), false);
    assert.ok(roleMayEmit('lab_admin', 'RESULT_VALIDATED'));
    assert.ok(roleMayEmit('lab_admin', 'RESULT_RELEASED'));
});

test('every non-terminal status has at least one exit', () => {
    for (const t of ORDER_EVENT_TYPES) {
        if (!isTerminal(t)) {
            assert.ok(ORDER_TRANSITIONS[t].length > 0, `${t} is a dead end`);
        }
    }
});

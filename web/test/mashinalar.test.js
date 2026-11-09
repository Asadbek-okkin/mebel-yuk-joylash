import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STANDART, ozMashinalar, ozMashinaSaqla, hammaMashinalar } from '../mashinalar.js';

test('STANDART', () => {
  assert.equal(STANDART.length, 4);
  const labo = STANDART.find((m) => m.nomi === 'Labo');
  assert.deepEqual([labo.L, labo.W, labo.H, labo.maxKg], [1900, 1400, 1400, 500]);
  assert.deepEqual(STANDART.map((m) => m.nomi), ['Labo', 'Gazel', 'Isuzu NQR', 'Fura']);
});
test('xotirasizMashina', () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('yo\'q'); } });
  const m = { nomi: 'Kamaz', L: 6000, W: 2400, H: 2400, maxKg: 10000 };
  assert.equal(ozMashinaSaqla([m]), false);
  assert.deepEqual(ozMashinalar(), [m]);
  assert.equal(hammaMashinalar().length, 5);
  delete globalThis.localStorage;
});
test('localStorage bilan saqlanadi', () => {
  const store = {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
  const m = { nomi: 'Kamaz', L: 6000, W: 2400, H: 2400, maxKg: 10000 };
  assert.equal(ozMashinaSaqla([m]), true);
  assert.deepEqual(JSON.parse(store['yuk-mashinalar']), [m]);
  delete globalThis.localStorage;
});

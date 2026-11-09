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

import { mashinaProfil } from '../mashinalar.js';
test('mashinaProfil: turi nomidan yoki uzunlikdan', () => {
  assert.equal(mashinaProfil(STANDART[0]).tur, 'labo');
  assert.equal(mashinaProfil(STANDART[1]).tur, 'gazel');
  assert.equal(mashinaProfil(STANDART[2]).tur, 'isuzu');
  assert.equal(mashinaProfil(STANDART[3]).tur, 'fura');
  assert.equal(mashinaProfil({ nomi: 'Kamaz', L: 6000, W: 2400, H: 2400, maxKg: 10000 }).tur, 'isuzu');
  assert.equal(mashinaProfil({ nomi: 'Damas', L: 1500, W: 1200, H: 1100, maxKg: 400 }).tur, 'labo');
  assert.equal(mashinaProfil({ nomi: 'Tent', L: 12000, W: 2450, H: 2600, maxKg: 18000 }).tur, 'fura');
});
test('mashinaProfil: g\'ildirak polga sig\'adi, o\'qlar kuzov ostida yoki kabinada', () => {
  for (const K of STANDART) {
    const P = mashinaProfil(K);
    assert.ok(P.polH > 2 * P.gildirakR * 0.9, K.nomi + ' polH');
    assert.ok(P.kabinaL > 0.8 && P.kabinaH > P.polH, K.nomi + ' kabina');
    assert.ok(P.oqlar.length >= 2);
    assert.ok(P.oqlar.every((x) => x > -(P.kabinaL + P.oraliq + 0.1) && x < K.L / 1000), K.nomi + ' oqlar');
    assert.ok(P.oqlar.some((x) => x < 0) && P.oqlar.some((x) => x > 0), K.nomi + ' old va orqa o\'q');
  }
  assert.equal(mashinaProfil(STANDART[3]).oraliq > 0, true);   // fura: tyagach va pritsep orasida bo'shliq
});

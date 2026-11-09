import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oqiYuk, buyurtmaQosh, qutilarniYoy, RANGLAR } from '../yukfayl.js';
import { NAMUNA } from '../namuna.js';

const YUK = {
  format: 'mebel-yuk', versiya: 1, buyurtma: 'Shkaf', sana: '2026-11-09', jamiKg: 50,
  upakovkalar: [
    { nomer: '2/1', turi: 'korpus', L: 2040, W: 640, H: 88, kg: 37.4, detallar: [] },
    { nomer: '2/2', turi: 'fasad', L: 740, W: 440, H: 56, kg: 12.6, detallar: [] }
  ]
};
const XATO = 'Bu fayl upakovka fayli emas (.yuk)';

test('oqiYuk', () => { assert.equal(oqiYuk(JSON.stringify(YUK)).buyurtma, 'Shkaf'); });
test('bomliFayl', () => { assert.equal(oqiYuk('﻿' + JSON.stringify(YUK)).upakovkalar.length, 2); });
test('noto\'g\'ri fayllar', () => {
  assert.throws(() => oqiYuk('salom'), { message: XATO });
  assert.throws(() => oqiYuk('{"a":1}'), { message: XATO });
  assert.throws(() => oqiYuk(JSON.stringify({ ...YUK, format: 'boshqa' })), { message: XATO });
  assert.throws(() => oqiYuk(JSON.stringify({ ...YUK, versiya: 2 })), { message: XATO });
  assert.throws(() => oqiYuk(JSON.stringify({ ...YUK, upakovkalar: 'x' })), { message: XATO });
});
test('takrorFayl', () => {
  let r = buyurtmaQosh([], oqiYuk(JSON.stringify(YUK)));
  r = buyurtmaQosh(r, oqiYuk(JSON.stringify(YUK)));
  assert.equal(r.length, 1);
  assert.equal(r[0].soni, 2);
  r = buyurtmaQosh(r, { ...YUK, buyurtma: 'Boshqa' });
  assert.equal(r.length, 2);
  assert.notEqual(r[0].rang, r[1].rang);
});
test('qutilarniYoy', () => {
  const q = qutilarniYoy([{ yuk: YUK, soni: 2 }]);
  assert.equal(q.length, 4);
  assert.equal(new Set(q.map((x) => x.id)).size, 4);
  assert.equal(q[0].nomer, '#1 2/1');
  assert.equal(qutilarniYoy([{ yuk: YUK, soni: 1 }])[0].nomer, '2/1');
});
test('RANGLAR 8 ta', () => { assert.equal(RANGLAR.length, 8); });
test('NAMUNA', () => {
  const y = oqiYuk(JSON.stringify(NAMUNA));
  assert.equal(y.upakovkalar.length, 5);
  assert.deepEqual(y.upakovkalar.map((u) => u.turi), ['korpus', 'korpus', 'korpus', 'fasad', 'furnitura']);
  assert.ok(y.jamiKg > 120 && y.jamiKg < 220);
});

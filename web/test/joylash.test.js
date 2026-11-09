import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joyla, nechtaSigadi, tavsiya } from '../joylash.js';

const Q = (id, L, W, H, kg, turi = 'korpus', buyurtma = 0) => ({ id, nomer: id, buyurtma, turi, L, W, H, kg });
const K = { nomi: 'T', L: 1000, W: 1000, H: 1000, maxKg: 1000 };
const FURA = { nomi: 'Fura', L: 13600, W: 2450, H: 2700, maxKg: 20000 };

function kesishadi(a, b) {
  return a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.w && b.y < a.y + a.w && a.z < b.z + b.h && b.z < a.z + a.h;
}
function invariant(r, K) {
  const J = r.joylandi;
  let kg = 0;
  J.forEach((p, i) => {
    kg += p.q.kg;
    assert.ok(p.x >= 0 && p.y >= 0 && p.z >= 0 && p.x + p.l <= K.L && p.y + p.w <= K.W && p.z + p.h <= K.H, 'kuzovdan chiqdi: ' + p.q.id);
    assert.equal(p.h, p.q.H, 'yotqizilmagan: ' + p.q.id);
    for (let j = 0; j < i; j++) assert.ok(!kesishadi(p, J[j]), 'kesishma: ' + p.q.id + ' / ' + J[j].q.id);
    if (p.z > 0) {
      let s = 0;
      const ostida = J.filter((o) => Math.abs(o.z + o.h - p.z) <= 1);
      ostida.forEach((o) => {
        const dx = Math.min(p.x + p.l, o.x + o.l) - Math.max(p.x, o.x), dy = Math.min(p.y + p.w, o.y + o.w) - Math.max(p.y, o.y);
        if (dx > 0 && dy > 0) {
          s += dx * dy;
          if (p.q.turi !== 'fasad') assert.notEqual(o.q.turi, 'fasad', 'fasad ustida og\'ir: ' + p.q.id);
        }
      });
      assert.ok(s >= 0.7 * p.l * p.w - 1, 'tayanch < 70%: ' + p.q.id);
    }
  });
  assert.ok(kg <= K.maxKg, 'og\'irlik limiti');
  assert.equal(Math.round(kg * 10) / 10, Math.round(r.jamiKg * 10) / 10);
}
function tasodifiy(n, seed = 1) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({ length: n }, (_, i) => Q('r' + i, 300 + Math.round(rnd() * 1800), 300 + Math.round(rnd() * 400),
    40 + Math.round(rnd() * 210), 5 + Math.round(rnd() * 35), rnd() < 0.2 ? 'fasad' : 'korpus'));
}

test('8 kub to\'liq', () => {
  const r = joyla(Array.from({ length: 9 }, (_, i) => Q('q' + i, 500, 500, 500, 10)), K);
  assert.equal(r.joylandi.length, 8);
  assert.equal(r.sigmadi[0].sabab, 'joy');
  assert.equal(r.hajmFoiz, 100);
  invariant(r, K);
});
test('og\'irlik limiti', () => {
  const r = joyla([Q('a', 100, 100, 100, 400), Q('b', 100, 100, 100, 400), Q('c', 100, 100, 100, 400)], K);
  assert.equal(r.joylandi.length, 2);
  assert.equal(r.sigmadi[0].sabab, 'ogirlik');
});
test('kuzovdanKattaQuti', () => {
  const r = joyla([Q('uzun', 2100, 640, 90, 30), Q('ok', 500, 500, 100, 10)], { ...K, L: 1900, W: 1400 });
  assert.equal(r.sigmadi.length, 1);
  assert.equal(r.sigmadi[0].q.id, 'uzun');
  assert.equal(r.sigmadi[0].sabab, 'olcham');
  assert.equal(r.joylandi.length, 1);
});
test('fasad yuqorida', () => {
  const r = joyla([Q('f', 1000, 500, 100, 5, 'fasad'), Q('k', 1000, 500, 100, 30)], { ...K, W: 500 });
  assert.equal(r.joylandi.find((p) => p.q.id === 'k').z, 0);
  assert.equal(r.joylandi.find((p) => p.q.id === 'f').z, 100);
});
test('burish', () => {
  const r = joyla([Q('b', 900, 400, 100, 10)], { ...K, L: 500, W: 1000 });
  assert.equal(r.joylandi.length, 1);
  assert.equal(r.joylandi[0].l, 400);
});
test('osilib turmaydi', () => {
  const r = joyla([Q('a', 500, 500, 500, 50), Q('keng', 1000, 1000, 100, 10)], { ...K, H: 550 });
  assert.equal(r.sigmadi.length, 1);
  invariant(r, { ...K, H: 550 });
});
test('tasodifiy 200 quti invariantlari', () => {
  const r = joyla(tasodifiy(200), FURA);
  assert.ok(r.joylandi.length > 150, 'joylandi: ' + r.joylandi.length);
  invariant(r, FURA);
});
test('tasodifiy Gazel invariantlari', () => {
  const G = { nomi: 'Gazel', L: 3000, W: 2000, H: 1800, maxKg: 1500 };
  for (const seed of [2, 3, 4]) invariant(joyla(tasodifiy(80, seed), G), G);
});
test('nechtaSigadi', () => {
  const yuk = { upakovkalar: [{ nomer: '1/1', turi: 'korpus', L: 500, W: 500, H: 500, kg: 10 }] };
  assert.equal(nechtaSigadi([{ yuk, soni: 1 }], 0, K), 8);
});
test('nechtaSigadi boshqa buyurtma bilan', () => {
  const yuk = { upakovkalar: [{ nomer: '1/1', turi: 'korpus', L: 500, W: 500, H: 500, kg: 10 }] };
  assert.equal(nechtaSigadi([{ yuk, soni: 1 }, { yuk, soni: 3 }], 0, K), 5);
});
test('tavsiya', () => {
  const M = [{ nomi: 'Katta', L: 2000, W: 1000, H: 1000, maxKg: 2000 }, { nomi: 'Kichik', L: 1000, W: 1000, H: 1000, maxKg: 1000 }];
  const t1 = tavsiya(Array.from({ length: 6 }, (_, i) => Q('q' + i, 500, 500, 500, 10)), M);
  assert.deepEqual([t1.mashina.nomi, t1.soni], ['Kichik', 1]);
  const t2 = tavsiya(Array.from({ length: 12 }, (_, i) => Q('q' + i, 500, 500, 500, 10)), M);
  assert.deepEqual([t2.mashina.nomi, t2.soni], ['Katta', 1]);
  const t3 = tavsiya(Array.from({ length: 20 }, (_, i) => Q('q' + i, 500, 500, 500, 10)), M);
  assert.deepEqual([t3.mashina.nomi, t3.soni], ['Katta', 2]);
});
test('tavsiya: hech biriga sig\'maydigan quti', () => {
  const M = [{ nomi: 'Kichik', L: 1000, W: 1000, H: 1000, maxKg: 1000 }];
  assert.equal(tavsiya([Q('x', 3000, 500, 100, 10)], M), null);
});
test('200 quti Fura < 1.5 s', () => {
  const qs = tasodifiy(200, 7), t0 = Date.now();
  joyla(qs, FURA);
  assert.ok(Date.now() - t0 < 1500, 'ms: ' + (Date.now() - t0));
});
test('katta yassi quti uchun boshqa tartib sinaladi (namuna Gazelga sig\'adi)', () => {
  const G = { nomi: 'Gazel', L: 3000, W: 2000, H: 1800, maxKg: 1500 };
  const r = joyla([Q('a', 1240, 640, 104, 38.6), Q('b', 2240, 640, 72, 37.3), Q('c', 2240, 1240, 43, 18.9), Q('d', 400, 300, 100, 3), Q('f', 2240, 640, 72, 27.2, 'fasad')], G);
  assert.equal(r.sigmadi.length, 0);
  invariant(r, G);
});

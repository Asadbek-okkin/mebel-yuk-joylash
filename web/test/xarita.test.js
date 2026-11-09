import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yuklashTartibi, joyMatni } from '../xarita.js';
import { joyla } from '../joylash.js';

const Q = (id, L, W, H, kg, turi = 'korpus') => ({ id, nomer: id, buyurtma: 0, turi, L, W, H, kg });
const K = { nomi: 'T', L: 3000, W: 2000, H: 1800, maxKg: 5000 };
const J = (id, x, y, z, l, w, h, turi = 'korpus') => ({ q: Q(id, l, w, h, 10, turi), x, y, z, l, w, h });

test('tayanch qutisi har doim ustidagidan oldin, qavat raqami', () => {
  // b (x=0) a ning (x=0..1000) ustida, c - eshik tomonda polda
  const T = yuklashTartibi([J('c', 2000, 0, 0, 1000, 1000, 100), J('b', 0, 0, 100, 1000, 1000, 100), J('a', 0, 0, 0, 1000, 1000, 100)]);
  assert.deepEqual(T.map((t) => t.p.q.id), ['a', 'b', 'c']);
  assert.deepEqual(T.map((t) => t.qavat), [1, 2, 1]);
  assert.deepEqual(T.map((t) => t.n), [1, 2, 3]);
});
test('kabina tomoni birinchi, eshik tomoni oxirida', () => {
  const T = yuklashTartibi([J('eshik', 2500, 0, 0, 500, 500, 100), J('kabina', 0, 0, 0, 500, 500, 100), J('orta', 1200, 0, 0, 500, 500, 100)]);
  assert.deepEqual(T.map((t) => t.p.q.id), ['kabina', 'orta', 'eshik']);
});
test('qavat - eng baland tayanch zanjiri', () => {
  const T = yuklashTartibi([J('a', 0, 0, 0, 1000, 1000, 100), J('b', 0, 0, 0 + 100, 1000, 1000, 50), J('c', 0, 0, 150, 1000, 1000, 50)]);
  assert.deepEqual(T.map((t) => [t.p.q.id, t.qavat]), [['a', 1], ['b', 2], ['c', 3]]);
});
test('haqiqiy joylashda tartib tayanchni buzmaydi', () => {
  let s = 3; const r = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const qs = Array.from({ length: 60 }, (_, i) => Q('r' + i, 300 + Math.round(r() * 1500), 300 + Math.round(r() * 400), 40 + Math.round(r() * 200), 10, r() < 0.2 ? 'fasad' : 'korpus'));
  const R = joyla(qs, K);
  const T = yuklashTartibi(R.joylandi);
  assert.equal(T.length, R.joylandi.length);
  const indeks = new Map(T.map((t, i) => [t.p, i]));
  for (const t of T) {
    if (t.p.z <= 1) continue;
    for (const o of R.joylandi) {
      const ust = Math.abs(o.z + o.h - t.p.z) <= 1;
      const dx = Math.min(t.p.x + t.p.l, o.x + o.l) - Math.max(t.p.x, o.x), dy = Math.min(t.p.y + t.p.w, o.y + o.w) - Math.max(t.p.y, o.y);
      if (ust && dx > 0 && dy > 0) assert.ok(indeks.get(o) < indeks.get(t.p), 'tayanch keyin yuklanadi: ' + t.p.q.id);
    }
  }
});
test('joyMatni: eshikdan qaraganda', () => {
  // eshikdan (x = L) kabinaga qaraganda: y kichik - o'ng, y katta - chap
  assert.equal(joyMatni({ p: J('a', 0, 1500, 0, 500, 500, 100), qavat: 1 }, K), "kabina tomoni, chap, 1-qavat");
  assert.equal(joyMatni({ p: J('a', 2500, 0, 200, 500, 500, 100), qavat: 3 }, K), "eshik oldi, o'ng, 3-qavat");
  assert.equal(joyMatni({ p: J('a', 1250, 750, 0, 500, 500, 100), qavat: 1 }, K), "o'rtada, o'rta, 1-qavat");
});

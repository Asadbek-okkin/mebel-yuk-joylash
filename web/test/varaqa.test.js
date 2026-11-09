import { test } from 'node:test';
import assert from 'node:assert/strict';
import { varaqaHTML } from '../varaqa.js';
import { yuklashTartibi } from '../xarita.js';

const K = { nomi: 'Gazel', L: 3000, W: 2000, H: 1800, maxKg: 1500 };
const J = (id, x, y, z, l, w, h, buyurtma = 0, turi = 'korpus') => ({ q: { id, nomer: id, buyurtma, turi, L: l, W: w, H: h, kg: 12.5 }, x, y, z, l, w, h });
const royxat = [{ yuk: { buyurtma: 'Shkaf <b>1</b>' }, rang: '#2f6fdf', soni: 1 }, { yuk: { buyurtma: 'Krovat' }, rang: '#2e9e5b', soni: 1 }];
const joylandi = [J('3/1', 0, 0, 0, 2000, 600, 100), J('3/2', 0, 0, 100, 2000, 600, 80), J('2/1', 2000, 0, 0, 900, 500, 100, 1)];
const html = varaqaHTML({ K, tartib: yuklashTartibi(joylandi), royxat, jamiKg: 37.5, sana: '2026-11-09' });

test('har qavat uchun bitta xarita', () => {
  assert.equal((html.match(/<svg/g) || []).length, 2);
  assert.match(html, /1-qavat/);
  assert.match(html, /2-qavat/);
});
test('jadvalda har quti bitta qator, tartib bilan', () => {
  const qatorlar = html.match(/<tr class="q">/g) || [];
  assert.equal(qatorlar.length, 3);
  assert.ok(html.indexOf('>3/1<') < html.indexOf('>3/2<'));
});
test('kabina va eshik belgilari, mashina va jami', () => {
  assert.match(html, /KABINA/);
  assert.match(html, /ESHIK/);
  assert.match(html, /Gazel/);
  assert.match(html, /37\.5 kg/);
});
test('matnlar escape qilinadi', () => {
  assert.ok(!html.includes('<b>1</b>'));
  assert.match(html, /Shkaf &lt;b&gt;1&lt;\/b&gt;/);
});

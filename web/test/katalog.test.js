import { test } from 'node:test';
import assert from 'node:assert/strict';
import { katalogTuz, katalogOqi, filtrla } from '../katalog.js';

const yuk = (buyurtma, n, kg, turkum) => JSON.stringify({ format: 'mebel-yuk', versiya: 2, buyurtma, sana: '2026-11-09', jamiKg: kg, turkum,
  upakovkalar: Array.from({ length: n }, (_, i) => ({ nomer: `${n}/${i + 1}`, turi: 'korpus', L: 2000, W: 600, H: 100, kg: kg / n, detallar: [] })),
  model: { L: 2000, W: 550, H: 2100, ranglar: ['#7b5b45'], panellar: [[0, 0, 0, 16, 2100, 550, 0, 0]] } });

test('katalogTuz: fayl nomidan nom, papkadan turkum, xavfsiz fayl nomi', () => {
  const r = katalogTuz([
    { nisbiy: 'Shkaf/01 Шкаф Дилафруз.yuk', matn: '﻿' + yuk('01 Шкаф', 4, 148.8, 'Shkaf') },
    { nisbiy: 'Prixojka/02 Пр Макс.yuk', matn: yuk('01 Прихожка Макс', 3, 55.4, 'Prixojka') },
    { nisbiy: 'Shkaf/buzuq.yuk', matn: '{"a":1}' }
  ]);
  assert.equal(r.index.mahsulotlar.length, 2);
  assert.equal(r.xatolar.length, 1);
  const m = r.index.mahsulotlar.find((x) => x.nomi === '01 Шкаф Дилафруз');
  assert.deepEqual([m.turkum, m.quti, m.kg], ['Shkaf', 4, 148.8]);
  assert.match(m.fayl, /^[a-z0-9-]+\.yuk$/);
  assert.equal(new Set(r.index.mahsulotlar.map((x) => x.fayl)).size, 2);
  const chiq = r.fayllar.find((f) => f.fayl === m.fayl);
  assert.equal(JSON.parse(chiq.matn).buyurtma, '01 Шкаф Дилафруз');   // buyurtma nomi = mahsulot nomi
  assert.deepEqual(r.index.mahsulotlar.map((x) => x.turkum), ['Prixojka', 'Shkaf']);   // turkum bo'yicha tartib
});
test('katalogOqi va filtrla', () => {
  const k = katalogOqi(JSON.stringify({ mahsulotlar: [{ fayl: 'a.yuk', nomi: 'Шкаф Гола', turkum: 'Shkaf', quti: 4, kg: 141.7 }, { fayl: 'b.yuk', nomi: 'Марсел', turkum: 'Prixojka', quti: 3, kg: 51 }, { fayl: '../x', nomi: 'yomon' }] }));
  assert.equal(k.mahsulotlar.length, 2);                      // xavfsiz bo'lmagan fayl nomi tashlanadi
  assert.deepEqual(k.turkumlar, ['Prixojka', 'Shkaf']);
  assert.equal(filtrla(k.mahsulotlar, { turkum: 'Shkaf' }).length, 1);
  assert.equal(filtrla(k.mahsulotlar, { qidiruv: 'мар' }).length, 1);
  assert.equal(filtrla(k.mahsulotlar, {}).length, 2);
});

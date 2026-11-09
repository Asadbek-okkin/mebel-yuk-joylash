const t = require('node:test'), a = require('node:assert/strict');
const C = require('../upakovka-core.js');
const S = C.sozlama();

t.test('zichlik', () => {
  a.equal(C.zichlik('ЛДСП Кроношпан 16 Ясень', S), 650);
  a.equal(C.zichlik('ХДФ 3мм белый', S), 850);
  a.equal(C.zichlik('МДФ 18 крашеный', S), 750);
  a.equal(C.zichlik('Зеркало 4мм', S), 2500);
  a.equal(C.zichlik('', S), 650);
});
t.test('detalKg', () => {
  a.equal(Math.round(C.detalKg({ L: 2000, W: 600, T: 16, material: 'ЛДСП' }, S) * 100) / 100, 12.48);
});
t.test('fasadmi', () => {
  a.equal(C.fasadmi({ nomi: 'Фасад верхний', material: 'ЛДСП' }, S), true);
  a.equal(C.fasadmi({ nomi: 'Дверь', material: 'ЛДСП' }, S), true);
  a.equal(C.fasadmi({ nomi: 'Бок', material: 'МДФ крашеный' }, S), true);
  a.equal(C.fasadmi({ nomi: 'Бок левый', material: 'ЛДСП' }, S), false);
});
t.test('sozlama ustiga yozadi', () => {
  a.equal(C.sozlama({ maxKg: 30 }).maxKg, 30);
  a.equal(C.sozlama({ maxKg: 30 }).zaxiraMm, 20);
});

const D = (nomi, L, W, T = 16, material = 'ЛДСП') => ({ nomi, L, W, T, material });
t.test('40 kg chegarasi va nomlash', () => {
  const r = C.bolish([D('Бок', 2000, 600), D('Бок', 2000, 600), D('Бок', 2000, 600), D('Бок', 2000, 600)], 0, S);
  a.deepEqual(r.upakovkalar.map(u => u.nomer), ['2/1', '2/2']);
  a.equal(r.upakovkalar[0].detallar.length, 3);
  a.deepEqual([r.upakovkalar[0].L, r.upakovkalar[0].W, r.upakovkalar[0].H], [2040, 640, 88]);
  a.equal(r.upakovkalar[0].kg, 37.4);
});
t.test('fasad alohida, mayda detal katta qutiga', () => {
  const r = C.bolish([D('Полка', 800, 500), D('Фасад', 700, 400), D('Бок', 2000, 600)], 0, S);
  a.deepEqual(r.upakovkalar.map(u => [u.nomer, u.turi, u.detallar.length]), [['2/1', 'korpus', 2], ['2/2', 'fasad', 1]]);
});
t.test('detal L >= W ga normallashadi', () => {
  const r = C.bolish([D('Бок', 600, 2000)], 0, S);
  a.deepEqual([r.upakovkalar[0].detallar[0].L, r.upakovkalar[0].detallar[0].W], [2000, 600]);
});
t.test('furnitura qutisi oxirida', () => {
  const r = C.bolish([D('Бок', 2000, 600)], 60, S);
  const f = r.upakovkalar[1];
  a.deepEqual([f.nomer, f.turi, f.L, f.W, f.H, f.kg], ['2/2', 'furnitura', 400, 300, 200, 3]);
});
t.test('faqatFurnitura', () => {
  const r = C.bolish([], 10, S);
  a.deepEqual(r.upakovkalar.map(u => [u.nomer, u.H]), [['1/1', 100]]);
});
t.test("bo'sh", () => { a.equal(C.bolish([], 0, S).upakovkalar.length, 0); });
t.test("og'ir bitta detal", () => {
  const r = C.bolish([D('Столешница', 3000, 600, 38, 'ЛДСП'), D('Бок', 2000, 600)], 0, S);
  a.equal(r.upakovkalar.length, 2);
  a.equal(r.ogohlar.length, 1);
  a.match(r.ogohlar[0], /Столешница/);
});
t.test('yukFayl', () => {
  const r = C.bolish([D('Бок', 2000, 600)], 0, S);
  const y = C.yukFayl('Shkaf', '2026-11-09', r.upakovkalar);
  a.equal(y.format, 'mebel-yuk'); a.equal(y.versiya, 1); a.equal(y.jamiKg, 12.5);
  a.equal(y.buyurtma, 'Shkaf'); a.equal(y.upakovkalar.length, 1);
});

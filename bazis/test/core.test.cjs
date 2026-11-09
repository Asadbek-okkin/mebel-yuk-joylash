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

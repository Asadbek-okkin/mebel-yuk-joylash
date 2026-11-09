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
  a.equal(C.fasadmi({ nomi: 'Панель', material: 'ЛДСП', egalar: ['Аниматция', 'Дверь 2 (простой)'] }, S), true);
});
t.test('sozlama: default 50 kg', () => {
  a.equal(S.maxKg, 50);
  a.equal(C.sozlama({ maxKg: 30 }).maxKg, 30);
  a.equal(C.sozlama({ maxKg: 30 }).zaxiraMm, 20);
});

const D = (nomi, L, W, T = 16, material = 'ЛДСП', qosh = {}) => ({ nomi, L, W, T, material, ...qosh });
t.test('guruhi: fasad / uzun / mayda / orqa', () => {
  a.equal(C.guruhi(D('Панель', 1950, 600, 16, 'ЛДСП', { egalar: ['Фасад'] }), S), 'fasad');
  a.equal(C.guruhi(D('Зеркало', 760, 230, 4, 'Зеркала'), S), 'fasad');
  a.equal(C.guruhi(D('Хдф задный', 1996, 606, 3, 'ЛХДФ 3мм'), S), 'orqa');
  a.equal(C.guruhi(D('бокавина', 2084, 530, 16, 'ЛДСП', { tik: true }), S), 'uzun');
  a.equal(C.guruhi(D('Стойка', 1968, 470), S), 'uzun');                                   // nomidan
  a.equal(C.guruhi(D('Дно', 1968, 530, 16, 'ЛДСП', { tik: false }), S), 'mayda');          // yotiq uzun - gorizontal
  a.equal(C.guruhi(D('Крышка', 2000, 530), S), 'mayda');                                  // nomidan
  a.equal(C.guruhi(D('Планка цокольная', 1968, 100, 16, 'ЛДСП', { tik: true }), S), 'mayda'); // tor
  a.equal(C.guruhi(D('Полка', 768, 423), S), 'mayda');
});

// Shkaf Dilafruz'ga o'xshash to'plam (bloklarsiz)
const SHKAF = [
  D('Фасад купе', 1950, 600), D('Фасад купе', 1950, 600),
  D('бокавина', 2084, 530, 16, 'ЛДСП', { tik: true }), D('бокавина', 2084, 530, 16, 'ЛДСП', { tik: true }),
  D('Стойка', 1968, 470, 16, 'ЛДСП', { tik: true }), D('Стойка', 1968, 470, 16, 'ЛДСП', { tik: true }),
  D('Дно', 1968, 530, 16, 'ЛДСП', { tik: false }), D('Крышка', 2000, 530, 16, 'ЛДСП', { tik: false }),
  D('Полка', 768, 423), D('Полка', 768, 423), D('Полка', 768, 423), D('Полка', 768, 423),
  D('Планка цокольная', 1968, 100, 16, 'ЛДСП', { tik: true }), D('Планка цокольная', 1968, 100, 16, 'ЛДСП', { tik: true }),
  D('Хдф задный', 1996, 606, 3, 'ЛХДФ'), D('Хдф задный', 1996, 784, 3, 'ЛХДФ'), D('Хдф задный', 1996, 606, 3, 'ЛХДФ')
];
t.test('avtomatik: fasad, uzun, mayda, orqa - standart modellar tartibi', () => {
  const r = C.bolish(SHKAF, 0, S);
  a.deepEqual(r.upakovkalar.map((u) => [u.nomer, u.guruh, u.turi]), [['4/1', 'fasad', 'fasad'], ['4/2', 'uzun', 'korpus'], ['4/3', 'mayda', 'korpus'], ['4/4', 'orqa', 'korpus']]);
  a.ok(r.upakovkalar.every((u) => u.kg <= 50));
});

function qatlamInvariant(u, z) {
  u.detallar.filter((d) => d.T > 0).forEach((d, i, arr) => {
    a.ok(d.x >= z - 0.01 && d.y >= z - 0.01 && d.x + d.dx <= u.L - z + 2.01 && d.y + d.dy <= u.W - z + 2.01, 'asosdan chiqdi: ' + d.nomi);
    a.ok(d.z + d.T <= u.H - z + 0.01, 'balandlikdan chiqdi: ' + d.nomi);
    for (let j = 0; j < i; j++) {
      const e = arr[j];
      const ust = d.z < e.z + e.T && e.z < d.z + d.T;
      const xy = d.x < e.x + e.dx && e.x < d.x + d.dx && d.y < e.y + e.dy && e.y < d.y + d.dy;
      a.ok(!(ust && xy), 'kesishma: ' + d.nomi + ' / ' + e.nomi);
    }
  });
}
t.test('real qadoqlash: mayda detallar bir qatlamga yonma-yon, H past', () => {
  const r = C.bolish(SHKAF, 0, S);
  const m = r.upakovkalar[2];
  a.equal(m.detallar.length, 8);
  a.equal(m.H, 4 * 16 + 40);                  // krisha | dno | 2 polka + planka | 2 polka + planka
  // 3-qatlam (z = 20 zaxira + 32): 2 polka yonma-yon + planka
  a.equal(m.detallar.filter((d) => d.z === 52).length, 3);
  a.equal(m.detallar.filter((d) => d.z === 52 && /Полка/.test(d.nomi)).length, 2);
  r.upakovkalar.forEach((u) => qatlamInvariant(u, 20));
});
t.test('50 kg chegarasi: guruh og\'ir bo\'lsa bo\'linadi', () => {
  const bok = () => D('Бок', 2000, 600, 16, 'ЛДСП', { tik: true });
  a.equal(C.bolish([bok(), bok(), bok(), bok()], 0, S).upakovkalar.length, 1);   // 49.9 kg
  const r = C.bolish([bok(), bok(), bok(), bok(), bok()], 0, S);
  a.deepEqual(r.upakovkalar.map((u) => u.nomer), ['2/1', '2/2']);
});
t.test('bloklar bo\'lsa - aynan ular upakovka, nomer saqlanadi, tashqaridagi detal mos blokka', () => {
  const B = (d, blok) => ({ ...d, blok });
  const r = C.bolish([
    B(D('Бок', 2084, 530, 16, 'ЛДСП', { tik: true }), '4/2'), B(D('Фасад', 1950, 600), '4/1'),
    B(D('Полка', 768, 423), '4/3'), B(D('Дно', 1968, 530, 16, 'ЛДСП', { tik: false }), '4/3'),
    B(D('Хдф', 1996, 606, 3, 'ЛХДФ'), '4/4'), D('ручка лдсп', 800, 120)
  ], 0, S);
  a.deepEqual(r.upakovkalar.map((u) => [u.nomer, u.detallar.length]), [['4/1', 1], ['4/2', 1], ['4/3', 3], ['4/4', 1]]);
});
t.test('bloklar: mos blok topilmasa yangi upakovka, hammasi qayta raqamlanadi', () => {
  const r = C.bolish([{ ...D('Фасад', 1950, 600), blok: '1/1' }, D('Хдф', 1996, 606, 3, 'ЛХДФ')], 0, S);
  a.deepEqual(r.upakovkalar.map((u) => u.nomer), ['2/1', '2/2']);
  a.ok(r.ogohlar.some((o) => /raqam/.test(o)));
});
t.test('furnitura og\'irligi mayda detallar upakovkasiga qo\'shiladi', () => {
  const r = C.bolish([D('Полка', 768, 423)], 60, S);
  a.equal(r.upakovkalar.length, 1);
  a.equal(r.upakovkalar[0].kg, Math.round((3.38 + 3) * 10) / 10);
  a.ok(r.upakovkalar[0].detallar.some((d) => /Furnitura \(60 dona\)/.test(d.nomi)));
});
t.test('avtomatik: kichik fasad detallar bitta qutiga (asos kattalashadi)', () => {
  const r = C.bolish([D('Фасад низ', 787, 493), D('Зеркало', 800, 270, 4, 'Зеркала'), D('планка фасадный', 834, 110)], 0, S);
  a.equal(r.upakovkalar.length, 1);
  a.equal(r.upakovkalar[0].L, 834 + 40);
  qatlamInvariant(r.upakovkalar[0], 20);
});
t.test("avtomatik: 5 kg dan yengil guruh (yashik ХДФ) mayda detallar qutisiga qo'shiladi", () => {
  const r = C.bolish([D('Полка', 768, 423), D('Полка', 768, 423), D('ХДФ Ящика', 367, 332, 3, 'ЛХДФ')], 0, S);
  a.equal(r.upakovkalar.length, 1);
  a.equal(r.upakovkalar[0].guruh, 'mayda');
});
t.test("furnitura eng yengil mayda qutiga, chegaradan oshirmaydi", () => {
  const og = () => D('Полка', 1200, 600, 25);   // ~11.7 kg
  const r = C.bolish([og(), og(), og(), og(), og(), D('Планка', 800, 100)], 100, S);   // furnitura 5 kg
  a.ok(r.upakovkalar.every((u) => u.kg <= 50), r.upakovkalar.map((u) => u.kg).join(','));
});
t.test("furnitura hech qaysi qutiga sig'masa - alohida furnitura qutisi", () => {
  const og = () => D('Полка', 1200, 600, 25);   // ~11.7 kg, 4 tasi 46.8 kg
  const r = C.bolish([og(), og(), og(), og()], 200, S);   // furnitura 10 kg
  a.equal(r.upakovkalar.length, 2);
  a.deepEqual(r.upakovkalar.map((u) => u.turi), ['korpus', 'furnitura']);
  a.ok(r.upakovkalar.every((u) => u.kg <= 50));
});
t.test('faqatFurnitura', () => {
  const r = C.bolish([], 10, S);
  a.deepEqual(r.upakovkalar.map((u) => [u.nomer, u.turi, u.H]), [['1/1', 'furnitura', 100]]);
});
t.test("bo'sh", () => { a.equal(C.bolish([], 0, S).upakovkalar.length, 0); });
t.test('detal L >= W ga normallashadi', () => {
  const r = C.bolish([D('Полка', 423, 768)], 0, S);
  a.deepEqual([r.upakovkalar[0].detallar[0].L, r.upakovkalar[0].detallar[0].W], [768, 423]);
});
t.test("og'ir bitta detal", () => {
  const r = C.bolish([D('Столешница', 3000, 600, 50), D('Полка', 768, 423)], 0, S);
  a.equal(r.ogohlar.length, 1);
  a.match(r.ogohlar[0], /Столешница/);
});
t.test('yukFayl: versiya 2, model va turkum', () => {
  const r = C.bolish([D('Полка', 768, 423)], 0, S);
  const y = C.yukFayl('Shkaf', '2026-11-09', r.upakovkalar, { turkum: 'Shkaf', model: { L: 1, W: 1, H: 1, panellar: [] } });
  a.equal(y.format, 'mebel-yuk'); a.equal(y.versiya, 2); a.equal(y.jamiKg, 3.4);
  a.equal(y.buyurtma, 'Shkaf'); a.equal(y.turkum, 'Shkaf'); a.ok(y.model);
});
t.test('turkumAniqla: model yo\'lidan', () => {
  a.equal(C.turkumAniqla('C:\\...\\Стандарт\\SH Шкаф\\01 Шкаф Дилафруз\\x.b3d'), 'Shkaf');
  a.equal(C.turkumAniqla('C:\\...\\Стандарт\\PR Прихожка\\02 Пр Макс\\x.b3d'), 'Prixojka');
  a.equal(C.turkumAniqla('C:\\...\\Спалныйлар\\SP9999\\01 Шкаф Бурбон.b3d'), 'Spalniy');
  a.equal(C.turkumAniqla('C:\\...\\KR Кроватлар\\Кроват 03\\x.b3d'), 'Krovat');
  a.equal(C.turkumAniqla('C:\\boshqa\\Комп стол.b3d'), 'Boshqa');
});
t.test("kasrli o'lcham (868.2 vs 868) bir qutiga tushadi", () => {
  const r = C.bolish([D('Дно', 868, 550), D('Планка', 868.4, 100), D('Фронтальная', 868.2, 60)], 0, S);
  a.equal(r.upakovkalar.length, 1);
});
t.test('qisqart: Bazis alert uchun uzun matn kesiladi', () => {
  const s = C.qisqart('a\n'.repeat(5000), 3000);
  a.ok(s.length <= 3000 + 40);
  a.match(s, /qisqartirildi/);
  a.equal(C.qisqart('salom', 3000), 'salom');
});

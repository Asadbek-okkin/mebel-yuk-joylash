# Mebel yuk joylash — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bazis skripti mebelni `N/i` upakovkalarga bo'lib `.yuk` faylga yozadi; veb-sahifa bir nechta `.yuk` ni mashina kuzoviga 3D joylab, sig'ishi va og'irligini ko'rsatadi.

**Architecture:** Ikki qism faqat `.yuk` JSON formati orqali bog'lanadi. Har ikkala qismning mantig'i (bo'lish, joylash) DOM'siz/Bazis'siz sof JS funksiyalarda — Node testlari bilan; Bazis va brauzer qatlamlari ularni chaqiradi. Bazis `require` bilmaydi, shuning uchun `build.js` core + Bazis qismini bitta `Upakovka.js` ga yig'adi.

**Tech Stack:** Bazis Mebelshchik JS (2026.7), Node 24 (`node:test`), vanilla ES modullar, three.js `0.160.0` (jsDelivr, import map) + OrbitControls, Playwright (npx), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-09-mebel-yuk-joylash-design.md`

## Global Constraints

- Interfeys va xabarlar tili — o'zbek (lotin); Bazis detal/material nomlari asl holicha.
- O'lchamlar mm, og'irlik kg (1 kasr), tonna `kg/1000` (2 kasr).
- `maxKg` default **40**, `zaxiraMm` default **20**, model–upakovka masofasi **500 mm**, qutilar orasi **300 mm**.
- Zichlik (kg/m³): `ХДФ|ДВП|HDF` 850, `МДФ|MDF` 750, `Зеркал|Стекл|Ойна` 2500, qolgani 650.
- Fasad: nom `Фасад|Дверь|Двер|Лицев|Fasad|Eshik` yoki material `МДФ|MDF` (regex, `i`).
- Furnitura: `soni × 0.05 kg`, quti 400×300×H, H = soni ≤ 50 → 100, ≤ 150 → 200, aks holda 300.
- Asl Bazis model o'zgarmaydi; skript faqat `UPAKOVKA` blokini qo'shadi/almashtiradi.
- Bazis COM'ga yoziladigan satr 8000 belgilik bo'laklarda (`writeUtf8`).
- Bazis `.js` fayllari faqat Write/Edit tool bilan tahrirlanadi (bash heredoc/python emas).
- Bazis bilan har qanday GUI ishi oldidan `C:\Users\admin\bazis_gui.lock` yoziladi; faqat model NUSXASIDA sinov.
- Mashinalar (U×E×B mm, kg): Labo 1900×1400×1400/500, Gazel 3000×2000×1800/1500, Isuzu NQR 5000×2100×2200/4500, Fura 13600×2450×2700/20000.
- Joylash: qutilar faqat yotqizilgan, faqat 90° gorizontal burilish; tayanch ≥ 70 %; fasad ustiga fasad bo'lmagan quti qo'yilmaydi.
- three.js aniq versiya `0.160.0`; boshqa tashqi bog'liqlik yo'q.
- Har tugagan task — alohida commit (oxiri `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).

## Review Focus

1. **`.yuk` fayl BOM bilan keladi** (ADODB.Stream UTF-8 BOM yozadi) — sahifa BOM'ni olib tashlab o'qishi kerak → Task 5 test `bomliFayl`.
2. **Quti hech qanday burilishda kuzovga sig'maydi** (2100 mm yon devor Labo'da) — xatosiz "sig'madi" ro'yxatiga tushadi, qolganlar joylanadi → Task 4 test `kuzovdanKattaQuti`.
3. **Bitta `.yuk` ikki marta qo'shiladi** — ikkinchi buyurtma bo'lib qo'shilmaydi, mavjudining ×N i 1 ga oshadi → Task 5 test `takrorFayl`.
4. **Bo'sh model yoki faqat furnitura** — skript tushunarli xabar beradi, bo'sh `.yuk` yozmaydi; faqat furnitura bo'lsa 1 ta furnitura qutisi → Task 2 test `faqatFurnitura`, Task 3 qo'lda tekshiruv.
5. **`localStorage` yo'q (Telegram ichki brauzeri / private)** — o'z mashinam sessiya davomida ishlaydi, sahifa yiqilmaydi → Task 5 test `xotirasizMashina`.

---

## Fayl tuzilmasi

```
mebel-yuk-joylash/
  package.json                 "type": "module", scripts: test, build
  bazis/
    upakovka-core.js           sof: zichlik, fasadmi, bolish, yukFayl  (CommonJS-siz, oxirida shartli export)
    upakovka-bazis.js          Bazis: Prop UI, collect, chizish, fayl yozish, alert
    build.js                   core + bazis -> dist/Upakovka/Upakovka.js (+ Font.json, QOLLANMA.txt)
    QOLLANMA.txt
    test/core.test.cjs
  web/
    index.html  style.css
    joylash.js                 sof: joyla, nechtaSigadi, tavsiya
    yukfayl.js                 sof: oqiYuk, qutilarniYoy, buyurtmaQosh
    mashinalar.js              STANDART ro'yxat + saqlash/yuklash (localStorage try/catch)
    namuna.js                  ichki namuna buyurtma (.yuk obyekt)
    sahna.js                   three.js chizish, tanlash, bosqichma-bosqich
    app.js                     DOM, hodisalar, natija paneli
    test/joylash.test.js  test/yukfayl.test.js  test/mashinalar.test.js
  tests/e2e.mjs                Playwright: iPhone + desktop
  tarqatish/ORNATISH.bat  tarqatish/ornatish.ps1  tarqatish/zip.ps1
```

---

### Task 1: Repo skeleti + core: zichlik va fasad

**Files:**
- Create: `package.json`, `.gitignore` (`dist/`, `node_modules/`, `*.png` in `tests/`), `bazis/upakovka-core.js`, `bazis/test/core.test.cjs`

**Interfaces:**
- Produces:
  - `DEFAULT = { maxKg: 40, zaxiraMm: 20, furnituraKg: 0.05, zichlik: [[RegExpSource, kgM3], ...], zichlikDefault: 650, fasadRegex, fasadMaterialRegex }`
  - `sozlama(user?: object) -> S` — DEFAULT ustiga user maydonlari (regexlar satr sifatida).
  - `zichlik(material: string, S) -> number` (kg/m³, birinchi mos regex).
  - `detalKg(d: {L,W,T,material}, S) -> number` = `L·W·T/1e9 · zichlik`, 1 kasrga emas — to'liq (yaxlitlash faqat chiqishda).
  - `fasadmi(d: {nomi, material}, S) -> boolean`.
  - Fayl oxirida: `if (typeof module !== 'undefined') module.exports = { DEFAULT, sozlama, zichlik, detalKg, fasadmi, bolish, yukFayl };` (bolish/yukFayl Task 2 da).

- [ ] **Step 1: `package.json`** — `{"name":"mebel-yuk-joylash","private":true,"scripts":{"test":"node --test bazis/test/ web/test/","build":"node bazis/build.js"}}`. `type` maydoni YO'Q (core `.cjs` testdan `require` qilinadi; web testlari `.js` lekin `web/package.json` `{"type":"module"}` bilan ESM).
- [ ] **Step 2: Failing test** `bazis/test/core.test.cjs`:

```js
const t = require('node:test'), a = require('node:assert');
const C = require('../upakovka-core.js'); const S = C.sozlama();
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
```
- [ ] **Step 3:** `npm test` → FAIL (`Cannot find module`).
- [ ] **Step 4:** `bazis/upakovka-core.js` ni yozish. ES5-ga yaqin sintaksis (`const/let`, `function`, arrow mumkin — Bazis Kroy shuni ishlatadi), `class`/modul import yo'q. Regex `new RegExp(src, 'i')`.
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** `git init` allaqachon bor; commit `feat(core): zichlik, og'irlik, fasad aniqlash`.

---

### Task 2: Core: upakovkalarga bo'lish va `.yuk` obyekt

**Files:**
- Modify: `bazis/upakovka-core.js`
- Test: `bazis/test/core.test.cjs`

**Interfaces:**
- Consumes: Task 1 `detalKg`, `fasadmi`, `sozlama`.
- Produces:
  - `bolish(detallar: Array<{nomi,L,W,T,material}>, furnituraSoni: number, S) -> { upakovkalar: Upak[], ogohlar: string[] }`
  - `Upak = { nomer: 'N/i', turi: 'korpus'|'fasad'|'furnitura', L, W, H, kg, detallar: Array<{nomi,L,W,T,material,kg}> }` — L,W,H butun mm, kg 1 kasr; detal L ≥ W ga normallashtirilgan.
  - `yukFayl(buyurtma: string, sana: 'YYYY-MM-DD', upakovkalar: Upak[]) -> { format:'mebel-yuk', versiya:1, buyurtma, sana, jamiKg, upakovkalar }`.

Algoritm (`bolish`) — guruh bo'yicha (korpus, keyin fasad):
1. Detallar maydoni kamayishi bo'yicha saralanadi.
2. Har detal uchun: shu guruhdagi mavjud qutilardan birinchisi, agar `q.kg + d.kg ≤ maxKg` va detal asosga sig'sa (`d.L ≤ q.asosL && d.W ≤ q.asosW`) — o'shanga; aks holda yangi quti, `asos = d.L × d.W`.
3. `d.kg > maxKg` — o'z qutisi + ogoh `"<nomi> <L>x<W> bitta o'zi <kg> kg (> maxKg)"`.
4. Quti: `L = asosL + 2z`, `W = asosW + 2z`, `H = ΣT + 2z`.
5. `furnituraSoni > 0` → oxirida furnitura qutisi (Global Constraints o'lchamlari), `detallar: []`.
6. Jami N ma'lum bo'lgach `nomer = N + '/' + i` (1 dan).

- [ ] **Step 1: Failing testlar:**

```js
const D = (nomi, L, W, T = 16, material = 'ЛДСП') => ({ nomi, L, W, T, material });
t.test('40 kg chegarasi va nomlash', () => {
  // har biri 12.48 kg -> 3 tasi 37.4 kg bitta qutida, 4-chisi yangi qutida
  const r = C.bolish([D('Бок',2000,600),D('Бок',2000,600),D('Бок',2000,600),D('Бок',2000,600)], 0, S);
  a.deepEqual(r.upakovkalar.map(u => u.nomer), ['2/1', '2/2']);
  a.equal(r.upakovkalar[0].detallar.length, 3);
  a.deepEqual([r.upakovkalar[0].L, r.upakovkalar[0].W, r.upakovkalar[0].H], [2040, 640, 88]);
  a.equal(r.upakovkalar[0].kg, 37.4);
});
t.test('fasad alohida, mayda detal katta qutiga', () => {
  const r = C.bolish([D('Полка',800,500), D('Фасад',700,400), D('Бок',2000,600)], 0, S);
  a.deepEqual(r.upakovkalar.map(u => [u.nomer, u.turi, u.detallar.length]), [['2/1','korpus',2], ['2/2','fasad',1]]);
});
t.test('furnitura qutisi oxirida', () => {
  const r = C.bolish([D('Бок',2000,600)], 60, S);
  const f = r.upakovkalar[1];
  a.deepEqual([f.nomer, f.turi, f.L, f.W, f.H, f.kg], ['2/2','furnitura',400,300,200,3]);
});
t.test('faqatFurnitura', () => {
  const r = C.bolish([], 10, S);
  a.deepEqual(r.upakovkalar.map(u => u.nomer), ['1/1']);
});
t.test('bo\'sh', () => { a.equal(C.bolish([], 0, S).upakovkalar.length, 0); });
t.test('og\'ir bitta detal', () => {
  const r = C.bolish([D('Столешница',3000,600,38,'ЛДСП')], 0, S);  // 44.5 kg
  a.equal(r.upakovkalar.length, 1); a.equal(r.ogohlar.length, 1);
});
t.test('yukFayl', () => {
  const r = C.bolish([D('Бок',2000,600)], 0, S);
  const y = C.yukFayl('Shkaf', '2026-11-09', r.upakovkalar);
  a.equal(y.format, 'mebel-yuk'); a.equal(y.versiya, 1); a.equal(y.jamiKg, 12.5);
});
```
- [ ] **Step 2:** `npm test` → FAIL (`C.bolish is not a function`).
- [ ] **Step 3:** `bolish`, `yukFayl` ni yozish (yuqoridagi algoritm).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(core): upakovkalarga bo'lish va .yuk formati`.

---

### Task 3: Bazis skripti `Upakovka.js` + build + o'rnatish

**Files:**
- Create: `bazis/upakovka-bazis.js`, `bazis/build.js`, `bazis/QOLLANMA.txt`
- Output: `dist/Upakovka/Upakovka.js`, `dist/Upakovka/Font.json`, `dist/Upakovka/QOLLANMA.txt`

**Interfaces:**
- Consumes: core `sozlama, detalKg, fasadmi, bolish, yukFayl`.
- Produces: Bazis'dagi `Scripts\Upakovka\Upakovka.js`; sahnada blok `UPAKOVKA`, ichida bloklar `N/i`; model yonida `<model>.yuk`.

`upakovka-bazis.js` (Kroy uslubida, `1 Kroy.js` dan nusxalanadigan yordamchilar: `com, appdata, readUtf8, writeUtf8, fileExists, ensureDir, typeOf, firstLine, addBox, font, textLines, textWidth, rectLines, kontur`):
- Prop UI: tugma `UPAKOVKA QILISH`; `Maks. og'irlik (kg)` = 40; `Karton zaxirasi (mm)` = 20; `Modeldan masofa (mm)` = 500; `FileOptions = 'Upakovka.prop'`. `zichlik`/regex/`furnituraKg` — `sozlamalar.json` (skript papkasida, ixtiyoriy, `sozlama()` ga beriladi).
- `isUpak(o)` — owner zanjirida `^(UPAKOVKA|KROY)\b` nomi.
- `collect()` → `{ detallar, furnituraSoni, box, skip }`: `Model.forEachPanel` — o'tkazib: `isUpak`, `Visible===false`, `UseInEstimate===false`, `MaterialWidth>0` (pogonaj, `skip.pogonaj++`), o'lchamsiz. Detal: `nomi=firstLine(p.Name)`, `L/W = max/min(ContourWidth, ContourHeight)`, `T=p.Thickness`, `material=firstLine(p.MaterialName)`. Furnitura: Smeta'dagi stack aylanishi (`TFastener|TFurnAsm|TAsmKit`, ko'rinadigan, `isUpak` emas) — soni.
- `eskisiniOchir()` — `Model.Objects` dan `^UPAKOVKA` nomlilarni `DeleteObject`.
- `chiz(upakovkalar, box, P)`: `BeginBlock('UPAKOVKA')`; `x = box.x1 + masofa`, `Y0 = box.y0`, `Z0 = box.z0`; har quti uchun `BeginBlock(u.nomer)`: detallar yotqizilgan holda ustma-ust `AddHorizPanel(x+z, Z0+z, x+z+d.L, Z0+z+d.W, y)` + `Thickness=d.T; Build()`, `y += d.T` (`y` boshlanishi `Y0+z`), `Name = d.nomi`, `MaterialName`, `UseInCutting/UseInEstimate=false`; karton — `kontur` old (z=Z0) va orqa (z=Z0+u.W) tekislikda `rectLines(0,0,u.L,u.H)`, rang 33023 (jigarrang); yorliq — `kontur` qora, ikki qator `"<nomer>  <kg> kg"` va `"<L>x<W>x<H>"`, h = `min(120, (u.L-40)/textWidth(str,1))`, quti ustida (y = Y0+u.H+40); `EndBlock()`; `x += u.L + 300`. Furnitura qutisi: panel yo'q, faqat karton + yorliq. Tashqi `EndBlock()` `finally` da.
  - Agar ichma-ich `BeginBlock` Bazis'da ishlamasa (Task 9 da aniqlanadi) — tashqi blok olib tashlanadi, bloklar nomi `UPAKOVKA N/i` bo'ladi (bitta konstanta `ICHMA_ICH`).
- Fayl: `ModelFilename` bor → shu papka + nom `.yuk`; yo'q → `MyDocuments\Upakovka\<Article.Name||'buyurtma'>.yuk` (`ensureDir`). `buyurtma = Article.Name || fayl nomi`. `writeUtf8(path, JSON.stringify(yuk, null, 1))`.
- Bo'sh: `detallar=0 && furnituraSoni=0` → `alert('Modelda detal topilmadi - upakovka qilinmadi.')`, fayl yozilmaydi, eski `UPAKOVKA` o'chiriladi.
- Yakuniy `alert`: `"<N> ta upakovka, jami <kg> kg (<t> t)\n- 4/1 korpus 2040x640x88  37.4 kg\n...\nFayl: <path>"` + ogohlar + `skip.pogonaj` bo'lsa `"<n> ta pogonaj detal (plintus/profil) hisobga olinmadi"`.

`build.js`: `core` matnidan `if (typeof module ...` qatorini olib tashlaydi, `bazis` matni oldiga qo'yadi, `dist/Upakovka/Upakovka.js` ga yozadi (UTF-8, BOM'siz — Kroy fayllari bilan bir xil kodlashni `file` bilan tekshirib moslash); `Font.json` ni `Scripts\Kroy va Smeta\Font.json` dan, `QOLLANMA.txt` ni ko'chiradi; `--ornat` bayrog'i bilan `dist/Upakovka/*` ni `C:\YandexDisk\Базис каталог\4 Документы\Scripts\Upakovka\` ga ko'chiradi.

- [ ] **Step 1:** `upakovka-bazis.js` va `build.js` ni yozish (Write tool).
- [ ] **Step 2:** `npm run build && node --check dist/Upakovka/Upakovka.js` → `SYNTAX OK` (xato chiqmaydi).
- [ ] **Step 3: Node mock tutun-testi** `bazis/test/mock-bazis.cjs`: global `Model` (2 panel: `Бок` 2000×600×16 ЛДСП, `Фасад` 700×400×16), `Action/Prop` stub (Kroy mock uslubi), `AddHorizPanel/BeginBlock/EndBlock/AddContour/NewVector/DeleteObject/alert` yozib boruvchi stub, `NewCOMObject` → `ADODB.Stream` faylni `fs` ga yozadigan stub. `Btn.OnClick()` chaqiriladi. Tekshiruv: `alert` matni `2 ta upakovka` ni o'z ichiga oladi; yozilgan fayl JSON.parse bo'ladi va `upakovkalar[1].turi === 'fasad'`; `BeginBlock` chaqiruvlari `['UPAKOVKA','2/1','2/2']`.
  Run: `node bazis/test/mock-bazis.cjs` → `MOCK OK`.
- [ ] **Step 4:** `npm run build -- --ornat` → `Scripts\Upakovka\` da 3 fayl.
- [ ] **Step 5:** Commit `feat(bazis): Upakovka skripti, build va mock test`.

---

### Task 4: Joylash algoritmi `web/joylash.js`

**Files:**
- Create: `web/package.json` (`{"type":"module"}`), `web/joylash.js`, `web/test/joylash.test.js`

**Interfaces:**
- Produces:
  - `Quti = { id: string, nomer: string, buyurtma: number, turi, L, W, H, kg }`
  - `Kuzov = { nomi, L, W, H, maxKg }` (L — uzunlik, kabinadan orqaga; W — eni; H — balandlik)
  - `joyla(qutilar: Quti[], kuzov: Kuzov) -> { joylandi: Array<{ q: Quti, x, y, z, l, w, h }>, sigmadi: Array<{ q: Quti, sabab: 'olcham'|'ogirlik'|'joy' }>, jamiKg, hajmFoiz }` — `joylandi` yuklash tartibida.
  - `nechtaSigadi(buyurtmalar: Array<{ yuk, soni }>, idx: number, kuzov) -> number`
  - `tavsiya(qutilar: Quti[], mashinalar: Kuzov[]) -> { mashina: Kuzov, soni: number } | null`

Algoritm (`joyla`), aniqlanmagan qismi shu:
- Tartib: `turi !== 'fasad'` oldin, ichida `kg` kamayishi, teng bo'lsa `L·W` kamayishi; keyin fasadlar xuddi shunday.
- Avval: ikkala yo'nalishda ham (L×W, W×L) `l ≤ K.L && w ≤ K.W && h ≤ K.H` bo'lmasa → `sigmadi 'olcham'`. `jamiKg + kg > K.maxKg` → `'ogirlik'`.
- Nuqtalar `P = [{0,0,0}]`. Har nuqta × har yo'nalish uchun nomzod; to'g'ri nomzod: kuzov ichida; hech bir joylangan bilan hajmiy kesishmaydi (chegaraga tegish mumkin); `z === 0` yoki tayanch maydoni (`top === z` ±1 mm bo'lgan qutilar bilan XY kesishma yig'indisi) ≥ `0.7·l·w`; agar quti fasad emas — tayanch qutilardan hech biri fasad emas. Eng yaxshisi: eng kichik `z`, keyin `x`, keyin `y`.
- Joylangach P ga qo'shiladi: `(x+l, y, z)`, `(x, y+w, z)`, `(x, y, z+h)`; boshqa qutining ichida qolgan nuqtalar olib tashlanadi.
- Nomzod topilmasa → `'joy'`.
- `hajmFoiz = round(100 · Σ(l·w·h) / (K.L·K.W·K.H))`.
- `nechtaSigadi`: yuqori chegara `n_max` = og'irlik va hajm bo'yicha (boshqa buyurtmalar hisobga olingan holda); 0..n_max oralig'ida ikkilik qidiruv: `joyla(...).sigmadi.length === 0` bo'lgan eng katta `n`.
- `tavsiya`: hammasi sig'adigan eng kichik (hajm bo'yicha) mashina → `{mashina, soni:1}`; hech biri bo'lmasa — eng katta mashina uchun `k = ceil(max(Σkg/maxKg, Σhajm/(0.75·hajm)))`, so'ng qutilarni `k` ta mashinaga ketma-ket `joyla` bilan tekshirib, kerak bo'lsa `k++` (ko'pi bilan 50).

- [ ] **Step 1: Failing testlar** — `invariant(r, K)` yordamchisi: kesishma yo'q, kuzov ichida, tayanch ≥ 70 %, fasad ustida fasad emas yo'q, `jamiKg ≤ maxKg`.

```js
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { joyla, nechtaSigadi, tavsiya } from '../joylash.js';
const Q = (id, L, W, H, kg, turi = 'korpus', buyurtma = 0) => ({ id, nomer: id, buyurtma, turi, L, W, H, kg });
const K = { nomi: 'T', L: 1000, W: 1000, H: 1000, maxKg: 1000 };
test('8 kub to\'liq', () => { const r = joyla(Array.from({length: 9}, (_, i) => Q('q'+i, 500,500,500,10)), K);
  assert.equal(r.joylandi.length, 8); assert.equal(r.sigmadi[0].sabab, 'joy'); assert.equal(r.hajmFoiz, 100); invariant(r, K); });
test('og\'irlik limiti', () => { const r = joyla([Q('a',100,100,100,400),Q('b',100,100,100,400),Q('c',100,100,100,400)], K);
  assert.equal(r.joylandi.length, 2); assert.equal(r.sigmadi[0].sabab, 'ogirlik'); });
test('kuzovdanKattaQuti', () => { const r = joyla([Q('uzun',2100,640,90,30), Q('ok',500,500,100,10)], { ...K, L: 1900, W: 1400 });
  assert.equal(r.sigmadi[0].q.id, 'uzun'); assert.equal(r.sigmadi[0].sabab, 'olcham'); assert.equal(r.joylandi.length, 1); });
test('fasad yuqorida', () => { const r = joyla([Q('f',1000,500,100,5,'fasad'), Q('k',1000,500,100,30)], { ...K, W: 500 });
  assert.equal(r.joylandi.find(p => p.q.id === 'k').z, 0); assert.equal(r.joylandi.find(p => p.q.id === 'f').z, 100); });
test('burish', () => { const r = joyla([Q('b',900,400,100,10)], { ...K, L: 500, W: 1000 }); assert.equal(r.joylandi.length, 1); assert.equal(r.joylandi[0].l, 400); });
test('osilib turmaydi', () => { const r = joyla([Q('a',500,500,500,50), Q('keng',1000,1000,100,10)], K);
  assert.equal(r.sigmadi[0].q.id, 'keng'); invariant(r, K); });
test('tasodifiy 200 quti invariantlari', () => { /* seed=1 LCG, L 300..2100, W 300..700, H 40..250, kg 5..40, 20% fasad; Fura */ invariant(joyla(qs, FURA), FURA); });
test('nechtaSigadi', () => { const yuk = { upakovkalar: [{ nomer:'1/1', turi:'korpus', L:500, W:500, H:500, kg:10 }] };
  assert.equal(nechtaSigadi([{ yuk, soni: 1 }], 0, K), 8); });
test('tavsiya', () => { const M = [{ nomi:'Kichik', L:1000,W:1000,H:1000,maxKg:1000 }, { nomi:'Katta', L:2000,W:1000,H:1000,maxKg:2000 }];
  const qs = Array.from({length: 12}, (_, i) => Q('q'+i,500,500,500,10));
  assert.deepEqual(((t) => [t.mashina.nomi, t.soni])(tavsiya(qs, M)), ['Katta', 1]);
  const ko = Array.from({length: 20}, (_, i) => Q('q'+i,500,500,500,10));
  assert.deepEqual(((t) => [t.mashina.nomi, t.soni])(tavsiya(ko, M)), ['Katta', 2]); });
test('200 quti Fura < 1.5 s', () => { const t0 = Date.now(); joyla(qs200, FURA); assert.ok(Date.now() - t0 < 1500); });
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** `web/joylash.js` ni yozish.
- [ ] **Step 4:** `npm test` → PASS (shu jumladan tezlik testi).
- [ ] **Step 5:** Commit `feat(web): 3D joylash algoritmi`.

---

### Task 5: `.yuk` o'qish, buyurtmalar, mashinalar, namuna

**Files:**
- Create: `web/yukfayl.js`, `web/mashinalar.js`, `web/namuna.js`, `web/test/yukfayl.test.js`, `web/test/mashinalar.test.js`

**Interfaces:**
- Consumes: Task 4 `Quti`, `Kuzov` shakllari.
- Produces:
  - `oqiYuk(matn: string) -> yuk` — BOM olib tashlanadi; `format !== 'mebel-yuk'` yoki `versiya !== 1` yoki `upakovkalar` massiv emas → `Error('Bu fayl upakovka fayli emas (.yuk)')`.
  - `buyurtmaQosh(royxat: Array<{yuk, soni, rang}>, yuk) -> royxat` — bir xil `buyurtma`+`sana`+`jamiKg` bo'lsa `soni++`, aks holda yangi element, `rang = RANGLAR[royxat.length % 8]`.
  - `RANGLAR` — 8 ta aniq ajraladigan rang (hex).
  - `qutilarniYoy(royxat) -> Quti[]` — har nusxa uchun `id = bi + '-' + nusxa + '-' + nomer`, `nomer` soni > 1 bo'lsa `'#' + nusxa + ' ' + nomer`, `buyurtma = bi`.
  - `STANDART: Kuzov[]` (Global Constraints dagi 4 ta), `ozMashinalar(): Kuzov[]`, `ozMashinaSaqla(list: Kuzov[]): boolean` — `localStorage['yuk-mashinalar']`, xatoda `false` va xotiradagi o'zgaruvchida saqlaydi; `hammaMashinalar() = STANDART + oz`.
  - `NAMUNA` — `.yuk` obyekt: 1 shkaf, 5 upakovka (3 korpus, 1 fasad, 1 furnitura), jami ~170 kg.

- [ ] **Step 1: Failing testlar:** `oqiYuk` to'g'ri fayl; `bomliFayl` (`'\uFEFF' + JSON`) o'qiladi; noto'g'ri JSON va `format:'boshqa'` → aynan shu xato matni; `takrorFayl` — bir yuk ikki marta → `royxat.length === 1 && soni === 2`; `qutilarniYoy` soni 2 → qutilar soni ×2, id'lar noyob; `xotirasizMashina` — `globalThis.localStorage` getter throw qiladi → `ozMashinaSaqla` `false`, keyin `ozMashinalar()` saqlangan ro'yxatni qaytaradi; `STANDART` 4 ta, Labo `{L:1900,W:1400,H:1400,maxKg:500}`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Uchta modulni yozish.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(web): .yuk o'qish, buyurtmalar, mashinalar, namuna`.

---

### Task 6: Sahifa: maket, 3D, natija paneli

**Files:**
- Create: `web/index.html`, `web/style.css`, `web/sahna.js`, `web/app.js`

**Interfaces:**
- Consumes: Task 4 `joyla, nechtaSigadi, tavsiya`; Task 5 hammasi.
- Produces (`sahna.js`):
  - `sahnaYarat(el: HTMLElement) -> Sahna`
  - `Sahna.chiz(kuzov, natija, ranglar: string[])`, `Sahna.qadam(n: number|null)` (null — hammasi), `Sahna.onTanlash(cb: (joy) => void)`.

Talablar (spes 3.4–3.6):
- `index.html`: `<title>Yuk joylash</title>`, viewport meta, import map `three` → `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`, `three/addons/` → `.../three@0.160.0/examples/jsm/`.
- Bloklar: **Buyurtmalar** (`<input type=file multiple accept=".yuk,.json">`, "Namuna", ro'yxat: rang nuqtasi, nomi, `N quti · kg`, `×` soni input (1..99), o'chirish), **Mashina** (`<select>` + "+ O'z mashinam" forma: nomi, U, E, B mm, yuk kg; o'z mashinasini o'chirish), **3D** (canvas, "Bosqichma-bosqich" ◀ ▶ "Hammasi"), **Natija** (`Sig'di X / Y quti`, sig'maganlar ro'yxati sabab bilan: o'lcham — "mashinaga sig'maydigan o'lcham", og'irlik — "yuk limiti", joy — "joy qolmadi"; og'irlik `1.24 t / 1.5 t` + progress, hajm `%`, "Nechta sig'adi?" (tanlangan buyurtma — ro'yxatdagi radio), tavsiya matni).
- Har o'zgarishda `qayta()` — `joyla(qutilarniYoy(royxat), mashina)` → `sahna.chiz` + natija.
- 3D: Bazis o'qlariga emas, three o'qlariga: kuzov L → three X, W → Z, H → Y. Pol — kulrang tekislik; kuzov — `EdgesGeometry` chiziqlar + kabina tomonida qalinroq devor belgisi. Quti — `MeshLambertMaterial` buyurtma rangi + qora qirralar; fasad — 45° shtrixli `CanvasTexture`. `OrbitControls` (`enableDamping`). Tanlash — `Raycaster` → popup: nomer, buyurtma nomi, `kg`, `L×W×H`, detallar ro'yxati (nomi L×W×T).
- Maket: ≤ 768 px ustma-ust (3D balandligi 60vh), aks holda chapda 360 px panel, o'ngda 3D. 16 px gutter, gorizontal scroll yo'q. Rang tokenlari `:root`, `prefers-color-scheme: dark`.
- Xato (`oqiYuk` throw) — buyurtmalar ostida qizil xabar, boshqa fayllar qo'shilaveradi.

- [ ] **Step 1:** To'rtta faylni yozish.
- [ ] **Step 2:** `npx serve web -l 8765` (yoki `python -m http.server 8765 -d web`) va brauzerda konsol xatosiz ochilishini Task 7 e2e bilan tekshirish — bu task alohida test emas, Task 7 uni qoplaydi.
- [ ] **Step 3:** Commit `feat(web): sahifa, 3D ko'rinish, natija paneli`.

---

### Task 7: Playwright e2e (telefon + kompyuter)

**Files:**
- Create: `tests/e2e.mjs`, `tests/fixtures/shkaf.yuk` (Task 2 `yukFayl` bilan yaratilgan, BOM bilan), `tests/fixtures/xato.yuk` (`{"a":1}`)

**Interfaces:**
- Consumes: Task 6 sahifa; elementlar `data-test` atributlari: `fayl`, `namuna`, `mashina`, `sigdi`, `ogirlik`, `nechta`, `nechta-natija`, `tavsiya`, `xato`, `canvas`.

- [ ] **Step 1:** `tests/e2e.mjs` — statik server (node `http`) `web/` ni beradi; `devices['iPhone 13']` va `1366×800` uchun:
  - konsolda xato yo'q (`page.on('pageerror')` → fail);
  - "Namuna" → `sigdi` matni `5 / 5`, `ogirlik` `t` ni o'z ichiga oladi;
  - `mashina` = Labo, `fixtures/shkaf.yuk` yuklash → `sigdi` o'zgaradi, `tavsiya` bo'sh emas;
  - `xato.yuk` → `xato` ko'rinadi, oldingi buyurtmalar joyida;
  - `nechta` bosiladi → `nechta-natija` raqam;
  - canvas markaziga bosish → popup ko'rinadi (yoki `qadam` 1 → 1 ta quti);
  - `document.documentElement.scrollWidth <= innerWidth` (telefon);
  - skrinshotlar `tests/iphone.png`, `tests/desktop.png`.
  Run: `npx -y playwright@1.48.2 install chromium` (bir marta), so'ng `node tests/e2e.mjs` → `E2E OK`.
- [ ] **Step 2:** Ishga tushirish; xatolarni Task 6 fayllarida tuzatish, PASS gacha.
- [ ] **Step 3:** Skrinshotlarni Read bilan ko'zdan kechirish (telefonda o'qiladimi, 3D ko'rinadimi).
- [ ] **Step 4:** Commit `test(web): Playwright e2e telefon va kompyuter`.

---

### Task 8: GitHub repo va Pages

**Files:**
- Create: `README.md` (qisqa: nima, havola, `.yuk` formati spesga havola), `.github/workflows/pages.yml` (`web/` ni Pages'ga deploy: `actions/upload-pages-artifact@v3` path `web`, `actions/deploy-pages@v4`)

- [ ] **Step 1:** `gh repo create Asadbek-okkin/mebel-yuk-joylash --public --source . --push`.
- [ ] **Step 2:** `gh api -X POST repos/Asadbek-okkin/mebel-yuk-joylash/pages -f build_type=workflow`; workflow tugashini `gh run watch` bilan kutish.
- [ ] **Step 3:** `curl -sI https://asadbek-okkin.github.io/mebel-yuk-joylash/` → `200`; e2e ni shu URL'ga qarshi ham ishga tushirish (`E2E_URL` env) → `E2E OK`.
- [ ] **Step 4:** Commit `ci: GitHub Pages deploy`.

---

### Task 9: Bazis'da haqiqiy sinov

**Files:**
- Modify (kerak bo'lsa): `bazis/upakovka-bazis.js` (`ICHMA_ICH`, API farqlari)

- [ ] **Step 1:** `C:\Users\admin\bazis_gui.lock` yozish; model NUSXASINI tayyorlash (`01 Кроват 1 кишилк.b3d` → `C:\Users\admin\upakovka_sinov\`), Bazis'da ochish (mouse_event, SendKeys emas; har bosishdan oldin oyna rect qayta o'qiladi).
- [ ] **Step 2:** `Scripts\Upakovka\Upakovka.js` ni ishga tushirish → `UPAKOVKA QILISH`.
- [ ] **Step 3:** Tekshirish: alert matni (N, kg); sahnada `UPAKOVKA` va `N/i` bloklari (Объекты daraxti skrinshoti); `upakovka_sinov\*.yuk` mavjud va `oqiYuk` bilan o'qiladi (`node -e` orqali `web/yukfayl.js`); skriptni 2-marta ishga tushirish → bloklar takrorlanmaydi.
- [ ] **Step 4:** Ichma-ich blok ishlamasa — `ICHMA_ICH=false`, qayta build/ornat, qayta sinov.
- [ ] **Step 5:** `.yuk` faylni sahifaga yuklab (Playwright) skrinshot — haqiqiy mebel mashinada.
- [ ] **Step 6:** Lock faylni o'chirish; commit `fix(bazis): haqiqiy Bazis sinovidan tuzatishlar` (o'zgarish bo'lsa).

---

### Task 10: Boshqa skriptlar `UPAKOVKA` ni hisobga olmasin

**Files:**
- Modify: `Scripts\Kroy va Smeta\1 Kroy.js` (`isKroy` regex), `1 Nesting (CNC).js`, `3 Nesting DXF (Rover).js`, `2 Smeta (Excel).js`, `Scripts\Chizma nazorati\Chizma nazorati.js` — `^KROY\b` o'tkazib yuboruvchi joylar `^(KROY|UPAKOVKA)\b` ga.

- [ ] **Step 1:** Har faylda `KROY` regexlarini Grep bilan topish, faqat "o'tkazib yuborish" ma'nosidagilarini Edit bilan o'zgartirish (`eskiKroyniOchir` — YO'Q, u faqat KROY ni o'chiradi).
- [ ] **Step 2:** `node --check` har fayl → OK.
- [ ] **Step 3:** Task 9 modelida (UPAKOVKA bloki bor) Smeta va Chizma nazoratini ishga tushirish — upakovka detallari smetaga/hisobotga tushmaganini tekshirish (lock bilan).
- [ ] **Step 4:** O'z repolarida commit (`C:\Users\admin\bazis-kroy-smeta.git` worktree, `bazis-chizma-nazorati`): `fix: UPAKOVKA bloklarini o'tkazib yuborish`.

---

### Task 11: Tarqatish ZIP, qo'llanma, hisobot

**Files:**
- Create: `tarqatish/ORNATISH.bat`, `tarqatish/ornatish.ps1` (UTF-8 BOM; Kroy va Smeta `ornatish.ps1` dan moslab: `Settings.xml` `PathScript` → `Upakovka` papkasiga ko'chirish, FolderBrowser fallback, `-Jim`), `tarqatish/zip.ps1` → `Desktop\Upakovka (Bazis).zip` (OQING.txt + ORNATISH.bat + ornatish.ps1 + `dist/Upakovka/*`)
- Modify: `bazis/QOLLANMA.txt` — sahifa havolasi, `.yuk` ni Telegram orqali yuborish, sozlamalar.

- [ ] **Step 1:** Fayllarni yozish; `powershell -File tarqatish/zip.ps1` → ZIP yaratiladi.
- [ ] **Step 2:** ZIP ni vaqtinchalik papkaga ochib `ornatish.ps1 -Jim -Manzil <scratch>` → 3 fayl ko'chirilgan.
- [ ] **Step 3:** Commit `feat: tarqatish ZIP va qo'llanma`; `git push`.
- [ ] **Step 4:** Telegram (@claude_asadbek_bot) hisobot: sahifa havolasi, ZIP fayli, iPhone skrinshoti.

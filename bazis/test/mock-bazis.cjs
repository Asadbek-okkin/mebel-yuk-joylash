// Bazis muhitining soxta nusxasi: dist/Upakovka/Upakovka.js ni ishga tushirib natijani tekshiradi.
// Run: node bazis/test/mock-bazis.cjs   -> "MOCK OK"
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm'), assert = require('node:assert/strict');

const SCRIPT = path.join(__dirname, '..', '..', 'dist', 'Upakovka', 'Upakovka.js');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'upak-'));
const MODEL = path.join(TMP, 'Shkaf test.b3d');

const tag = (o, t) => { Object.defineProperty(o, Symbol.toStringTag, { value: t }); return o; };
const log = { blocks: [], panels: [], contours: 0, alerts: [], deleted: [] };

function panel(Name, w, h, t, MaterialName) {
  return tag({
    Name, MaterialName, ContourWidth: w, ContourHeight: h, Thickness: t, Visible: true, UseInEstimate: true, MaterialWidth: 0,
    Owner: null, GMin: { x: 0, y: 0, z: 0 }, GMax: { x: w, y: h, z: t }, ToGlobal: (v) => v
  }, 'TFurnPanel');
}
// "Панель" nomli fasad: fasadligi u turgan "Дверь" blokidan aniqlanishi kerak
const top = { Name: '01 Шкаф', Owner: { Name: 'Model' } };
const P = [panel('Бок', 2000, 600, 16, 'ЛДСП Кроношпан'), Object.assign(panel('Панель', 700, 400, 16, 'ЛДСП Кроношпан'), { Owner: { Name: 'Дверь 2 (простой)', Owner: top } })];
const oldUpak = tag({ Name: 'UPAKOVKA', Count: 0, Objects: [] }, 'TFurnBlock');
const objects = P.slice().concat([tag({ Name: 'Эксцентрик', Visible: true }, 'TFastener'), oldUpak]);
const Model = { Count: objects.length, Objects: objects, forEachPanel: (cb) => P.forEach(cb) };

function prop() {
  const g = () => ({ Value: 0 });
  const grp = { NewNumber: g, NewBool: g, NewString: g, NewButton: (n) => ({ name: n, OnClick: null }) };
  return Object.assign({ NewGroup: () => grp, Load() {}, Save() {} }, grp);
}
let btn = null;
const Prop = prop();
const nb = Prop.NewButton; Prop.NewButton = (n) => (btn = nb(n));

function stream() {
  let buf = '', file = '';
  return {
    Type: 0, Charset: '', Open() {}, Close() {},
    WriteText(s) { buf += s; }, SaveToFile(p) { fs.writeFileSync(p, '﻿' + buf, 'utf8'); },
    LoadFromFile(p) { file = fs.readFileSync(p, 'utf8'); }, ReadText() { return file; }
  };
}
const ctx = {
  Action: { Properties: Prop, OnFinish: null, Finish() {}, Continue() {} },
  Model, Article: { Name: 'Shkaf test' }, ModelFilename: MODEL,
  NewVector: (x, y, z) => ({ x, y, z }),
  BeginBlock: (n) => { log.blocks.push(n); return {}; }, EndBlock: () => ({}),
  AddHorizPanel: (x1, z1, x2, z2, y) => { const p = { args: [x1, z1, x2, z2, y], Build() {} }; log.panels.push(p); return p; },
  AddContour: () => { log.contours++; return { Contour: { AddLine() {} }, OrientGCS() {}, Build() {} }; },
  DeleteObject: (o) => log.deleted.push(o.Name),
  alert: (m) => log.alerts.push(String(m)),
  system: { readTextFile: (n) => { if (n === 'Font.json') return fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'Upakovka', 'Font.json'), 'utf8'); throw new Error('yo\'q'); } },
  NewCOMObject: (n) => {
    if (n === 'ADODB.Stream') return stream();
    if (n === 'Scripting.FileSystemObject') return { FileExists: (p) => fs.existsSync(p), FolderExists: (p) => fs.existsSync(p), CreateFolder: (p) => fs.mkdirSync(p, { recursive: true }) };
    if (n === 'WScript.Shell') return { ExpandEnvironmentStrings: () => TMP, SpecialFolders: () => TMP };
    throw new Error('COM ' + n);
  }
};
ctx.FileOptions = '';
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), ctx, { filename: SCRIPT });
assert.ok(btn && btn.OnClick, 'tugma yaratilmadi');
// Prop qiymatlari: maxKg 40, zaxira 20, masofa 500 (prop() 0 beradi -> skript default qo'llashi kerak)
btn.OnClick();

assert.equal(log.alerts.length, 1, 'alert: ' + log.alerts.join('|'));
assert.match(log.alerts[0], /2 ta upakovka/);        // fasad + uzun (furnitura og'irligi oxirgisiga)
assert.deepEqual(log.deleted, ['UPAKOVKA']);
assert.deepEqual(log.blocks, ['UPAKOVKA', '2/1', '2/2']);
assert.equal(log.panels.length, 2);
assert.ok(log.contours >= 6, 'karton/yorliq konturlari: ' + log.contours);
const yuk = JSON.parse(fs.readFileSync(path.join(TMP, 'Shkaf test.yuk'), 'utf8').replace(/^﻿/, ''));
assert.equal(yuk.buyurtma, 'Shkaf test');
assert.deepEqual(yuk.upakovkalar.map(u => u.turi), ['fasad', 'korpus']);
assert.equal(yuk.versiya, 2);
assert.equal(yuk.model.panellar.length, 2);
assert.equal(yuk.turkum, 'Shkaf');   // fayl nomi 'Shkaf test'
console.log('MOCK OK');

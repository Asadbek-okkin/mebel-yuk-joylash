// =====================================================================
//  UPAKOVKA - Bazis Mebelshchik skripti.
//  Modeldagi detallarni upakovkalarga bo'ladi (korpus / fasad / furnitura, har biri <= maks. kg),
//  model yoniga "UPAKOVKA" blokini chizadi (ichida 4/1, 4/2, ... bloklari) va
//  model yoniga <model nomi>.yuk faylini yozadi - uni "Yuk joylash" sahifasida ochasiz.
//  Asl model o'zgarmaydi. Qayta ishga tushirilsa eski UPAKOVKA bloki almashtiriladi.
// =====================================================================

FileOptions = 'Upakovka.prop';
Prop = Action.Properties;

Btn = Prop.NewButton('UPAKOVKA QILISH');
grUp = Prop.NewGroup('Upakovka');
tbMaxKg = grUp.NewNumber('Maks. og\'irlik (kg)');
tbMaxKg.Value = 40;
tbZaxira = grUp.NewNumber('Karton zaxirasi (mm)');
tbZaxira.Value = 20;
grSahna = Prop.NewGroup('Natija');
tbMasofa = grSahna.NewNumber('Modeldan masofa (mm)');
tbMasofa.Value = 500;

Action.Properties.Load(FileOptions);
Action.OnFinish = function () { Action.Properties.Save(FileOptions); };

Btn.OnClick = function () {
	try { upakovka(); } catch (e) { alert('Upakovka xatosi: ' + e + '\n\nSkriptni qayta ishga tushiring yoki dasturchiga ayting.'); }
	Action.Finish();
};

Action.Continue();

const UPAK_BLOK = 'UPAKOVKA';
const ICHMA_ICH = true;      // ichma-ich bloklar (UPAKOVKA -> 4/1). false bo'lsa: "UPAKOVKA 4/1" alohida bloklar
const QUTI_ORASI = 300;

// ---------- yordamchilar (Kroy va Smeta bilan bir xil) ----------
function com(n) { return NewCOMObject(n); }
function readUtf8(p) {
	const st = com('ADODB.Stream');
	st.Type = 2; st.Charset = 'utf-8'; st.Open();
	st.LoadFromFile(p);
	const t = st.ReadText(-1); st.Close();
	return String(t).replace(/^﻿/, '');
}
// Bazis COM ga ~16 ming belgidan uzun satr uzatilsa yiqiladi -> 8000 lik bo'laklar
function writeUtf8(p, text) {
	const st = com('ADODB.Stream');
	st.Type = 2; st.Charset = 'utf-8'; st.Open();
	text = String(text);
	for (let i = 0; i < text.length; i += 8000) st.WriteText(text.substring(i, i + 8000));
	st.SaveToFile(p, 2); st.Close();
}
function ensureDir(p) { const f = com('Scripting.FileSystemObject'); if (!f.FolderExists(p)) f.CreateFolder(p); }
function typeOf(o) { return Object.prototype.toString.call(o); }
function firstLine(s) { return String(s || '').split(/[\r\n]/)[0].trim(); }
function addBox(box, p) {
	try {
		const mn = p.GMin, mx = p.GMax;
		for (let c = 0; c < 8; c++) {
			const q = p.ToGlobal(NewVector(c & 1 ? mx.x : mn.x, c & 2 ? mx.y : mn.y, c & 4 ? mx.z : mn.z));
			if (q.x < box.x0) box.x0 = q.x; if (q.x > box.x1) box.x1 = q.x;
			if (q.y < box.y0) box.y0 = q.y; if (q.y > box.y1) box.y1 = q.y;
			if (q.z < box.z0) box.z0 = q.z; if (q.z > box.z1) box.z1 = q.z;
		}
	} catch (e) { }
}

// ---------- sahnadagi yozuv (Bazis "Текст в модели" usuli: AddContour + Font.json) ----------
let FONT = null;
function font() {
	if (FONT) return FONT;
	FONT = {};
	let txt = '';
	try { txt = system.readTextFile('Font.json'); } catch (e) { }
	try { JSON.parse(String(txt).replace(/^﻿/, '')).Font.Symbols.Symbol.forEach(function (s) { FONT[s.ID] = s; }); } catch (e) { }
	return FONT;
}
function textLines(str, h, x0, y0, out) {
	const F = font();
	let px = 0;
	for (let i = 0; i < str.length; i++) {
		let id = str.charCodeAt(i);
		if (id >= 1040) id = id - 1040 + 192;   // kirill harflari (Font.json cp1251 tartibida)
		const s = F[id];
		if (!s) { px += 0.6 * h; continue; }
		if (s.Lines) [].concat(s.Lines.Line).forEach(function (l) {
			out.push([x0 + px + parseFloat(l.x1) * h, y0 + parseFloat(l.y1) * h, x0 + px + parseFloat(l.x2) * h, y0 + parseFloat(l.y2) * h]);
		});
		px += parseFloat(s.IncX) * h;
	}
	return px;
}
function textWidth(str, h) {
	const F = font();
	let px = 0;
	for (let i = 0; i < str.length; i++) { let id = str.charCodeAt(i); if (id >= 1040) id = id - 1040 + 192; px += (F[id] ? parseFloat(F[id].IncX) : 0.6) * h; }
	return px;
}
function rectLines(x, y, w, h, out) { out.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]); }
// old tekislikdagi (XY) kontur: chiziqlar lokal koordinatada, (px, py, pz) - global boshlang'ich nuqta
function kontur(nom, lines, px, py, pz, color) {
	if (!lines.length) return;
	try {
		const c = AddContour();
		c.Name = nom;
		c.OrientGCS(NewVector(0, 0, 1), NewVector(0, 1, 0));
		try { c.Color = color; } catch (e) { }
		lines.forEach(function (l) { c.Contour.AddLine(l[0], l[1], l[2], l[3]); });
		c.Position = NewVector(px, py, pz);
		c.Build();
	} catch (e) { }
}

// ---------- model ----------
function isUpak(o) {
	for (let d = 0; o && d < 12; d++) {
		let n = ''; try { n = String(o.Name || ''); } catch (e) { }
		if (/^(UPAKOVKA|KROY)\b/.test(n)) return true;
		let nx = null; try { nx = o.Owner; } catch (e) { }
		o = nx;
	}
	return false;
}

function collect() {
	const detallar = [], skip = { pogonaj: 0, yashirin: 0 };
	const box = { x0: 1e18, y0: 1e18, z0: 1e18, x1: -1e18, y1: -1e18, z1: -1e18 };
	Model.forEachPanel(function (p) {
		try {
			if (isUpak(p)) return;
			if (p.Visible === false) { skip.yashirin++; return; }
			addBox(box, p);
			try { if (p.UseInEstimate === false) return; } catch (e) { }
			let matW = 0; try { matW = Number(p.MaterialWidth) || 0; } catch (e) { }
			if (matW > 0) { skip.pogonaj++; return; }
			const a = Number(p.ContourWidth) || 0, b = Number(p.ContourHeight) || 0, t = Number(p.Thickness) || 0;
			if (!(a > 0 && b > 0 && t > 0)) return;
			detallar.push({ nomi: firstLine(p.Name) || 'Detal', L: Math.max(a, b), W: Math.min(a, b), T: t, material: firstLine(p.MaterialName) });
		} catch (e) { }
	});
	// furnitura: Smeta Excel bilan bir xil aylanish
	let furnituraSoni = 0;
	const stack = [];
	for (let i = 0; i < Model.Count; i++) stack.push(Model.Objects[i]);
	let guard = 0;
	while (stack.length && guard++ < 100000) {
		const o = stack.pop();
		const t = typeOf(o);
		if (t === '[object TFurnPanel]' || t === '[object TModelLimits]') continue;
		if (isUpak(o)) continue;
		if (t === '[object TFastener]' || t === '[object TFurnAsm]' || t === '[object TAsmKit]') {
			try { if (o.Visible === false) continue; } catch (e) { }
			furnituraSoni++;
			continue;
		}
		let cnt = 0; try { cnt = o.Count; } catch (e) { }
		if (typeof cnt === 'number' && cnt > 0) for (let k = 0; k < cnt; k++) stack.push(o.Objects[k]);
	}
	return { detallar: detallar, furnituraSoni: furnituraSoni, box: box, skip: skip };
}

function eskisiniOchir() {
	let n = 0;
	for (let i = Model.Count - 1; i >= 0; i--) {
		let o = null; try { o = Model.Objects[i]; } catch (e) { }
		if (o && /^UPAKOVKA\b/.test(String(o.Name || ''))) { try { DeleteObject(o); n++; } catch (e) { } }
	}
	return n;
}

function hp(x1, z1, x2, z2, y, t, nom, mat) {
	const p = AddHorizPanel(x1, z1, x2, z2, y);
	try { p.Name = nom; } catch (e) { }
	if (mat) { try { p.MaterialName = mat; } catch (e) { } }
	try { p.Thickness = t; p.Build(); } catch (e) { }
	try { p.UseInCutting = false; } catch (e) { }
	try { p.UseInEstimate = false; } catch (e) { }
	return p;
}

// Har quti: detallar yotqizilgan holda ustma-ust (X - uzunlik, Z - eni, Y - balandlik),
// old va orqa tekislikda karton chizig'i, ustida yorliq.
function chizQuti(u, x, Y0, Z0, z) {
	let y = Y0 + z;
	u.detallar.forEach(function (d) {
		hp(x + z, Z0 + z, x + z + d.L, Z0 + z + d.W, y, d.T, d.nomi, d.material);
		y += d.T;
	});
	const kt = [];
	rectLines(0, 0, u.L, u.H, kt);
	kontur('UPAKOVKA karton', kt, x, Y0, Z0, 33023);
	kontur('UPAKOVKA karton', kt, x, Y0, Z0 + u.W, 33023);
	const t1 = u.nomer + '  ' + u.kg + ' kg', t2 = u.L + 'x' + u.W + 'x' + u.H;
	const h1 = Math.max(15, Math.min(120, (u.L - 40) / Math.max(1, textWidth(t1, 1))));
	const h2 = Math.max(12, Math.min(70, (u.L - 40) / Math.max(1, textWidth(t2, 1))));
	const yz = [];
	textLines(t2, h2, 20, u.H + 40, yz);
	textLines(t1, h1, 20, u.H + 40 + h2 * 1.6, yz);
	kontur('UPAKOVKA yorliq', yz, x, Y0, Z0, 0);
}

function chiz(upakovkalar, box, P) {
	const X0 = (box.x1 > -1e17 ? box.x1 : 0) + P.masofa, Y0 = box.y0 < 1e17 ? box.y0 : 0, Z0 = box.z0 < 1e17 ? box.z0 : 0;
	let x = X0;
	if (ICHMA_ICH) BeginBlock(UPAK_BLOK);
	try {
		upakovkalar.forEach(function (u) {
			BeginBlock(ICHMA_ICH ? u.nomer : UPAK_BLOK + ' ' + u.nomer);
			try { chizQuti(u, x, Y0, Z0, P.zaxira); } finally { EndBlock(); }
			x += u.L + QUTI_ORASI;
		});
	} finally { if (ICHMA_ICH) EndBlock(); }
}

function sozlamalarJson() {
	try { return JSON.parse(String(system.readTextFile('sozlamalar.json')).replace(/^﻿/, '')); } catch (e) { return {}; }
}

function bugun() {
	const d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
	return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function upakovka() {
	const user = sozlamalarJson();
	user.maxKg = Number(tbMaxKg.Value) || user.maxKg || 40;
	const zx = Number(tbZaxira.Value);
	user.zaxiraMm = zx >= 0 ? zx : 20;
	const S = sozlama(user);
	const P = { masofa: Number(tbMasofa.Value) || 500, zaxira: S.zaxiraMm };

	const C = collect();
	eskisiniOchir();
	if (!C.detallar.length && !C.furnituraSoni) {
		alert('Modelda detal topilmadi - upakovka qilinmadi.');
		return;
	}
	const R = bolish(C.detallar, C.furnituraSoni, S);
	chiz(R.upakovkalar, C.box, P);

	// fayl: model yonida <model nomi>.yuk, model saqlanmagan bo'lsa Documents\Upakovka\
	let fname = '', nom = '';
	try { fname = String(ModelFilename || '').replace(/\//g, '\\'); } catch (e) { }
	try { nom = firstLine(Article.Name); } catch (e) { }
	let dir, base;
	if (fname && /\\/.test(fname)) {
		dir = fname.substring(0, fname.lastIndexOf('\\') + 1);
		base = fname.substring(fname.lastIndexOf('\\') + 1).replace(/\.b3d$/i, '');
	} else {
		dir = com('WScript.Shell').SpecialFolders('MyDocuments') + '\\Upakovka\\';
		ensureDir(dir);
		base = nom || 'buyurtma';
	}
	if (!nom) nom = base;
	const yol = dir + base.replace(/[\\\/:*?"<>|]/g, '_') + '.yuk';
	const yuk = yukFayl(nom, bugun(), R.upakovkalar);
	let saqlandi = true;
	try { writeUtf8(yol, JSON.stringify(yuk, null, 1)); } catch (e) { saqlandi = false; }

	let msg = R.upakovkalar.length + ' ta upakovka, jami ' + yuk.jamiKg + ' kg (' + (yuk.jamiKg / 1000).toFixed(2) + ' t)\n\n';
	R.upakovkalar.forEach(function (u) { msg += '- ' + u.nomer + ' ' + u.turi + '  ' + u.L + 'x' + u.W + 'x' + u.H + '  ' + u.kg + ' kg\n'; });
	msg += saqlandi ? '\nFayl: ' + yol + '\nShu faylni "Yuk joylash" sahifasida oching.' : '\nDIQQAT: fayl yozilmadi: ' + yol;
	if (R.ogohlar.length) msg += '\n\n' + R.ogohlar.join('\n');
	if (C.skip.pogonaj) msg += '\n\n' + C.skip.pogonaj + ' ta pogonaj detal (plintus, profil) hisobga olinmadi.';
	alert(qisqart(msg, 3000));   // juda katta modelda ham Bazis yiqilmasin (COM satr chegarasi)
}

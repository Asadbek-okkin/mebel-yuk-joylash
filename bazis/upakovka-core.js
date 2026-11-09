// =====================================================================
//  UPAKOVKA - sof mantiq (Bazis API'siz): og'irlik, fasad, upakovkalarga bo'lish, .yuk formati.
//  Node testlari: bazis/test/core.test.cjs. Bazis uchun build.js bu faylni Upakovka.js ga qo'shadi.
// =====================================================================

const UPAK_DEFAULT = {
	maxKg: 50,
	zaxiraMm: 20,
	furnituraKg: 0.05,
	uzunMm: 1200,
	gorizontalRegex: 'Дно|Криш|Крыш|Полк|Планк|Плинт|Цокол|Карона|Корона|Ящик|Яшик|Фронт|Столешн',
	uzunRegex: 'Бок|Бак|Бокав|Стойк|Перегор|Шит|Стенк',
	orqaRegex: 'ХДФ|ДВП|HDF',
	nozikRegex: 'Зеркал|Стекл|Ойна|Oyna|Shisha',
	// tartib muhim: birinchi mos kelgani olinadi
	zichlik: [
		['ХДФ|ДВП|HDF|ДВПО', 850],
		['МДФ|MDF', 750],
		['Зеркал|Стекл|Ойна|Oyna|Shisha', 2500]
	],
	zichlikDefault: 650,
	fasadRegex: 'Фасад|Дверь|Двер|Лицев|Fasad|Eshik',
	fasadMaterialRegex: 'МДФ|MDF'
};

function sozlama(user) {
	const S = {};
	Object.keys(UPAK_DEFAULT).forEach(function (k) { S[k] = UPAK_DEFAULT[k]; });
	if (user) Object.keys(user).forEach(function (k) { if (user[k] !== undefined && user[k] !== null) S[k] = user[k]; });
	return S;
}

function rx(src) { return new RegExp(String(src || '(?!)'), 'i'); }

function zichlik(material, S) {
	const m = String(material || '');
	for (let i = 0; i < S.zichlik.length; i++) if (rx(S.zichlik[i][0]).test(m)) return Number(S.zichlik[i][1]);
	return Number(S.zichlikDefault);
}

function detalKg(d, S) {
	return (Number(d.L) || 0) * (Number(d.W) || 0) * (Number(d.T) || 0) / 1e9 * zichlik(d.material, S);
}

// fasad: panel nomi, u turgan bloklar nomi (egalar: Дверь -> Аниматция -> Фасад) yoki МДФ material
function fasadmi(d, S) {
	return rx(S.fasadRegex).test(String(d.nomi || '')) || rx(S.fasadRegex).test((d.egalar || []).join(' | ')) ||
		rx(S.fasadMaterialRegex).test(String(d.material || ''));
}

// Standart modellar tartibi (Shkaf / Spalniy / Prixojka): 1 fasad, 2 tik uzun (bokavina, stoyka),
// 3 gorizontal va mayda (dno, krisha, polka, planka), 4 orqa devor (ХДФ / ДВП)
const GURUH_TARTIB = ['fasad', 'uzun', 'mayda', 'orqa'];
function guruhi(d, S) {
	const nom = String(d.nomi || ''), mat = String(d.material || '');
	const L = Math.max(d.L, d.W), W = Math.min(d.L, d.W);
	if (fasadmi(d, S) || rx(S.nozikRegex).test(mat) || rx(S.nozikRegex).test(nom)) return 'fasad';
	if (rx(S.orqaRegex).test(mat) || (Number(d.T) > 0 && Number(d.T) <= 5)) return 'orqa';
	if (rx(S.gorizontalRegex).test(nom)) return 'mayda';
	if (rx(S.uzunRegex).test(nom) && L >= 1000) return 'uzun';
	if (d.tik === true && L >= S.uzunMm && W >= 250) return 'uzun';
	if (d.tik === undefined && L >= 1500 && W >= 250) return 'uzun';
	return 'mayda';
}

function kg1(x) { return Math.round(x * 10) / 10; }

// ---- quti ichida detallarni qatlamlab terish (MaxRects): mayda detallar bir qatlamga yonma-yon ----
const TOL = 2;   // mm: Bazis o'lchamlari kasrli (868.2 va 868 - bir xil detal)
function joyTop(free, w, h) {
	let eng = null;
	free.forEach(function (r) {
		[[w, h], [h, w]].forEach(function (o) {
			if (o[0] <= r.w + TOL && o[1] <= r.h + TOL) {
				const s = Math.min(r.w - o[0], r.h - o[1]);
				if (!eng || s < eng.s) eng = { s: s, x: r.x, y: r.y, w: o[0], h: o[1] };
			}
		});
	});
	return eng;
}
function joyBand(free, p) {
	const yangi = [];
	free.forEach(function (f) {
		if (p.x >= f.x + f.w || p.x + p.w <= f.x || p.y >= f.y + f.h || p.y + p.h <= f.y) { yangi.push(f); return; }
		if (p.x > f.x) yangi.push({ x: f.x, y: f.y, w: p.x - f.x, h: f.h });
		if (p.x + p.w < f.x + f.w) yangi.push({ x: p.x + p.w, y: f.y, w: f.x + f.w - p.x - p.w, h: f.h });
		if (p.y > f.y) yangi.push({ x: f.x, y: f.y, w: f.w, h: p.y - f.y });
		if (p.y + p.h < f.y + f.h) yangi.push({ x: f.x, y: p.y + p.h, w: f.w, h: f.y + f.h - p.y - p.h });
	});
	return yangi.filter(function (a, i) {
		if (a.w < 1 || a.h < 1) return false;
		return !yangi.some(function (b, j) { return j !== i && b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h && (j < i || b.w * b.h > a.w * a.h); });
	});
}
// ds: L >= W normallashgan detallar -> { L, W, H, detallar (x, y, z, dx, dy bilan) }
function qatlamla(ds, z) {
	const tekis = ds.filter(function (d) { return d.T > 0; }).sort(function (p, q) { return q.L * q.W - p.L * p.W; });
	const baseL = tekis.reduce(function (m, d) { return Math.max(m, d.L); }, 0), baseW = tekis.reduce(function (m, d) { return Math.max(m, d.W); }, 0);
	const qat = [];
	tekis.forEach(function (d) {
		let joy = null, k = 0;
		for (; k < qat.length && !joy; k++) joy = joyTop(qat[k].free, d.L, d.W);
		if (joy) k--;
		else { qat.push({ free: [{ x: 0, y: 0, w: baseL, h: baseW }], T: 0 }); k = qat.length - 1; joy = joyTop(qat[k].free, d.L, d.W); }
		qat[k].free = joyBand(qat[k].free, joy);
		qat[k].T = Math.max(qat[k].T, d.T);
		d._q = k; d._x = joy.x; d._y = joy.y; d._dx = joy.w; d._dy = joy.h;
	});
	const zq = []; let s = 0;
	qat.forEach(function (q) { zq.push(s); s += q.T; });
	const r1 = function (v) { return Math.round(v * 10) / 10; };
	return {
		L: Math.round(baseL + 2 * z), W: Math.round(baseW + 2 * z), H: Math.round(s + 2 * z),
		detallar: ds.map(function (d) {
			const o = { nomi: d.nomi, L: Math.round(d.L), W: Math.round(d.W), T: d.T, material: d.material, kg: kg1(d.kg) };
			if (d.T > 0) { o.x = r1(z + d._x); o.y = r1(z + d._y); o.z = r1(z + zq[d._q]); o.dx = r1(d._dx); o.dy = r1(d._dy); o.qatlam = d._q + 1; }
			return o;
		})
	};
}

function blokRaqam(s) { const m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(s || '').trim()); return m ? Number(m[2]) : null; }

// detallar: [{nomi, L, W, T, material, egalar?, tik?, blok?}], furnituraSoni: dona
// blok - detal turgan "N/i" bloki (modelda oldindan tuzilgan upakovka). Bunday bloklar bo'lsa - aynan ular upakovka.
// -> { upakovkalar: [{nomer:'N/i', turi, guruh, L, W, H, kg, detallar}], ogohlar: [] }
function bolish(detallar, furnituraSoni, S) {
	const z = Number(S.zaxiraMm) || 0, maxKg = Number(S.maxKg) || 50;
	const ogohlar = [], bloklar = {}, erkin = [];
	(detallar || []).forEach(function (d0) {
		const a = Number(d0.L) || 0, b = Number(d0.W) || 0;
		const d = { nomi: String(d0.nomi || 'Detal'), L: Math.max(a, b), W: Math.min(a, b), T: Number(d0.T) || 0, material: String(d0.material || ''), egalar: d0.egalar, tik: d0.tik };
		if (!(d.L > 0 && d.W > 0 && d.T > 0)) return;
		d.kg = detalKg(d, S);
		d.guruh = guruhi(d, S);
		const bi = blokRaqam(d0.blok);
		if (bi !== null) (bloklar[bi] = bloklar[bi] || []).push(d); else erkin.push(d);
	});
	const qutilar = [];   // { guruh, ds }
	const kop = function (ds) {   // ko'pchilik guruh
		const n = {}; ds.forEach(function (d) { n[d.guruh] = (n[d.guruh] || 0) + d.kg; });
		return Object.keys(n).sort(function (p, q) { return n[q] - n[p]; })[0];
	};
	const bloklarRaqami = Object.keys(bloklar).map(Number).sort(function (p, q) { return p - q; });
	bloklarRaqami.forEach(function (i) { qutilar.push({ guruh: kop(bloklar[i]), ds: bloklar[i], blok: true }); });
	// bloklardan tashqaridagi detal - shu guruhdagi blokka, bo'lmasa avtomatik upakovkaga
	const qolgan = [];
	erkin.forEach(function (d) {
		const q = qutilar.filter(function (q) { return q.blok && q.guruh === d.guruh; })[0];
		if (q) q.ds.push(d); else qolgan.push(d);
	});
	GURUH_TARTIB.forEach(function (g) {
		const ql = [];
		qolgan.filter(function (d) { return d.guruh === g; }).sort(function (p, q) { return q.L * q.W - p.L * p.W; }).forEach(function (d) {
			if (d.kg > maxKg) {
				ogohlar.push(d.nomi + ' ' + Math.round(d.L) + 'x' + Math.round(d.W) + ' bitta o\'zi ' + kg1(d.kg) + ' kg (> ' + maxKg + ' kg) - alohida upakovka');
				ql.push({ guruh: g, ds: [d], kg: d.kg, asosL: d.L, asosW: d.W, yopiq: true });
				return;
			}
			// faqat og'irlik bo'yicha: quti asosi eng katta detalga qarab kattalashadi (qatlamla joylaydi)
			let q = null;
			for (let i = 0; i < ql.length && !q; i++) {
				const c = ql[i];
				if (!c.yopiq && c.kg + d.kg <= maxKg) q = c;
			}
			if (!q) { q = { guruh: g, ds: [], kg: 0 }; ql.push(q); }
			q.ds.push(d); q.kg += d.kg;
		});
		ql.forEach(function (q) { qutilar.push(q); });
	});
	// juda yengil guruh (masalan yashik ХДФ, bitta tik shit) alohida quti bo'lmaydi - eng yengil mayda qutiga
	const minKg = Number(S.minKg) || 5;
	const kgi = function (q) { return q.ds.reduce(function (s, d) { return s + d.kg; }, 0); };
	['uzun', 'orqa'].forEach(function (g) {
		const bular = qutilar.filter(function (q) { return !q.blok && q.guruh === g; });
		if (!bular.length || bular.reduce(function (s, q) { return s + kgi(q); }, 0) >= minKg) return;
		bular.forEach(function (q) {
			const maqsad = qutilar.filter(function (m) { return !m.blok && m.guruh === 'mayda' && kgi(m) + kgi(q) <= maxKg; })
				.sort(function (p, r) { return kgi(p) - kgi(r); })[0];
			if (!maqsad) return;
			Array.prototype.push.apply(maqsad.ds, q.ds);
			qutilar.splice(qutilar.indexOf(q), 1);
		});
	});
	if (bloklarRaqami.length && qutilar.length > bloklarRaqami.length)
		ogohlar.push('Bloklardan tashqaridagi detallar uchun ' + (qutilar.length - bloklarRaqami.length) + ' ta yangi upakovka qo\'shildi - raqamlar qayta berildi.');
	// furnitura og'irligi mayda detallar upakovkasiga (standart modellarda alohida quti yo'q)
	const fs = Number(furnituraSoni) || 0;
	if (fs > 0) {
		const fd = { nomi: 'Furnitura (' + fs + ' dona)', L: 0, W: 0, T: 0, material: '', kg: fs * S.furnituraKg, guruh: 'mayda' };
		const yengil = function (arr) { return arr.slice().sort(function (p, r) { return kgi(p) - kgi(r); })[0]; };
		const q = yengil(qutilar.filter(function (q) { return q.guruh === 'mayda'; })) || yengil(qutilar);
		// sig'sa - eng yengil qutiga; chegaradan oshirsa (yoki quti yo'q) - alohida furnitura qutisi
		if (q && kgi(q) + fd.kg <= maxKg) q.ds.push(fd); else qutilar.push({ guruh: 'furnitura', ds: [fd] });
	}
	const N = qutilar.length;
	const upakovkalar = qutilar.map(function (q, i) {
		const kg = q.ds.reduce(function (s, d) { return s + d.kg; }, 0);
		if (q.blok && kg > maxKg) ogohlar.push((i + 1) + '-upakovka ' + kg1(kg) + ' kg - ' + maxKg + ' kg dan og\'ir.');
		const o = q.guruh === 'furnitura' ? { L: 400, W: 300, H: fs <= 50 ? 100 : fs <= 150 ? 200 : 300, detallar: q.ds.map(function (d) { return { nomi: d.nomi, L: 0, W: 0, T: 0, material: '', kg: kg1(d.kg) }; }) } : qatlamla(q.ds, z);
		return {
			nomer: N + '/' + (i + 1), turi: q.guruh === 'fasad' ? 'fasad' : q.guruh === 'furnitura' ? 'furnitura' : 'korpus', guruh: q.guruh,
			L: o.L, W: o.W, H: o.H, kg: kg1(kg), detallar: o.detallar
		};
	});
	return { upakovkalar: upakovkalar, ogohlar: ogohlar };
}

// model fayli yo'lidan mahsulot turkumi (katalog uchun)
function turkumAniqla(yol) {
	const s = String(yol || '');
	if (/Спалн|Spaln|\\SP\s?\d/i.test(s)) return 'Spalniy';
	if (/Прихож|Prixoj|\\PR\s/i.test(s)) return 'Prixojka';
	if (/Кроват|Krovat|\\KR\s/i.test(s)) return 'Krovat';
	if (/Шкаф|Shkaf|\\SH\s/i.test(s)) return 'Shkaf';
	if (/Обувн|Obuvn/i.test(s)) return 'Obuvnitsa';
	return 'Boshqa';
}

// Bazis alert/COM ga juda uzun satr uzatilsa yiqiladi - xabar shu uzunlikda kesiladi
function qisqart(s, n) {
	s = String(s);
	if (s.length <= n) return s;
	const k = s.lastIndexOf('\n', n);
	return s.substring(0, k > n / 2 ? k : n) + '\n... (xabar qisqartirildi)';
}

// qosh: { turkum, model } - model: mahsulotning 3D shakli (sahifada ko'rsatish uchun)
function yukFayl(buyurtma, sana, upakovkalar, qosh) {
	const y = {
		format: 'mebel-yuk', versiya: 2,
		buyurtma: String(buyurtma || 'Buyurtma'), sana: String(sana || ''),
		jamiKg: kg1(upakovkalar.reduce(function (s, u) { return s + u.kg; }, 0)),
		upakovkalar: upakovkalar
	};
	if (qosh && qosh.turkum) y.turkum = qosh.turkum;
	if (qosh && qosh.model) y.model = qosh.model;
	return y;
}

if (typeof module !== 'undefined') module.exports = { DEFAULT: UPAK_DEFAULT, sozlama, zichlik, detalKg, fasadmi, guruhi, bolish, yukFayl, qisqart, turkumAniqla };

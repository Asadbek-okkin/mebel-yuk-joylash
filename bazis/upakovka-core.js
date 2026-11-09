// =====================================================================
//  UPAKOVKA - sof mantiq (Bazis API'siz): og'irlik, fasad, upakovkalarga bo'lish, .yuk formati.
//  Node testlari: bazis/test/core.test.cjs. Bazis uchun build.js bu faylni Upakovka.js ga qo'shadi.
// =====================================================================

const UPAK_DEFAULT = {
	maxKg: 40,
	zaxiraMm: 20,
	furnituraKg: 0.05,
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

function fasadmi(d, S) {
	return rx(S.fasadRegex).test(String(d.nomi || '')) || rx(S.fasadMaterialRegex).test(String(d.material || ''));
}

function kg1(x) { return Math.round(x * 10) / 10; }

// detallar: [{nomi, L, W, T, material}], furnituraSoni: dona
// -> { upakovkalar: [{nomer:'N/i', turi, L, W, H, kg, detallar}], ogohlar: [] }
function bolish(detallar, furnituraSoni, S) {
	const z = Number(S.zaxiraMm) || 0, maxKg = Number(S.maxKg) || 40;
	const ogohlar = [], qutilar = [];
	const guruh = { korpus: [], fasad: [] };
	(detallar || []).forEach(function (d0) {
		const a = Number(d0.L) || 0, b = Number(d0.W) || 0;
		const d = { nomi: String(d0.nomi || 'Detal'), L: Math.max(a, b), W: Math.min(a, b), T: Number(d0.T) || 0, material: String(d0.material || '') };
		if (!(d.L > 0 && d.W > 0 && d.T > 0)) return;
		d.kg = detalKg(d, S);
		guruh[fasadmi(d, S) ? 'fasad' : 'korpus'].push(d);
	});
	['korpus', 'fasad'].forEach(function (turi) {
		const ql = [];
		guruh[turi].sort(function (p, q) { return q.L * q.W - p.L * p.W; }).forEach(function (d) {
			if (d.kg > maxKg) {
				ogohlar.push(d.nomi + ' ' + Math.round(d.L) + 'x' + Math.round(d.W) + ' bitta o\'zi ' + kg1(d.kg) + ' kg (> ' + maxKg + ' kg) - alohida upakovka');
				ql.push({ turi: turi, asosL: d.L, asosW: d.W, kg: d.kg, detallar: [d], yopiq: true });
				return;
			}
			let q = null;
			for (let i = 0; i < ql.length && !q; i++) {
				const c = ql[i];
				// 2 mm tolerans: Bazis o'lchamlari kasrli (868.2 va 868 - bir xil detal)
				if (!c.yopiq && c.kg + d.kg <= maxKg && d.L <= c.asosL + 2 && d.W <= c.asosW + 2) q = c;
			}
			if (!q) { q = { turi: turi, asosL: d.L, asosW: d.W, kg: 0, detallar: [] }; ql.push(q); }
			q.detallar.push(d); q.kg += d.kg;
		});
		ql.forEach(function (q) {
			qutilar.push({
				turi: turi,
				L: Math.round(q.asosL + 2 * z), W: Math.round(q.asosW + 2 * z),
				H: Math.round(q.detallar.reduce(function (s, d) { return s + d.T; }, 0) + 2 * z),
				kg: kg1(q.kg),
				detallar: q.detallar.map(function (d) { return { nomi: d.nomi, L: Math.round(d.L), W: Math.round(d.W), T: d.T, material: d.material, kg: kg1(d.kg) }; })
			});
		});
	});
	const fs = Number(furnituraSoni) || 0;
	if (fs > 0) qutilar.push({ turi: 'furnitura', L: 400, W: 300, H: fs <= 50 ? 100 : fs <= 150 ? 200 : 300, kg: kg1(fs * S.furnituraKg), detallar: [] });
	const N = qutilar.length;
	const upakovkalar = qutilar.map(function (q, i) {
		return { nomer: N + '/' + (i + 1), turi: q.turi, L: q.L, W: q.W, H: q.H, kg: q.kg, detallar: q.detallar };
	});
	return { upakovkalar: upakovkalar, ogohlar: ogohlar };
}

function yukFayl(buyurtma, sana, upakovkalar) {
	return {
		format: 'mebel-yuk', versiya: 1,
		buyurtma: String(buyurtma || 'Buyurtma'), sana: String(sana || ''),
		jamiKg: kg1(upakovkalar.reduce(function (s, u) { return s + u.kg; }, 0)),
		upakovkalar: upakovkalar
	};
}

if (typeof module !== 'undefined') module.exports = { DEFAULT: UPAK_DEFAULT, sozlama, zichlik, detalKg, fasadmi, bolish, yukFayl };

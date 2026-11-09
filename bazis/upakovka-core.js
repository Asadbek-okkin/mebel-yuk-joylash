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

if (typeof module !== 'undefined') module.exports = { DEFAULT: UPAK_DEFAULT, sozlama, zichlik, detalKg, fasadmi };

// Yuklash varaqasi: qavatma-qavat 2D xarita (tepadan) + tartiblangan ro'yxat. HTML satr qaytaradi (chop etish uchun).
// Xaritada: chapda KABINA, o'ngda ESHIK; eshik oldida turib kabinaga qaraganda o'ng tomon - tepada.
import { joyMatni } from './xarita.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rangOk = (r) => (/^#[0-9a-f]{3,8}$/i.test(String(r)) ? r : '#888');

function xarita(K, tartib, q, royxat) {
  const pad = 320, Lx = K.L, Wy = K.W;
  const shu = tartib.filter((t) => t.qavat === q), past = tartib.filter((t) => t.qavat < q);
  const harf = Math.max(90, Math.min(200, Wy * 0.07));
  let s = `<svg class="xarita" viewBox="${-pad} ${-pad} ${Lx + 2 * pad} ${Wy + 2 * pad}" role="img" aria-label="${q}-qavat xaritasi">`;
  s += `<rect x="0" y="0" width="${Lx}" height="${Wy}" fill="#f6f5f1" stroke="#333" stroke-width="16"/>`;
  s += `<rect x="-60" y="0" width="60" height="${Wy}" fill="#3a4250"/>`;
  s += `<text x="${-pad / 2 - 30}" y="${Wy / 2}" font-size="${harf}" font-weight="800" fill="#3a4250" text-anchor="middle" transform="rotate(-90 ${-pad / 2 - 30} ${Wy / 2})">KABINA</text>`;
  s += `<text x="${Lx + pad / 2}" y="${Wy / 2}" font-size="${harf}" font-weight="800" fill="#3a4250" text-anchor="middle" transform="rotate(90 ${Lx + pad / 2} ${Wy / 2})">ESHIK</text>`;
  s += `<text x="${Lx / 2}" y="${-pad / 3}" font-size="${harf * 0.75}" fill="#666" text-anchor="middle">o'ng tomon</text>`;
  s += `<text x="${Lx / 2}" y="${Wy + pad / 2}" font-size="${harf * 0.75}" fill="#666" text-anchor="middle">chap tomon</text>`;
  past.forEach((t) => { s += `<rect x="${t.p.x}" y="${t.p.y}" width="${t.p.l}" height="${t.p.w}" fill="none" stroke="#bbb" stroke-width="8" stroke-dasharray="40 30"/>`; });
  shu.forEach((t) => {
    const p = t.p, rang = rangOk((royxat[p.q.buyurtma] || {}).rang);
    s += `<rect x="${p.x}" y="${p.y}" width="${p.l}" height="${p.w}" fill="${rang}" fill-opacity="${p.q.turi === 'fasad' ? 0.55 : 0.85}" stroke="#111" stroke-width="10"/>`;
    const matn = `${t.n}. ${p.q.nomer}`;
    const f = Math.max(40, Math.min(260, p.w * 0.42, (p.l * 0.9) / (matn.length * 0.58)));
    s += `<text x="${p.x + p.l / 2}" y="${p.y + p.w / 2}" font-size="${f}" font-weight="800" fill="#fff" stroke="#000" stroke-width="${f / 14}" paint-order="stroke" text-anchor="middle" dominant-baseline="central">${esc(matn)}</text>`;
  });
  return s + '</svg>';
}

export function varaqaHTML({ K, tartib, royxat, jamiKg, sana }) {
  const qavatlar = [...new Set(tartib.map((t) => t.qavat))].sort((a, b) => a - b);
  let h = `<header class="v-bosh"><h2>Yuklash varaqasi</h2>
    <div>${esc(K.nomi)} · kuzov ${K.L}×${K.W}×${K.H} mm · ${esc(sana)}</div>
    <div><b>${tartib.length} ta quti · ${Math.round(jamiKg * 10) / 10} kg</b></div>
    <ul class="v-buyurtmalar">${royxat.map((b) => `<li><i style="background:${rangOk(b.rang)}"></i>${esc(b.yuk.buyurtma)}${b.soni > 1 ? ' ×' + b.soni : ''}</li>`).join('')}</ul>
    <p class="v-izoh">Raqam - yuklash navbati. Avval 1-qavat, kabina tomondan boshlab. Punktir - pastki qavatdagi qutilar.</p></header>`;
  qavatlar.forEach((q) => {
    const n = tartib.filter((t) => t.qavat === q).length;
    h += `<section class="v-qavat"><h3>${q}-qavat <small>(${n} ta quti)</small></h3>${xarita(K, tartib, q, royxat)}</section>`;
  });
  h += `<table class="v-jadval"><thead><tr><th>№</th><th>Quti</th><th>Buyurtma</th><th>O'lcham, mm</th><th>kg</th><th>Joyi</th></tr></thead><tbody>`;
  tartib.forEach((t) => {
    const p = t.p, b = royxat[p.q.buyurtma] || { yuk: { buyurtma: '' } };
    h += `<tr class="q"><td>${t.n}</td><td><b>${esc(p.q.nomer)}</b></td><td><i style="background:${rangOk(b.rang)}"></i>${esc(b.yuk.buyurtma)}</td>` +
      `<td>${p.q.L}×${p.q.W}×${p.q.H}</td><td>${esc(p.q.kg)}</td><td>${esc(joyMatni(t, K))}</td></tr>`;
  });
  return h + '</tbody></table>';
}

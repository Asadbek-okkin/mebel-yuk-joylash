// Yuk ortuvchilar uchun: yuklash tartibi, qavat va joy tavsifi (DOM'siz, sof funksiyalar).
// Koordinatalar joylash.js dagi kabi: x - kabinadan eshikka, y - eni, z - balandlik (mm).

const EPS = 1;

function tayanchlar(p, J) {
  if (p.z <= EPS) return [];
  return J.filter((o) => o !== p && Math.abs(o.z + o.h - p.z) <= EPS &&
    Math.min(p.x + p.l, o.x + o.l) - Math.max(p.x, o.x) > 0 && Math.min(p.y + p.w, o.y + o.w) - Math.max(p.y, o.y) > 0);
}

// joylandi -> [{ n, p, qavat }]: kabina tomondan eshikka, tayanch qutisi har doim ustidagidan oldin
export function yuklashTartibi(joylandi) {
  const J = joylandi.slice();
  const tay = new Map(J.map((p) => [p, tayanchlar(p, J)]));
  const qavat = new Map(), yuklangan = new Set(), T = [];
  while (T.length < J.length) {
    let eng = null;
    for (const p of J) {
      if (yuklangan.has(p) || !tay.get(p).every((o) => yuklangan.has(o))) continue;
      if (!eng || p.x < eng.x - EPS || (Math.abs(p.x - eng.x) <= EPS && (p.z < eng.z - EPS || (Math.abs(p.z - eng.z) <= EPS && p.y < eng.y)))) eng = p;
    }
    if (!eng) eng = J.find((p) => !yuklangan.has(p));   // aylanma bog'liqlik bo'lmaydi, lekin ehtiyot uchun
    yuklangan.add(eng);
    qavat.set(eng, tay.get(eng).reduce((m, o) => Math.max(m, (qavat.get(o) || 1) + 1), 1));
    T.push({ n: T.length + 1, p: eng, qavat: qavat.get(eng) });
  }
  return T;
}

// eshik oldida turib kabinaga qaraganda: y kichik - o'ng, y katta - chap
export function joyMatni(t, K) {
  const cx = t.p.x + t.p.l / 2, cy = t.p.y + t.p.w / 2;
  const uz = cx < K.L / 3 ? 'kabina tomoni' : cx > (2 * K.L) / 3 ? 'eshik oldi' : "o'rtada";
  const en = cy < K.W / 3 ? "o'ng" : cy > (2 * K.W) / 3 ? 'chap' : "o'rta";
  return `${uz}, ${en}, ${t.qavat}-qavat`;
}

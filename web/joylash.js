// Mashina kuzoviga qutilarni joylash (DOM'siz, sof funksiyalar).
// Koordinatalar: x - kuzov uzunligi (kabinadan orqaga), y - eni, z - balandlik. Hammasi mm.
// Qutilar faqat yotqizilgan (H - vertikal), faqat 90° gorizontal burilish.

const TAYANCH = 0.7;   // quti tubining kamida 70% i pol yoki boshqa qutilar ustida
const EPS = 1;         // mm

const fasadmi = (q) => q.turi === 'fasad';

// bir nechta tartib sinaladi (fasadlar har doim oxirida), eng ko'p sig'gani olinadi
const TARTIBLAR = [
  (a, b) => b.kg - a.kg || b.L * b.W - a.L * a.W,          // og'ir pastga
  (a, b) => b.L * b.W - a.L * a.W || b.kg - a.kg,          // katta yuzali pastga
  (a, b) => b.L * b.W * b.H - a.L * a.W * a.H || b.kg - a.kg,
  (a, b) => b.L - a.L || b.W - a.W
];
function tartib(qutilar, k) {
  return qutilar.filter((q) => !fasadmi(q)).sort(k).concat(qutilar.filter(fasadmi).sort(k));
}

function kesishadi(a, x, y, z, l, w, h) {
  const e = 1e-6;
  return x < a.x + a.l - e && a.x < x + l - e && y < a.y + a.w - e && a.y < y + w - e && z < a.z + a.h - e && a.z < z + h - e;
}

let tosiq = 0;
function yaroqli(J, K, q, x, y, z, l, w, h) {
  if (x + l > K.L + EPS || y + w > K.W + EPS || z + h > K.H + EPS) return false;
  // oxirgi to'sgan quti birinchi tekshiriladi: ketma-ket nuqtalarni ko'pincha bitta quti to'sadi
  if (tosiq < J.length && kesishadi(J[tosiq], x, y, z, l, w, h)) return false;
  for (let i = 0; i < J.length; i++) if (kesishadi(J[i], x, y, z, l, w, h)) { tosiq = i; return false; }
  const Y = J;
  // fasad qutisi boshqa (fasad bo'lmagan) qutining ostiga kiritilmaydi
  if (fasadmi(q)) for (let i = 0; i < Y.length; i++) {
    const o = Y[i];
    if (fasadmi(o.q) || Math.abs(o.z - (z + h)) > EPS) continue;
    if (Math.min(x + l, o.x + o.l) - Math.max(x, o.x) > 0 && Math.min(y + w, o.y + o.w) - Math.max(y, o.y) > 0) return false;
  }
  if (z <= EPS) return true;
  let s = 0;
  for (let i = 0; i < Y.length; i++) {
    const o = Y[i];
    if (Math.abs(o.z + o.h - z) > EPS) continue;
    const dx = Math.min(x + l, o.x + o.l) - Math.max(x, o.x), dy = Math.min(y + w, o.y + o.w) - Math.max(y, o.y);
    if (dx <= 0 || dy <= 0) continue;
    if (!fasadmi(q) && fasadmi(o.q)) return false;   // fasad ustiga og'ir quti qo'yilmaydi
    s += dx * dy;
  }
  return s >= TAYANCH * l * w - EPS;
}

function ichida(J, p) {
  return J.some((o) => p.x >= o.x && p.x < o.x + o.l && p.y >= o.y && p.y < o.y + o.w && p.z >= o.z && p.z < o.z + o.h);
}

export function joyla(qutilar, K) {
  let eng = null;
  for (const k of TARTIBLAR) {
    const r = joylaTartib(tartib(qutilar, k), K);
    if (!eng || r.sigmadi.length < eng.sigmadi.length || (r.sigmadi.length === eng.sigmadi.length && r.jamiKg > eng.jamiKg)) eng = r;
    if (!eng.sigmadi.length) break;
  }
  return eng;
}

// hammasi sig'adimi (tez: birinchi sig'magan qutida to'xtaydi)
function hammasiSigadimi(qutilar, K) {
  for (const k of TARTIBLAR) if (joylaTartib(tartib(qutilar, k), K, true).sigmadi.length === 0) return true;
  return false;
}

function joylaTartib(royxat, K, toxta = false) {
  const J = [], sigmadi = [];
  let P = [{ x: 0, y: 0, z: 0 }], jamiKg = 0;
  for (const q of royxat) {
    if (toxta && sigmadi.length) break;
    const yon = [[q.L, q.W], [q.W, q.L]];
    if (!yon.some(([l, w]) => l <= K.L && w <= K.W) || q.H > K.H) { sigmadi.push({ q, sabab: 'olcham' }); continue; }
    if (jamiKg + q.kg > K.maxKg + 1e-9) { sigmadi.push({ q, sabab: 'ogirlik' }); continue; }
    let joy = null;
    for (const p of P) {
      for (const [l, w] of yon) {
        if (yaroqli(J, K, q, p.x, p.y, p.z, l, w, q.H)) { joy = { q, x: p.x, y: p.y, z: p.z, l, w, h: q.H }; break; }
      }
      if (joy) break;
    }
    if (!joy) { sigmadi.push({ q, sabab: 'joy' }); continue; }
    J.push(joy);
    jamiKg += q.kg;
    // eski nuqtalar faqat yangi quti bilan tekshiriladi (oldingilari bilan allaqachon tekshirilgan),
    // yangi nuqtalar - hamma qutilar bilan; takrorlar va kuzovdan tashqaridagilar tashlanadi; tartib: past, old, chap
    const yangi = [joy];
    P = P.filter((p) => !ichida(yangi, p));
    const seen = new Set(P.map((p) => p.x + ',' + p.y + ',' + p.z));
    for (const p of [{ x: joy.x + joy.l, y: joy.y, z: joy.z }, { x: joy.x, y: joy.y + joy.w, z: joy.z }, { x: joy.x, y: joy.y, z: joy.z + joy.h }]) {
      const k = p.x + ',' + p.y + ',' + p.z;
      if (seen.has(k) || p.x >= K.L || p.y >= K.W || p.z >= K.H || ichida(J, p)) continue;
      seen.add(k);
      P.push(p);
    }
    P.sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y);
  }
  const V = J.reduce((s, p) => s + p.l * p.w * p.h, 0);
  return { joylandi: J, sigmadi, jamiKg: Math.round(jamiKg * 10) / 10, hajmFoiz: Math.round((100 * V) / (K.L * K.W * K.H)) };
}

// buyurtmalar: [{ yuk, soni }] -> Quti[]; har nusxa alohida id bilan
export function qutilarniYoy(buyurtmalar) {
  const out = [];
  buyurtmalar.forEach((b, bi) => {
    const soni = Math.max(0, Math.floor(Number(b.soni) || 0));
    for (let n = 1; n <= soni; n++) {
      b.yuk.upakovkalar.forEach((u) => {
        out.push({
          id: bi + '-' + n + '-' + u.nomer, nomer: soni > 1 ? '#' + n + ' ' + u.nomer : u.nomer, buyurtma: bi,
          turi: u.turi, L: u.L, W: u.W, H: u.H, kg: u.kg, detallar: u.detallar || []
        });
      });
    }
  });
  return out;
}

// idx-buyurtmadan shu kuzovga eng ko'pi nechta komplekt sig'adi (boshqa buyurtmalar ham hisobda)
export function nechtaSigadi(buyurtmalar, idx, K) {
  const birlik = buyurtmalar[idx].yuk.upakovkalar;
  const kg1 = birlik.reduce((s, u) => s + u.kg, 0), v1 = birlik.reduce((s, u) => s + u.L * u.W * u.H, 0);
  const boshqa = qutilarniYoy(buyurtmalar.map((b, i) => (i === idx ? { ...b, soni: 0 } : b)));
  const kg0 = boshqa.reduce((s, q) => s + q.kg, 0), v0 = boshqa.reduce((s, q) => s + q.L * q.W * q.H, 0);
  // yuqori chegara: og'irlik va hajm bo'yicha
  let hi = Math.min(500, kg1 > 0 ? Math.floor((K.maxKg - kg0) / kg1) : 500, v1 > 0 ? Math.floor((K.L * K.W * K.H - v0) / v1) : 500);
  const sigadimi = (n) => hammasiSigadimi(qutilarniYoy(buyurtmalar.map((b, i) => (i === idx ? { ...b, soni: n } : b))), K);
  let lo = 0;
  if (hi <= 0 || !sigadimi(1)) return 0;
  // 1, 2, 4, 8 ... bilan chegara topiladi (kichik N tez), keyin ikkilik qidiruv.
  // Evristik joylash monoton emas: natija ba'zan haqiqiydan kam, lekin hech qachon ko'p emas (lo - tekshirilgan N).
  lo = 1;
  let qadam = 2;
  while (qadam <= hi && sigadimi(qadam)) { lo = qadam; qadam *= 2; }
  hi = Math.min(hi, qadam - 1);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (sigadimi(mid)) lo = mid; else hi = mid - 1;
  }
  return lo;
}

// hammasi sig'adigan eng kichik mashina; bo'lmasa eng katta mashinadan nechta kerak
export function tavsiya(qutilar, mashinalar) {
  if (!qutilar.length || !mashinalar.length) return null;
  const hajm = (m) => m.L * m.W * m.H;
  const M = mashinalar.slice().sort((a, b) => hajm(a) - hajm(b));
  for (const m of M) if (joyla(qutilar, m).sigmadi.length === 0) return { mashina: m, soni: 1 };
  const katta = M[M.length - 1];
  let qolgan = qutilar, n = 0;
  while (qolgan.length && n < 50) {
    const r = joyla(qolgan, katta);
    if (!r.joylandi.length) return null;
    qolgan = r.sigmadi.map((s) => s.q);
    n++;
  }
  return qolgan.length ? null : { mashina: katta, soni: n };
}

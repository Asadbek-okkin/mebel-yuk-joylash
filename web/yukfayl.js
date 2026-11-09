// .yuk faylini o'qish va buyurtmalar ro'yxati
import { qutilarniYoy } from './joylash.js';

export { qutilarniYoy };

export const RANGLAR = ['#2f6fdf', '#2e9e5b', '#e0821f', '#8a4fd1', '#d64545', '#1aa3a3', '#b8a21c', '#d2559b'];

const XATO = 'Bu fayl upakovka fayli emas (.yuk)';

export function oqiYuk(matn) {
  let y;
  try { y = JSON.parse(String(matn).replace(/^﻿/, '')); } catch { throw new Error(XATO); }
  if (!y || y.format !== 'mebel-yuk' || (y.versiya !== 1 && y.versiya !== 2) || !Array.isArray(y.upakovkalar)) throw new Error(XATO);
  const son = (v) => Number(v) || 0;
  y.turkum = typeof y.turkum === 'string' ? y.turkum.slice(0, 40) : '';
  // mahsulotning 3D shakli: [x, y, z, dx, dy, dz, rangIndeks, fasad] - faqat sonlar, rang faqat #hex
  if (y.model && typeof y.model === 'object' && Array.isArray(y.model.panellar)) {
    const m = y.model;
    y.model = {
      L: son(m.L), W: son(m.W), H: son(m.H),
      ranglar: (Array.isArray(m.ranglar) ? m.ranglar : []).map((r) => (/^#[0-9a-f]{6}$/i.test(String(r)) ? String(r) : '#999999')),
      panellar: m.panellar.filter((p) => Array.isArray(p) && p.length >= 6).slice(0, 3000).map((p) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => son(p[i])))
    };
  } else delete y.model;
  y.upakovkalar = y.upakovkalar.map((u) => ({
    nomer: String(u.nomer || ''), turi: ['korpus', 'fasad', 'furnitura'].includes(u.turi) ? u.turi : 'korpus',
    L: son(u.L), W: son(u.W), H: son(u.H), kg: son(u.kg),
    // fayl ishonchsiz (Telegram orqali keladi): detallar ham tozalanadi
    detallar: (Array.isArray(u.detallar) ? u.detallar : []).filter((d) => d && typeof d === 'object')
      .map((d) => ({ nomi: String(d.nomi ?? ''), L: son(d.L), W: son(d.W), T: son(d.T), material: String(d.material ?? ''), kg: son(d.kg) }))
  })).filter((u) => u.L > 0 && u.W > 0 && u.H > 0);
  y.buyurtma = String(y.buyurtma || 'Buyurtma');
  y.jamiKg = son(y.jamiKg) || Math.round(y.upakovkalar.reduce((s, u) => s + u.kg, 0) * 10) / 10;
  return y;
}

// bir xil fayl qayta qo'shilsa - yangi buyurtma emas, soni oshadi
export function buyurtmaQosh(royxat, yuk) {
  const bir = (a) => a.buyurtma + '|' + a.sana + '|' + a.jamiKg;
  const i = royxat.findIndex((b) => bir(b.yuk) === bir(yuk));
  if (i >= 0) return royxat.map((b, j) => (j === i ? { ...b, soni: b.soni + 1 } : b));
  const band = new Set(royxat.map((b) => b.rang));
  const rang = RANGLAR.find((r) => !band.has(r)) || RANGLAR[royxat.length % RANGLAR.length];
  return royxat.concat([{ yuk, soni: 1, rang }]);
}

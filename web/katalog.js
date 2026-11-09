// Mahsulotlar katalogi: index tuzish (katalogni yangilash skripti uchun) va o'qish/filtrlash (sahifa uchun). DOM'siz.
import { oqiYuk } from './yukfayl.js';

const LOTIN = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h' };
const slug = (s) => String(s).toLowerCase().split('').map((c) => (LOTIN[c] !== undefined ? LOTIN[c] : c)).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'mahsulot';
const XAVFSIZ = /^[a-z0-9-]+\.yuk$/;

// fayllar: [{ nisbiy: 'Shkaf/01 Шкаф Дилафруз.yuk', matn }] -> { index, fayllar: [{ fayl, matn }], xatolar }
export function katalogTuz(fayllar) {
  const mahsulotlar = [], chiq = [], xatolar = [], band = new Set();
  for (const f of fayllar) {
    const qism = f.nisbiy.split(/[\\/]/);
    const nomi = qism[qism.length - 1].replace(/\.yuk$/i, '').trim();
    let y;
    try { y = oqiYuk(f.matn); } catch (e) { xatolar.push(`${f.nisbiy}: ${e.message}`); continue; }
    const turkum = qism.length > 1 ? qism[qism.length - 2] : (y.turkum || 'Boshqa');
    let fayl = `${slug(turkum)}-${slug(nomi)}.yuk`;
    for (let i = 2; band.has(fayl); i++) fayl = `${slug(turkum)}-${slug(nomi)}-${i}.yuk`;
    band.add(fayl);
    y.buyurtma = nomi;
    y.turkum = turkum;
    chiq.push({ fayl, matn: JSON.stringify(y) });
    mahsulotlar.push({ fayl, nomi, turkum, quti: y.upakovkalar.length, kg: y.jamiKg, model: !!y.model });
  }
  mahsulotlar.sort((a, b) => a.turkum.localeCompare(b.turkum) || a.nomi.localeCompare(b.nomi, 'ru'));
  return { index: { versiya: 1, mahsulotlar }, fayllar: chiq, xatolar };
}

export function katalogOqi(matn) {
  const k = JSON.parse(String(matn).replace(/^﻿/, ''));
  const mahsulotlar = (Array.isArray(k.mahsulotlar) ? k.mahsulotlar : [])
    .filter((m) => m && XAVFSIZ.test(String(m.fayl)))
    .map((m) => ({ fayl: m.fayl, nomi: String(m.nomi || m.fayl), turkum: String(m.turkum || 'Boshqa'), quti: Number(m.quti) || 0, kg: Number(m.kg) || 0 }));
  const turkumlar = [...new Set(mahsulotlar.map((m) => m.turkum))].sort();
  return { mahsulotlar, turkumlar };
}

export function filtrla(mahsulotlar, { turkum = '', qidiruv = '' } = {}) {
  const q = qidiruv.trim().toLowerCase();
  return mahsulotlar.filter((m) => (!turkum || m.turkum === turkum) && (!q || m.nomi.toLowerCase().includes(q)));
}

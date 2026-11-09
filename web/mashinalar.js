// Mashinalar: standart ro'yxat + sotuvchining o'z mashinalari (localStorage, bo'lmasa xotirada)
export const STANDART = [
  { nomi: 'Labo', L: 1900, W: 1400, H: 1400, maxKg: 500 },
  { nomi: 'Gazel', L: 3000, W: 2000, H: 1800, maxKg: 1500 },
  { nomi: 'Isuzu NQR', L: 5000, W: 2100, H: 2200, maxKg: 4500 },
  { nomi: 'Fura', L: 13600, W: 2450, H: 2700, maxKg: 20000 }
];

const KALIT = 'yuk-mashinalar';
let xotira = null;

export function ozMashinalar() {
  if (xotira) return xotira.slice();
  try {
    const v = JSON.parse(globalThis.localStorage.getItem(KALIT) || '[]');
    xotira = Array.isArray(v) ? v : [];
  } catch { xotira = []; }
  return xotira.slice();
}

export function ozMashinaSaqla(list) {
  xotira = list.slice();
  try { globalThis.localStorage.setItem(KALIT, JSON.stringify(xotira)); return true; } catch { return false; }
}

export function hammaMashinalar() { return STANDART.concat(ozMashinalar()); }

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

// 3D ko'rinish uchun mashina profili (metrda). oqlar - g'ildirak o'qlarining x holati
// (kuzov polining old devoridan; manfiy - kabina ostida). oraliq - kabina va kuzov orasidagi bo'shliq.
export function mashinaProfil(K) {
  const L = K.L / 1000, nom = String(K.nomi || '').toLowerCase();
  const tur = /labo|damas/.test(nom) ? 'labo' : /gazel/.test(nom) ? 'gazel' : /isuzu/.test(nom) ? 'isuzu' : /fura|tent|pritsep/.test(nom) ? 'fura'
    : L < 2.5 ? 'labo' : L < 4 ? 'gazel' : L < 9 ? 'isuzu' : 'fura';
  const P = {
    labo: { polH: 0.75, gildirakR: 0.27, kabinaL: 1.15, kabinaH: 1.85, oraliq: 0.05, rang: '#eef1f4', oqlar: [-0.6, Math.max(0.3, L - 0.5)] },
    gazel: { polH: 0.95, gildirakR: 0.35, kabinaL: 1.7, kabinaH: 2.2, oraliq: 0.1, rang: '#e8ecf1', oqlar: [-1.0, Math.max(0.4, L - 0.9)] },
    isuzu: { polH: 1.05, gildirakR: 0.45, kabinaL: 1.9, kabinaH: 2.55, oraliq: 0.15, rang: '#f3f4f6', oqlar: [-1.2, Math.max(0.5, L - 1.25)] },
    fura: { polH: 1.3, gildirakR: 0.5, kabinaL: 2.4, kabinaH: 3.6, oraliq: 0.7, rang: '#c8372d', oqlar: [-(0.7 + 2.0), -(0.7 + 0.55), L - 3.2, L - 1.9, L - 0.6] }
  }[tur];
  return { tur, ...P };
}

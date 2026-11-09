// Mashinaning 3D ko'rinishi: kabina, rama, g'ildiraklar, kuzov devorlari (shaffof), ochiq orqa eshiklar, yer.
// Koordinatalar kuzov poliga nisbatan, metrda: x - old devordan (0) eshikka (L), y - yuqoriga (pol = 0), z - eni (0..W).
import * as THREE from 'three';

const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
const quti = (g, mat, x0, y0, z0, x1, y1, z1) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  g.add(m);
  return m;
};

function soyaTekstura() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// P - mashinaProfil(K); L, W, H - kuzov o'lchami (m)
export function mashinaModeli(P, L, W, H) {
  const g = new THREE.Group();
  const yer = -P.polH;                        // yer sathi
  const kx1 = -P.oraliq, kx0 = kx1 - P.kabinaL; // kabina x oralig'i
  const qora = lam(0x2b2f35), metall = lam(0x8c96a3), oyna = lam(0x1d2a38, { transparent: true, opacity: 0.85 });

  // yer va soya
  const zamin = new THREE.Mesh(new THREE.PlaneGeometry(L + P.kabinaL + 40, W + 30), lam(0xc9c4b8));
  zamin.rotation.x = -Math.PI / 2;
  zamin.position.set((kx0 + L) / 2, yer - 0.002, W / 2);
  g.add(zamin);
  const soya = new THREE.Mesh(new THREE.PlaneGeometry(L - kx0 + 1.2, W + 1.2), new THREE.MeshBasicMaterial({ map: soyaTekstura(), transparent: true, depthWrite: false }));
  soya.rotation.x = -Math.PI / 2;
  soya.position.set((kx0 + L) / 2, yer + 0.002, W / 2);
  g.add(soya);

  // rama va pol osti
  const ramaY0 = yer + P.gildirakR * 1.05, ramaY1 = -0.1;
  quti(g, qora, kx0 + 0.2, ramaY0, W * 0.22, L - 0.05, ramaY1, W * 0.22 + 0.12);
  quti(g, qora, kx0 + 0.2, ramaY0, W * 0.78 - 0.12, L - 0.05, ramaY1, W * 0.78);
  quti(g, lam(0x4a4f57), -0.02, -0.1, -0.02, L + 0.02, 0, W + 0.02);           // pol taxtasi
  quti(g, qora, L - 0.02, yer + P.gildirakR * 0.9, 0.05, L + 0.08, yer + P.gildirakR * 0.9 + 0.12, W - 0.05); // orqa bamper
  [0.12, W - 0.32].forEach((z) => quti(g, lam(0xd62828, { emissive: 0x550000 }), L + 0.08, -0.32, z, L + 0.11, -0.2, z + 0.2)); // stop chiroqlar

  // kuzov devorlari - shaffof, yuk ko'rinib tursin
  const devor = lam(P.tur === 'fura' ? 0x9fb4c8 : 0xd5dbe2, { transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const t = 0.03;
  quti(g, devor, -t, 0, -t, L, H, 0);          // o'ng devor (z = 0)
  quti(g, devor, -t, 0, W, L, H, W + t);       // chap devor
  quti(g, devor, -t, H, -t, L, H + t, W + t);  // tom
  quti(g, lam(0xb8c0ca, { transparent: true, opacity: 0.45, depthWrite: false }), -t, 0, 0, 0, H, W); // old devor
  // karkas: ustunlar va to'sinlar
  const s = 0.05;
  [[-t, 0], [-t, W], [L - s, 0], [L - s, W]].forEach(([x, z]) => quti(g, metall, x, 0, z - s / 2, x + s, H + t, z + s / 2));
  [0, W].forEach((z) => quti(g, metall, -t, H, z - s / 2, L, H + s, z + s / 2));
  [-t, L - s].forEach((x) => quti(g, metall, x, H, -s / 2, x + s, H + s, W + s / 2));
  for (let x = 1.2; x < L - 0.6; x += 1.2) [0, W].forEach((z) => quti(g, metall, x, 0, z - 0.015, x + 0.03, H, z + 0.015));

  // orqa eshiklar - ochiq (tashqariga, devor tomon qayrilgan)
  const eshikMat = lam(0xc5ccd5, { transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
  [[0, 1, 2.8], [W, -1, -2.8]].forEach(([z, yon, a]) => {
    const tabaqa = new THREE.Group();
    tabaqa.position.set(L, 0, z);
    const e = quti(tabaqa, eshikMat, -0.015, 0, 0, 0.015, H, yon * (W / 2 - 0.01));
    e.add(new THREE.LineSegments(new THREE.EdgesGeometry(e.geometry), new THREE.LineBasicMaterial({ color: 0x7a838e })));
    tabaqa.rotation.y = a;
    g.add(tabaqa);
  });

  // kabina: yon profili (qiya old oyna) z bo'ylab cho'zilgan
  const kW = Math.min(W * 0.98, 2.5), kz0 = (W - kW) / 2;
  const y0 = yer + P.gildirakR * 0.75, y1 = yer + P.kabinaH, kL = P.kabinaL, h = y1 - y0;
  const prof = new THREE.Shape();
  prof.moveTo(kx0, y0); prof.lineTo(kx1, y0); prof.lineTo(kx1, y1);
  prof.lineTo(kx0 + 0.32 * kL, y1); prof.lineTo(kx0 + 0.06 * kL, y0 + 0.5 * h); prof.lineTo(kx0, y0 + 0.42 * h); prof.lineTo(kx0, y0);
  const kab = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: kW, bevelEnabled: false }), lam(new THREE.Color(P.rang)));
  kab.position.z = kz0;
  g.add(kab);
  // old oyna (qiya)
  const ax = kx0 + 0.06 * kL, ay = y0 + 0.5 * h, bx = kx0 + 0.32 * kL, by = y1;
  const uz = Math.hypot(bx - ax, by - ay) * 0.86, burchak = Math.atan2(by - ay, bx - ax);
  const oldOyna = new THREE.Mesh(new THREE.BoxGeometry(uz, 0.02, kW * 0.86), oyna);
  oldOyna.position.set((ax + bx) / 2 - Math.sin(burchak) * 0.012, (ay + by) / 2 + Math.cos(burchak) * 0.012, W / 2);
  oldOyna.rotation.z = burchak;
  g.add(oldOyna);
  // yon oynalar (ikkala tomonda), chiroqlar, bamper, panjara, ko'zgular
  quti(g, oyna, kx0 + 0.3 * kL, y1 - 0.36 * h, kz0 - 0.01, kx1 - 0.12 * kL, y1 - 0.08 * h, kz0 + kW + 0.01);
  quti(g, qora, kx0 - 0.06, y0, kz0 + 0.05, kx0 + 0.02, y0 + 0.16 * h, kz0 + kW - 0.05);                   // bamper
  quti(g, lam(0x3a3f46), kx0 - 0.01, y0 + 0.2 * h, W / 2 - kW * 0.25, kx0 + 0.01, y0 + 0.36 * h, W / 2 + kW * 0.25); // panjara
  [kz0 + 0.08, kz0 + kW - 0.33].forEach((z) => quti(g, lam(0xfff3c4, { emissive: 0x806a20 }), kx0 - 0.015, y0 + 0.22 * h, z, kx0 + 0.005, y0 + 0.32 * h, z + 0.25));
  [kz0 - 0.22, kz0 + kW + 0.02].forEach((z) => quti(g, qora, kx0 + 0.22 * kL, y0 + 0.62 * h, z, kx0 + 0.26 * kL, y0 + 0.8 * h, z + 0.2));
  if (P.tur === 'fura') quti(g, lam(new THREE.Color(P.rang)), kx0 + 0.45 * kL, y1, kz0 + 0.15, kx1 - 0.05, y1 + 0.45, kz0 + kW - 0.15); // tom spoyleri

  // g'ildiraklar
  const r = P.gildirakR, en = Math.max(0.18, r * 0.55);
  const balon = new THREE.CylinderGeometry(r, r, en, 28), disk = new THREE.CylinderGeometry(r * 0.55, r * 0.55, en + 0.02, 20);
  P.oqlar.forEach((x) => [-en / 2 + 0.02, W - 0.02 + en / 2].forEach((z) => {
    const b = new THREE.Mesh(balon, lam(0x1b1d21));
    b.rotation.x = Math.PI / 2; b.position.set(x, yer + r, z);
    const d = new THREE.Mesh(disk, lam(0x9aa1aa));
    d.rotation.x = Math.PI / 2; d.position.copy(b.position);
    g.add(b, d);
  }));
  return g;
}

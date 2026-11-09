// three.js 3D ko'rinish: kuzov + qutilar + yuklash animatsiyasi.
// Kuzov o'qlari: L (kabinadan eshikka) -> X, W -> Z, H -> Y (metrda). Eshik x = L tomonda.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mashinaModeli } from './mashina3d.js';
import { mashinaProfil } from './mashinalar.js';

const M = 1 / 1000;
const silliq = (t) => t * t * (3 - 2 * t);

// "#43 6/2" -> { asosiy: '6/2', nusxa: '#43' }
function nomerQism(nomer) {
  const m = /^(#\d+)\s+(.+)$/.exec(nomer);
  return m ? { asosiy: m[2], nusxa: m[1] } : { asosiy: nomer, nusxa: '' };
}

// qutining bir yuzi uchun yozuvli tekstura: katta nomer, kichik - navbat raqami va nusxa
// W - tekstura eni: ko'p qutida kichikroq, aks holda telefon GPU xotirasi to'lib qoladi
function yozuvTekstura(rang, fasad, nomer, navbat, enMm, boyMm, W = 384) {
  const asp = Math.max(0.12, Math.min(8, enMm / Math.max(1, boyMm)));
  const H = Math.max(32, Math.round(W / asp));
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = rang; g.fillRect(0, 0, W, H);
  if (fasad) {
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 10;
    for (let i = -H; i < W + H; i += 34) { g.beginPath(); g.moveTo(i, H); g.lineTo(i + H, 0); g.stroke(); }
  }
  g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
  const { asosiy, nusxa } = nomerQism(nomer);
  const kichik = `№${navbat}${nusxa ? '  ' + nusxa : ''}`;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
  const ikkiQator = H >= 110;
  let f = Math.min(ikkiQator ? H * 0.5 : H * 0.8, 150);
  g.font = `800 ${f}px system-ui, sans-serif`;
  while (f > 10 && g.measureText(asosiy).width > W * 0.9) { f -= 4; g.font = `800 ${f}px system-ui, sans-serif`; }
  if (ikkiQator) {
    g.fillText(asosiy, W / 2, H * 0.42);
    let f2 = Math.min(H * 0.22, 54);
    g.font = `600 ${f2}px system-ui, sans-serif`;
    while (f2 > 10 && g.measureText(kichik).width > W * 0.92) { f2 -= 3; g.font = `600 ${f2}px system-ui, sans-serif`; }
    g.fillText(kichik, W / 2, H * 0.8);
  } else {
    // yupqa yuz: bitta qator, butun satr enga sig'guncha kichraytiriladi
    const satr = asosiy + '  ·  ' + kichik;
    let f1 = Math.min(H * 0.8, 150);
    g.font = `800 ${f1}px system-ui, sans-serif`;
    while (f1 > 8 && g.measureText(satr).width > W * 0.94) { f1 -= 2; g.font = `800 ${f1}px system-ui, sans-serif`; }
    g.fillText(satr, W / 2, H / 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function sahnaYarat(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 300);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-4, 8, 6);
  scene.add(sun);

  const guruh = new THREE.Group();
  scene.add(guruh);
  let qutilar = [], K = null, P = null, mashina = null, mashinaKorinsin = true;
  let tanlashCb = null, belgilangan = null, kuzatish = false, nishon = null;

  function olcham() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(olcham).observe(el);
  olcham();

  (function loop() {
    requestAnimationFrame(loop);
    if (kuzatish && nishon) {   // kamera rejissyori: nishon tomon silliq suriladi
      const d = nishon.clone().sub(controls.target).multiplyScalar(0.08);
      controls.target.add(d); camera.position.add(d);
    }
    if (belgilangan) belgilangan.material.forEach((m) => m.emissive.setScalar(0.18 + 0.12 * Math.sin(performance.now() / 180)));
    controls.update();
    renderer.render(scene, camera);
  })();

  function tozala() {
    guruh.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    guruh.clear();
    qutilar = []; belgilangan = null; nishon = null;
  }

  function yozuv(matn, x, y, z, olch) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const g = c.getContext('2d');
    g.font = '800 72px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(40,46,56,.85)'; g.fillText(matn, 256, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(olch, olch / 4, 1);
    s.position.set(x, y, z);
    guruh.add(s);
  }

  // tartib: [{ n, p, qavat }] - yuklash tartibida
  function chiz(kuzov, tartib, ranglar) {
    tozala();
    K = kuzov;
    P = mashinaProfil(K);
    const L = K.L * M, W = K.W * M, H = K.H * M;
    // butun mashina (kabina bilan) markazda tursin
    guruh.position.set(-L / 2 + (P.kabinaL + P.oraliq) / 2, 0, -W / 2);
    const pol = new THREE.Mesh(new THREE.BoxGeometry(L, 0.02, W), new THREE.MeshLambertMaterial({ color: 0x8d8a84 }));
    pol.position.set(L / 2, -0.01, W / 2);
    guruh.add(pol);
    const kuzovQ = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6470 }));
    kuzovQ.position.set(L / 2, H / 2, W / 2);
    guruh.add(kuzovQ);
    mashina = mashinaModeli(P, L, W, H);
    mashina.visible = mashinaKorinsin;
    guruh.add(mashina);
    const o = Math.max(0.5, Math.min(1.4, Math.max(L, W) * 0.1));
    yozuv('KABINA', -(P.oraliq + P.kabinaL / 2), P.kabinaH - P.polH + (P.tur === 'fura' ? 0.95 : 0.45), W / 2, o);
    yozuv('ESHIK', L + 0.6, H + 0.35, W / 2, o);

    const TW = tartib.length > 250 ? 160 : tartib.length > 120 ? 224 : 384;
    tartib.forEach((t) => {
      const p = t.p, rang = ranglar[p.q.buyurtma] || '#888888', fasad = p.q.turi === 'fasad';
      const oddiy = new THREE.MeshLambertMaterial({ color: new THREE.Color(rang) });
      if (p.q.turi === 'furnitura') oddiy.color.offsetHSL(0, -0.2, 0.15);
      const yon = (en, boy) => new THREE.MeshLambertMaterial({ map: yozuvTekstura(rang, fasad, p.q.nomer, t.n, en, boy, TW) });
      // BoxGeometry yuzlari: +X (eshik tomoni, u - Z bo'ylab), -X, +Y (tepa, u - X bo'ylab), -Y, +Z (yon, u - X bo'ylab), -Z
      const mats = [yon(p.w, p.h), oddiy.clone(), yon(p.l, p.w), oddiy.clone(), yon(p.l, p.h), oddiy];
      mats.forEach((m) => { m.emissive = new THREE.Color(0xff8a00); m.emissiveIntensity = 1; m.emissive.setScalar(0); });
      const g = new THREE.BoxGeometry(p.l * M, p.h * M, p.w * M);
      const mesh = new THREE.Mesh(g, mats);
      mesh.userData = { joy: p, t, joyi: new THREE.Vector3((p.x + p.l / 2) * M, (p.z + p.h / 2) * M, (p.y + p.w / 2) * M) };
      mesh.position.copy(mesh.userData.joyi);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x1a1a1a })));
      guruh.add(mesh);
      qutilar.push(mesh);
    });
    korinish('3d');
  }

  // joylangan: nechta quti joyida turibdi; t (0..1): navbatdagi qutining harakat bosqichi
  // belgila=false: hech qaysi quti ajratilmaydi (masalan "Hammasi" ko'rinishida)
  function korsat(joylangan, t = 0, belgila = true) {
    if (!K) return;
    const L = K.L * M, H = K.H * M;
    qutilar.forEach((m, i) => {
      m.visible = i < joylangan || (i === joylangan && t > 0);
      m.position.copy(m.userData.joyi);
    });
    let faol = null;
    if (t > 0 && qutilar[joylangan]) {
      faol = qutilar[joylangan];
      const J = faol.userData.joyi, p = faol.userData.joy;
      const yarim = (p.h * M) / 2;
      // ochiq eshiklar orqasida, yerda turgan joyidan boshlanadi
      const S = new THREE.Vector3(L + 1.4 + (p.l * M) / 2, -P.polH + yarim, J.z);
      const Y1 = Math.min(H + 0.35, Math.max(J.y, yarim) + 0.3);                   // ko'tarilish balandligi
      const a = silliq(Math.min(1, t / 0.25)), b = silliq(Math.max(0, Math.min(1, (t - 0.25) / 0.55))), c = silliq(Math.max(0, (t - 0.8) / 0.2));
      faol.position.set(S.x + (J.x - S.x) * b, S.y + (Y1 - S.y) * a + (J.y - Y1) * c, S.z + (J.z - S.z) * b);
    } else if (joylangan > 0) {
      faol = qutilar[Math.min(joylangan, qutilar.length) - 1] || null;
    }
    if (!belgila) faol = null;
    if (belgilangan && belgilangan !== faol) belgilangan.material.forEach((m) => m.emissive.setScalar(0));
    belgilangan = faol;
    if (faol) nishon = guruh.localToWorld(faol.position.clone());
    return faol ? faol.userData.t : null;
  }

  function korinish(nom) {
    if (!K) return;
    const L = K.L * M, W = K.W * M, H = K.H * M, kab = P.kabinaL + P.oraliq;
    const r = Math.max(L + kab, W * 1.6, (H + P.polH) * 1.6) * Math.max(1, 1.3 / (camera.aspect || 1));
    const tg = new THREE.Vector3(0, H * 0.3, 0);
    const eshikX = L / 2 + kab / 2;   // eshikning dunyo koordinatasi (guruh siljigan)
    if (nom === 'yon') camera.position.set(0, H * 0.55, r * 1.05);
    else if (nom === 'tepa') camera.position.set(0.001, r * 1.25, 0.001);
    else if (nom === 'eshik') { camera.position.set(eshikX + Math.max(W, H) * 1.9, H * 0.8, 0); tg.set(eshikX - L * 0.3, H * 0.4, 0); }
    else camera.position.set(r * 0.75, r * 0.65, r * 0.95);
    controls.target.copy(tg);
    controls.update();
  }

  let bosh = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { bosh = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!bosh || Math.hypot(e.clientX - bosh.x, e.clientY - bosh.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects(qutilar.filter((m) => m.visible), false)[0];
    if (tanlashCb) tanlashCb(hit ? hit.object.userData.t : null);
  });

  return {
    chiz, korsat, korinish, tozala,
    kuzat(v) { kuzatish = !!v; },
    mashinaKorinsin(v) { mashinaKorinsin = !!v; if (mashina) mashina.visible = mashinaKorinsin; },
    onTanlash(cb) { tanlashCb = cb; },
    ekranNuqta(i) {
      const m = qutilar[i];
      if (!m) return null;
      const p = m.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
    }
  };
}

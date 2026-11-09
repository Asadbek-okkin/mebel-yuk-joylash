// Mahsulotning 3D ko'rinishi (.yuk dagi model: Bazis panellarining global gabaritlari).
// model: { L, W, H, ranglar: ['#hex'], panellar: [[x, y, z, dx, dy, dz, rangIndeks, fasad]] } - mm, Bazis o'qlari (Y - yuqoriga)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const M = 1 / 1000;

function guruhYasa(model) {
  const g = new THREE.Group();
  const mat = {};
  const qirra = new THREE.LineBasicMaterial({ color: 0x2a2420, transparent: true, opacity: 0.55 });
  model.panellar.forEach((p) => {
    const [x, y, z, dx, dy, dz, ri, fasad] = p;
    if (!(dx > 0 && dy > 0 && dz > 0)) return;
    const rang = model.ranglar[ri] || '#b08a64';
    const k = rang + (fasad ? 'f' : '');
    if (!mat[k]) {
      mat[k] = /^#bcd2e2$/i.test(rang)
        ? new THREE.MeshStandardMaterial({ color: rang, metalness: 0.6, roughness: 0.15 })
        : new THREE.MeshLambertMaterial({ color: new THREE.Color(rang).offsetHSL(0, 0, fasad ? 0.03 : 0) });
    }
    const geo = new THREE.BoxGeometry(dx * M, dy * M, dz * M);
    const m = new THREE.Mesh(geo, mat[k]);
    m.position.set((x + dx / 2) * M, (y + dy / 2) * M, (z + dz / 2) * M);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), qirra));
    g.add(m);
  });
  return g;
}

// fasadlar qaysi tomonda (Z bo'yicha) - kamera shu tomondan qaraydi
function oldTomon(model) {
  const f = model.panellar.filter((p) => p[7]);
  if (!f.length) return 1;
  const o = f.reduce((s, p) => s + p[2] + p[5] / 2, 0) / f.length;
  return o >= model.W / 2 ? 1 : -1;
}

function sahnaQur(model) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8478, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  scene.add(sun);
  const g = guruhYasa(model);
  g.position.set(-model.L * M / 2, 0, -model.W * M / 2);
  scene.add(g);
  const s = oldTomon(model);
  const r = Math.max(model.L, model.H, model.W) * M;
  sun.position.set(r * 0.8, r * 2, s * r * 1.5);
  return { scene, s, r };
}

// butun mahsulot kadrga sig'adigan masofa: balandlik va (kadr nisbatiga qarab) eni bo'yicha
function kameraJoyla(camera, model, s, r, aspect) {
  camera.aspect = aspect;
  const t = Math.tan((camera.fov * Math.PI) / 360);
  const kerak = Math.max(model.H, Math.max(model.L, model.W) / aspect) * M;
  const d = (kerak / 2 / t) * 1.3 + Math.max(model.L, model.W) * M * 0.5;
  const yon = new THREE.Vector3(0.5, 0.32, s * 0.8).normalize();
  const markaz = new THREE.Vector3(0, model.H * M * 0.5, 0);
  camera.position.copy(markaz).addScaledVector(yon, d);
  camera.lookAt(markaz);
  camera.updateProjectionMatrix();
}

// ---- kichik rasmlar: bitta umumiy renderer (telefonda WebGL kontekstlari cheklangan) ----
let umumiy = null;
const kesh = new Map();
export function mahsulotRasm(kalit, model, w = 320, h = 240) {
  if (kesh.has(kalit)) return kesh.get(kalit);
  try {
    if (!umumiy) {
      umumiy = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      umumiy.setPixelRatio(1);
    }
    umumiy.setSize(w, h, false);
    const { scene, s, r } = sahnaQur(model);
    const camera = new THREE.PerspectiveCamera(32, w / h, 0.05, 100);
    kameraJoyla(camera, model, s, r, w / h);
    umumiy.setClearColor(0x000000, 0);
    umumiy.render(scene, camera);
    const url = umumiy.domElement.toDataURL('image/png');
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    kesh.set(kalit, url);
    return url;
  } catch {
    return '';
  }
}

// ---- katta, aylantiriladigan ko'rinish (oynada) ----
export function mahsulotKorinish(el, model) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  el.appendChild(renderer.domElement);
  const { scene, s, r } = sahnaQur(model);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const olcham = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  olcham();
  kameraJoyla(camera, model, s, r, camera.aspect);
  controls.target.set(0, model.H * M * 0.5, 0);
  const ro = new ResizeObserver(olcham); ro.observe(el);
  let tirik = true;
  (function loop() { if (!tirik) return; requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
  return {
    yop() {
      tirik = false; ro.disconnect(); controls.dispose();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
    }
  };
}

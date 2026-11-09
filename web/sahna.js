// three.js 3D ko'rinish: kuzov + qutilar. Kuzov o'qlari: L -> X, W -> Z, H -> Y (metrda).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const M = 1 / 1000;

function shtrixTekstura(rang) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = rang; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 8;
  for (let i = -64; i < 128; i += 22) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function sahnaYarat(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-4, 8, 6);
  scene.add(sun);

  const guruh = new THREE.Group();
  scene.add(guruh);
  let qutilar = [], tanlashCb = null, oxirgi = null;

  function olcham() {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(olcham).observe(el);
  olcham();

  (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

  function tozala() {
    guruh.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); });
    guruh.clear();
    qutilar = [];
  }

  function chiz(K, natija, ranglar) {
    tozala();
    const L = K.L * M, W = K.W * M, H = K.H * M;
    guruh.position.set(-L / 2, 0, -W / 2);
    // pol
    const pol = new THREE.Mesh(new THREE.BoxGeometry(L, 0.02, W), new THREE.MeshLambertMaterial({ color: 0x8d8a84 }));
    pol.position.set(L / 2, -0.01, W / 2);
    guruh.add(pol);
    // kuzov qirralari
    const kuzov = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6470 }));
    kuzov.position.set(L / 2, H / 2, W / 2);
    guruh.add(kuzov);
    // kabina tomoni (old devor, x = 0)
    const devor = new THREE.Mesh(new THREE.BoxGeometry(0.04, H, W), new THREE.MeshLambertMaterial({ color: 0x3a4250, transparent: true, opacity: 0.55 }));
    devor.position.set(-0.02, H / 2, W / 2);
    guruh.add(devor);

    const teks = {};
    natija.joylandi.forEach((p, i) => {
      const rang = ranglar[p.q.buyurtma] || '#888888';
      let mat;
      if (p.q.turi === 'fasad') {
        if (!teks[rang]) teks[rang] = shtrixTekstura(rang);
        mat = new THREE.MeshLambertMaterial({ map: teks[rang] });
      } else {
        mat = new THREE.MeshLambertMaterial({ color: new THREE.Color(rang) });
        if (p.q.turi === 'furnitura') mat.color.offsetHSL(0, -0.2, 0.15);
      }
      const g = new THREE.BoxGeometry(p.l * M, p.h * M, p.w * M);
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.set((p.x + p.l / 2) * M, (p.z + p.h / 2) * M, (p.y + p.w / 2) * M);
      mesh.userData = { joy: p, tartib: i };
      const qirra = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x1a1a1a }));
      mesh.add(qirra);
      guruh.add(mesh);
      qutilar.push(mesh);
    });

    // kamera: kuzovga qiya yuqoridan, orqa-yon tomondan
    // tor (telefon) ekranda kamera uzoqroq turadi, kuzov to'liq ko'rinsin
    const r = Math.max(L, W * 1.6, H * 1.6) * Math.max(1, 1.3 / (camera.aspect || 1));
    camera.position.set(r * 0.75, r * 0.65, r * 0.95);
    controls.target.set(0, H * 0.35, 0);
    controls.update();
  }

  function qadam(n) {
    qutilar.forEach((m, i) => { m.visible = n === null || i < n; });
  }

  // bosish (sudrash emas) -> tanlash
  let bosh = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { bosh = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!bosh || Math.hypot(e.clientX - bosh.x, e.clientY - bosh.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects(qutilar.filter((m) => m.visible), false)[0];
    if (oxirgi) { oxirgi.material.emissive.setHex(0x000000); oxirgi = null; }
    if (hit) { oxirgi = hit.object; oxirgi.material.emissive.setHex(0x333333); }
    if (tanlashCb) tanlashCb(hit ? hit.object.userData.joy : null);
  });

  return {
    chiz, qadam,
    onTanlash(cb) { tanlashCb = cb; },
    tozala,
    // e2e uchun: i-qutining ekrandagi markazi
    ekranNuqta(i) {
      const m = qutilar[i];
      if (!m) return null;
      const p = m.getWorldPosition(new THREE.Vector3()).project(camera);
      const r = renderer.domElement.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    }
  };
}

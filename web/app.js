import { joyla, nechtaSigadi, tavsiya } from './joylash.js';
import { oqiYuk, buyurtmaQosh, qutilarniYoy } from './yukfayl.js';
import { STANDART, ozMashinalar, ozMashinaSaqla, hammaMashinalar } from './mashinalar.js';
import { NAMUNA } from './namuna.js';
import { sahnaYarat } from './sahna.js';
import { yuklashTartibi, joyMatni } from './xarita.js';
import { varaqaHTML } from './varaqa.js';

const $ = (t) => document.querySelector(`[data-test="${t}"]`);
const tonna = (kg) => (kg / 1000).toFixed(2).replace(/\.?0+$/, '') + ' t';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SABAB = { olcham: "mashinaga sig'maydigan o'lcham", ogirlik: 'yuk limiti', joy: 'joy qolmadi' };

const holat = { royxat: [], mashina: 'Gazel', tanlangan: 0, natija: null, tartib: null };
const sahna = sahnaYarat($('canvas'));
window.__sahna = sahna;

function mashina() {
  const all = hammaMashinalar();
  return all.find((m) => m.nomi === holat.mashina) || STANDART[1];
}

function mashinaRoyxati() {
  const sel = $('mashina');
  const oz = ozMashinalar();
  sel.innerHTML = STANDART.map((m) => `<option>${esc(m.nomi)}</option>`).join('') +
    (oz.length ? `<optgroup label="O'z mashinalarim">${oz.map((m) => `<option>${esc(m.nomi)}</option>`).join('')}</optgroup>` : '');
  sel.value = mashina().nomi;
  const m = mashina();
  $('mashina-olcham').textContent = `Kuzov ${m.L}×${m.W}×${m.H} mm · yuk ${tonna(m.maxKg)}`;
  $('oz-ochir').hidden = !oz.some((o) => o.nomi === m.nomi);
}

function buyurtmalarRoyxati() {
  const ul = $('buyurtmalar');
  ul.innerHTML = holat.royxat.map((b, i) => `
    <li>
      <input type="radio" name="tanlangan" value="${i}" ${i === holat.tanlangan ? 'checked' : ''} aria-label="Nechta sig'adi uchun tanlash">
      <span class="nuqta" style="background:${b.rang}"></span>
      <span class="nom" title="${esc(b.yuk.buyurtma)}">${esc(b.yuk.buyurtma)}
        <span class="meta">${b.yuk.upakovkalar.length} quti · ${b.yuk.jamiKg} kg</span></span>
      <input type="number" min="1" max="99" value="${b.soni}" data-i="${i}" aria-label="Soni">
      <button class="ochir" type="button" data-ochir="${i}" aria-label="O'chirish">×</button>
    </li>`).join('');
  $('bosh').hidden = holat.royxat.length > 0;
}

function qayta() {
  buyurtmalarRoyxati();
  mashinaRoyxati();
  $('nechta-natija').textContent = '';
  hisobId++;                       // kutilayotgan "Nechta sig'adi" javobi endi eskirgan
  $('nechta').disabled = false;
  $('popup').hidden = true;
  const K = mashina();
  const qutilar = qutilarniYoy(holat.royxat);
  const r = joyla(qutilar, K);
  holat.natija = r;
  holat.tartib = yuklashTartibi(r.joylandi);
  sahna.chiz(K, holat.tartib, holat.royxat.map((b) => b.rang));
  pl.oyna = false; pl.pos = holat.tartib.length; pl.t = 0; pl.hammasi = true;
  $('surgich').max = String(holat.tartib.length);
  plKorsat();
  $('sahna-bosh').hidden = qutilar.length > 0;

  const bor = qutilar.length > 0;
  $('sigdi').textContent = bor ? `${r.joylandi.length} / ${qutilar.length}` : '—';
  $('ogirlik').textContent = bor ? `${tonna(r.jamiKg)} / ${tonna(K.maxKg)}` : '—';
  $('hajm').textContent = bor ? `${r.hajmFoiz}%` : '—';
  const kgFoiz = Math.min(100, (100 * r.jamiKg) / K.maxKg);
  const oc = $('ogirlik-chiziq');
  oc.style.width = (bor ? kgFoiz : 0) + '%';
  oc.className = kgFoiz > 95 ? 'xavf' : kgFoiz > 80 ? 'ogoh' : '';
  $('hajm-chiziq').style.width = (bor ? r.hajmFoiz : 0) + '%';

  $('sigmadi').innerHTML = r.sigmadi.slice(0, 12).map((s) =>
    `<li>${esc(holat.royxat[s.q.buyurtma].yuk.buyurtma)} — ${esc(s.q.nomer)} (${s.q.L}×${s.q.W}×${s.q.H}, ${s.q.kg} kg): ${SABAB[s.sabab]}</li>`).join('') +
    (r.sigmadi.length > 12 ? `<li>… yana ${r.sigmadi.length - 12} ta</li>` : '');

  const tv = $('tavsiya');
  tv.className = 'tavsiya';
  if (!bor) { tv.textContent = ''; return; }
  const t = tavsiya(qutilar, STANDART);
  if (!r.sigmadi.length) {
    tv.classList.add('yaxshi');
    tv.textContent = 'Hammasi sig\'di ✓' + (t && t.mashina.nomi !== K.nomi && t.mashina.L * t.mashina.W * t.mashina.H < K.L * K.W * K.H ? ` Kichikroq mashina ham yetadi: ${t.mashina.nomi}.` : '');
  } else {
    tv.classList.add('xavf');
    tv.textContent = 'Hammasi sig\'madi. ' + (t ? (t.soni === 1 ? `Tavsiya: ${t.mashina.nomi}.` : `Kerak: ${t.soni} ta ${t.mashina.nomi}.`) : 'Ba\'zi qutilar hech qaysi mashinaga sig\'maydi.');
  }
}

// ---- yuklash pleyeri: quti eshik orqasidan ko'tarilib, joyiga suriladi ----
const pl = { pos: 0, t: 0, oyna: false, tezlik: 1, hammasi: true, kuzat: true, oxirgi: 0 };
const QUTI_SEK = 1.1;   // bitta qutining harakati (1× tezlikda)

function plKorsat() {
  const N = holat.tartib ? holat.tartib.length : 0;
  const faol = sahna.korsat(pl.pos, pl.t, !(pl.hammasi && pl.pos >= N && !pl.oyna));
  $('qadam').textContent = `${Math.min(N, pl.pos + (pl.t > 0 ? 1 : 0))} / ${N}`;
  $('surgich').value = String(pl.pos);
  $('oyna').textContent = pl.oyna ? '❚❚ Pauza' : '▶ Yuklash';
  const hud = $('hud');
  if (!N) { hud.hidden = true; return; }
  hud.hidden = false;
  if (!faol) {
    hud.innerHTML = `<div class="hud-n">${N} ta quti</div><div class="hud-t">«▶ Yuklash» - qutilar navbat bilan joyiga tushadi. Qutidagi katta yozuv - upakovka nomeri, №-navbat.</div>`;
    return;
  }
  const p = faol.p, b = holat.royxat[p.q.buyurtma];
  hud.innerHTML = `<div class="hud-n">${faol.n} <small>/ ${N}</small></div>
    <div class="hud-q"><i style="background:${b.rang}"></i><b>${esc(p.q.nomer)}</b> · ${esc(b.yuk.buyurtma)}</div>
    <div class="hud-t">${esc(p.q.kg)} kg · ${p.q.L}×${p.q.W}×${p.q.H} mm${p.q.turi === 'fasad' ? ' · <b>FASAD - ehtiyot</b>' : ''}</div>
    <div class="hud-j">${esc(joyMatni(faol, mashina()))}</div>`;
}

function plQadam(pos) {
  const N = holat.tartib ? holat.tartib.length : 0;
  pl.oyna = false; pl.t = 0; pl.hammasi = false;
  pl.pos = Math.max(0, Math.min(N, pos));
  plKorsat();
}

(function plLoop(vaqt) {
  requestAnimationFrame(plLoop);
  const dt = Math.min(0.1, (vaqt - (pl.oxirgi || vaqt)) / 1000);
  pl.oxirgi = vaqt;
  if (!pl.oyna || !holat.tartib) return;
  const N = holat.tartib.length;
  pl.t += (dt * pl.tezlik) / QUTI_SEK;
  if (pl.t >= 1) { pl.pos++; pl.t = 0; if (pl.pos >= N) { pl.pos = N; pl.oyna = false; } }
  plKorsat();
})(0);

// ---- hodisalar ----
$('fayl').addEventListener('change', async (e) => {
  const xatolar = [];
  for (const f of e.target.files) {
    try { holat.royxat = buyurtmaQosh(holat.royxat, oqiYuk(await f.text())); } catch (err) { xatolar.push(`${f.name}: ${err.message}`); }
  }
  e.target.value = '';
  $('xato').hidden = !xatolar.length;
  $('xato').textContent = xatolar.join('\n');
  qayta();
});
$('namuna').addEventListener('click', () => { holat.royxat = buyurtmaQosh(holat.royxat, structuredClone(NAMUNA)); $('xato').hidden = true; qayta(); });
$('buyurtmalar').addEventListener('change', (e) => {
  if (e.target.name === 'tanlangan') { holat.tanlangan = Number(e.target.value); $('nechta-natija').textContent = ''; return; }
  const i = e.target.dataset.i;
  if (i !== undefined) {
    const v = Math.max(1, Math.min(99, Math.floor(Number(e.target.value) || 1)));
    holat.royxat = holat.royxat.map((b, j) => (j === Number(i) ? { ...b, soni: v } : b));
    qayta();
  }
});
$('buyurtmalar').addEventListener('click', (e) => {
  const i = e.target.dataset.ochir;
  if (i === undefined) return;
  holat.royxat = holat.royxat.filter((_, j) => j !== Number(i));
  holat.tanlangan = Math.min(holat.tanlangan, Math.max(0, holat.royxat.length - 1));
  qayta();
});
$('mashina').addEventListener('change', (e) => { holat.mashina = e.target.value; qayta(); });
$('oz-ochish').addEventListener('click', () => { $('oz-forma').hidden = false; $('oz-forma').elements.nomi.focus(); });
$('oz-bekor').addEventListener('click', () => { $('oz-forma').hidden = true; });
$('oz-forma').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const nomi = f.nomi.value.trim();
  if (!nomi || STANDART.some((m) => m.nomi === nomi)) { f.nomi.setCustomValidity('Bu nom band'); f.nomi.reportValidity(); f.nomi.setCustomValidity(''); return; }
  const m = { nomi, L: Number(f.L.value), W: Number(f.W.value), H: Number(f.H.value), maxKg: Number(f.maxKg.value) };
  ozMashinaSaqla(ozMashinalar().filter((o) => o.nomi !== nomi).concat([m]));
  holat.mashina = nomi;
  e.target.reset();
  e.target.hidden = true;
  qayta();
});
$('oz-ochir').addEventListener('click', () => {
  ozMashinaSaqla(ozMashinalar().filter((o) => o.nomi !== holat.mashina));
  holat.mashina = 'Gazel';
  qayta();
});
$('nechta').addEventListener('click', () => {
  const out = $('nechta-natija');
  if (!holat.royxat.length) { out.textContent = 'Avval buyurtma qo\'shing.'; return; }
  const b = holat.royxat[holat.tanlangan], K = mashina();
  const boshqa = holat.royxat.length > 1 ? ' (boshqa buyurtmalar bilan birga)' : '';
  const yoz = (n) => { out.textContent = `${K.nomi}ga «${b.yuk.buyurtma}» dan ${n} ta komplekt sig'adi${boshqa}.`; $('nechta').disabled = false; };
  const id = ++hisobId;
  out.textContent = 'Hisoblanmoqda…';
  $('nechta').disabled = true;
  const w = hisobchi();
  if (!w) { setTimeout(() => yoz(nechtaSigadi(holat.royxat, holat.tanlangan, K)), 20); return; }
  w.onmessage = (e) => {
    if (e.data.id !== hisobId) return;   // eskirgan javob
    if (e.data.xato) { out.textContent = 'Hisoblashda xato: ' + e.data.xato; $('nechta').disabled = false; return; }
    yoz(e.data.n);
  };
  w.postMessage({ id, buyurtmalar: holat.royxat.map((x) => ({ yuk: x.yuk, soni: x.soni })), idx: holat.tanlangan, kuzov: K });
});
let hisobId = 0, worker = null;
function hisobchi() {
  if (worker === false) return null;
  try { worker = worker || new Worker(new URL('./hisob-worker.js', import.meta.url), { type: 'module' }); } catch { worker = false; return null; }
  return worker;
}
$('boshiga').addEventListener('click', () => plQadam(0));
$('orqaga').addEventListener('click', () => plQadam(pl.pos - 1));
$('oldinga').addEventListener('click', () => plQadam(pl.pos + (pl.t > 0 ? 1 : 0) + 1));
$('hammasi').addEventListener('click', () => { plQadam(Infinity); pl.hammasi = true; plKorsat(); });
$('surgich').addEventListener('input', (e) => plQadam(Number(e.target.value)));
$('oyna').addEventListener('click', () => {
  const N = holat.tartib ? holat.tartib.length : 0;
  if (!N) return;
  if (pl.oyna) { pl.oyna = false; plKorsat(); return; }
  if (pl.pos >= N) pl.pos = 0;
  pl.hammasi = false; pl.oyna = true;
});
$('tezlik').addEventListener('change', (e) => { pl.tezlik = Number(e.target.value) || 1; });
document.querySelectorAll('[data-korinish]').forEach((b) => b.addEventListener('click', () => {
  pl.kuzat = false; $('kuzat').setAttribute('aria-pressed', 'false'); sahna.kuzat(false);
  sahna.korinish(b.dataset.korinish);
}));
$('kuzat').addEventListener('click', (e) => {
  pl.kuzat = !pl.kuzat;
  e.currentTarget.setAttribute('aria-pressed', String(pl.kuzat));
  sahna.kuzat(pl.kuzat);
});
sahna.kuzat(true);

// ---- yuklash varaqasi (2D xaritalar + ro'yxat, chop etish) ----
$('varaqa-ochish').addEventListener('click', () => {
  if (!holat.tartib || !holat.tartib.length) return;
  const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
  $('varaqa-ichi').innerHTML = varaqaHTML({
    K: mashina(), tartib: holat.tartib, royxat: holat.royxat, jamiKg: holat.natija.jamiKg,
    sana: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
  });
  $('varaqa').hidden = false;
  document.body.classList.add('varaqa-ochiq');
});
$('varaqa-yop').addEventListener('click', () => { $('varaqa').hidden = true; document.body.classList.remove('varaqa-ochiq'); });
$('chop').addEventListener('click', () => window.print());

sahna.onTanlash((t) => {
  const pop = $('popup');
  if (!t) { pop.hidden = true; return; }
  const p = t.p;
  const b = holat.royxat[p.q.buyurtma];
  pop.innerHTML = `<button class="yop" type="button" aria-label="Yopish">×</button>
    <h3>${esc(p.q.nomer)} · ${esc(p.q.kg)} kg <small>№${t.n}</small></h3>
    <div>${esc(joyMatni(t, mashina()))}</div>
    <div>${esc(b.yuk.buyurtma)} · ${esc(p.q.turi)}</div>
    <div>${esc(p.q.L)}×${esc(p.q.W)}×${esc(p.q.H)} mm</div>
    ${p.q.detallar && p.q.detallar.length ? `<ul>${p.q.detallar.map((d) => `<li>${esc(d.nomi)} ${esc(d.L)}×${esc(d.W)}×${esc(d.T)}</li>`).join('')}</ul>` : ''}`;
  pop.hidden = false;
});
$('popup').addEventListener('click', (e) => { if (e.target.classList.contains('yop')) $('popup').hidden = true; });

qayta();

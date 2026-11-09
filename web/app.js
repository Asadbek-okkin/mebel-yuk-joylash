import { joyla, nechtaSigadi, tavsiya } from './joylash.js';
import { oqiYuk, buyurtmaQosh, qutilarniYoy } from './yukfayl.js';
import { STANDART, ozMashinalar, ozMashinaSaqla, hammaMashinalar } from './mashinalar.js';
import { NAMUNA } from './namuna.js';
import { sahnaYarat } from './sahna.js';

const $ = (t) => document.querySelector(`[data-test="${t}"]`);
const tonna = (kg) => (kg / 1000).toFixed(2).replace(/\.?0+$/, '') + ' t';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SABAB = { olcham: "mashinaga sig'maydigan o'lcham", ogirlik: 'yuk limiti', joy: 'joy qolmadi' };

const holat = { royxat: [], mashina: 'Gazel', tanlangan: 0, qadam: null, natija: null };
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
  holat.qadam = null;
  sahna.chiz(K, r, holat.royxat.map((b) => b.rang));
  qadamKorsat();
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

function qadamKorsat() {
  const n = holat.natija ? holat.natija.joylandi.length : 0;
  sahna.qadam(holat.qadam);
  $('qadam').textContent = holat.qadam === null ? 'Hammasi' : `${holat.qadam} / ${n}`;
}

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
$('orqaga').addEventListener('click', () => {
  const n = holat.natija.joylandi.length;
  holat.qadam = holat.qadam === null ? Math.max(0, n - 1) : Math.max(0, holat.qadam - 1);
  qadamKorsat();
});
$('oldinga').addEventListener('click', () => {
  const n = holat.natija.joylandi.length;
  if (holat.qadam === null) holat.qadam = Math.min(1, n);
  else holat.qadam = holat.qadam + 1 >= n ? null : holat.qadam + 1;
  qadamKorsat();
});
$('hammasi').addEventListener('click', () => { holat.qadam = null; qadamKorsat(); });

sahna.onTanlash((p) => {
  const pop = $('popup');
  if (!p) { pop.hidden = true; return; }
  const b = holat.royxat[p.q.buyurtma];
  pop.innerHTML = `<button class="yop" type="button" aria-label="Yopish">×</button>
    <h3>${esc(p.q.nomer)} · ${esc(p.q.kg)} kg</h3>
    <div>${esc(b.yuk.buyurtma)} · ${esc(p.q.turi)}</div>
    <div>${esc(p.q.L)}×${esc(p.q.W)}×${esc(p.q.H)} mm</div>
    ${p.q.detallar && p.q.detallar.length ? `<ul>${p.q.detallar.map((d) => `<li>${esc(d.nomi)} ${esc(d.L)}×${esc(d.W)}×${esc(d.T)}</li>`).join('')}</ul>` : ''}`;
  pop.hidden = false;
});
$('popup').addEventListener('click', (e) => { if (e.target.classList.contains('yop')) $('popup').hidden = true; });

qayta();

// Katalogni yangilash: YandexDisk\...\Upakovka katalog\<turkum>\*.yuk -> web/katalog/ (+ index.json)
//   node tarqatish/katalog.mjs            - faqat fayllarni tayyorlash
//   node tarqatish/katalog.mjs --chiqar   - + git commit, push va saytni yangilash (GitHub Pages)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { katalogTuz } from '../web/katalog.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANBA = process.env.KATALOG_MANBA || 'C:\\YandexDisk\\Базис каталог\\Upakovka katalog';
const CHIQ = path.join(ROOT, 'web', 'katalog');

function yuklar(dir, nisbiy = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name), n = nisbiy ? nisbiy + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...yuklar(p, n));
    else if (/\.yuk$/i.test(e.name)) out.push({ nisbiy: n, matn: fs.readFileSync(p, 'utf8') });
  }
  return out;
}

if (!fs.existsSync(MANBA)) { console.error('Katalog papkasi topilmadi: ' + MANBA); process.exit(1); }
const r = katalogTuz(yuklar(MANBA));
fs.mkdirSync(CHIQ, { recursive: true });
for (const f of fs.readdirSync(CHIQ)) if (/\.yuk$/.test(f) || f === 'index.json') fs.rmSync(path.join(CHIQ, f));
for (const f of r.fayllar) fs.writeFileSync(path.join(CHIQ, f.fayl), f.matn, 'utf8');
r.index.yangilangan = new Date().toISOString().slice(0, 16).replace('T', ' ');
fs.writeFileSync(path.join(CHIQ, 'index.json'), JSON.stringify(r.index, null, 1), 'utf8');
console.log(`Katalog: ${r.index.mahsulotlar.length} ta mahsulot`);
r.index.mahsulotlar.forEach((m) => console.log(`  ${m.turkum.padEnd(9)} ${m.nomi} - ${m.quti} quti, ${m.kg} kg`));
if (r.xatolar.length) console.log('O\'qilmadi:\n  ' + r.xatolar.join('\n  '));

if (process.argv.includes('--chiqar')) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, stdio: 'pipe' }).toString().trim();
  git('add', 'web/katalog');
  if (!git('status', '--porcelain', 'web/katalog')) { console.log('O\'zgarish yo\'q - sayt yangilanmadi.'); process.exit(0); }
  git('commit', '-m', `katalog: ${r.index.mahsulotlar.length} ta mahsulot (${r.index.yangilangan})`);
  git('push', 'origin', 'HEAD:main');
  // push saytni o'zi yangilamaydi (Pages workflow faqat qo'lda ishga tushadi)
  execFileSync('gh', ['workflow', 'run', 'pages.yml', '--ref', 'main'], { cwd: ROOT, stdio: 'inherit' });
  console.log('Sayt yangilanmoqda (1-2 daqiqa): https://asadbek-okkin.github.io/mebel-yuk-joylash/');
}

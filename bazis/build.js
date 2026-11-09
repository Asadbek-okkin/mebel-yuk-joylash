// core + Bazis qismi -> dist/Upakovka/Upakovka.js (Bazis `require` bilmaydi).
// node bazis/build.js           - faqat yig'ish
// node bazis/build.js --ornat   - + Bazis Scripts\Upakovka papkasiga ko'chirish
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'Upakovka');
const SCRIPTS = 'C:\\YandexDisk\\Базис каталог\\4 Документы\\Scripts';
const FONT = path.join(SCRIPTS, 'Kroy va Smeta', 'Font.json');

const core = fs.readFileSync(path.join(__dirname, 'upakovka-core.js'), 'utf8')
	.split(/\r?\n/).filter((l) => !/^if \(typeof module !== 'undefined'\)/.test(l)).join('\r\n');
const bazis = fs.readFileSync(path.join(__dirname, 'upakovka-bazis.js'), 'utf8');

fs.mkdirSync(OUT, { recursive: true });
// tartib: core (sof funksiyalar + UPAK_DEFAULT), keyin Bazis qismi (UI + sahna + fayl)
fs.writeFileSync(path.join(OUT, 'Upakovka.js'), core + '\r\n\r\n' + bazis.replace(/\r?\n/g, '\r\n'), 'utf8');
fs.copyFileSync(FONT, path.join(OUT, 'Font.json'));
fs.copyFileSync(path.join(__dirname, 'QOLLANMA.txt'), path.join(OUT, 'QOLLANMA.txt'));
console.log('build: ' + OUT);

if (process.argv.includes('--ornat')) {
	const dst = path.join(SCRIPTS, 'Upakovka');
	fs.mkdirSync(dst, { recursive: true });
	for (const f of ['Upakovka.js', 'Font.json', 'QOLLANMA.txt']) fs.copyFileSync(path.join(OUT, f), path.join(dst, f));
	console.log('ornatildi: ' + dst);
}

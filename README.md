# Mebel yuk joylash

Mebel upakovkalarini mashinaga joylash: nechta sig'adi, necha kg / tonna.

- **Sahifa (sotuvchilar uchun):** https://asadbek-okkin.github.io/mebel-yuk-joylash/
- **Bazis skripti "Upakovka":** modelni `4/1, 4/2 …` upakovkalarga bo'lib, `<model>.yuk` faylini yozadi
  (`bazis/`, yig'ish: `npm run build`, qo'llanma: `bazis/QOLLANMA.txt`).

Ish tartibi: Bazis'da `Upakovka.js` → `.yuk` faylni sotuvchiga Telegram orqali yuborish →
sotuvchi sahifada faylni qo'shadi, mashinani tanlaydi, 3D joylashuvni ko'radi.

`.yuk` formati va dizayn: `docs/superpowers/specs/2026-11-09-mebel-yuk-joylash-design.md`.

Testlar: `npm test` (mantiq), `npm run test:bazis` (Bazis mock), `node tests/e2e.mjs` (Playwright).

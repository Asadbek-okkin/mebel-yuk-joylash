# Mebel yuk joylash — dizayn (spes)

Sana: 2026-11-09
Maqsad: sotuvchilar mebel buyurtmalarini mashinaga yuklashdan oldin bilsin —
nechta upakovka, necha kg / tonna, qaysi mashinaga sig'adi, qanday joylashadi.

Loyiha ikki qismdan iborat:

1. **Bazis skripti "Upakovka"** — modelni upakovkalarga bo'ladi, `N/1 … N/N`
   bloklarini chizadi, og'irlik/o'lchamni `.yuk` fayliga yozadi.
2. **Veb-sahifa "Yuk joylash"** — sotuvchi `.yuk` fayllarini ochadi, mashina
   tanlaydi, 3D joylashuv va natijani ko'radi.

Ular orasidagi yagona bog'lanish — `.yuk` fayl formati (pastda).

---

## 1. Bazis skripti "Upakovka"

Joyi: `C:\YandexDisk\Базис каталог\4 Документы\Scripts\Upakovka\`
— `Upakovka.js`, `sozlamalar.json` (ixtiyoriy), `QOLLANMA.txt`.
Manba kodi repoda: `bazis/`.

### 1.1 Detallarni yig'ish
- Modeldagi barcha panellar aylanib chiqiladi (Smeta/Kroy bilan bir xil traversal).
- O'tkazib yuboriladi: egasi (owner zanjiri) nomi `^KROY` yoki `^UPAKOVKA`
  bo'lgan obyektlar, `UseInEstimate=false` panellar.
- Har bir panel uchun: nomi, uzunlik L, eni W (gabarit, mm), qalinlik T (mm),
  material nomi.
- Furnitura (fastener) — soni bo'yicha.

### 1.2 Og'irlik
- `kg = L/1000 × W/1000 × T/1000 × zichlik`
- Zichlik material nomidan regex bilan aniqlanadi (sozlamada o'zgartiriladi):

| Regex (material nomi) | kg/m³ |
|---|---|
| `ХДФ|ДВП|HDF` | 850 |
| `МДФ|MDF` | 750 |
| `Зеркал|Стекл|Ойна` | 2500 |
| `ЛДСП|ДСП` (va boshqa hamma) | 650 |

- Furnitura: `soni × 0.05 kg` (sozlama `furnituraKg`), qutisi 40×30×(10..30) sm.

### 1.3 Fasadni aniqlash
Panel fasad, agar nomi `Фасад|Дверь|Двер|Лицев|Fasad|Eshik` regexiga mos
kelsa, yoki materiali `МДФ` bo'lsa (sozlama `fasadRegex`, `fasadMaterialRegex`).

### 1.4 Upakovkalarga bo'lish (A qoidasi)
- Ikki guruh: **korpus** va **fasad**; har biri alohida qutilarga.
- Guruh ichida detallar maydoni bo'yicha kamayish tartibida saralanadi.
- Greedy: joriy qutiga detal qo'shiladi, agar
  - quti og'irligi + detal ≤ `maxKg` (default **40**), va
  - detal qutining asos tekisligiga sig'sa (L ≤ qutiL, W ≤ qutiW, 90° burish
    ruxsat). Birinchi detal qutining asosini belgilaydi.
  - Aks holda yangi quti ochiladi. Mayda detal avval mavjud qutilarga
    (first-fit) joylashtiriladi, joy bo'lmasa yangi quti.
- Bitta detalning o'zi `maxKg` dan og'ir bo'lsa — alohida quti + ogohlantirish.
- Furnitura bo'lsa — oxirida bitta furnitura qutisi.
- Quti o'lchami: `L = maxL + 2·zaxira`, `W = maxW + 2·zaxira`,
  `H = ΣT + 2·zaxira`, `zaxira = 20 mm` (sozlama `zaxiraMm`).
- Tartib: korpus qutilari, keyin fasad, keyin furnitura. Nomlash `N/i`,
  N — jami qutilar soni.

### 1.5 Modelga bloklar chizish
- Asl model **o'zgarmaydi**.
- Model gabaritining o'ng tomonida (+X, 500 mm oraliq) blok `UPAKOVKA`
  yaratiladi, ichida har bir quti uchun blok `N/i`:
  - detallar taxi — yupqa panellar (har biri o'z o'lchami/materiali bilan,
    ustma-ust), `UseInCutting/UseInEstimate=false`;
  - karton qobiq — sim kontur (AddContour) quti gabariti bo'yicha;
  - yorliq matni: `4/2  38.5 kg  1840×620×96` (Font.json shtrixlari,
    "Текст в модели" usuli).
- Qutilar bir qatorda, orasi 300 mm.
- Qayta ishga tushirilsa: avvalgi `UPAKOVKA` bloki o'chirilib qayta chiziladi.

### 1.6 `.yuk` fayl
- Model fayli yonida `<model nomi>.yuk` (model saqlanmagan bo'lsa
  `Documents\Upakovka\`). UTF-8 JSON, 8000 belgidan bo'lib yoziladi
  (Bazis COM string limiti).
- Oxirida xabar: `4 ta upakovka, jami 186.4 kg. Fayl: …`

### 1.7 Sozlamalar (`sozlamalar.json`, ixtiyoriy)
`maxKg`, `zaxiraMm`, `furnituraKg`, `zichlik` (regex→kg/m³ ro'yxati),
`fasadRegex`, `fasadMaterialRegex`. Yo'q bo'lsa defaultlar.

---

## 2. `.yuk` fayl formati (v1)

```json
{
  "format": "mebel-yuk",
  "versiya": 1,
  "buyurtma": "01 Кроват 1 кишилк",
  "sana": "2026-11-09",
  "jamiKg": 186.4,
  "upakovkalar": [
    {
      "nomer": "4/1",
      "turi": "korpus",
      "L": 2040, "W": 640, "H": 96,
      "kg": 39.2,
      "detallar": [
        { "nomi": "Бок", "L": 2000, "W": 600, "T": 16, "material": "ЛДСП ...", "kg": 12.5 }
      ]
    }
  ]
}
```
`turi`: `korpus | fasad | furnitura`. O'lchamlar mm, og'irlik kg.
Sahifa `format`/`versiya` ni tekshiradi; noto'g'ri fayl — tushunarli xato.

---

## 3. Veb-sahifa "Yuk joylash"

Bitta statik sahifa (`web/index.html` + JS modullar), three.js (CDN, aniq
versiya), GitHub Pages. Server yo'q, ma'lumot brauzerdan chiqmaydi.

### 3.1 Buyurtmalar
- "Fayl qo'shish" — bir nechta `.yuk`. Har bir buyurtma: rang, nomi,
  qutilar soni, kg, **soni ×N** (default 1), o'chirish.
- "Namuna" tugmasi — ichki namuna buyurtma.

### 3.2 Mashinalar
| Mashina | Kuzov U×E×B (mm) | Yuk (kg) |
|---|---|---|
| Labo | 1900×1400×1400 | 500 |
| Gazel | 3000×2000×1800 | 1500 |
| Isuzu NQR | 5000×2100×2200 | 4500 |
| Fura | 13600×2450×2700 | 20000 |

"+ O'z mashinam" — nomi, U×E×B, yuk; `localStorage`da saqlanadi
(try/catch; bo'lmasa ham ishlaydi). O'chirish mumkin.

### 3.3 Joylash algoritmi (`web/joylash.js`, sof funksiya, DOM'siz)
- Kirish: qutilar ro'yxati (L, W, H, kg, turi, buyurtma), kuzov (L, W, H, maxKg).
- Hamma qutilar **yotqizilgan** (H — vertikal), faqat 90° gorizontal burilish.
- Tartib: fasad bo'lmaganlar oldin, ichida og'irlik kamayishi bo'yicha
  (og'ir pastga/oldga); fasadlar oxirida.
- Extreme-points heuristikasi: har bir quti uchun mumkin bo'lgan nuqtalar
  (pastki-old-chap birinchi) ichidan eng past Z, keyin eng kichik X (old
  devorga yaqin), keyin Y tanlanadi.
- Cheklovlar:
  - kuzov ichida, boshqa qutilar bilan kesishmaydi;
  - **tayanch**: quti tubi maydonining ≥ 70 % i pol yoki boshqa qutilar
    ustida turadi;
  - **fasad ustiga** fasad bo'lmagan quti qo'yilmaydi;
  - jami og'irlik ≤ mashina yuki — oshsa qolganlar "sig'madi".
- Chiqish: joylanganlar (x, y, z, aylantirilganmi), sig'maganlar, jami kg,
  hajm to'lishi %.
- **Nechta sig'adi?**: tanlangan buyurtmaning ×N ini oshirib boradi (1, 2, …)
  va sig'gan eng katta N ni beradi (boshqa buyurtmalar ham hisobda).
- **Tavsiya**: hammasi sig'masa — sig'adigan eng kichik standart mashina;
  hech biri sig'masa — "k ta <eng katta mos>" (og'irlik va hajm bo'yicha
  taxminiy, so'ng joylash bilan tekshirilgan).

### 3.4 3D ko'rinish
- Kuzov — shaffof qobiq + pol; qutilar buyurtma rangida, qirralari chiziq,
  fasad qutilari chiziqli (shtrix) naqsh bilan ajralib turadi.
- OrbitControls (aylantirish/zoom, sensorli ekran).
- Qutiga bosish — yorliq: nomer, buyurtma, kg, o'lcham, detallar ro'yxati.
- "Bosqichma-bosqich" — qutilar yuklash tartibida birma-bir paydo bo'ladi
  (oldinga/orqaga tugmalari).

### 3.5 Natija paneli
Sig'di X/Y quti, sig'maganlar ro'yxati, og'irlik `1.24 t / 1.5 t` + chiziq,
hajm %, tavsiya matni.

### 3.6 Maket
Telefon (≤ 768 px): ustma-ust — Buyurtmalar, Mashina, 3D, Natija.
Kompyuter: chapda panel (buyurtma, mashina, natija), o'ngda 3D.
Interfeys tili — o'zbek (lotin).

---

## 4. Tekshirish
- **Skript mantiqi** (`bazis/upakovka-core.js` — og'irlik, fasad, bo'lish,
  nomlash) Bazis API'siz sof funksiyalar; Node testlari bilan.
  Bazis qismi (`Upakovka.js`) core'ni ichiga qo'shadi (build bosqichida
  bitta faylga yig'iladi, Bazis `require` qo'llamaydi).
- **Joylash** — Node testlari: kesishma yo'q, kuzovdan chiqmaydi, tayanch
  ≥ 70 %, fasad ustida og'ir yo'q, og'irlik limiti, "Nechta sig'adi" to'g'ri.
- **Sahifa** — Playwright: iPhone va desktop skrinshotlari; fayl yuklash,
  mashina tanlash, Nechta sig'adi, qutiga bosish.
- **Bazis** — model nusxasida (asl emas), GUI lock fayli bilan; bloklar va
  `.yuk` fayl skrinshot bilan tasdiqlanadi.

## 5. Tarqatish
- Repo `Asadbek-okkin/mebel-yuk-joylash` (ochiq), GitHub Pages — `web/`.
- Skript ZIP: `ORNATISH.bat` + `ornatish.ps1` (Kroy va Smeta usuli) +
  `QOLLANMA.txt`.
- Har bir tugagan bosqich — alohida commit; yakunda Telegram hisobot.

## 6. Kiritilmaydi (YAGNI)
Server/login, buyurtmalar bazasi, tik qo'yish, haydovchi marshruti,
PDF yuklash varaqasi, detalga upakovka raqamini yozish.

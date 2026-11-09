// Ichki namuna buyurtma (Bazis faylisiz sinab ko'rish uchun)
const d = (nomi, L, W, T, kg) => ({ nomi, L, W, T, material: 'ЛДСП 16', kg });

export const NAMUNA = {
  format: 'mebel-yuk', versiya: 1, buyurtma: 'Namuna shkaf 2 eshikli', sana: '2026-11-09', jamiKg: 125,
  upakovkalar: [
    { nomer: '5/1', turi: 'korpus', L: 2240, W: 640, H: 72, kg: 37.3, detallar: [d('Бок левый', 2200, 600, 16, 13.7), d('Бок правый', 2200, 600, 16, 13.7), d('Перегородка', 2100, 290, 16, 6.3), d('Цоколь', 1000, 100, 16, 1)] },
    { nomer: '5/2', turi: 'korpus', L: 1240, W: 640, H: 104, kg: 38.6, detallar: [d('Крыша', 1200, 600, 16, 7.5), d('Дно', 1200, 600, 16, 7.5), d('Полка', 1168, 580, 16, 7), d('Полка', 1168, 580, 16, 7), d('Полка', 1168, 580, 16, 7), d('Штанга планка', 1168, 100, 16, 1.2)] },
    { nomer: '5/3', turi: 'korpus', L: 2240, W: 1240, H: 43, kg: 18.9, detallar: [d('Задняя стенка ХДФ', 2200, 1200, 3, 6.7), d('Задняя стенка ХДФ', 2200, 1200, 3, 6.7)] },
    { nomer: '5/4', turi: 'fasad', L: 2240, W: 640, H: 72, kg: 27.2, detallar: [d('Дверь левая', 2196, 597, 16, 13.6), d('Дверь правая', 2196, 597, 16, 13.6)] },
    { nomer: '5/5', turi: 'furnitura', L: 400, W: 300, H: 100, kg: 3, detallar: [] }
  ]
};

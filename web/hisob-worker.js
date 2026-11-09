// "Nechta sig'adi?" hisobi alohida oqimda - og'ir hisobda sahifa qotmaydi
import { nechtaSigadi } from './joylash.js';

self.onmessage = (e) => {
  const { id, buyurtmalar, idx, kuzov } = e.data;
  try { self.postMessage({ id, n: nechtaSigadi(buyurtmalar, idx, kuzov) }); } catch (err) { self.postMessage({ id, xato: String(err) }); }
};

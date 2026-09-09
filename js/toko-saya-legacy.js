import { loadController } from './utils/controllerLoader.js';

loadController('./toko-saya-core.js').catch((error) => {
  console.error('[Toko Saya bootstrap] Gagal memuat controller.', error);
});

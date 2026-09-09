import { loadController } from './utils/controllerLoader.js';

loadController('./app-main-core.js').catch((error) => {
  console.error('[App bootstrap] Gagal memuat controller utama.', error);
});

import { loadController } from './utils/controllerLoader.js';

const controllerUrl = new URL('./toko-saya-core.js', import.meta.url).href;
export const bootstrapPromise = loadController(controllerUrl).catch((error) => {
  console.error('[Toko Saya bootstrap] Gagal memuat controller.', error);
  throw error;
});

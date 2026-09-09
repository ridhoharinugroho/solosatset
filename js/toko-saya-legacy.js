// SoloSatSet Toko Saya controller entrypoint.
// Defer the heavy controller module so the initial document remains responsive.
import('./toko-saya-core.js').catch((error) => {
  console.error('[Toko Saya bootstrap] Gagal memuat controller.', error);
});

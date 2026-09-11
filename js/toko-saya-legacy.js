import { loadController } from "./utils/controllerLoader.js";

export const bootstrapPromise = loadController("./toko-saya-core.js").catch((error) => {
  console.error("[Toko Saya bootstrap] Gagal memuat controller.", error);
  throw error;
});


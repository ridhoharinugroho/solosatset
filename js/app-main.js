import { loadController } from "./utils/controllerLoader.js";

export const bootstrapPromise = loadController("./app-main-core.js").catch((error) => {
  console.error("[App bootstrap] Gagal memuat controller utama.", error);
  throw error;
});


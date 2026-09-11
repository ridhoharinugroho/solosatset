import { loadController } from "./utils/controllerLoader.js";

const controllerUrl = new URL("./app-main-core.js", import.meta.url).href;
export const bootstrapPromise = loadController(controllerUrl).catch((error) => {
  console.error("[App bootstrap] Gagal memuat controller utama.", error);
  throw error;
});

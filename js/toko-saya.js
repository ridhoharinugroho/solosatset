// Toko Saya page entrypoint.
// The legacy controller stays intact while the server-authoritative admin
// security bootstrap is allowed to validate before the controller runs.
import './utils/adminSecurityBootstrap.js';
import { loadController } from './utils/controllerLoader.js';

try {
  await window.__solosatsetAdminSecurity?.refresh?.();
} catch {
  // Fail closed for admin-only UI while keeping the public storefront usable.
}

await loadController('./toko-saya-legacy.js');

// SoloSatSet application entrypoint.
// Security bootstrap runs before the monolithic controller and hardens the
// client-side admin UI hint without changing the application's public UI.
import "./utils/adminSecurityBootstrap.js";
import "./app-main.js";

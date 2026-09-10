export function initSplashScreen() {
  const splash = document.getElementById("app-splash-screen");
  if (!splash) return;
  let hidden = false;
  const hideSplash = () => {
    if (hidden) return;
    hidden = true;
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      } else if (splash) {
        splash.style.display = "none";
      }
    }, 600);
  };
  setTimeout(hideSplash, 1200);
  splash.addEventListener("click", hideSplash);
  splash.addEventListener("touchstart", hideSplash, { passive: true });
}

if (typeof window !== "undefined") {
  window.initSplashScreen = initSplashScreen;
}

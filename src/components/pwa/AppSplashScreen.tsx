"use client";

import React, { useEffect, useState } from "react";

export interface AppSplashScreenProps {
  autoDismissMs?: number;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  autoDismissMs = 1200,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  const handleDismiss = () => {
    setOpacity(0);
    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  if (!isVisible) return null;

  return (
    <div
      id="app-splash-screen"
      onClick={handleDismiss}
      onTouchStart={handleDismiss}
      style={{ opacity, transition: "opacity 600ms ease-out" }}
      className="fixed inset-0 z-[99999] bg-[#4a0419] flex items-center justify-center select-none cursor-pointer overflow-hidden p-6"
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 p-3 shadow-2xl backdrop-blur-xs flex items-center justify-center border border-white/20">
          <img
            src="/assets/img/app-logo.png"
            alt="SOPALOKA"
            className="w-full h-full object-contain drop-shadow-md"
            width={112}
            height={112}
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight leading-none drop-shadow-sm">
            SOPALOKA
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-rose-200 tracking-widest uppercase">
            Pantau Cocok Bayar
          </span>
        </div>
      </div>
    </div>
  );
};

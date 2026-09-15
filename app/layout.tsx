import type { Metadata, Viewport } from "next";
import "../css/styles.css";
import { ServiceWorkerRegister } from "../src/components/pwa/ServiceWorkerRegister";
import { AppSplashScreen } from "../src/components/pwa/AppSplashScreen";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "SOPALOKA — Jual Beli Barang Terdekat — Pantau Cocok Bayar",
  description:
    "Temukan barang terdekat di mana saja, pantau barangnya, cocokkan barangnya, hubungi penjualnya, bayar langsung ke orangnya, bawa pulang barang idamannya.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/assets/img/app-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" style={{ backgroundColor: "#ffffff" }}>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body
        style={{ backgroundColor: "#ffffff", margin: 0 }}
        className="bg-[#ffffff] text-slate-900 pb-24 md:pb-24 min-h-screen flex flex-col antialiased selection:bg-rose-900 selection:text-white font-sans"
      >
        <AppSplashScreen />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}


import React, { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentQrisFeature } from "../../src/features/payment/PaymentQrisFeature";

export const metadata: Metadata = {
  title: "Pembayaran Iklan BU - SOPALOKA",
  description: "Selesaikan pembayaran QRIS untuk aktivasi iklan Butuh Uang (BU) di SOPALOKA.",
};

export default function PembayaranQrisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-[360px] text-center shadow-2xl">
            <p className="text-slate-600 font-bold text-sm">Memuat QRIS...</p>
          </div>
        </div>
      }
    >
      <PaymentQrisFeature />
    </Suspense>
  );
}

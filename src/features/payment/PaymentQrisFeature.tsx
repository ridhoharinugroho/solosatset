"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, Loader2, CheckCircle2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export interface PaymentQrisFeatureProps {
  className?: string;
}

export const PaymentQrisFeature: React.FC<PaymentQrisFeatureProps> = ({ className = "" }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingId = searchParams.get("listing_id");
  const rawAmount = searchParams.get("amount");

  const [amount, setAmount] = useState<number>(500);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("Menunggu mutasi masuk...");

  const isCheckingRef = useRef<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let parsedAmount = Number(rawAmount);
    if (!rawAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      parsedAmount = 500;
    }
    setAmount(parsedAmount);

    if (!listingId) {
      alert("Data pembayaran tidak valid (ID Iklan hilang).");
      router.push("/toko-saya");
      return;
    }

    const startPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      pollingIntervalRef.current = setInterval(async () => {
        if (isCheckingRef.current) return;
        if (!supabase) return;

        isCheckingRef.current = true;
        try {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

          const { data, error } = await supabase
            .from("mutations")
            .select("id, amount, created_at")
            .eq("amount", parsedAmount)
            .gte("created_at", oneHourAgo)
            .limit(1);

          if (error) {
            console.error("[Polling] Error query mutations:", error);
          }

          if (data && data.length > 0) {
            // Payment verified
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setIsSuccess(true);
            setIsVerifying(false);
            setStatusText("Pembayaran Berhasil & Terverifikasi!");

            // Update status listing in Supabase
            try {
              await supabase
                .from("listings")
                .update({
                  is_bu: true,
                  payment_status: "paid",
                  qris_verified: true,
                  bu_activated_at: new Date().toISOString(),
                })
                .eq("id", listingId);

              if (typeof window !== "undefined") {
                sessionStorage.setItem("qris_success_listing_id", listingId);
              }
            } catch (updateErr) {
              console.error("Gagal update status BU:", updateErr);
            }

            setTimeout(() => {
              router.push("/toko-saya");
            }, 2500);
          }
        } catch (err) {
          console.error("Polling error:", err);
        } finally {
          isCheckingRef.current = false;
        }
      }, 4000);
    };

    const timer = setTimeout(startPolling, 2000);

    return () => {
      clearTimeout(timer);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [listingId, rawAmount, router]);

  const handleCancel = async () => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin membatalkan pembayaran? Iklan BU (draf) Anda tidak akan ditayangkan."
      )
    ) {
      setIsCancelling(true);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

      try {
        if (supabase && listingId) {
          await supabase.from("listings").delete().eq("id", listingId);
        }
      } catch (err) {
        console.error("Kesalahan saat membatalkan:", err);
      }

      router.push("/toko-saya");
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 ${className}`.trim()}
    >
      <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-[360px] text-center shadow-2xl flex flex-col items-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-12 h-12 bg-rose-100 text-rose-900 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-rose-200">
          <ScanLine className="w-6 h-6" />
        </div>

        <h3 className="mt-0 text-slate-800 font-black text-xl mb-2">Scan QRIS Iklan BU</h3>
        <p className="text-[13px] text-slate-500 mb-5 leading-relaxed">
          Selesaikan pembayaran sejumlah{" "}
          <strong className="text-rose-600">tepat sampai 3 digit terakhir</strong> agar terverifikasi
          otomatis dalam hitungan detik.
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 shadow-inner rounded-2xl mb-5 w-full flex justify-center">
          <img
            src="/assets/img/qris-traktir-kopi.jpg"
            alt="QRIS Pembayaran BU"
            className="w-52 h-52 object-contain rounded-xl mix-blend-multiply"
          />
        </div>

        <p className="text-[13px] text-slate-600 font-bold m-0 uppercase tracking-wider">
          Total Tagihan Unik:
        </p>
        <p className="text-3xl font-black text-rose-600 mt-1 mb-6 tracking-tight">
          Rp {amount.toLocaleString("id-ID")}
        </p>

        {isSuccess ? (
          <div className="w-full p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold mb-5 flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{statusText}</span>
          </div>
        ) : (
          <div className="w-full p-3.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold mb-5 flex items-center justify-center gap-2 animate-pulse shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>{statusText}</span>
          </div>
        )}

        {!isSuccess && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border-none py-3 px-4 rounded-xl cursor-pointer transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            {isCancelling ? "Membatalkan..." : "Batal / Kembali"}
          </button>
        )}
      </div>
    </div>
  );
};

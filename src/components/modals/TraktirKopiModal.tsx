import React from "react";
import { Coffee, HeartHandshake, QrCode, MessageCircle } from "lucide-react";

export interface TraktirKopiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TraktirKopiModal: React.FC<TraktirKopiModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-traktir-kopi"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="modal-content relative z-10 w-full max-w-md sm:max-w-lg max-h-[calc(100dvh-24px)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-400 text-rose-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Coffee className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                Traktir Kopi Pengembang
              </h3>
              <p className="text-[10px] sm:text-xs text-rose-200 font-medium">SOPALOKA</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 bg-slate-50/50 text-slate-800 flex-1 min-h-0 overflow-hidden flex flex-col justify-between space-y-2.5 sm:space-y-3">
          {/* Pesan Hangat */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-rose-50 to-amber-100/60 border border-amber-300/90 rounded-2xl p-3 sm:p-3.5 shadow-xs space-y-1 sm:space-y-1.5 text-left flex-shrink-0">
            <div className="flex items-center gap-1.5 text-rose-950 font-black text-xs sm:text-sm">
              <span className="p-1 bg-amber-400 text-rose-950 rounded-lg shadow-xs flex items-center justify-center">
                <HeartHandshake className="w-3.5 h-3.5" />
              </span>
              <span>Pesan dari Pengembang</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-700 leading-snug font-medium">
              Platform <b>SOPALOKA</b> 100% gratis tanpa potongan. Jika Anda terbantu, yuk traktir kopi
              pengembang agar server ini selalu aktif! ☕
            </p>
          </div>

          {/* QRIS Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 text-center space-y-2 sm:space-y-2.5 shadow-sm flex flex-col items-center justify-center flex-1 min-h-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 bg-amber-100 text-amber-900 rounded-full text-[10.5px] sm:text-xs font-black shadow-inner flex-shrink-0">
              <QrCode className="w-3.5 h-3.5 text-amber-700" />
              <span>Nominal Seikhlasnya</span>
            </div>

            {/* Official QRIS Image Container */}
            <div className="bg-white p-1.5 sm:p-2 rounded-2xl border-2 border-dashed border-amber-200 w-full max-w-[180px] sm:max-w-[220px] shadow-sm flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              <img
                id="qris-image"
                src="/assets/img/qris-traktir-kopi.jpg"
                alt="QRIS Resmi SOPALOKA - NMID ID1026575309988"
                className="block w-auto max-w-full max-h-[28dvh] sm:max-h-[36dvh] object-contain mx-auto rounded-xl"
              />
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight px-1 flex-shrink-0">
              Berapa pun apresiasi Anda sangat berarti. Terima kasih banyak! 🙏
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-0.5 flex-shrink-0">
            <a
              href="https://wa.me/6281228198765?text=Halo%20Admin%20SOPALOKA,%20saya%20sudah%20traktir%20kopi%20lewat%20QRIS.%20Semoga%20platform%20ini%20semakin%20maju!"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Konfirmasi Admin</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

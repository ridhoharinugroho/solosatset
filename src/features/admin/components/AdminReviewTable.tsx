import React, { useState, useEffect } from "react";
import {
  getAllReviews,
  toggleHideSellerReview,
  deleteSellerReview,
} from "../../../../js/services/storageReviews.js";
import {
  getAppReviews,
  toggleHideAppReview,
  deleteAppReview,
} from "../../../../js/services/storageAppReviews.js";

export interface ReviewItemData {
  id: string;
  sellerId?: string;
  buyerName?: string;
  userName?: string;
  comment?: string;
  review_text?: string;
  rating: number;
  createdAt?: string;
  created_at?: string;
  isHidden?: boolean;
  type: "seller" | "app";
}

export const AdminReviewTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"seller" | "app">("seller");
  const [reviews, setReviews] = useState<ReviewItemData[]>([]);

  const loadReviews = () => {
    try {
      if (activeTab === "seller") {
        const data = (getAllReviews() || []).map((r: Record<string, unknown>) => ({
          ...r,
          id: String(r.id),
          buyerName: String(r.buyerName || "Pengguna"),
          comment: String(r.comment || ""),
          rating: Number(r.rating || 5),
          createdAt: String(r.createdAt || new Date().toISOString()),
          isHidden: Boolean(r.isHidden),
          type: "seller" as const,
        }));
        setReviews(data);
      } else {
        const data = (getAppReviews(true) || []).map((r: Record<string, unknown>) => ({
          ...r,
          id: String(r.id),
          userName: String(r.userName || "Pengguna"),
          comment: String(r.comment || r.review_text || ""),
          rating: Number(r.rating || 5),
          createdAt: String(r.createdAt || r.created_at || new Date().toISOString()),
          isHidden: Boolean(r.isHidden),
          type: "app" as const,
        }));
        setReviews(data);
      }
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeTab]);

  const handleToggleHide = (id: string) => {
    try {
      if (activeTab === "seller") {
        toggleHideSellerReview(id);
      } else {
        toggleHideAppReview(id);
      }
      loadReviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status ulasan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) return;
    try {
      if (activeTab === "seller") {
        await deleteSellerReview(id);
      } else {
        await deleteAppReview(id);
      }
      loadReviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus ulasan.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("seller")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "seller"
              ? "bg-rose-900 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Ulasan Toko / Penjual
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("app")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "app"
              ? "bg-rose-900 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Ulasan Aplikasi & Masukan
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Belum ada ulasan dalam kategori ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Pengulas</th>
                <th className="p-3.5">Rating & Ulasan</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {reviews.map((rev) => (
                <tr
                  key={rev.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    rev.isHidden ? "opacity-75 bg-purple-950/20" : ""
                  }`}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-white">
                      {rev.buyerName || rev.userName || "Pengguna"}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="text-amber-400 font-bold mb-0.5">
                      {"★".repeat(rev.rating)} ({rev.rating})
                    </div>
                    <div className="text-slate-300 line-clamp-2">{rev.comment}</div>
                  </td>

                  <td className="p-3.5">
                    {rev.isHidden ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-900/80 text-purple-200 border border-purple-700 inline-block">
                        Disembunyikan
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700 inline-block">
                        Tampil
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleHide(rev.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      >
                        {rev.isHidden ? "Tampilkan" : "Sembunyikan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rev.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

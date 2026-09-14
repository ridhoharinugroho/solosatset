import React, { useState } from "react";

export interface ReviewFormProps {
  onSubmit: (payload: { rating: number; comment: string; productImage: string }) => Promise<unknown>;
  isDisabled?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit, isDisabled = false }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [productImage, setProductImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!comment.trim()) {
      setErrorMessage("Silakan tulis ulasan atau pengalaman transaksi Anda.");
      return;
    }

    if (!productImage.trim()) {
      setErrorMessage(
        "Ulasan ditolak sistem: Anda wajib melampirkan foto produk/barang yang dibeli sebagai bukti ulasan terverifikasi."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ rating, comment, productImage });
      setComment("");
      setProductImage("");
      setRating(5);
      setSuccessMessage("Ulasan Anda berhasil ditambahkan!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan ulasan.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4"
    >
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Tulis Ulasan Toko</h3>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-800">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800">
          {successMessage}
        </div>
      )}

      {/* Star Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Beri Rating Bintang
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              disabled={isDisabled || isSubmitting}
              className="text-2xl transition-transform active:scale-110 focus:outline-none"
            >
              <span className={star <= activeStar ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>
                ★
              </span>
            </button>
          ))}
          <span className="ml-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {activeStar} dari 5 Bintang
          </span>
        </div>
      </div>

      {/* Comment Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Ulasan & Pengalaman Transaksi
        </label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isDisabled || isSubmitting}
          placeholder="Ceritakan kepuasan Anda mengenai produk, respon penjual, atau proses COD/transaksi..."
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
        />
      </div>

      {/* Product Image Proof Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          Foto Bukti Produk/Barang (Wajib)
        </label>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isDisabled || isSubmitting}
            className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-700 dark:file:text-slate-200 transition"
          />
          <div className="text-[11px] text-slate-400 font-medium">atau masukkan URL foto produk:</div>
          <input
            type="text"
            value={productImage}
            onChange={(e) => setProductImage(e.target.value)}
            disabled={isDisabled || isSubmitting}
            placeholder="https://..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
          />
          {productImage && (
            <div className="relative inline-block mt-2">
              <img
                src={productImage}
                alt="Preview bukti barang"
                className="w-20 h-20 object-cover rounded-xl border border-slate-300 dark:border-slate-600"
              />
              <button
                type="button"
                onClick={() => setProductImage("")}
                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-rose-700"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isDisabled || isSubmitting}
        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
      >
        {isSubmitting ? "Mengirim Ulasan..." : "Kirim Ulasan Toko"}
      </button>
    </form>
  );
};

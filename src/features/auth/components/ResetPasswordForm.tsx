import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";

export interface ResetPasswordFormProps {
  onSubmit: (identifier: string) => Promise<boolean>;
  onBackToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  onBackToLogin,
  isLoading = false,
  error = null,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    const ok = await onSubmit(identifier.trim());
    if (ok) setIsSuccess(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-xs text-gray-500 mt-1">
          Masukkan nomor WhatsApp atau Email terdaftar
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {isSuccess ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-2">
          <p className="font-bold">✓ Petunjuk Reset Terkirim!</p>
          <p>Silakan cek pesan WhatsApp / Email Anda untuk mengatur ulang password.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              WhatsApp / Email Terdaftar
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="08123456789"
              required
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || !identifier.trim()}
            className="w-full justify-center py-2.5 font-bold"
          >
            {isLoading ? "Mengirim..." : "Kirim Petunjuk Reset"}
          </Button>
        </>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-medium text-gray-500 hover:text-gray-800 underline"
        >
          ← Kembali ke Login
        </button>
      </div>
    </form>
  );
};

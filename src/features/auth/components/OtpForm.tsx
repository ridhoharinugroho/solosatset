import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";

export interface OtpFormProps {
  identifier: string;
  onVerify: (otpCode: string) => Promise<boolean>;
  onBackToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const OtpForm: React.FC<OtpFormProps> = ({
  identifier,
  onVerify,
  onBackToLogin,
  isLoading = false,
  error = null,
}) => {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    onVerify(otp.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Verifikasi Kode OTP</h2>
        <p className="text-xs text-gray-500 mt-1">
          Masukkan 6 digit kode OTP yang dikirim ke <strong className="text-gray-800">{identifier}</strong>
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Kode OTP (6 Digit)
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="123456"
          maxLength={6}
          required
          className="w-full tracking-widest text-center text-lg font-mono px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={isLoading || otp.length < 4}
        className="w-full justify-center py-2.5 font-bold"
      >
        {isLoading ? "Verifikasi..." : "Verifikasi & Masuk"}
      </Button>

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

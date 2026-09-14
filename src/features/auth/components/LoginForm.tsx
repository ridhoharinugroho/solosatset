import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";

export interface LoginFormProps {
  onSubmit: (identifier: string, password?: string) => Promise<boolean>;
  onSwitchToRegister: () => void;
  onSwitchToResetPassword: () => void;
  onSendOtp: (identifier: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSwitchToRegister,
  onSwitchToResetPassword,
  onSendOtp,
  isLoading = false,
  error = null,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    onSubmit(identifier.trim(), password || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Masuk Akun SOPALOKA</h2>
        <p className="text-xs text-gray-500 mt-1">
          Gunakan Nomor WhatsApp, Email, atau Nama Toko Anda
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          WhatsApp / Email / Nama Toko
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="08123456789 / email@example.com"
          required
          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-gray-700">
            Password
          </label>
          <button
            type="button"
            onClick={onSwitchToResetPassword}
            className="text-[11px] font-medium text-red-600 hover:underline"
          >
            Lupa Password?
          </button>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
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
        {isLoading ? "Memproses..." : "Masuk Akun"}
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white px-2 text-gray-400 font-medium">atau</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => {
          if (identifier.trim()) onSendOtp(identifier.trim());
          else alert("Masukkan nomor WhatsApp terlebih dahulu untuk kirim OTP.");
        }}
        className="w-full justify-center text-xs border-gray-300"
      >
        📲 Masuk via Kode OTP WhatsApp
      </Button>

      <div className="text-center pt-2 text-xs text-gray-600">
        Belum punya akun SOPALOKA?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-red-600 hover:underline"
        >
          Daftar Gratis
        </button>
      </div>
    </form>
  );
};

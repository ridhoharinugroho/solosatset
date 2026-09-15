import React, { useState } from "react";
import { Button } from "../../../components/ui/Button";

export interface RegisterFormProps {
  onSubmit: (data: { name: string; identifier: string; storeName?: string; password?: string }) => Promise<boolean>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSwitchToLogin,
  isLoading = false,
  error = null,
}) => {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim()) return;
    onSubmit({
      name: name.trim(),
      identifier: identifier.trim(),
      storeName: storeName.trim() || undefined,
      password: password || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Daftar Akun Baru</h2>
        <p className="text-xs text-gray-500 mt-1">
          Mulai jual beli barang terdekat di SOPALOKA
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Lengkap *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Budi Santoso"
          required
          autoComplete="name"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nomor WhatsApp / Email *
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="08123456789"
          required
          autoComplete="username"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Toko (Opsional)
        </label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          placeholder="Toko Barokah Solo"
          autoComplete="organization"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={isLoading || !name.trim() || !identifier.trim()}
        className="w-full justify-center py-2.5 font-bold mt-2"
      >
        {isLoading ? "Membuat Akun..." : "Daftar Akun Sekarang"}
      </Button>

      <div className="text-center pt-2 text-xs text-gray-600">
        Sudah punya akun?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-bold text-red-600 hover:underline"
        >
          Masuk Akun
        </button>
      </div>
    </form>
  );
};

import React, { useState } from "react";

export interface AdminLoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  error?: string | null;
  isLoading?: boolean;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onLogin,
  error: externalError,
  isLoading = false,
}) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim()) {
      setLocalError("Masukkan username admin.");
      return;
    }

    if (!password) {
      setLocalError("Masukkan password admin.");
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await onLogin(username.trim(), password);
      if (!success) {
        // Error state handled by externalError or onLogin return
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || externalError;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center mx-auto text-xl font-black">
            🛡️
          </div>
          <h2 className="text-xl font-extrabold text-white">Panel Admin SOPALOKA</h2>
          <p className="text-xs text-slate-400">Masuk dengan akun administrator terverifikasi server</p>
        </div>

        {displayError && (
          <div className="p-3.5 bg-rose-950/60 text-rose-300 text-xs font-semibold rounded-2xl border border-rose-800/80 animate-shake">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Username Admin
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || isSubmitting}
              placeholder="Contoh: admin"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isSubmitting}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98]"
          >
            {isSubmitting || isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Panel Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};

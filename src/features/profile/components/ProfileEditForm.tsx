import React, { useState } from "react";
import type { UserProfile } from "../../../domain/user/user.contract";
import { Button } from "../../../components/ui/Button";

export interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (updatedFields: Partial<UserProfile>) => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profile,
  onSave,
  onCancel,
  isLoading = false,
  error = null,
  className = "",
}) => {
  const [name, setName] = useState(profile.name || "");
  const [storeName, setStoreName] = useState(profile.storeName || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [bio, setBio] = useState(profile.bio || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      storeName: storeName.trim() || name.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 text-left ${className}`.trim()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Edit Profil Pengguna</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Batal
        </button>
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
          required
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nama Toko
        </label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Nomor WhatsApp
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Bio Toko / Penjual
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
};

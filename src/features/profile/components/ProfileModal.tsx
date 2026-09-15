"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Store,
  Phone,
  Mail,
  MapPin,
  Navigation,
  FileText,
  Lock,
  Camera,
  Trash2,
  Edit3,
  Save,
  LogOut,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getCurrentUser,
  updateProfile,
  logout,
  saveUserAvatarDirectly,
  formatJoinedDate,
  formatRegionTitle,
  formatDistrictTitle,
  RegisteredUser,
} from "../../../services/authService";

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReviews?: () => void;
  onLogoutSuccess?: () => void;
  className?: string;
}

const REGIONS = [
  { id: "solo", name: "Kota Solo", districts: ["Banjarsari", "Jebres", "Laweyan", "Pasar Kliwon", "Serengan"] },
  { id: "karanganyar", name: "Karanganyar", districts: ["Jaten", "Karanganyar", "Colomadu", "Kebakkramat", "Tasikmadu", "Gondangrejo"] },
  { id: "sukoharjo", name: "Sukoharjo", districts: ["Kartasura", "Sukoharjo", "Grogol", "Baki", "Mojolaban"] },
  { id: "sragen", name: "Sragen", districts: ["Sragen", "Masaran", "Gemolong", "Gondang", "Sidoharjo"] },
  { id: "boyolali", name: "Boyolali", districts: ["Boyolali", "Mojosongo", "Teras", "Banyudono", "Ngemplak"] },
  { id: "klaten", name: "Klaten", districts: ["Klaten Utara", "Klaten Tengah", "Klaten Selatan", "Delanggu", "Ceper"] },
  { id: "wonogiri", name: "Wonogiri", districts: ["Wonogiri", "Selogiri", "Baturetno", "Pracimantoro", "Purwantoro"] },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenReviews,
  onLogoutSuccess,
  className = "",
}) => {
  const [user, setUser] = useState<RegisteredUser | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("solo");
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const syncUserState = (currentUser: RegisteredUser | null) => {
    if (!currentUser) {
      setUser(null);
      return;
    }
    setUser(currentUser);
    setName(currentUser.name || "");
    setStoreName(currentUser.storeName || "");
    setPhone(currentUser.phone || "");
    setEmail(currentUser.email || "");
    setRegion(currentUser.region || "solo");
    setDistrict(currentUser.district || "");
    setBio(currentUser.bio || "");
    setAvatar(currentUser.avatar || null);
  };

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser();
      syncUserState(current);
      setIsEditMode(false);
      setErrorMsg(null);
      setSuccessMsg(null);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const currentRegionObj = REGIONS.find((r) => r.id === region) || REGIONS[0];
  const availableDistricts = currentRegionObj.districts;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Ukuran file foto maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setAvatar(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama lengkap tidak boleh kosong.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        storeName: storeName.trim() || name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        region,
        district: district || availableDistricts[0],
        bio: bio.trim(),
        avatar,
      });

      if (updated) {
        syncUserState(updated);
        setIsEditMode(false);
        setSuccessMsg("Profil berhasil diperbarui!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan perubahan profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari akun SOPALOKA?")) {
      await logout();
      onClose();
      onLogoutSuccess?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 p-4 sm:p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full ring-2 ring-amber-400/80 bg-rose-900/60 flex items-center justify-center overflow-hidden font-black text-amber-300 text-lg shadow-inner">
                {avatar ? (
                  <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              {isEditMode && (
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-md hover:bg-amber-300 transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                {user.storeName || user.name}
              </h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <span>Member sejak {formatJoinedDate(user.createdAt)}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
                <span className="text-emerald-400 text-[10px] font-bold">Aktif</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
            aria-label="Tutup Modal Profil"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="form-user-profile-settings"
          onSubmit={handleSave}
          className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isEditMode && avatar && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleDeleteAvatar}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1 bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Foto Profil
              </button>
            </div>
          )}

          <div className="space-y-3">
            {/* 1. Nama Lengkap */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-rose-800" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditMode}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isEditMode
                    ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                    : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>

            {/* 2. Nama Toko */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-rose-800" />
                Nama Toko / Usaha
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={!isEditMode}
                placeholder="Contoh: Toko Berkah Solo"
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isEditMode
                    ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                    : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>

            {/* 3. WhatsApp & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-rose-800" />
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditMode}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isEditMode
                      ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                      : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-rose-800" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditMode}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isEditMode
                      ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                      : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            {/* 4. Wilayah BPS (Solo Raya) & Kecamatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-800" />
                  Kabupaten / Kota
                </label>
                <select
                  value={region}
                  onChange={(e) => {
                    const newReg = e.target.value;
                    setRegion(newReg);
                    const rObj = REGIONS.find((r) => r.id === newReg);
                    if (rObj && rObj.districts.length > 0) {
                      setDistrict(rObj.districts[0]);
                    }
                  }}
                  disabled={!isEditMode}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isEditMode
                      ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                      : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                  }`}
                >
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-rose-800" />
                  Kecamatan
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!isEditMode}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isEditMode
                      ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                      : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                  }`}
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      Kec. {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Bio / Deskripsi Toko */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-rose-800" />
                Bio / Deskripsi Toko
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditMode}
                rows={2}
                placeholder="Deskripsi singkat mengenai toko dan jualan Anda..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isEditMode
                    ? "bg-white border border-rose-300 focus:ring-2 focus:ring-rose-900 focus:outline-none"
                    : "bg-slate-100 border border-slate-200 text-slate-700 cursor-not-allowed"
                }`}
              />
            </div>

            {/* 6. Section Ganti Password (Hanya muncul saat Edit Mode) */}
            {isEditMode && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 mt-3 animate-fade-in">
                <h4 className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Keamanan & Ganti Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password Baru (Opsional)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-900 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi Password"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-900 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 flex items-center justify-between gap-3 bg-slate-50 flex-shrink-0">
          {/* Left: Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>

          {/* Right: View vs Edit Mode buttons */}
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit Profil</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    syncUserState(user);
                    setIsEditMode(false);
                    setErrorMsg(null);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  form="form-user-profile-settings"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-black text-white bg-rose-900 hover:bg-rose-800 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isLoading ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom Ulasan Aplikasi Link */}
        {onOpenReviews && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Suka SOPALOKA?</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReviews();
              }}
              className="text-rose-700 hover:text-rose-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Beri Ulasan Aplikasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import type { UserProfile } from "../../../domain/user/user.contract";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/common/StatusBadge";

export interface ProfileViewProps {
  profile: UserProfile;
  onEditClick?: () => void;
  className?: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onEditClick,
  className = "",
}) => {
  const locationText = [
    profile.village,
    profile.district,
    profile.region !== "all" ? profile.region : null,
  ]
    .filter(Boolean)
    .join(", ") || "Solo Raya";

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 ${className}`.trim()}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-700 font-extrabold text-2xl flex items-center justify-center border-2 border-red-200 shadow-sm overflow-hidden">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <h2 className="text-xl font-extrabold text-gray-900">{profile.name}</h2>
            <StatusBadge
              label={profile.status === "active" ? "Aktif" : profile.status}
              variant={profile.status === "active" ? "success" : "warning"}
            />
          </div>

          <p className="text-sm font-semibold text-red-600">
            🏪 {profile.storeName || profile.name}
          </p>

          <p className="text-xs text-gray-500">
            📍 {locationText}
          </p>
        </div>

        {onEditClick && (
          <Button variant="outline" size="sm" onClick={onEditClick} className="shrink-0">
            ✏️ Edit Profil
          </Button>
        )}
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
        <div className="p-3 bg-gray-50 rounded-xl space-y-0.5">
          <span className="text-gray-500 font-medium block">Nomor WhatsApp:</span>
          <span className="font-bold text-gray-900">{profile.phone || "-"}</span>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl space-y-0.5">
          <span className="text-gray-500 font-medium block">Email:</span>
          <span className="font-bold text-gray-900">{profile.email || "-"}</span>
        </div>

        {profile.bio && (
          <div className="p-3 bg-gray-50 rounded-xl sm:col-span-2 space-y-0.5">
            <span className="text-gray-500 font-medium block">Bio Toko / Penjual:</span>
            <p className="text-gray-800 font-normal leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
};

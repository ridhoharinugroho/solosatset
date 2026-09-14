import React from "react";
import { useProfile, UseProfileProps } from "./hooks/useProfile";
import { ProfileView } from "./components/ProfileView";
import { ProfileEditForm } from "./components/ProfileEditForm";

export interface ProfileFeatureProps extends UseProfileProps {
  className?: string;
}

export const ProfileFeature: React.FC<ProfileFeatureProps> = ({
  initialProfile = null,
  onUpdateProfileSubmit,
  className = "",
}) => {
  const {
    profile,
    isEditing,
    isLoading,
    error,
    startEdit,
    cancelEdit,
    updateProfile,
  } = useProfile({
    initialProfile,
    onUpdateProfileSubmit,
  });

  if (!profile) {
    return (
      <div className={`p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`.trim()}>
        <p className="text-sm font-semibold text-gray-500">
          ⚠️ Silakan masuk akun terlebih dahulu untuk melihat profil pengguna.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`.trim()}>
      {isEditing ? (
        <ProfileEditForm
          profile={profile}
          onSave={updateProfile}
          onCancel={cancelEdit}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <ProfileView
          profile={profile}
          onEditClick={startEdit}
        />
      )}
    </div>
  );
};

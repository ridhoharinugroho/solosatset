import { useState, useCallback } from "react";
import type { UserProfile } from "../../../domain/user/user.contract";
import type { UserProfileUpdateDTO } from "../../../domain/user/user.dto";
import { mapUserDtoToDomain, mapDomainToUserUpdateDto } from "../../../domain/user/user.mapper";

export interface UseProfileProps {
  initialProfile?: UserProfile | null;
  onUpdateProfileSubmit?: (data: UserProfileUpdateDTO) => Promise<boolean>;
}

export function useProfile({ initialProfile = null, onUpdateProfileSubmit }: UseProfileProps = {}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  const updateProfile = useCallback(
    async (updatedFields: Partial<UserProfile>): Promise<boolean> => {
      if (!profile) return false;
      setIsLoading(true);
      setError(null);

      const mergedProfile: UserProfile = { ...profile, ...updatedFields };
      const updateDto = mapDomainToUserUpdateDto(mergedProfile);

      try {
        if (onUpdateProfileSubmit) {
          const ok = await onUpdateProfileSubmit(updateDto);
          if (ok) {
            setProfile(mergedProfile);
            setIsEditing(false);
            setIsLoading(false);
            return true;
          }
          setError("Gagal menyimpan perubahan profil.");
          setIsLoading(false);
          return false;
        }

        // Default local update fallback
        setProfile(mergedProfile);
        setIsEditing(false);
        setIsLoading(false);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui profil.");
        setIsLoading(false);
        return false;
      }
    },
    [profile, onUpdateProfileSubmit]
  );

  return {
    profile,
    isEditing,
    isLoading,
    error,
    startEdit,
    cancelEdit,
    updateProfile,
    setProfile,
  };
}

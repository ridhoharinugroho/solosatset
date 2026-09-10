import { updateProfile, removeUserAvatar } from "../../services/auth.js";
import { sbUploadAvatar, sbUpdateUserAvatar } from "../../services/supabaseDB.js";

export async function handleAvatarUpload(file, currentUser) {
  if (!file || !currentUser) return null;
  try {
    const avatarUrl = await sbUploadAvatar(file, currentUser.id);
    if (avatarUrl) {
      await sbUpdateUserAvatar(currentUser.id, avatarUrl);
      updateProfile({ avatar: avatarUrl });
      return avatarUrl;
    }
  } catch (err) {
    console.warn("[Avatar Upload Warning]", err);
  }
  return null;
}

export function handleAvatarDelete(currentUser) {
  if (!currentUser) return false;
  try {
    removeUserAvatar();
    updateProfile({ avatar: null });
    return true;
  } catch (err) {
    console.warn("[Avatar Delete Warning]", err);
    return false;
  }
}

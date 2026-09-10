import { loginUser, registerUser, logout, getCurrentUser } from "../../services/auth.js";

export function handleLoginAction(email, password) {
  return loginUser(email, password);
}

export function handleRegisterAction(userData) {
  return registerUser(userData);
}

export function handleLogoutAction() {
  logout();
  sessionStorage.setItem("solosatset_just_logged_out", "true");
  window.location.href = "index.html";
}

export function getActiveUserSession() {
  return getCurrentUser();
}

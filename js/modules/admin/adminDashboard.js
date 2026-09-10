export function initAdminDashboardControls() {
  const adminContainer = document.getElementById("admin-dashboard-container");
  if (!adminContainer) return;
  console.log("[Admin Dashboard] Dashboard controls initialized.");
}

export function formatAdminDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

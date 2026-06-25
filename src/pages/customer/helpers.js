import API from "../../services/api";

// ─── Notification API helpers (wired to your notificationController) ──────────
export const notifAPI = {
  getAll:      (params={}) => API.get("/notifications", { params }),
  markRead:    (id)        => API.put(`/notifications/${id}/read`),
  markAllRead: ()          => API.put("/notifications/read-all"),
  remove:      (id)        => API.delete(`/notifications/${id}`),
};

// ─── Formatting helpers ─────────────────────────────────────────────────────────
export const fmt = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
  : `$${Number(n || 0).toFixed(2)}`;

export const ago = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { year:"numeric", month:"short", day:"numeric" }) : "—";

// ─── Toast (module-level singleton so any file can call toast.success(...)) ──
let _setToast = () => {};
export const registerToastSetter = (setter) => { _setToast = setter; };
export const toast = {
  success: (msg) => _setToast({ msg, type:"success" }),
  error:   (msg) => _setToast({ msg, type:"error" }),
  info:    (msg) => _setToast({ msg, type:"info" }),
};
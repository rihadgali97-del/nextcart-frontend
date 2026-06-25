// ─── Design tokens (matches Admin dashboard) ──────────────────────────────────
export const C = {
  sidebar:      "#0E2A23",
  sidebarHover: "#1a3d2f",
  gold:         "#C6A84B",
  green:        "#1D9E75",
  red:          "#D85A30",
  blue:         "#185FA5",
  purple:       "#533AB7",
  bg:           "#F3F5F1",
  card:         "#fff",
  border:       "#e8ede9",
  text:         "#1a2b1f",
  muted:        "#7a8c7e",
};

// ─── Order status styling ──────────────────────────────────────────────────────
export const STATUS = {
  pending:    { bg:"#faeeda", color:"#854F0B", icon:"⏳" },
  processing: { bg:"#e6f1fb", color:"#185FA5", icon:"⚙️" },
  shipped:    { bg:"#edf6ff", color:"#0c5a9e", icon:"🚚" },
  delivered:  { bg:"#eaf3de", color:"#3B6D11", icon:"✅" },
  cancelled:  { bg:"#fcebeb", color:"#A32D2D", icon:"✕"  },
};

// ─── Notification type styling ─────────────────────────────────────────────────
export const NOTIF_STYLE = {
  success: { icon:"✅", accent:C.green,  bg:"#eaf3de" },
  warning: { icon:"⚠️", accent:"#854F0B", bg:"#faeeda" },
  alert:   { icon:"🔒", accent:C.red,    bg:"#fcebeb" },
  info:    { icon:"ℹ️",  accent:C.blue,   bg:"#e6f1fb" },
};
export const notifStyle = (type) => NOTIF_STYLE[type] || NOTIF_STYLE.info;

// ─── Avatar palette ─────────────────────────────────────────────────────────────
export const AVATAR_COLORS = [C.green, C.blue, C.gold, C.red, C.purple, "#0F6E56"];
export const avatarColor = (s="") => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Pagination sizes ───────────────────────────────────────────────────────────
export const ITEMS_PER_PAGE    = 5;
export const PRODUCTS_PER_PAGE = 12;
export const NOTIF_PER_PAGE    = 8;
export const NEARBY_LIMIT      = 12;

// ─── Sidebar navigation config ─────────────────────────────────────────────────
export const NAV = [
  { id:"home",     label:"Dashboard",  icon:"⊞",  badge:null },
  { id:"shop",     label:"Shop",       icon:"🛍",  badge:null },
  { id:"nearby",   label:"Near Me",    icon:"📍",  badge:null },
  { id:"orders",   label:"My Orders",  icon:"📦",  badge:"orders" },
  { id:"cart",     label:"Cart",       icon:"🛒",  badge:"cart" },
  { id:"wishlist", label:"Wishlist",   icon:"❤️",  badge:"wishlist" },
  { id:"reviews",  label:"My Reviews", icon:"⭐",  badge:null },
  { id:"messages", label:"Messages",   icon:"💬",  badge:"messages" },
  { id:"profile",  label:"Profile",    icon:"👤",  badge:null },
  { id:"settings", label:"Settings",   icon:"⚙️",  badge:null },
];
import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import nextCartLogo from "../../assets/nextcart-logo.png";
import API, {
  getAdminStats,
  getAdminUsers,
  getAdminOrders,
  getAdminProducts,
  getVendors,
  updateVendorStatus,
  deleteUser,
  updateUser,
  deleteProduct,
  updateProduct,
  getAuditLogs,
  updateOrderStatus,
  getAdminSettings,
  updateAdminSettings,
} from "../../services/api";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}k`
    : `$${Number(n || 0).toFixed(0)}`;

const fmtNum = (n) => Number(n || 0).toLocaleString();

const ago = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const STATUS_STYLES = {
  pending:    { bg: "#faeeda", color: "#854F0B" },
  processing: { bg: "#e6f1fb", color: "#185FA5" },
  delivered:  { bg: "#eaf3de", color: "#3B6D11" },
  shipped:    { bg: "#eaf3de", color: "#3B6D11" },
  cancelled:  { bg: "#fcebeb", color: "#A32D2D" },
  completed:  { bg: "#eaf3de", color: "#3B6D11" },
  active:     { bg: "#eaf3de", color: "#3B6D11" },
  inactive:   { bg: "#f1efe8", color: "#5f5e5a" },
  verified:   { bg: "#eaf3de", color: "#3B6D11" },
  rejected:   { bg: "#fcebeb", color: "#A32D2D" },
  paid:       { bg: "#eaf3de", color: "#3B6D11" },
  unpaid:     { bg: "#fcebeb", color: "#A32D2D" },
};

const Pill = ({ label }) => {
  const s = STATUS_STYLES[label?.toLowerCase()] || { bg: "#f1efe8", color: "#5f5e5a" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, display: "inline-block", textTransform: "capitalize" }}>
      {label || "—"}
    </span>
  );
};

const Avatar = ({ name = "?", size = 32, bg = "#1D9E75", color = "#fff" }) => {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const AVATAR_COLORS = ["#1D9E75", "#185FA5", "#C6A84B", "#D85A30", "#533AB7", "#0F6E56"];
const avatarColor = (str = "") => AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Search + Filter bar ──────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder, filters = [], activeFilter, onFilterChange, onExportCSV, onExportPDF }) => (
  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
    <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
        fontSize: 14, color: "#7a8c7e", pointerEvents: "none" }}>🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Search…"}
        style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #e8ede9",
          borderRadius: 8, fontSize: 13, color: "#1a2b1f", outline: "none",
          background: "#fff", boxSizing: "border-box" }} />
    </div>
    {filters.map((f) => (
      <button key={f.value} onClick={() => onFilterChange(f.value)}
        style={{ padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
          border: "1px solid " + (activeFilter === f.value ? "#0E2A23" : "#e8ede9"),
          background: activeFilter === f.value ? "#0E2A23" : "#fff",
          color: activeFilter === f.value ? "#C6A84B" : "#7a8c7e", whiteSpace: "nowrap" }}>
        {f.label}
      </button>
    ))}
    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
      <button onClick={onExportCSV}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #1D9E7540",
          background: "#1D9E7510", color: "#1D9E75" }}>
        📄 Export CSV
      </button>
      <button onClick={onExportPDF}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid #D85A3040",
          background: "#D85A3010", color: "#D85A30" }}>
        📑 Export PDF
      </button>
    </div>
  </div>
);

// ─── CSV export ───────────────────────────────────────────────────────────────
const exportCSV = (rows, cols, filename) => {
  const headers = cols.map((c) => c.label).join(",");
  const body = rows.map((row) =>
    cols.map((c) => {
      const val = c.csvValue ? c.csvValue(row) : (row[c.key] ?? "");
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([headers + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename + ".csv"; a.click();
  URL.revokeObjectURL(url);
};

// ─── PDF export (opens print-ready tab, no external lib needed) ───────────────
const exportPDF = (rows, cols, title) => {
  const w = window.open("", "_blank");
  if (!w) return;
  const ths = cols.map((c) => `<th>${c.label}</th>`).join("");
  const trs = rows.map((row) =>
    "<tr>" + cols.map((c) => {
      const val = c.csvValue ? c.csvValue(row) : (row[c.key] ?? "—");
      return `<td>${String(val)}</td>`;
    }).join("") + "</tr>"
  ).join("");
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;padding:28px;color:#1a2b1f}
  h2{margin:0 0 4px;color:#0E2A23;font-size:20px}
  p.meta{margin:0 0 18px;color:#7a8c7e;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#0E2A23;color:#C6A84B;padding:9px 11px;text-align:left;font-weight:600}
  td{padding:8px 11px;border-bottom:1px solid #e8ede9}
  tr:nth-child(even) td{background:#f9fafb}
  .print-btn{margin-top:18px;padding:9px 20px;background:#0E2A23;color:#C6A84B;
    border:none;border-radius:7px;cursor:pointer;font-size:13px;font-weight:600}
  @media print{.print-btn{display:none}}
</style></head><body>
<h2>${title}</h2>
<p class="meta">Generated: ${new Date().toLocaleString()} &nbsp;·&nbsp; ${rows.length} records</p>
<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
<button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
</body></html>`);
  w.document.close();
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ede9", borderRadius: 12,
    padding: "18px 20px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", bottom: -14, right: -14, width: 64, height: 64,
      borderRadius: "50%", background: accent, opacity: 0.08 }} />
    <div style={{ fontSize: 11, color: "#7a8c7e", fontWeight: 500, marginBottom: 6, letterSpacing: ".3px" }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: "#1a2b1f", letterSpacing: "-.5px", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#7a8c7e", marginTop: 6 }}>{sub}</div>}
    <div style={{ width: 32, height: 3, borderRadius: 2, background: accent, marginTop: 12 }} />
  </div>
);

// ─── Panel wrapper ────────────────────────────────────────────────────────────
const Panel = ({ title, action, onAction, children, style = {} }) => (
  <div style={{ background: "#fff", border: "1px solid #e8ede9", borderRadius: 12,
    padding: "18px 20px", ...style }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2b1f" }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{ fontSize: 12, color: "#1D9E75", background: "none",
          border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}>{action}</button>
      )}
    </div>
    {children}
  </div>
);

// ─── Table ────────────────────────────────────────────────────────────────────
const Table = ({ cols, rows, loading }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} style={{ textAlign: "left", color: "#7a8c7e", fontWeight: 500,
              fontSize: 11, letterSpacing: ".3px", padding: "0 12px 10px 0",
              borderBottom: "1px solid #e8ede9", whiteSpace: "nowrap" }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={cols.length} style={{ padding: "24px 0", textAlign: "center", color: "#7a8c7e" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #e8ede9",
                borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Loading…
            </span>
          </td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: "32px 0", textAlign: "center", color: "#7a8c7e" }}>
            No results found
          </td></tr>
        ) : (
          rows.map((row, i) => (
            <tr key={row._id || i}
              onMouseEnter={e => e.currentTarget.style.background = "#fafbfa"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              {cols.map((c) => (
                <td key={c.key} style={{ padding: "10px 12px 10px 0",
                  borderBottom: i < rows.length - 1 ? "1px solid #e8ede9" : "none",
                  verticalAlign: "middle" }}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ─── Line Chart (pure SVG, zero dependencies) ────────────────────────────────
const LineChart = ({ datasets = [], height = 160, xLabels = [] }) => {
  if (!datasets.length || !datasets[0]?.data?.length) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#7a8c7e", fontSize: 12 }}>No data yet</div>
  );
  const allVals = datasets.flatMap((d) => d.data);
  const max = Math.max(...allVals, 1);
  const W = 460, H = height, pad = 10;
  const ptsFn = (data) => data.map((v, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - (v / max) * (H - pad * 2);
    return [x, y];
  });
  const DS_COLORS = ["#1D9E75", "#C6A84B", "#185FA5"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ width: "100%", height: H + 22 }}>
      {datasets.map((ds, di) => {
        const pts = ptsFn(ds.data);
        const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
        const area = path + ` L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
        const col = DS_COLORS[di % DS_COLORS.length];
        return (
          <g key={di}>
            <path d={area} fill={col} opacity={0.1} />
            <path d={path} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" />
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={col} />)}
          </g>
        );
      })}
      {xLabels.map((lbl, i) => {
        const x = pad + (i / Math.max(xLabels.length - 1, 1)) * (W - pad * 2);
        return <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize={9} fill="#7a8c7e">{lbl}</text>;
      })}
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#e8ede9" strokeWidth={1} />
    </svg>
  );
};

// ─── Bar Chart (pure SVG) ─────────────────────────────────────────────────────
const BarChart = ({ data = [], color = "#1D9E75", height = 130 }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 460;
  const gap = 6;
  const barW = Math.floor((W - (data.length - 1) * gap) / data.length);
  return (
    <svg viewBox={`0 0 ${W} ${height + 24}`} style={{ width: "100%", height: height + 24 }}>
      {data.map((d, i) => {
        const bh = Math.max(4, (d.value / max) * height);
        const x = i * (barW + gap);
        const y = height - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4}
              fill={color} opacity={i === data.length - 1 ? 1 : 0.55} />
            <text x={x + barW / 2} y={height + 18} textAnchor="middle" fontSize={9} fill="#7a8c7e">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={color} fontWeight="600">
              {fmtNum(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
const DonutChart = ({ slices = [], size = 120 }) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let cursor = -90;
  const r = 46, cx = size / 2, cy = size / 2;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcs = slices.map((s) => {
    const deg = (s.value / total) * 360;
    const start = cursor; cursor += deg;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + deg));
    const y2 = cy + r * Math.sin(toRad(start + deg));
    return { ...s, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${deg > 180 ? 1 : 0} 1 ${x2},${y2} Z` };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
      <circle cx={cx} cy={cy} r={30} fill="#fff" />
    </svg>
  );
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Dashboard",  icon: "⊞" },
  { id: "users",     label: "Users",      icon: "👤" },
  { id: "vendors",   label: "Vendors",    icon: "🏪" },
  { id: "products",  label: "Products",   icon: "📦" },
  { id: "orders",    label: "Orders",     icon: "🛒" },
  { id: "reviews",   label: "Reviews",    icon: "💬" },
  { id: "audit",     label: "Audit Logs", icon: "📋" },
  { id: "settings",  label: "Settings",   icon: "⚙️" },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection]           = useState("dashboard");
  const [collapsed, setCollapsed]       = useState(false);
  const [stats, setStats]               = useState(null);
  const [users, setUsers]               = useState([]);
  const [vendors, setVendors]           = useState([]);
  const [products, setProducts]         = useState([]);
  const [orders, setOrders]             = useState([]);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [settings, setSettings]         = useState(null);
  const [loading, setLoading]           = useState({});
  const [page, setPage]                 = useState({ users: 1, orders: 1, products: 1 });
  const [toast, setToast]               = useState(null);
  const [settingsForm, setSettingsForm] = useState({});
  const [adminUser]                     = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (!window.confirm("Log out of admin panel?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── Search & filter state (one per section) ────────────────────────────────
  const [userSearch,    setUserSearch]    = useState("");
  const [userFilter,    setUserFilter]    = useState("all");
  const [vendorSearch,  setVendorSearch]  = useState("");
  const [vendorFilter,  setVendorFilter]  = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [orderSearch,   setOrderSearch]   = useState("");
  const [orderFilter,   setOrderFilter]   = useState("all");
  const [auditSearch,   setAuditSearch]   = useState("");

  const [topbarSearch, setTopbarSearch] = useState("");

  // Topbar search syncs into the active section's search box
  useEffect(() => {
    if (!topbarSearch) return;
    if (section === "users")    setUserSearch(topbarSearch);
    if (section === "vendors")  setVendorSearch(topbarSearch);
    if (section === "products") setProductSearch(topbarSearch);
    if (section === "orders")   setOrderSearch(topbarSearch);
    if (section === "audit")    setAuditSearch(topbarSearch);
    if (section === "reviews")  setReviewSearch(topbarSearch);
  }, [topbarSearch, section]);

  // Clear topbar search when switching sections
  useEffect(() => { setTopbarSearch(""); }, [section]);

  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));
  const notify  = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoad("stats", true);
    try { const { data } = await getAdminStats(); setStats(data.data); }
    catch { notify("Failed to load stats", "error"); }
    finally { setLoad("stats", false); }
  }, []);

  const loadUsers = useCallback(async (p = 1) => {
    setLoad("users", true);
    try { const { data } = await getAdminUsers(p); setUsers(data.data || []); }
    catch { notify("Failed to load users", "error"); }
    finally { setLoad("users", false); }
  }, []);

  const loadVendors = useCallback(async () => {
    setLoad("vendors", true);
    try { const { data } = await getVendors(); setVendors(data.data || []); }
    catch { notify("Failed to load vendors", "error"); }
    finally { setLoad("vendors", false); }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoad("products", true);
    try { const { data } = await getAdminProducts(); setProducts(data.data || []); }
    catch { notify("Failed to load products", "error"); }
    finally { setLoad("products", false); }
  }, []);

  const loadOrders = useCallback(async (p = 1) => {
    setLoad("orders", true);
    try { const { data } = await getAdminOrders(p); setOrders(data.data || []); }
    catch { notify("Failed to load orders", "error"); }
    finally { setLoad("orders", false); }
  }, []);

  const loadAudit = useCallback(async () => {
    setLoad("audit", true);
    try { const { data } = await getAuditLogs(); setAuditLogs(data.data || []); }
    catch { notify("Failed to load audit logs", "error"); }
    finally { setLoad("audit", false); }
  }, []);

  const loadSettings = useCallback(async () => {
    setLoad("settings", true);
    try {
      const { data } = await getAdminSettings();
      setSettings(data.data); setSettingsForm(data.data || {});
    }
    catch { notify("Failed to load settings", "error"); }
    finally { setLoad("settings", false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (section === "users")    loadUsers(page.users);
    if (section === "vendors")  loadVendors();
    if (section === "products") loadProducts();
    if (section === "orders")   loadOrders(page.orders);
    if (section === "audit")    loadAudit();
    if (section === "settings") loadSettings();
  }, [section, page.users, page.orders]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUser(id); notify("User deleted"); loadUsers(page.users); }
    catch { notify("Failed to delete user", "error"); }
  };

  const handleToggleUserActive = async (user) => {
    try { await updateUser(user._id, { isActive: !user.isActive }); notify("User updated"); loadUsers(page.users); }
    catch { notify("Failed to update user", "error"); }
  };

  const handleVerifyVendor = async (id, status) => {
    try { await updateVendorStatus(id, status); notify(`Vendor ${status}`); loadVendors(); }
    catch { notify("Failed to update vendor", "error"); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await deleteProduct(id); notify("Product deleted"); loadProducts(); }
    catch { notify("Failed to delete product", "error"); }
  };

  const handleToggleProductActive = async (product) => {
    try { await updateProduct(product._id, { isActive: !product.isActive }); notify("Product updated"); loadProducts(); }
    catch { notify("Failed to update product", "error"); }
  };

  const handleOrderStatus = async (id, status) => {
    try { await updateOrderStatus(id, status); notify("Order status updated"); loadOrders(page.orders); }
    catch { notify("Failed to update order", "error"); }
  };

  const handleSaveSettings = async () => {
    try { await updateAdminSettings(settingsForm); notify("Settings saved"); }
    catch { notify("Failed to save settings", "error"); }
  };

  // ── Client-side filtering (search + filter pills) ─────────────────────────
  const q = (str, term) => str?.toLowerCase().includes(term.toLowerCase());

  const filteredUsers = users.filter((u) => {
    const ms = !userSearch || q(u.name, userSearch) || q(u.email, userSearch) || q(u._id, userSearch);
    const mf = userFilter === "all" || (userFilter === "active" ? u.isActive !== false : u.isActive === false);
    return ms && mf;
  });

  const filteredVendors = vendors.filter((v) => {
    const ms = !vendorSearch || q(v.businessName, vendorSearch) || q(v.user?.email, vendorSearch)
      || q(v._id, vendorSearch) || q(v.category, vendorSearch);
    const mf = vendorFilter === "all" || (vendorFilter === "verified" ? v.isVerified : !v.isVerified);
    return ms && mf;
  });

  const filteredProducts = products.filter((p) => {
    const ms = !productSearch || q(p.name, productSearch) || q(p._id, productSearch)
      || q(p.category?.name, productSearch) || q(p.vendor?.businessName, productSearch);
    const mf =
      productFilter === "all"      ? true :
      productFilter === "low"      ? p.stock < 10 :
      productFilter === "active"   ? p.isActive !== false :
                                     p.isActive === false;
    return ms && mf;
  });

  const filteredOrders = orders.filter((o) => {
    const ms = !orderSearch || q(o._id, orderSearch) || q(o.user?.name, orderSearch)
      || q(o.user?.email, orderSearch) || q(o.status, orderSearch);
    const mf = orderFilter === "all" || o.status === orderFilter;
    return ms && mf;
  });

  const filteredAudit = auditLogs.filter((l) =>
    !auditSearch || q(l.action, auditSearch) || q(l.target, auditSearch)
    || q(l.details, auditSearch) || q(l.adminId?.name, auditSearch) || q(l.ipAddress, auditSearch)
  );

  // ── Chart data from stats ─────────────────────────────────────────────────
  const counts = stats?.counts || {};

  const entityBarData = [
    { label: "Users",    value: counts.users    || 0 },
    { label: "Vendors",  value: counts.vendors  || 0 },
    { label: "Products", value: counts.products || 0 },
    { label: "Orders",   value: counts.orders   || 0 },
  ];

  const orderDonutData = [
    { label: "Pending",   value: counts.pendingOrders || 0,
      color: "#C6A84B" },
    { label: "Fulfilled", value: Math.max(0, (counts.orders || 0) - (counts.pendingOrders || 0)),
      color: "#1D9E75" },
    { label: "Low Stock", value: counts.lowStockProducts || 0,
      color: "#D85A30" },
  ];

  // Simulated 6-month curve from monthly total (replace with a real endpoint if you add one)
  const monthly = stats?.monthlyRevenue || 0;
  const revenueLineData = [{
    label: "Revenue",
    data: [0.58, 0.72, 0.64, 0.88, 0.95, 1].map((f) => Math.round(monthly * f)),
  }];
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION RENDERERS
  // ══════════════════════════════════════════════════════════════════════════

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Row 1 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Gross Revenue"   value={fmt(counts.grossRevenue)}     sub="All paid orders"   accent="#1D9E75" />
        <StatCard label="Platform Profit" value={fmt(counts.platformProfit)}   sub="Commission earned" accent="#C6A84B" />
        <StatCard label="Pending Orders"  value={fmtNum(counts.pendingOrders)} sub="Needs action"      accent="#D85A30" />
        <StatCard label="Total Users"     value={fmtNum(counts.users)}         sub={`${fmtNum(counts.vendors)} vendors`} accent="#185FA5" />
      </div>
      {/* Row 2 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Total Products"  value={fmtNum(counts.products)}          sub={`${fmtNum(counts.lowStockProducts)} low stock`} accent="#533AB7" />
        <StatCard label="Total Orders"    value={fmtNum(counts.orders)}            sub="All time"      accent="#0F6E56" />
        <StatCard label="Monthly Revenue" value={fmt(stats?.monthlyRevenue)}       sub="Last 30 days"  accent="#C6A84B" />
        <StatCard label="Low Stock"       value={fmtNum(counts.lowStockProducts)}  sub="< 10 units"    accent="#D85A30" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 0.75fr", gap: 14 }}>
        {/* Line — revenue trend */}
        <Panel title="Revenue Trend (6 months)">
          <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
            {revenueLineData.map((ds, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#7a8c7e" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1D9E75", display: "inline-block" }} />
                {ds.label}
              </span>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#7a8c7e" }}>
              This month: <b style={{ color: "#1a2b1f" }}>{fmt(monthly)}</b>
            </span>
          </div>
          <LineChart datasets={revenueLineData} xLabels={monthLabels} height={145} />
        </Panel>

        {/* Bar — entity counts */}
        <Panel title="Platform Entities">
          <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
            {entityBarData.map((d) => (
              <span key={d.label} style={{ fontSize: 11, color: "#7a8c7e" }}>
                <b style={{ color: "#1a2b1f" }}>{fmtNum(d.value)}</b> {d.label}
              </span>
            ))}
          </div>
          <BarChart data={entityBarData} color="#0E2A23" height={120} />
        </Panel>

        {/* Donut — order breakdown */}
        <Panel title="Order Breakdown">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <DonutChart slices={orderDonutData} size={110} />
            <div style={{ width: "100%" }}>
              {orderDonutData.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color,
                    flexShrink: 0, display: "inline-block" }} />
                  <span style={{ flex: 1, color: "#7a8c7e" }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: "#1a2b1f" }}>{fmtNum(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Recent orders + top products */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Panel title="Recent Orders" action="View all →" onAction={() => setSection("orders")}>
          <Table loading={loading.stats}
            cols={[
              { key: "user", label: "Customer", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={r.user?.name || "?"} size={28} bg={avatarColor(r.user?.name || "")} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{r.user?.name || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "#7a8c7e" }}>{r.user?.email}</div>
                  </div>
                </div>
              )},
              { key: "totalPrice", label: "Amount", render: (r) => <b>${Number(r.totalPrice).toFixed(2)}</b> },
              { key: "status",     label: "Status", render: (r) => <Pill label={r.status} /> },
              { key: "createdAt",  label: "Date",   render: (r) => ago(r.createdAt) },
            ]}
            rows={stats?.recentOrders || []}
          />
        </Panel>

        <Panel title="Top Products by Reviews" action="View all →" onAction={() => setSection("products")}>
          {(stats?.topProducts || []).map((p, i) => (
            <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
              borderBottom: i < (stats.topProducts.length - 1) ? "1px solid #e8ede9" : "none" }}>
              <div style={{ width: 24, height: 24, background: "#f3f5f1", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#7a8c7e", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#C6A84B" }}>
                  {"★".repeat(Math.round(p.averageRating || 0))}
                  {"☆".repeat(5 - Math.round(p.averageRating || 0))}
                  <span style={{ color: "#7a8c7e" }}> {p.averageRating?.toFixed(1)}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#7a8c7e", flexShrink: 0 }}>{fmtNum(p.totalReviews)} reviews</div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );

  // ── CSV/PDF column definitions (reused for export) ─────────────────────────
  const userExportCols = [
    { key: "_id",       label: "ID",      csvValue: (r) => r._id },
    { key: "name",      label: "Name",    csvValue: (r) => r.name },
    { key: "email",     label: "Email",   csvValue: (r) => r.email },
    { key: "phone",     label: "Phone",   csvValue: (r) => r.phone || "" },
    { key: "isActive",  label: "Status",  csvValue: (r) => r.isActive !== false ? "active" : "inactive" },
    { key: "createdAt", label: "Joined",  csvValue: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const vendorExportCols = [
    { key: "_id",          label: "ID",       csvValue: (r) => r._id },
    { key: "businessName", label: "Business", csvValue: (r) => r.businessName },
    { key: "email",        label: "Email",    csvValue: (r) => r.user?.email || "" },
    { key: "category",     label: "Category", csvValue: (r) => r.category || "" },
    { key: "isVerified",   label: "Verified", csvValue: (r) => r.isVerified ? "Yes" : "No" },
    { key: "rank",         label: "Rank",     csvValue: (r) => r.reputation?.rank || "" },
    { key: "createdAt",    label: "Joined",   csvValue: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const productExportCols = [
    { key: "_id",      label: "ID",       csvValue: (r) => r._id },
    { key: "name",     label: "Name",     csvValue: (r) => r.name },
    { key: "category", label: "Category", csvValue: (r) => r.category?.name || "" },
    { key: "vendor",   label: "Vendor",   csvValue: (r) => r.vendor?.businessName || "" },
    { key: "price",    label: "Price",    csvValue: (r) => Number(r.price).toFixed(2) },
    { key: "stock",    label: "Stock",    csvValue: (r) => r.stock },
    { key: "isActive", label: "Status",   csvValue: (r) => r.isActive !== false ? "active" : "inactive" },
  ];

  const orderExportCols = [
    { key: "_id",        label: "Order ID",  csvValue: (r) => r._id?.slice(-6).toUpperCase() },
    { key: "customer",   label: "Customer",  csvValue: (r) => r.user?.name || "Unknown" },
    { key: "email",      label: "Email",     csvValue: (r) => r.user?.email || "" },
    { key: "totalPrice", label: "Total",     csvValue: (r) => `$${Number(r.totalPrice).toFixed(2)}` },
    { key: "status",     label: "Status",    csvValue: (r) => r.status },
    { key: "isPaid",     label: "Payment",   csvValue: (r) => r.isPaid ? "Paid" : "Unpaid" },
    { key: "createdAt",  label: "Date",      csvValue: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const auditExportCols = [
    { key: "action",    label: "Action",  csvValue: (r) => r.action },
    { key: "target",    label: "Target",  csvValue: (r) => r.target || "" },
    { key: "details",   label: "Details", csvValue: (r) => r.details || "" },
    { key: "admin",     label: "Admin",   csvValue: (r) => r.adminId?.name || r.adminId?.email || "System" },
    { key: "ipAddress", label: "IP",      csvValue: (r) => r.ipAddress || "" },
    { key: "timestamp", label: "Time",    csvValue: (r) => new Date(r.timestamp || r.createdAt).toLocaleString() },
  ];

  // ── USERS ─────────────────────────────────────────────────────────────────
  const renderUsers = () => (
    <Panel title={`Users (${filteredUsers.length} of ${users.length})`}>
      <SearchBar value={userSearch} onChange={setUserSearch}
        placeholder="Search by name, email, or ID…"
        filters={[
          { label: "All",      value: "all"      },
          { label: "Active",   value: "active"   },
          { label: "Inactive", value: "inactive" },
        ]}
        activeFilter={userFilter} onFilterChange={setUserFilter}
        onExportCSV={() => exportCSV(filteredUsers, userExportCols, "users_export")}
        onExportPDF={() => exportPDF(filteredUsers, userExportCols, "Users Report")}
      />
      <Table loading={loading.users}
        cols={[
          { key: "name", label: "User", render: (r) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={r.name} size={30} bg={avatarColor(r.name)} />
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#7a8c7e" }}>{r.email}</div>
              </div>
            </div>
          )},
          { key: "_id",       label: "ID",     render: (r) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7a8c7e" }}>{r._id?.slice(-8)}</span> },
          { key: "phone",     label: "Phone",  render: (r) => r.phone || "—" },
          { key: "isActive",  label: "Status", render: (r) => <Pill label={r.isActive !== false ? "active" : "inactive"} /> },
          { key: "createdAt", label: "Joined", render: (r) => ago(r.createdAt) },
          { key: "actions",   label: "Actions", render: (r) => (
            <div style={{ display: "flex", gap: 6 }}>
              <ActionBtn label={r.isActive !== false ? "Deactivate" : "Activate"}
                color="#185FA5" onClick={() => handleToggleUserActive(r)} />
              <ActionBtn label="Delete" color="#D85A30" onClick={() => handleDeleteUser(r._id)} />
            </div>
          )},
        ]}
        rows={filteredUsers}
      />
      <Pagination page={page.users} onChange={(p) => setPage((prev) => ({ ...prev, users: p }))} />
    </Panel>
  );

  // ── VENDORS ───────────────────────────────────────────────────────────────
  const renderVendors = () => (
    <Panel title={`Vendors (${filteredVendors.length} of ${vendors.length})`}>
      <SearchBar value={vendorSearch} onChange={setVendorSearch}
        placeholder="Search by name, email, category, or ID…"
        filters={[
          { label: "All",        value: "all"        },
          { label: "Verified",   value: "verified"   },
          { label: "Unverified", value: "unverified" },
        ]}
        activeFilter={vendorFilter} onFilterChange={setVendorFilter}
        onExportCSV={() => exportCSV(filteredVendors, vendorExportCols, "vendors_export")}
        onExportPDF={() => exportPDF(filteredVendors, vendorExportCols, "Vendors Report")}
      />
      <Table loading={loading.vendors}
        cols={[
          { key: "businessName", label: "Business", render: (r) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={r.businessName || r.user?.name || "?"} size={30} bg={avatarColor(r.businessName || "")} />
              <div>
                <div style={{ fontWeight: 500 }}>{r.businessName}</div>
                <div style={{ fontSize: 11, color: "#7a8c7e" }}>{r.user?.email}</div>
              </div>
            </div>
          )},
          { key: "_id",          label: "ID",       render: (r) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7a8c7e" }}>{r._id?.slice(-8)}</span> },
          { key: "category",     label: "Category", render: (r) => r.category || "—" },
          { key: "verification", label: "Status",   render: (r) => <Pill label={r.verification?.status || (r.isVerified ? "verified" : "pending")} /> },
          { key: "reputation",   label: "Rank",     render: (r) => <span style={{ fontSize: 12, fontWeight: 500, color: "#C6A84B" }}>{r.reputation?.rank || "—"}</span> },
          { key: "createdAt",    label: "Joined",   render: (r) => ago(r.createdAt) },
          { key: "actions",      label: "Actions",  render: (r) => (
            <div style={{ display: "flex", gap: 6 }}>
              {!r.isVerified && <ActionBtn label="Verify" color="#1D9E75" onClick={() => handleVerifyVendor(r._id, "verified")} />}
              <ActionBtn label="Reject" color="#D85A30" onClick={() => handleVerifyVendor(r._id, "rejected")} />
            </div>
          )},
        ]}
        rows={filteredVendors}
      />
    </Panel>
  );

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
  const renderProducts = () => (
    <Panel title={`Products (${filteredProducts.length} of ${products.length})`}>
      <SearchBar value={productSearch} onChange={setProductSearch}
        placeholder="Search by name, category, vendor, or ID…"
        filters={[
          { label: "All",       value: "all"      },
          { label: "Active",    value: "active"   },
          { label: "Inactive",  value: "inactive" },
          { label: "Low Stock", value: "low"      },
        ]}
        activeFilter={productFilter} onFilterChange={setProductFilter}
        onExportCSV={() => exportCSV(filteredProducts, productExportCols, "products_export")}
        onExportPDF={() => exportPDF(filteredProducts, productExportCols, "Products Report")}
      />
      <Table loading={loading.products}
        cols={[
          { key: "name", label: "Product", render: (r) => (
            <div>
              <div style={{ fontWeight: 500, maxWidth: 200, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "#7a8c7e" }}>{r.category?.name}</div>
            </div>
          )},
          { key: "_id",      label: "ID",     render: (r) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#7a8c7e" }}>{r._id?.slice(-8)}</span> },
          { key: "vendor",   label: "Vendor", render: (r) => r.vendor?.businessName || "—" },
          { key: "price",    label: "Price",  render: (r) => `$${Number(r.price).toFixed(2)}` },
          { key: "stock",    label: "Stock",  render: (r) => (
            <span style={{ color: r.stock < 10 ? "#D85A30" : "#1a2b1f", fontWeight: r.stock < 10 ? 600 : 400 }}>
              {r.stock < 10 ? `⚠ ${r.stock}` : r.stock}
            </span>
          )},
          { key: "isActive", label: "Status", render: (r) => <Pill label={r.isActive !== false ? "active" : "inactive"} /> },
          { key: "actions",  label: "Actions", render: (r) => (
            <div style={{ display: "flex", gap: 6 }}>
              <ActionBtn label={r.isActive !== false ? "Deactivate" : "Activate"}
                color="#185FA5" onClick={() => handleToggleProductActive(r)} />
              <ActionBtn label="Delete" color="#D85A30" onClick={() => handleDeleteProduct(r._id)} />
            </div>
          )},
        ]}
        rows={filteredProducts}
      />
    </Panel>
  );

  // ── ORDERS ────────────────────────────────────────────────────────────────
  const renderOrders = () => (
    <Panel title={`Orders (${filteredOrders.length} of ${orders.length})`}>
      <SearchBar value={orderSearch} onChange={setOrderSearch}
        placeholder="Search by order ID, customer name, email, or status…"
        filters={[
          { label: "All",        value: "all"        },
          { label: "Pending",    value: "pending"    },
          { label: "Processing", value: "processing" },
          { label: "Shipped",    value: "shipped"    },
          { label: "Delivered",  value: "delivered"  },
          { label: "Cancelled",  value: "cancelled"  },
        ]}
        activeFilter={orderFilter} onFilterChange={setOrderFilter}
        onExportCSV={() => exportCSV(filteredOrders, orderExportCols, "orders_export")}
        onExportPDF={() => exportPDF(filteredOrders, orderExportCols, "Orders Report")}
      />
      <Table loading={loading.orders}
        cols={[
          { key: "_id", label: "Order ID", render: (r) => (
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>#{r._id?.slice(-6).toUpperCase()}</span>
          )},
          { key: "user", label: "Customer", render: (r) => (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={r.user?.name || "?"} size={26} bg={avatarColor(r.user?.name || "")} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{r.user?.name || "Unknown"}</div>
                <div style={{ fontSize: 10, color: "#7a8c7e" }}>{r.user?.email}</div>
              </div>
            </div>
          )},
          { key: "totalPrice", label: "Total",   render: (r) => <b>${Number(r.totalPrice).toFixed(2)}</b> },
          { key: "status",     label: "Status",  render: (r) => <Pill label={r.status} /> },
          { key: "isPaid",     label: "Payment", render: (r) => <Pill label={r.isPaid ? "paid" : "unpaid"} /> },
          { key: "createdAt",  label: "Date",    render: (r) => ago(r.createdAt) },
          { key: "actions",    label: "Update",  render: (r) => (
            <select defaultValue={r.status} onChange={(e) => handleOrderStatus(r._id, e.target.value)}
              style={{ fontSize: 11, padding: "4px 6px", border: "1px solid #e8ede9",
                borderRadius: 6, background: "#fff", cursor: "pointer", color: "#1a2b1f" }}>
              {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )},
        ]}
        rows={filteredOrders}
      />
      <Pagination page={page.orders} onChange={(p) => setPage((prev) => ({ ...prev, orders: p }))} />
    </Panel>
  );

  // ── AUDIT LOGS ────────────────────────────────────────────────────────────
  const renderAudit = () => (
    <Panel title={`Audit Logs (${filteredAudit.length})`}>
      <SearchBar value={auditSearch} onChange={setAuditSearch}
        placeholder="Search by action, target, admin, or IP…"
        filters={[]}
        activeFilter="all" onFilterChange={() => {}}
        onExportCSV={() => exportCSV(filteredAudit, auditExportCols, "audit_export")}
        onExportPDF={() => exportPDF(filteredAudit, auditExportCols, "Audit Logs Report")}
      />
      <Table loading={loading.audit}
        cols={[
          { key: "action", label: "Action", render: (r) => (
            <span style={{ background: "#e6f1fb", color: "#185FA5", padding: "2px 8px",
              borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: "monospace" }}>{r.action}</span>
          )},
          { key: "target",    label: "Target",  render: (r) => r.target || "—" },
          { key: "details",   label: "Details", render: (r) => <span style={{ color: "#7a8c7e", fontSize: 12 }}>{r.details}</span> },
          { key: "adminId",   label: "Admin",   render: (r) => r.adminId?.name || r.adminId?.email || "System" },
          { key: "ipAddress", label: "IP",      render: (r) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{r.ipAddress}</span> },
          { key: "timestamp", label: "Time",    render: (r) => ago(r.timestamp || r.createdAt) },
        ]}
        rows={filteredAudit}
      />
    </Panel>
  );

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  const inputStyle = { width: 300, padding: "8px 12px", border: "1px solid #e8ede9",
    borderRadius: 8, fontSize: 13, color: "#1a2b1f", outline: "none" };
  const primaryBtn = { background: "#0E2A23", color: "#C6A84B", border: "none",
    borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Panel title="Platform Settings">
        {loading.settings ? (
          <p style={{ color: "#7a8c7e", fontSize: 13 }}>Loading settings…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Object.entries(settingsForm).map(([key, val]) =>
              typeof val === "boolean" ? (
                <SettingRow key={key} label={key}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={val}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: e.target.checked }))} />
                    <span style={{ fontSize: 13 }}>{val ? "Enabled" : "Disabled"}</span>
                  </label>
                </SettingRow>
              ) : typeof val === "number" ? (
                <SettingRow key={key} label={key}>
                  <input type="number" value={val} style={inputStyle}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: Number(e.target.value) }))} />
                </SettingRow>
              ) : typeof val === "string" ? (
                <SettingRow key={key} label={key}>
                  <input type="text" value={val} style={inputStyle}
                    onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: e.target.value }))} />
                </SettingRow>
              ) : null
            )}
            <div style={{ paddingTop: 8 }}>
              <button onClick={handleSaveSettings} style={primaryBtn}>Save Settings</button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );

  // ── REVIEWS state ────────────────────────────────────────────────────────
  const [reviews,       setReviews]       = useState([]);
  const [reviewSearch,  setReviewSearch]  = useState("");
  const [reviewFilter,  setReviewFilter]  = useState("all");

  const loadReviews = useCallback(async () => {
    setLoad("reviews", true);
    try {
      const { data } = await API.get("/admin/reviews");
      setReviews(data.data || []);
    } catch { notify("Failed to load reviews", "error"); }
    finally { setLoad("reviews", false); }
  }, []);

  useEffect(() => {
    if (section === "reviews") loadReviews();
  }, [section]);

  const handleModerateReview = async (id, action) => {
    try {
      await API.put(`/admin/reviews/${id}/moderate`, { action });
      notify(action === "remove" ? "Review removed" : "Review approved");
      loadReviews();
    } catch { notify("Failed to moderate review", "error"); }
  };

  const filteredReviews = reviews.filter(r => {
    const ms = !reviewSearch ||
      r.user?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.product?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.comment?.toLowerCase().includes(reviewSearch.toLowerCase());
    const mf = reviewFilter === "all" || (reviewFilter === "reported" ? r.reported : !r.reported);
    return ms && mf;
  });

  const reviewExportCols = [
    { key: "user",    label: "User",    csvValue: r => r.user?.name || "" },
    { key: "product", label: "Product", csvValue: r => r.product?.name || "" },
    { key: "rating",  label: "Rating",  csvValue: r => r.rating },
    { key: "comment", label: "Comment", csvValue: r => r.comment },
    { key: "reported",label: "Reported",csvValue: r => r.reported ? "Yes" : "No" },
    { key: "createdAt",label:"Date",    csvValue: r => new Date(r.createdAt).toLocaleDateString() },
  ];

  const renderReviews = () => (
    <Panel title={`Reported Reviews (${filteredReviews.length} of ${reviews.length})`}>
      <SearchBar value={reviewSearch} onChange={setReviewSearch}
        placeholder="Search by user, product, or comment…"
        filters={[
          { label: "All",      value: "all"      },
          { label: "Reported", value: "reported" },
          { label: "Clean",    value: "clean"    },
        ]}
        activeFilter={reviewFilter} onFilterChange={setReviewFilter}
        onExportCSV={() => exportCSV(filteredReviews, reviewExportCols, "reviews_export")}
        onExportPDF={() => exportPDF(filteredReviews, reviewExportCols, "Reviews Report")}
      />
      <Table loading={loading.reviews}
        cols={[
          { key: "user", label: "Reviewer", render: r => (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Avatar name={r.user?.name||"?"} size={28} bg={avatarColor(r.user?.name||"")}/>
              <span style={{ fontWeight:500, fontSize:12 }}>{r.user?.name||"Unknown"}</span>
            </div>
          )},
          { key: "product", label: "Product", render: r => (
            <span style={{ fontSize:12, color:"#7a8c7e" }}>{r.product?.name||"—"}</span>
          )},
          { key: "rating", label: "Rating", render: r => (
            <span style={{ color:"#C6A84B", fontWeight:600 }}>
              {"★".repeat(r.rating||0)}{"☆".repeat(5-(r.rating||0))}
            </span>
          )},
          { key: "comment", label: "Comment", render: r => (
            <span style={{ fontSize:12, color:"#1a2b1f", maxWidth:240, display:"block",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.comment}</span>
          )},
          { key: "reported", label: "Status", render: r => (
            <Pill label={r.reported ? "reported" : "clean"}/>
          )},
          { key: "createdAt", label: "Date", render: r => ago(r.createdAt) },
          { key: "actions", label: "Actions", render: r => (
            <div style={{ display:"flex", gap:6 }}>
              {r.reported && (
                <ActionBtn label="Approve" color="#1D9E75"
                  onClick={() => handleModerateReview(r._id, "approve")}/>
              )}
              <ActionBtn label="Remove" color="#D85A30"
                onClick={() => handleModerateReview(r._id, "remove")}/>
            </div>
          )},
        ]}
        rows={filteredReviews}
      />
    </Panel>
  );

  // ── Section map ───────────────────────────────────────────────────────────
  const sectionMap = {
    dashboard: renderDashboard,
    users:     renderUsers,
    vendors:   renderVendors,
    products:  renderProducts,
    orders:    renderOrders,
    reviews:   renderReviews,
    audit:     renderAudit,
    settings:  renderSettings,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .nav-tooltip       { display:none; }
        .nav-item:hover .nav-tooltip { display:block; }
      `}</style>
      <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F3F5F1" }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <aside style={{ width:collapsed?80:240, background:"#0f2a29",
          display:"flex", flexDirection:"column", flexShrink:0,
          transition:"width .3s cubic-bezier(.4,0,.2,1)", overflow:"hidden",
          position:"sticky", top:0, height:"100vh" }}>

          {/* Logo + toggle */}
          <div style={{ padding:"18px 14px 14px", borderBottom:"1px solid rgba(255,255,255,.07)",
            display:"flex", alignItems:"center",
            justifyContent:collapsed?"center":"space-between", gap:10, minHeight:72 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, overflow:"hidden" }}>
              {/* Real NextCart logo */}
              <div style={{ width:40, height:40, borderRadius:"50%", overflow:"hidden",
                background:"#fff", flexShrink:0, display:"flex", alignItems:"flex-start",
                justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
                <img src={nextCartLogo} alt="NextCart"
                  style={{ width:56, maxWidth:"none", transform:"scale(1.5) translateY(-1px)",
                    objectFit:"contain" }}/>
              </div>
              {!collapsed && (
                <h1 style={{ fontSize:22, fontWeight:900, color:"#fff", margin:0,
                  whiteSpace:"nowrap", letterSpacing:"-.3px", animation:"fadeIn .3s ease" }}>
                  Next<span style={{ color:"#c4a456" }}>Cart</span>
                </h1>
              )}
            </div>
            <button onClick={()=>setCollapsed(p=>!p)}
              style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,.06)",
                border:"none", color:"rgba(255,255,255,.6)", cursor:"pointer", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                transition:"background .15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#c4a456"; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,.06)"; e.currentTarget.style.color="rgba(255,255,255,.6)"; }}>
              {collapsed ? "›" : "‹"}
            </button>
          </div>

          {/* Nav label */}
          {!collapsed && (
            <div style={{ padding:"16px 18px 6px", fontSize:10, fontWeight:700, letterSpacing:"2px",
              color:"#c4a456", opacity:.8, textTransform:"uppercase" }}>Admin Panel</div>
          )}

          {/* Nav items */}
          <nav style={{ padding:"8px 8px", flex:1, overflowY:"auto" }}>
            {NAV.map(item => {
              const active = section === item.id;
              return (
                <div key={item.id} className="nav-item"
                  onClick={()=>setSection(item.id)}
                  style={{ position:"relative", display:"flex", alignItems:"center",
                    gap:collapsed?0:14, padding:collapsed?"11px 0":"10px 14px",
                    justifyContent:collapsed?"center":"flex-start",
                    borderRadius:14, cursor:"pointer", marginBottom:2, fontSize:13,
                    fontWeight:active?700:400,
                    color:active?"#fff":"rgba(255,255,255,.55)",
                    background:active?"#c4a456":"transparent",
                    boxShadow:active?"0 4px 12px rgba(196,164,86,.25)":"none",
                    transition:"all .2s" }}
                  onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background="rgba(255,255,255,.06)"; e.currentTarget.style.color="#fff"; }}}
                  onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,.55)"; }}}>
                  <span style={{ fontSize:17, flexShrink:0,
                    color:active?"#fff":"rgba(255,255,255,.35)",
                    transition:"color .2s" }}>{item.icon}</span>
                  {!collapsed && <span style={{ whiteSpace:"nowrap" }}>{item.label}</span>}
                  {/* Tooltip in collapsed mode */}
                  {collapsed && (
                    <div className="nav-tooltip"
                      style={{ position:"absolute", left:58, background:"#c4a456", color:"#fff",
                        padding:"5px 12px", borderRadius:10, fontSize:11, fontWeight:700,
                        whiteSpace:"nowrap", pointerEvents:"none", zIndex:50,
                        boxShadow:"0 4px 14px rgba(0,0,0,.2)", textTransform:"uppercase",
                        letterSpacing:".1em" }}>
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Admin profile + logout */}
          <div style={{ padding:collapsed?"10px 8px":"14px", borderTop:"1px solid rgba(255,255,255,.07)" }}>
            <div style={{ background:"#1a3433", borderRadius:20, padding:collapsed?"10px 0":"18px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:collapsed?8:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12,
                justifyContent:collapsed?"center":"flex-start", width:"100%" }}>
                <div style={{ width:40, height:40, borderRadius:14, flexShrink:0,
                  background:"linear-gradient(135deg,#c4a456,#e5c77e)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"#0f2a29", fontWeight:900, fontSize:17,
                  boxShadow:"0 2px 8px rgba(196,164,86,.35)" }}>
                  {adminUser?.name?.[0]?.toUpperCase() || "A"}
                </div>
                {!collapsed && (
                  <div style={{ overflow:"hidden", animation:"fadeIn .3s ease" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:130 }}>
                      {adminUser?.name || "System Admin"}
                    </div>
                    <div style={{ fontSize:10, color:"#c4a456", fontWeight:700,
                      textTransform:"uppercase", letterSpacing:".15em" }}>
                      {adminUser?.role || "Administrator"}
                    </div>
                  </div>
                )}
              </div>
              {/* Logout button */}
              <button onClick={handleLogout}
                title={collapsed?"Log Out":""}
                style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  gap:collapsed?0:8, background:"rgba(196,164,86,.12)", color:"#c4a456",
                  border:"none", borderRadius:12, fontWeight:700, cursor:"pointer",
                  padding:collapsed?"10px":"10px 0", width:collapsed?40:"100%",
                  height:collapsed?40:"auto", fontSize:collapsed?16:11,
                  letterSpacing:collapsed?0:".15em", textTransform:"uppercase",
                  transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background="#c4a456"; e.currentTarget.style.color="#fff"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="rgba(196,164,86,.12)"; e.currentTarget.style.color="#c4a456"; }}>
                <span style={{ fontSize:15 }}>🚪</span>
                {!collapsed && "Log Out"}
              </button>
            </div>
            {!collapsed && (
              <p style={{ textAlign:"center", fontSize:9, color:"rgba(255,255,255,.1)",
                marginTop:14, letterSpacing:".4em", textTransform:"uppercase" }}>
                NextCart • BiT 2026
              </p>
            )}
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          {/* Topbar */}
          <div style={{ background:"#fff", borderBottom:"1px solid #e8ede9", padding:"14px 24px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, zIndex:100 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#7a8c7e" }}>
              <span>Dashboard</span>
              <span style={{ fontSize:11 }}>›</span>
              <span style={{ color:"#1a2b1f", fontWeight:600, textTransform:"capitalize" }}>{section}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {/* Topbar quick search — syncs to active section */}
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:10, top:"50%",
                  transform:"translateY(-50%)", color:"#7a8c7e", fontSize:13,
                  pointerEvents:"none" }}>🔍</span>
                <input
                  value={topbarSearch}
                  onChange={e => setTopbarSearch(e.target.value)}
                  placeholder={section === "dashboard" ? "Quick search…" : `Search ${section}…`}
                  style={{ padding:"7px 12px 7px 30px", border:"1px solid #e8ede9",
                    borderRadius:9, fontSize:12, color:"#1a2b1f", outline:"none",
                    width:200, background:"#f9fafb", transition:"border-color .15s" }}
                  onFocus={e => e.target.style.borderColor="#c4a456"}
                  onBlur={e  => e.target.style.borderColor="#e8ede9"}
                />
              </div>
              {/* Admin name chip */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px",
                background:"#f3f5f1", borderRadius:8 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:"#c4a456",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:11, fontWeight:700, color:"#0f2a29" }}>
                  {adminUser?.name?.[0]?.toUpperCase()||"A"}
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:"#1a2b1f" }}>
                  {adminUser?.name?.split(" ")[0] || "Admin"}
                </span>
              </div>
              <button
                onClick={()=>{ loadStats(); if(section!=="dashboard") setSection("dashboard"); }}
                style={{ fontSize:12, background:"#0f2a29", color:"#c4a456", border:"none",
                  borderRadius:8, padding:"7px 14px", cursor:"pointer", fontWeight:700 }}>
                ↻ Refresh
              </button>
              <button onClick={handleLogout}
                style={{ fontSize:12, background:"rgba(216,90,48,.1)", color:"#D85A30",
                  border:"1px solid rgba(216,90,48,.25)", borderRadius:8,
                  padding:"7px 14px", cursor:"pointer", fontWeight:600,
                  display:"flex", alignItems:"center", gap:5 }}>
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
            {(sectionMap[section] || sectionMap.dashboard)()}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", bottom:24, right:24,
            background: toast.type==="error"?"#D85A30":"#1D9E75",
            color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:500,
            boxShadow:"0 4px 20px rgba(0,0,0,.15)", zIndex:9999,
            animation:"fadeIn .2s ease" }}>
            {toast.type==="error"?"✕ ":"✓ "}{toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
        border: `1px solid ${color}30`, background: `${color}10`, color, cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

function Pagination({ page, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end", alignItems: "center" }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #e8ede9", borderRadius: 7,
          background: page <= 1 ? "#f3f5f1" : "#fff", color: page <= 1 ? "#7a8c7e" : "#1a2b1f",
          cursor: page <= 1 ? "default" : "pointer" }}>← Prev</button>
      <span style={{ fontSize: 12, color: "#7a8c7e" }}>Page {page}</span>
      <button onClick={() => onChange(page + 1)}
        style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #e8ede9",
          borderRadius: 7, background: "#fff", cursor: "pointer", color: "#1a2b1f" }}>Next →</button>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 12, borderBottom: "1px solid #e8ede9" }}>
      <div style={{ width: 200, fontSize: 13, fontWeight: 500, color: "#1a2b1f",
        textTransform: "capitalize", flexShrink: 0 }}>
        {label.replace(/([A-Z])/g, " $1").trim()}
      </div>
      {children}
    </div>
  );
}
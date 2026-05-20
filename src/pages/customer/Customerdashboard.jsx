import React from 'react';
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API, {
  getUserProfile,
  updateProfile,
  changePassword,
  getCategories,
  getConversations,
  reportReview,
  deleteReview,
} from "../../services/api"; 

// ─── Notification API helpers (wired to your notificationController) ──────────
const notifAPI = {
  getAll:      (params={}) => API.get("/notifications", { params }),
  markRead:    (id)        => API.put(`/notifications/${id}/read`),
  markAllRead: ()          => API.put("/notifications/read-all"),
  remove:      (id)        => API.delete(`/notifications/${id}`),
};

// ─── Design tokens (matches Admin dashboard) ──────────────────────────────────
const C = {
  sidebar:  "#0E2A23",
  sidebarHover: "#1a3d2f",
  gold:     "#C6A84B",
  green:    "#1D9E75",
  red:      "#D85A30",
  blue:     "#185FA5",
  purple:   "#533AB7",
  bg:       "#F3F5F1",
  card:     "#fff",
  border:   "#e8ede9",
  text:     "#1a2b1f",
  muted:    "#7a8c7e",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
  : `$${Number(n || 0).toFixed(2)}`;

const ago = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { year:"numeric", month:"short", day:"numeric" }) : "—";

const STATUS = {
  pending:    { bg:"#faeeda", color:"#854F0B", icon:"⏳" },
  processing: { bg:"#e6f1fb", color:"#185FA5", icon:"⚙️" },
  shipped:    { bg:"#edf6ff", color:"#0c5a9e", icon:"🚚" },
  delivered:  { bg:"#eaf3de", color:"#3B6D11", icon:"✅" },
  cancelled:  { bg:"#fcebeb", color:"#A32D2D", icon:"✕"  },
};

const Pill = ({ label }) => {
  const s = STATUS[label?.toLowerCase()] || { bg:"#f1f1f1", color:"#555", icon:"•" };
  return (
    <span style={{ background:s.bg, color:s.color, padding:"3px 10px",
      borderRadius:20, fontSize:11, fontWeight:600, display:"inline-flex",
      alignItems:"center", gap:4, textTransform:"capitalize" }}>
      {s.icon} {label || "—"}
    </span>
  );
};

const AVATAR_COLORS = [C.green, C.blue, C.gold, C.red, C.purple, "#0F6E56"];
const avatarColor  = (s="") => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];

const Avatar = ({ name="?", size=36, bg, color="#fff" }) => {
  const initials = name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background: bg || avatarColor(name), color, display:"flex",
      alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, fontWeight:700, flexShrink:0 }}>
      {initials}
    </div>
  );
};

const Stars = ({ rating=0, size=14, interactive=false, onChange }) => (
  <span style={{ display:"inline-flex", gap:2 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i}
        onClick={() => interactive && onChange?.(i)}
        style={{ fontSize:size, color: i<=rating ? C.gold : "#d0d5d1",
          cursor: interactive?"pointer":"default",
          transition:"color .15s" }}>★</span>
    ))}
  </span>
);

// ─── UI primitives ────────────────────────────────────────────────────────────
const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick}
    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
      padding:"18px 20px", ...style,
      cursor: onClick?"pointer":"default",
      transition:"box-shadow .15s" }}
    onMouseEnter={e=>{ if(onClick) e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,.08)"; }}
    onMouseLeave={e=>{ e.currentTarget.style.boxShadow="none"; }}>
    {children}
  </div>
);

const Panel = ({ title, subtitle, action, onAction, children, style={} }) => (
  <Card style={style}>
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{subtitle}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize:12, color:C.green, background:"none",
          border:"none", cursor:"pointer", fontWeight:500, padding:0, whiteSpace:"nowrap" }}>
          {action}
        </button>
      )}
    </div>
    {children}
  </Card>
);

const StatCard = ({ label, value, sub, accent, icon }) => (
  <Card style={{ position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:14, right:14, fontSize:22, opacity:.15 }}>{icon}</div>
    <div style={{ fontSize:11, color:C.muted, fontWeight:500, marginBottom:6, letterSpacing:".3px" }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:"-.5px", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{sub}</div>}
    <div style={{ width:32, height:3, borderRadius:2, background:accent, marginTop:12 }} />
  </Card>
);

const Input = ({ label, type="text", value, onChange, placeholder, disabled=false, error }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <label style={{ fontSize:12, fontWeight:500, color:C.text }}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} disabled={disabled}
      style={{ padding:"9px 12px", border:`1px solid ${error?C.red:C.border}`,
        borderRadius:8, fontSize:13, color:C.text, outline:"none",
        background: disabled?"#f9fafb":C.card,
        transition:"border-color .15s" }}
      onFocus={e=>{ if(!disabled) e.target.style.borderColor=C.green; }}
      onBlur={e=>{ e.target.style.borderColor=error?C.red:C.border; }} />
    {error && <span style={{ fontSize:11, color:C.red }}>{error}</span>}
  </div>
);

const Btn = ({ children, onClick, variant="primary", disabled=false, style={}, type="button" }) => {
  const variants = {
    primary:   { background:C.sidebar, color:C.gold, border:"none" },
    secondary: { background:"#fff", color:C.text, border:`1px solid ${C.border}` },
    danger:    { background:C.red, color:"#fff", border:"none" },
    ghost:     { background:"transparent", color:C.green, border:`1px solid ${C.green}40` },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...v, padding:"9px 20px", borderRadius:8, fontSize:13, fontWeight:600,
        cursor: disabled?"not-allowed":"pointer", opacity: disabled?.6:1,
        transition:"opacity .15s, transform .1s", ...style }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity=".85"; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
      {children}
    </button>
  );
};

const Spinner = ({ size=18 }) => (
  <span style={{ display:"inline-block", width:size, height:size,
    border:`2px solid ${C.border}`, borderTopColor:C.green, borderRadius:"50%",
    animation:"spin .7s linear infinite" }} />
);

const Empty = ({ icon="📭", text="Nothing here yet" }) => (
  <div style={{ padding:"40px 0", textAlign:"center" }}>
    <div style={{ fontSize:40, marginBottom:10 }}>{icon}</div>
    <div style={{ fontSize:13, color:C.muted }}>{text}</div>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 5;
const PRODUCTS_PER_PAGE = 12;

const Pagination = ({ page, totalItems, perPage=ITEMS_PER_PAGE, onChange }) => {
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end   = Math.min(page * perPage, totalItems);
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      marginTop:18, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
      <span style={{ fontSize:12, color:C.muted }}>
        Showing <b style={{ color:C.text }}>{start}–{end}</b> of <b style={{ color:C.text }}>{totalItems}</b>
      </span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <button disabled={page<=1} onClick={()=>onChange(page-1)}
          style={{ padding:"6px 14px", fontSize:12, fontWeight:600, borderRadius:7,
            border:`1px solid ${C.border}`, background:page<=1?"#f3f5f1":"#fff",
            color:page<=1?C.muted:C.text, cursor:page<=1?"not-allowed":"pointer",
            transition:"all .15s" }}>
          ← Prev
        </button>
        {/* Page number pills */}
        {Array.from({ length: totalPages }, (_,i) => i+1)
          .filter(n => n===1 || n===totalPages || Math.abs(n-page)<=1)
          .reduce((acc, n, i, arr) => {
            if (i>0 && n-arr[i-1]>1) acc.push("...");
            acc.push(n);
            return acc;
          }, [])
          .map((n, i) => n === "..." ? (
            <span key={`dot${i}`} style={{ fontSize:12, color:C.muted, padding:"0 2px" }}>…</span>
          ) : (
            <button key={n} onClick={()=>onChange(n)}
              style={{ width:32, height:32, borderRadius:7, fontSize:12, fontWeight:600,
                border:`1px solid ${n===page?C.sidebar:C.border}`,
                background:n===page?C.sidebar:"#fff",
                color:n===page?C.gold:C.text, cursor:"pointer", transition:"all .15s" }}>
              {n}
            </button>
          ))
        }
        <button disabled={page>=totalPages} onClick={()=>onChange(page+1)}
          style={{ padding:"6px 14px", fontSize:12, fontWeight:600, borderRadius:7,
            border:`1px solid ${C.border}`, background:page>=totalPages?"#f3f5f1":"#fff",
            color:page>=totalPages?C.muted:C.text, cursor:page>=totalPages?"not-allowed":"pointer",
            transition:"all .15s" }}>
          Next →
        </button>
      </div>
    </div>
  );
};

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────
const Donut = ({ slices=[], size=110, label="" }) => {
  const total = slices.reduce((a,s)=>a+s.value,0)||1;
  let cur = -90;
  const r=42, cx=size/2, cy=size/2;
  const rad = d => d*Math.PI/180;
  const arcs = slices.map(s=>{
    const deg=(s.value/total)*360;
    const x1=cx+r*Math.cos(rad(cur)), y1=cy+r*Math.sin(rad(cur));
    cur+=deg;
    const x2=cx+r*Math.cos(rad(cur)), y2=cy+r*Math.sin(rad(cur));
    return {...s, d:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${deg>180?1:0} 1 ${x2},${y2} Z`};
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a,i)=><path key={i} d={a.d} fill={a.color}/>)}
        <circle cx={cx} cy={cy} r={26} fill="#fff"/>
        <text x={cx} y={cy+4} textAnchor="middle" fontSize={10} fill={C.muted} fontWeight="600">
          {label}
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {slices.map(s=>(
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
            <span style={{ width:10, height:10, borderRadius:"50%", background:s.color,
              flexShrink:0, display:"inline-block" }}/>
            <span style={{ color:C.muted, flex:1 }}>{s.label}</span>
            <span style={{ fontWeight:600, color:C.text }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Mini bar (pure SVG) ──────────────────────────────────────────────────────
const MiniBar = ({ data=[], color=C.green, height=80 }) => {
  if(!data.length) return null;
  const max = Math.max(...data.map(d=>d.value),1);
  const W=300, gap=4, bW=Math.floor((W-(data.length-1)*gap)/data.length);
  return (
    <svg viewBox={`0 0 ${W} ${height+18}`} style={{ width:"100%", height:height+18 }}>
      {data.map((d,i)=>{
        const bh=Math.max(3,(d.value/max)*height);
        return (
          <g key={i}>
            <rect x={i*(bW+gap)} y={height-bh} width={bW} height={bh} rx={3}
              fill={color} opacity={i===data.length-1?1:.55}/>
            <text x={i*(bW+gap)+bW/2} y={height+14} textAnchor="middle"
              fontSize={8} fill={C.muted}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
let _setToast = () => {};
const toast = {
  success: (msg) => _setToast({ msg, type:"success" }),
  error:   (msg) => _setToast({ msg, type:"error" }),
  info:    (msg) => _setToast({ msg, type:"info" }),
};

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"home",     label:"Dashboard",  icon:"⊞",  badge:null },
  { id:"shop",     label:"Shop",       icon:"🛍",  badge:null },
  { id:"orders",   label:"My Orders",  icon:"📦",  badge:"orders" },
  { id:"cart",     label:"Cart",       icon:"🛒",  badge:"cart" },
  { id:"wishlist", label:"Wishlist",   icon:"❤️",  badge:"wishlist" },
  { id:"reviews",  label:"My Reviews", icon:"⭐",  badge:null },
  { id:"messages", label:"Messages",   icon:"💬",  badge:"messages" },
  { id:"profile",  label:"Profile",    icon:"👤",  badge:null },
  { id:"settings", label:"Settings",   icon:"⚙️",  badge:null },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function CustomerDashboard() {
  const navigate = useNavigate();

  // ── Global state ────────────────────────────────────────────────────────────
  const [section,   setSection]   = useState("home");
  const [collapsed, setCollapsed] = useState(false);
  const [profile,   setProfile]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [cart,      setCart]      = useState([]);
  const [categories,setCategories]= useState([]);
  const [products,  setProducts]  = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [convos,    setConvos]    = useState([]);
  const [loading,   setLoading]   = useState({});
  const [toastState,setToastState]= useState(null);

  // ── Wishlist (persisted to localStorage) ────────────────────────────────────
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nc_wishlist") || "[]"); }
    catch { return []; }
  });
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p._id === product._id);
      const next   = exists ? prev.filter(p => p._id !== product._id)
                            : [...prev, { _id:product._id, name:product.name,
                                price:product.price, image:product.image,
                                category:product.category, averageRating:product.averageRating }];
      localStorage.setItem("nc_wishlist", JSON.stringify(next));
      toast[exists?"info":"success"](exists ? "Removed from wishlist" : "Added to wishlist ❤️");
      return next;
    });
  };
  const isWishlisted = (id) => wishlist.some(p => p._id === id);

  // ── Confirm dialog ───────────────────────────────────────────────────────────
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const showConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    showConfirm("Are you sure you want to log out?", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("nc_wishlist");
      navigate("/login");
    });
  };

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [notifs,       setNotifs]       = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPage,    setNotifPage]    = useState(1);
  const [notifTotal,   setNotifTotal]   = useState(0);
  const [notifFilter,  setNotifFilter]  = useState("all"); // all | unread
  const notifRef = useRef(null);

  const NOTIF_PER_PAGE = 8;

  const loadNotifs = useCallback(async (page=1, filter="all") => {
    setNotifLoading(true);
    try {
      const params = { page, limit: NOTIF_PER_PAGE };
      if (filter === "unread") params.read = false;
      const { data } = await notifAPI.getAll(params);
      const result   = data.data || data;
      const list     = result.notifications || result;
      const total    = result.pagination?.total || list.length;
      setNotifs(page === 1 ? list : prev => [...prev, ...list]);
      setNotifTotal(total);
      setUnreadCount(list.filter(n => !n.read).length + (page > 1 ? unreadCount : 0));
    } catch { /* silent — bell stays functional even if API is slow */ }
    finally { setNotifLoading(false); }
  }, []);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    loadNotifs(1, notifFilter);
    const interval = setInterval(() => loadNotifs(1, notifFilter), 60_000);
    return () => clearInterval(interval);
  }, [notifFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notifAPI.markRead(id);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error("Failed to mark as read"); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); }
  };

  const handleDeleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await notifAPI.remove(id);
      setNotifs(prev => prev.filter(n => n._id !== id));
      setNotifTotal(prev => prev - 1);
    } catch { toast.error("Failed to delete notification"); }
  };

  const handleLoadMore = () => {
    const nextPage = notifPage + 1;
    setNotifPage(nextPage);
    loadNotifs(nextPage, notifFilter);
  };

  // Notif type → icon + accent colour
  const NOTIF_STYLE = {
    success: { icon:"✅", accent:C.green,  bg:"#eaf3de" },
    warning: { icon:"⚠️", accent:"#854F0B", bg:"#faeeda" },
    alert:   { icon:"🔒", accent:C.red,    bg:"#fcebeb" },
    info:    { icon:"ℹ️",  accent:C.blue,   bg:"#e6f1fb" },
  };
  const notifStyle = (type) => NOTIF_STYLE[type] || NOTIF_STYLE.info;

  // Assign global toast setter
  _setToast = setToastState;
  useEffect(()=>{ if(toastState) { const t=setTimeout(()=>setToastState(null),3200); return()=>clearTimeout(t); } },[toastState]);

  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async()=>{
    setLoad("profile",true);
    try{
      const {data} = await getUserProfile();
      setProfile(data.data || data);
    } catch{ toast.error("Failed to load profile"); }
    finally{ setLoad("profile",false); }
  },[]);

  const loadOrders = useCallback(async()=>{
    setLoad("orders",true);
    try{
      const {data} = await API.get("/orders");
      setOrders(Array.isArray(data)?data:(data.orders||data.data||[]));
    } catch{ toast.error("Failed to load orders"); }
    finally{ setLoad("orders",false); }
  },[]);

  const loadCart = useCallback(async()=>{
    setLoad("cart",true);
    try{
      const {data} = await API.get("/cart");
      setCart(data.items || data.cart?.items || []);
    } catch{ /* cart might be empty */ }
    finally{ setLoad("cart",false); }
  },[]);

  const loadCategories = useCallback(async()=>{
    try{
      const {data} = await getCategories();
      setCategories(Array.isArray(data)?data:(data.data||[]));
    } catch{}
  },[]);

  const loadProducts = useCallback(async(params={})=>{
    setLoad("products",true);
    try{
      const {data} = await API.get("/products", { params });
      setProducts(data.products || data.data || data || []);
    } catch{ toast.error("Failed to load products"); }
    finally{ setLoad("products",false); }
  },[]);

  const loadMyReviews = useCallback(async()=>{
    setLoad("reviews",true);
    try{
      const {data} = await API.get("/reviews/mine");
      setMyReviews(data.data || data || []);
    } catch{ toast.error("Failed to load reviews"); }
    finally{ setLoad("reviews",false); }
  },[]);

  const loadConvos = useCallback(async()=>{
    setLoad("convos",true);
    try{
      const {data} = await getConversations();
      setConvos(data||[]);
    } catch{}
    finally{ setLoad("convos",false); }
  },[]);

  // Initial load
  useEffect(()=>{ loadProfile(); loadOrders(); loadCart(); loadCategories(); },[]);

  useEffect(()=>{
    if(section==="shop")     loadProducts();
    if(section==="reviews")  loadMyReviews();
    if(section==="messages") loadConvos();
  },[section]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalSpent   = orders.filter(o=>o.isPaid).reduce((a,o)=>a+o.totalPrice,0);
  const pendingCount = orders.filter(o=>["pending","processing","shipped"].includes(o.status)).length;
  const deliveredCount = orders.filter(o=>o.status==="delivered").length;
  const cartTotal    = cart.reduce((a,i)=>a+(i.price*i.quantity),0);
  const cartCount    = cart.reduce((a,i)=>a+i.quantity,0);

  const orderStatusCounts = orders.reduce((acc,o)=>{
    acc[o.status] = (acc[o.status]||0)+1; return acc;
  },{});

  const spendingByMonth = (() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map = {};
    orders.filter(o=>o.isPaid).forEach(o=>{
      const m = months[new Date(o.createdAt).getMonth()];
      map[m] = (map[m]||0) + o.totalPrice;
    });
    return months.slice(0,new Date().getMonth()+1).map(m=>({ label:m, value:map[m]||0 }));
  })();

  const badges = {
    orders:   pendingCount || null,
    cart:     cartCount    || null,
    wishlist: wishlist.length || null,
    messages: convos.filter(c=>c.unread).length || null,
  };

  // ── Pagination state (one per section) ───────────────────────────────────────
  const [ordersPage,   setOrdersPage]   = useState(1);
  const [reviewsPage,  setReviewsPage]  = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [shopPage,     setShopPage]     = useState(1);

  // Reset pages when section changes
  useEffect(() => {
    setOrdersPage(1);
    setReviewsPage(1);
    setMessagesPage(1);
    setWishlistPage(1);
    setShopPage(1);
  }, [section]);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: HOME / OVERVIEW
  // ══════════════════════════════════════════════════════════════════════════
  const renderHome = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Welcome banner */}
      <div style={{ background:`linear-gradient(120deg, ${C.sidebar} 0%, #1a4d38 100%)`,
        borderRadius:14, padding:"24px 28px", display:"flex",
        alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", marginBottom:4 }}>
            Welcome back 👋
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>
            {profile?.name || "Customer"}
          </div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginTop:4 }}>
            {profile?.email}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
            <span style={{ fontSize:11, background:C.gold+"25", color:C.gold,
              padding:"3px 10px", borderRadius:20, fontWeight:600 }}>
              {profile?.reputation?.rank || "Starter"}
            </span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>
              Trust score: <b style={{ color:C.gold }}>{profile?.reputation?.score || 0}</b>/100
            </span>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <Avatar name={profile?.name||"?"} size={60} bg={C.gold} color={C.sidebar}/>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard label="Total Spent"      value={fmt(totalSpent)}       sub="All paid orders"     accent={C.green}  icon="💰"/>
        <StatCard label="Total Orders"     value={orders.length}          sub={`${deliveredCount} delivered`} accent={C.gold} icon="📦"/>
        <StatCard label="Active Orders"    value={pendingCount}           sub="In progress"         accent={C.blue}   icon="🚚"/>
        <StatCard label="Cart Items"       value={cartCount}              sub={`${fmt(cartTotal)} total`} accent={C.red} icon="🛒"/>
      </div>

      {/* Charts + recent orders */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14 }}>
        <Panel title="Spending Over Time" subtitle="Monthly breakdown of your purchases">
          {spendingByMonth.length > 0
            ? <MiniBar data={spendingByMonth} color={C.green} height={90}/>
            : <Empty icon="📊" text="No spending data yet"/>}
        </Panel>

        <Panel title="Order Breakdown">
          <Donut label="orders"
            slices={[
              { label:"Pending",    value:orderStatusCounts.pending||0,    color:C.gold  },
              { label:"Processing", value:orderStatusCounts.processing||0, color:C.blue  },
              { label:"Shipped",    value:orderStatusCounts.shipped||0,    color:"#0c5a9e"},
              { label:"Delivered",  value:orderStatusCounts.delivered||0,  color:C.green },
            ]}
          />
        </Panel>
      </div>

      {/* Recent orders + quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:14 }}>
        <Panel title="Recent Orders" action="View all →" onAction={()=>setSection("orders")}>
          {loading.orders
            ? <div style={{ padding:"20px 0", textAlign:"center" }}><Spinner/></div>
            : orders.length===0
            ? <Empty icon="📦" text="No orders yet — go shopping!"/>
            : orders.slice(0,5).map((o,i)=>(
              <div key={o._id} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"10px 0", borderBottom: i<4?"1px solid "+C.border:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:
                  STATUS[o.status?.toLowerCase()]?.bg||"#f1f1f1",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                  {STATUS[o.status?.toLowerCase()]?.icon||"📦"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize:12.5 }}>
                    Order #{o._id?.slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize:11, color:C.muted }}>{fmtDate(o.createdAt)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{fmt(o.totalPrice)}</div>
                  <Pill label={o.status}/>
                </div>
              </div>
            ))
          }
        </Panel>

        <Panel title="Quick Actions">
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"🛍", label:"Browse Products",    action:()=>setSection("shop")     },
              { icon:"📦", label:"Track My Orders",    action:()=>setSection("orders")   },
              { icon:"⭐", label:"Write a Review",     action:()=>setSection("reviews")  },
              { icon:"💬", label:"My Messages",        action:()=>setSection("messages") },
              { icon:"👤", label:"Edit Profile",       action:()=>setSection("profile")  },
            ].map(item=>(
              <button key={item.label} onClick={item.action}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px",
                  borderRadius:9, border:`1px solid ${C.border}`, background:"#fafbfa",
                  cursor:"pointer", fontSize:13, fontWeight:500, color:C.text,
                  textAlign:"left", transition:"all .15s" }}
                onMouseEnter={e=>{ e.currentTarget.style.background=C.sidebar; e.currentTarget.style.color=C.gold; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="#fafbfa"; e.currentTarget.style.color=C.text; }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>{item.label}
                <span style={{ marginLeft:"auto", color:C.muted, fontSize:14 }}>›</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: SHOP
  // ══════════════════════════════════════════════════════════════════════════
  const [shopSearch,     setShopSearch]     = useState("");
  const [shopCategory,   setShopCategory]   = useState("");
  const [shopSort,       setShopSort]       = useState("newest");

  // Reset shop page when search/filter changes
  useEffect(()=>{ setShopPage(1); }, [shopSearch, shopCategory, shopSort]);
  const [addingToCart,   setAddingToCart]   = useState(null);
  const [selectedProduct,setSelectedProduct]= useState(null);

  const filteredProducts = products
    .filter(p =>
      (!shopSearch || p.name?.toLowerCase().includes(shopSearch.toLowerCase()) ||
       p.description?.toLowerCase().includes(shopSearch.toLowerCase())) &&
      (!shopCategory || p.category?._id === shopCategory || p.category === shopCategory)
    )
    .sort((a,b)=>{
      if(shopSort==="price_asc")  return a.price-b.price;
      if(shopSort==="price_desc") return b.price-a.price;
      if(shopSort==="rating")     return (b.averageRating||0)-(a.averageRating||0);
      return new Date(b.createdAt)-new Date(a.createdAt);
    });

  const handleAddToCart = async (productId, e) => {
    e?.stopPropagation();
    setAddingToCart(productId);
    try {
      await API.post("/cart", { productId, quantity:1 });
      await loadCart();
      toast.success("Added to cart!");
    } catch { toast.error("Failed to add to cart"); }
    finally { setAddingToCart(null); }
  };

  const renderShop = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Search + filters */}
      <Card>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:"1 1 220px" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
              color:C.muted, fontSize:14 }}>🔍</span>
            <input value={shopSearch} onChange={e=>setShopSearch(e.target.value)}
              placeholder="Search products, brands, keywords…"
              style={{ width:"100%", padding:"9px 10px 9px 32px", border:`1px solid ${C.border}`,
                borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
          </div>
          <select value={shopCategory} onChange={e=>setShopCategory(e.target.value)}
            style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8,
              fontSize:13, background:C.card, color:C.text, cursor:"pointer" }}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={shopSort} onChange={e=>setShopSort(e.target.value)}
            style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8,
              fontSize:13, background:C.card, color:C.text, cursor:"pointer" }}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <Btn onClick={()=>loadProducts()} variant="ghost">↻ Refresh</Btn>
        </div>
      </Card>

      {/* Category pills */}
      {categories.length>0 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={()=>setShopCategory("")}
            style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:500,
              cursor:"pointer", border:`1px solid ${shopCategory===""?C.sidebar:C.border}`,
              background:shopCategory===""?C.sidebar:"#fff",
              color:shopCategory===""?C.gold:C.muted }}>All</button>
          {categories.map(c=>(
            <button key={c._id} onClick={()=>setShopCategory(c._id===shopCategory?"":c._id)}
              style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:500,
                cursor:"pointer", border:`1px solid ${shopCategory===c._id?C.sidebar:C.border}`,
                background:shopCategory===c._id?C.sidebar:"#fff",
                color:shopCategory===c._id?C.gold:C.muted }}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      {loading.products
        ? <div style={{ padding:"60px 0", textAlign:"center" }}><Spinner size={28}/></div>
        : filteredProducts.length===0
        ? <Empty icon="🛍" text="No products found"/>
        : (() => {
            const pageItems = filteredProducts.slice((shopPage-1)*PRODUCTS_PER_PAGE, shopPage*PRODUCTS_PER_PAGE);
            return (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
                  {pageItems.map(p=>(
              <Card key={p._id} onClick={()=>setSelectedProduct(p)}
                style={{ padding:0, overflow:"hidden", cursor:"pointer" }}>
                {/* Product image */}
                <div style={{ height:160, background:`linear-gradient(135deg,#e8f0ea,#d4e5d8)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:48, position:"relative", overflow:"hidden" }}>
                  {p.image
                    ? <img src={p.image} alt={p.name}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : "📦"}
                  {/* Wishlist heart */}
                  <button onClick={(e)=>{ e.stopPropagation(); toggleWishlist(p); }}
                    style={{ position:"absolute", top:8, left:8, width:30, height:30,
                      borderRadius:"50%", background:"rgba(255,255,255,.9)", border:"none",
                      cursor:"pointer", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:15,
                      boxShadow:"0 1px 4px rgba(0,0,0,.15)" }}>
                    {isWishlisted(p._id) ? "❤️" : "🤍"}
                  </button>
                  {p.stock<5 && p.stock>0 && (
                    <span style={{ position:"absolute", top:8, right:8, background:C.red,
                      color:"#fff", fontSize:10, fontWeight:600, padding:"2px 7px",
                      borderRadius:20 }}>Low Stock</span>
                  )}
                  {p.stock===0 && (
                    <span style={{ position:"absolute", top:8, right:8, background:"#333",
                      color:"#fff", fontSize:10, fontWeight:600, padding:"2px 7px",
                      borderRadius:20 }}>Out of Stock</span>
                  )}
                </div>
                <div style={{ padding:"14px 14px 12px" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>
                    {p.category?.name || "Uncategorized"}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:10 }}>
                    <Stars rating={Math.round(p.averageRating||0)} size={12}/>
                    <span style={{ fontSize:11, color:C.muted }}>({p.totalReviews||0})</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:16, fontWeight:700, color:C.green }}>${p.price}</span>
                    <button onClick={(e)=>handleAddToCart(p._id,e)} disabled={p.stock===0}
                      style={{ background: p.stock===0?"#ccc":C.sidebar, color: p.stock===0?"#999":C.gold,
                        border:"none", padding:"6px 12px", borderRadius:7, fontSize:12,
                        fontWeight:600, cursor: p.stock===0?"not-allowed":"pointer" }}>
                      {addingToCart===p._id ? <Spinner size={12}/> : "+ Cart"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
                </div>
                <Pagination page={shopPage} totalItems={filteredProducts.length}
                  perPage={PRODUCTS_PER_PAGE} onChange={p=>{ setShopPage(p); window.scrollTo(0,0); }}/>
              </>
            );
          })()
      }

      {/* Product detail modal */}
      {selectedProduct && <ProductModal product={selectedProduct}
        onClose={()=>setSelectedProduct(null)} onAddToCart={handleAddToCart} addingToCart={addingToCart}/>}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: ORDERS
  // ══════════════════════════════════════════════════════════════════════════
  const [orderFilter, setOrderFilter]   = useState("all");
  const [orderSearch, setOrderSearch]   = useState("");

  // Reset page when filter/search changes
  useEffect(()=>{ setOrdersPage(1); }, [orderFilter, orderSearch]);
  const [selectedOrder,setSelectedOrder]= useState(null);

  const filteredOrders = orders.filter(o=>{
    const ms = !orderSearch || o._id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status?.toLowerCase().includes(orderSearch.toLowerCase());
    const mf = orderFilter==="all" || o.status===orderFilter;
    return ms && mf;
  });

  const renderOrders = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Order summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard label="Total Orders"  value={orders.length}        sub="All time"        accent={C.gold}  icon="📦"/>
        <StatCard label="Active"        value={pendingCount}         sub="Pending/shipping" accent={C.blue}  icon="🚚"/>
        <StatCard label="Delivered"     value={deliveredCount}       sub="Completed"        accent={C.green} icon="✅"/>
        <StatCard label="Total Spent"   value={fmt(totalSpent)}      sub="On paid orders"   accent={C.purple}icon="💳"/>
      </div>

      <Panel title="Order History" subtitle="Track and manage all your orders">
        {/* Search + filters */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:"1 1 180px" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
              color:C.muted, fontSize:13 }}>🔍</span>
            <input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}
              placeholder="Search order ID or status…"
              style={{ width:"100%", padding:"8px 10px 8px 30px", border:`1px solid ${C.border}`,
                borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          </div>
          {["all","pending","processing","shipped","delivered"].map(f=>(
            <button key={f} onClick={()=>setOrderFilter(f)}
              style={{ padding:"7px 13px", borderRadius:8, fontSize:12, fontWeight:500,
                cursor:"pointer", border:`1px solid ${orderFilter===f?C.sidebar:C.border}`,
                background:orderFilter===f?C.sidebar:"#fff",
                color:orderFilter===f?C.gold:C.muted, textTransform:"capitalize" }}>
              {f==="all"?"All":f}
            </button>
          ))}
        </div>

        {loading.orders
          ? <div style={{ padding:"40px", textAlign:"center" }}><Spinner size={24}/></div>
          : filteredOrders.length===0
          ? <Empty icon="📦" text="No orders found"/>
          : (() => {
              const pageItems = filteredOrders.slice((ordersPage-1)*ITEMS_PER_PAGE, ordersPage*ITEMS_PER_PAGE);
              return (
                <>
                  {pageItems.map((o,i)=>(
            <div key={o._id}
              onClick={()=>setSelectedOrder(selectedOrder?._id===o._id?null:o)}
              style={{ border:`1px solid ${C.border}`, borderRadius:10, marginBottom:10,
                overflow:"hidden", cursor:"pointer",
                background: selectedOrder?._id===o._id?"#f8faf8":"#fff" }}>
              {/* Order header */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px" }}>
                <div style={{ width:40, height:40, borderRadius:10,
                  background:STATUS[o.status?.toLowerCase()]?.bg||"#f5f5f5",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {STATUS[o.status?.toLowerCase()]?.icon||"📦"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>Order #{o._id?.slice(-8).toUpperCase()}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{fmtDate(o.createdAt)} · {o.orderItems?.length||0} item(s)</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.green }}>{fmt(o.totalPrice)}</div>
                  <Pill label={o.status}/>
                </div>
                <span style={{ color:C.muted, fontSize:14, marginLeft:8 }}>
                  {selectedOrder?._id===o._id?"▲":"▼"}
                </span>
              </div>

              {/* Expanded order detail */}
              {selectedOrder?._id===o._id && (
                <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${C.border}` }}>
                  {/* Progress tracker */}
                  <OrderTracker status={o.status}/>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:14 }}>
                    {/* Items */}
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:8 }}>Items</div>
                      {(o.orderItems||[]).map((item,j)=>(
                        <div key={j} style={{ display:"flex", gap:10, marginBottom:8,
                          padding:"8px 10px", background:"#f9fafb", borderRadius:8 }}>
                          <div style={{ width:36, height:36, borderRadius:6, background:"#e8ede9",
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                            {item.image ? <img src={item.image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:6 }}/> : "📦"}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:12, fontWeight:500 }}>{item.name}</div>
                            <div style={{ fontSize:11, color:C.muted }}>x{item.quantity} · ${item.price}</div>
                          </div>
                          <div style={{ fontWeight:600, fontSize:12 }}>${(item.price*item.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping + payment */}
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:8 }}>Delivery Info</div>
                      <div style={{ background:"#f9fafb", borderRadius:8, padding:"10px 12px",
                        fontSize:12, lineHeight:1.8 }}>
                        <div><b>Address:</b> {o.shippingAddress?.address || "—"}</div>
                        <div><b>City:</b> {o.shippingAddress?.city || "—"}</div>
                        <div><b>Country:</b> {o.shippingAddress?.country || "—"}</div>
                        <div style={{ marginTop:6, paddingTop:6, borderTop:`1px solid ${C.border}` }}>
                          <b>Payment:</b> {o.paymentMethod} &nbsp;
                          <span style={{ color:o.isPaid?C.green:C.red, fontWeight:600 }}>
                            {o.isPaid?"✓ Paid":"⏳ Unpaid"}
                          </span>
                        </div>
                        <div><b>Placed:</b> {fmtDate(o.createdAt)}</div>
                        {o.paidAt && <div><b>Paid at:</b> {fmtDate(o.paidAt)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
                  <Pagination page={ordersPage} totalItems={filteredOrders.length}
                    onChange={p=>{ setOrdersPage(p); window.scrollTo(0,0); }}/>
                </>
              );
            })()
        }
      </Panel>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: CART
  // ══════════════════════════════════════════════════════════════════════════
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    address:"", city:"", postalCode:"", country:"", paymentMethod:"cash"
  });
  const [shippingErrors, setShippingErrors] = useState({});

  const updateCartQty = async (productId, quantity) => {
    if(quantity<1){ return removeFromCart(productId); }
    try {
      await API.post("/cart", { productId, quantity });
      await loadCart();
    } catch { toast.error("Failed to update cart"); }
  };

  const removeFromCart = async (productId) => {
    try {
      await API.delete(`/cart/${productId}`);
      await loadCart();
      toast.success("Removed from cart");
    } catch { toast.error("Failed to remove item"); }
  };

  const clearCartFn = async () => {
    if(!window.confirm("Clear the entire cart?")) return;
    try {
      await API.delete("/cart");
      setCart([]);
      toast.success("Cart cleared");
    } catch { toast.error("Failed to clear cart"); }
  };

  const validateShipping = () => {
    const e = {};
    if(!shippingForm.address)     e.address    = "Required";
    if(!shippingForm.city)        e.city       = "Required";
    if(!shippingForm.country)     e.country    = "Required";
    setShippingErrors(e);
    return Object.keys(e).length===0;
  };

  const handleCheckout = async () => {
    if(!validateShipping()) return;
    if(cart.length===0){ toast.error("Cart is empty"); return; }
    setCheckingOut(true);
    try {
      await API.post("/orders", {
        orderItems: cart.map(i=>({ product:i.product?._id||i.productId, name:i.name||i.product?.name,
          quantity:i.quantity, price:i.price, image:i.image, vendor:i.vendor })),
        shippingAddress: shippingForm,
        paymentMethod:   shippingForm.paymentMethod,
        totalPrice:      cartTotal,
      });
      await API.delete("/cart");
      setCart([]);
      toast.success("Order placed successfully!");
      await loadOrders();
      setSection("orders");
    } catch(err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally { setCheckingOut(false); }
  };

  const renderCart = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {cart.length===0
        ? (
          <Card style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:56, marginBottom:12 }}>🛒</div>
            <div style={{ fontSize:18, fontWeight:600, color:C.text, marginBottom:8 }}>Your cart is empty</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Discover products you'll love</div>
            <Btn onClick={()=>setSection("shop")}>Browse Products</Btn>
          </Card>
        )
        : (
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, alignItems:"start" }}>
            {/* Cart items */}
            <Panel title={`Cart (${cartCount} item${cartCount!==1?"s":""})`}
              action="Clear all" onAction={clearCartFn}>
              {cart.map((item,i)=>(
                <div key={item.product?._id||i} style={{ display:"flex", gap:14, padding:"12px 0",
                  borderBottom: i<cart.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ width:60, height:60, borderRadius:10, background:"#e8ede9",
                    overflow:"hidden", flexShrink:0, display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:28 }}>
                    {item.image||item.product?.image
                      ? <img src={item.image||item.product?.image} alt=""
                          style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : "📦"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:13 }}>{item.name||item.product?.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>${item.price} each</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
                      <button onClick={()=>updateCartQty(item.product?._id||item.productId, item.quantity-1)}
                        style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`,
                          background:"#fff", cursor:"pointer", fontWeight:700, fontSize:14 }}>−</button>
                      <span style={{ fontSize:13, fontWeight:600, minWidth:24, textAlign:"center" }}>
                        {item.quantity}
                      </span>
                      <button onClick={()=>updateCartQty(item.product?._id||item.productId, item.quantity+1)}
                        style={{ width:26, height:26, borderRadius:6, border:`1px solid ${C.border}`,
                          background:"#fff", cursor:"pointer", fontWeight:700, fontSize:14 }}>+</button>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, color:C.green }}>
                      ${(item.price*item.quantity).toFixed(2)}
                    </div>
                    <button onClick={()=>removeFromCart(item.product?._id||item.productId)}
                      style={{ background:"none", border:"none", color:C.red, cursor:"pointer",
                        fontSize:11, marginTop:6 }}>Remove</button>
                  </div>
                </div>
              ))}
            </Panel>

            {/* Checkout */}
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Panel title="Order Summary">
                <div style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13 }}>
                  {cart.map((item,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", color:C.muted }}>
                      <span>{item.name||item.product?.name} ×{item.quantity}</span>
                      <span>${(item.price*item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:10,
                    display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:14 }}>
                    <span>Total</span>
                    <span style={{ color:C.green }}>{fmt(cartTotal)}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Shipping Details">
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <Input label="Street Address" value={shippingForm.address}
                    onChange={v=>setShippingForm(p=>({...p,address:v}))}
                    placeholder="123 Main St" error={shippingErrors.address}/>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <Input label="City" value={shippingForm.city}
                      onChange={v=>setShippingForm(p=>({...p,city:v}))}
                      placeholder="Addis Ababa" error={shippingErrors.city}/>
                    <Input label="Postal Code" value={shippingForm.postalCode}
                      onChange={v=>setShippingForm(p=>({...p,postalCode:v}))}
                      placeholder="1000"/>
                  </div>
                  <Input label="Country" value={shippingForm.country}
                    onChange={v=>setShippingForm(p=>({...p,country:v}))}
                    placeholder="Ethiopia" error={shippingErrors.country}/>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:C.text }}>Payment Method</label>
                    <select value={shippingForm.paymentMethod}
                      onChange={e=>setShippingForm(p=>({...p,paymentMethod:e.target.value}))}
                      style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8,
                        fontSize:13, background:"#fff", color:C.text }}>
                      <option value="cash">Cash on Delivery</option>
                      <option value="telebirr">Telebirr</option>
                      <option value="cbe">CBE Birr</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>
                  <Btn onClick={handleCheckout} disabled={checkingOut} style={{ marginTop:6 }}>
                    {checkingOut ? "Placing Order…" : `Place Order · ${fmt(cartTotal)}`}
                  </Btn>
                </div>
              </Panel>
            </div>
          </div>
        )
      }
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: REVIEWS
  // ══════════════════════════════════════════════════════════════════════════
  const [reviewForm,   setReviewForm]   = useState({ productId:"", rating:5, comment:"" });
  const [submitting,   setSubmitting]   = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");

  const handleSubmitReview = async () => {
    if(!reviewForm.productId){ toast.error("Enter a product ID"); return; }
    if(!reviewForm.comment.trim()){ toast.error("Write a comment"); return; }
    setSubmitting(true);
    try {
      await API.post("/reviews", reviewForm);
      toast.success("Review submitted!");
      setReviewForm({ productId:"", rating:5, comment:"" });
      loadMyReviews();
    } catch(err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (id) => {
    if(!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(id);
      toast.success("Review deleted");
      loadMyReviews();
    } catch { toast.error("Failed to delete review"); }
  };

  const filtered_reviews = myReviews.filter(r=>
    !reviewSearch || r.product?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.comment?.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  const renderReviews = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
        {/* Write review */}
        <Panel title="Write a Review" subtitle="Share your experience with a product">
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Input label="Product ID" value={reviewForm.productId}
              onChange={v=>setReviewForm(p=>({...p,productId:v}))}
              placeholder="Paste the product ID from your order"/>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:C.text, marginBottom:6 }}>Rating</div>
              <Stars rating={reviewForm.rating} size={26} interactive
                onChange={v=>setReviewForm(p=>({...p,rating:v}))}/>
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
                {["","Terrible","Bad","Okay","Good","Excellent"][reviewForm.rating]}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:12, fontWeight:500, color:C.text }}>Comment</label>
              <textarea value={reviewForm.comment}
                onChange={e=>setReviewForm(p=>({...p,comment:e.target.value}))}
                placeholder="Describe your experience in detail…"
                rows={4}
                style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8,
                  fontSize:13, color:C.text, outline:"none", resize:"vertical",
                  fontFamily:"inherit" }}/>
            </div>
            <Btn onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Review"}
            </Btn>
          </div>
        </Panel>

        {/* Review stats */}
        <Panel title="Your Review Stats">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:700, color:C.green }}>{myReviews.length}</div>
              <div style={{ fontSize:11, color:C.muted }}>Total Reviews</div>
            </div>
            <div style={{ background:"#f9fafb", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:700, color:C.gold }}>
                {myReviews.length>0
                  ? (myReviews.reduce((a,r)=>a+(r.rating||0),0)/myReviews.length).toFixed(1)
                  : "—"}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>Avg Rating Given</div>
            </div>
          </div>
          {/* Rating distribution */}
          {[5,4,3,2,1].map(star=>{
            const count = myReviews.filter(r=>r.rating===star).length;
            const pct   = myReviews.length ? (count/myReviews.length)*100 : 0;
            return (
              <div key={star} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                <span style={{ fontSize:11, color:C.muted, width:12 }}>{star}</span>
                <span style={{ fontSize:11, color:C.gold }}>★</span>
                <div style={{ flex:1, height:6, background:"#eee", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:C.gold, borderRadius:3,
                    transition:"width .4s ease" }}/>
                </div>
                <span style={{ fontSize:11, color:C.muted, width:16, textAlign:"right" }}>{count}</span>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* My reviews list */}
      <Panel title={`My Reviews (${filtered_reviews.length})`}>
        <div style={{ position:"relative", marginBottom:14 }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
            color:C.muted, fontSize:13 }}>🔍</span>
          <input value={reviewSearch} onChange={e=>{ setReviewSearch(e.target.value); setReviewsPage(1); }}
            placeholder="Search reviews…"
            style={{ width:"100%", padding:"8px 10px 8px 30px", border:`1px solid ${C.border}`,
              borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }}/>
        </div>

        {loading.reviews
          ? <div style={{ textAlign:"center", padding:30 }}><Spinner size={22}/></div>
          : filtered_reviews.length===0
          ? <Empty icon="⭐" text="No reviews yet — buy something and share your thoughts!"/>
          : (() => {
              const pageItems = filtered_reviews.slice((reviewsPage-1)*ITEMS_PER_PAGE, reviewsPage*ITEMS_PER_PAGE);
              return (
                <>
                  {pageItems.map((r,i)=>(
                    <div key={r._id} style={{ padding:"14px 0",
                      borderBottom: i<pageItems.length-1?`1px solid ${C.border}`:"none" }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:500, fontSize:13 }}>
                            {r.product?.name || "Product #"+r.product?.toString()?.slice(-6)}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 0" }}>
                            <Stars rating={r.rating} size={13}/>
                            <span style={{ fontSize:11, color:C.muted }}>{ago(r.createdAt)}</span>
                            {r.reported && <span style={{ fontSize:10, color:C.red, fontWeight:600 }}>⚠ Reported</span>}
                          </div>
                          <p style={{ fontSize:12.5, color:C.text, margin:0, lineHeight:1.6 }}>{r.comment}</p>
                        </div>
                        <button onClick={()=>handleDeleteReview(r._id)}
                          style={{ background:`${C.red}08`, border:`1px solid ${C.red}30`, color:C.red,
                            cursor:"pointer", fontSize:11, fontWeight:600, padding:"4px 8px",
                            borderRadius:6 }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <Pagination page={reviewsPage} totalItems={filtered_reviews.length}
                    onChange={p=>{ setReviewsPage(p); window.scrollTo(0,0); }}/>
                </>
              );
            })()
        }
      </Panel>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: MESSAGES
  // ══════════════════════════════════════════════════════════════════════════
  const renderMessages = () => (
    <Panel title="Messages" subtitle="Your conversations">
      {loading.convos
        ? <div style={{ textAlign:"center", padding:40 }}><Spinner size={22}/></div>
        : convos.length===0
        ? <Empty icon="💬" text="No conversations yet"/>
        : (() => {
            const pageItems = convos.slice((messagesPage-1)*ITEMS_PER_PAGE, messagesPage*ITEMS_PER_PAGE);
            return (
              <>
                {pageItems.map((c,i)=>(
                  <div key={c._id||i} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"12px 14px", borderRadius:10, marginBottom:6,
                    background:"#f9fafb", border:`1px solid ${C.border}`,
                    cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e=>{ e.currentTarget.style.background=C.sidebar; e.currentTarget.style.color="#fff"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background="#f9fafb"; e.currentTarget.style.color=C.text; }}>
                    <Avatar name={c.userDetails?.name||"?"} size={40} bg={avatarColor(c.userDetails?.name||"")}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:500, fontSize:13 }}>{c.userDetails?.name||"Unknown"}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:260 }}>
                        {c.lastMessage||"No messages"}
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{ago(c.lastTimestamp)}</div>
                  </div>
                ))}
                <Pagination page={messagesPage} totalItems={convos.length}
                  onChange={p=>{ setMessagesPage(p); window.scrollTo(0,0); }}/>
              </>
            );
          })()
      }
    </Panel>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: PROFILE
  // ══════════════════════════════════════════════════════════════════════════
  const [profileForm, setProfileForm]   = useState({ name:"", email:"" });
  const [pwForm,      setPwForm]        = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [savingProfile, setSavingProfile]= useState(false);
  const [savingPw,      setSavingPw]    = useState(false);
  const [pwErrors,      setPwErrors]    = useState({});

  useEffect(()=>{
    if(profile) setProfileForm({ name:profile.name||"", email:profile.email||"" });
  },[profile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const {data} = await updateProfile(profileForm);
      setProfile(data.data||data);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    const e = {};
    if(!pwForm.currentPassword)    e.currentPassword = "Required";
    if(pwForm.newPassword.length<6) e.newPassword = "Min 6 characters";
    if(pwForm.newPassword!==pwForm.confirmPassword) e.confirmPassword = "Passwords don't match";
    setPwErrors(e);
    if(Object.keys(e).length>0) return;
    setSavingPw(true);
    try {
      await changePassword({ currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword });
      toast.success("Password changed!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch(err) {
      toast.error(err.response?.data?.message||"Failed to change password");
    } finally { setSavingPw(false); }
  };

  const renderProfile = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Profile info */}
        <Panel title="Personal Information" subtitle="Update your public profile details">
          {/* Avatar display */}
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20,
            padding:"14px", background:"#f9fafb", borderRadius:10 }}>
            <Avatar name={profile?.name||"?"} size={52} bg={C.gold} color={C.sidebar}/>
            <div>
              <div style={{ fontWeight:600, fontSize:15 }}>{profile?.name}</div>
              <div style={{ fontSize:12, color:C.muted }}>{profile?.email}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
                <span style={{ fontSize:11, background:`${C.green}18`, color:C.green,
                  padding:"2px 8px", borderRadius:20, fontWeight:600 }}>
                  {profile?.reputation?.rank || "Starter"}
                </span>
                <span style={{ fontSize:11, color:C.muted }}>
                  Score: <b>{profile?.reputation?.score || 0}</b>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Input label="Full Name" value={profileForm.name}
              onChange={v=>setProfileForm(p=>({...p,name:v}))} placeholder="Your name"/>
            <Input label="Email Address" value={profileForm.email}
              onChange={v=>setProfileForm(p=>({...p,email:v}))} placeholder="you@example.com"/>
            <Btn onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile?"Saving…":"Save Changes"}
            </Btn>
          </div>
        </Panel>

        {/* Reputation */}
        <Panel title="Your Reputation" subtitle="Trust engine metrics from your activity">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { label:"Trust Score",     value:profile?.reputation?.score||0,                     accent:C.green },
              { label:"Rank",            value:profile?.reputation?.rank||"Starter",               accent:C.gold  },
              { label:"Successful Orders",value:profile?.reputation?.metrics?.successfulOrders||0, accent:C.blue  },
              { label:"Cancelled Orders", value:profile?.reputation?.metrics?.cancelledOrders||0,  accent:C.red   },
            ].map(s=>(
              <div key={s.label} style={{ background:"#f9fafb", borderRadius:10,
                padding:"12px 14px", borderLeft:`3px solid ${s.accent}` }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{s.value}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trust score bar */}
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
              <span style={{ color:C.muted }}>Trust Progress</span>
              <span style={{ fontWeight:600, color:C.green }}>{profile?.reputation?.score||0}/100</span>
            </div>
            <div style={{ height:8, background:"#e8ede9", borderRadius:4, overflow:"hidden" }}>
              <div style={{ width:`${profile?.reputation?.score||0}%`, height:"100%",
                background:`linear-gradient(90deg,${C.green},${C.gold})`,
                borderRadius:4, transition:"width .6s ease" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
              {["Unverified","Starter","Trusted","Elite","Legendary"].map(rank=>(
                <span key={rank} style={{ fontSize:9, color:C.muted }}>{rank}</span>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Change password */}
      <Panel title="Change Password" subtitle="Keep your account secure with a strong password">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          <Input label="Current Password" type="password" value={pwForm.currentPassword}
            onChange={v=>setPwForm(p=>({...p,currentPassword:v}))}
            placeholder="••••••••" error={pwErrors.currentPassword}/>
          <Input label="New Password" type="password" value={pwForm.newPassword}
            onChange={v=>setPwForm(p=>({...p,newPassword:v}))}
            placeholder="••••••••" error={pwErrors.newPassword}/>
          <Input label="Confirm Password" type="password" value={pwForm.confirmPassword}
            onChange={v=>setPwForm(p=>({...p,confirmPassword:v}))}
            placeholder="••••••••" error={pwErrors.confirmPassword}/>
        </div>
        <div style={{ marginTop:14 }}>
          <Btn onClick={handleChangePassword} disabled={savingPw} variant="secondary">
            {savingPw?"Updating…":"Update Password"}
          </Btn>
        </div>
      </Panel>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION: SETTINGS
  // ══════════════════════════════════════════════════════════════════════════
  const [notifSettings, setNotifSettings] = useState({ email:true, push:true });
  const [savingNotif, setSavingNotif]     = useState(false);

  useEffect(()=>{
    if(profile?.settings?.notifications) setNotifSettings(profile.settings.notifications);
  },[profile]);

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      await API.put("/profile/notifications", { notifications: notifSettings });
      toast.success("Notification preferences saved!");
    } catch { toast.error("Failed to save preferences"); }
    finally { setSavingNotif(false); }
  };

  const Toggle = ({ checked, onChange, label }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 14px", background:"#f9fafb", borderRadius:9, marginBottom:8 }}>
      <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{label}</span>
      <div onClick={()=>onChange(!checked)}
        style={{ width:44, height:24, borderRadius:12, background:checked?C.green:"#ccc",
          position:"relative", cursor:"pointer", transition:"background .2s" }}>
        <div style={{ position:"absolute", top:3, left:checked?22:3, width:18, height:18,
          borderRadius:"50%", background:"#fff", transition:"left .2s",
          boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <Panel title="Notification Preferences" subtitle="Control how we reach you">
        <Toggle checked={notifSettings.email} label="📧 Email Notifications"
          onChange={v=>setNotifSettings(p=>({...p,email:v}))}/>
        <Toggle checked={notifSettings.push}  label="🔔 Push Notifications"
          onChange={v=>setNotifSettings(p=>({...p,push:v}))}/>
        <div style={{ marginTop:8 }}>
          <Btn onClick={handleSaveNotif} disabled={savingNotif}>
            {savingNotif?"Saving…":"Save Preferences"}
          </Btn>
        </div>
      </Panel>

      <Panel title="Account" subtitle="Manage your account data">
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ padding:"12px 14px", background:"#f9fafb", borderRadius:9,
            fontSize:13, color:C.muted }}>
            <b style={{ color:C.text }}>Member since</b> — {fmtDate(profile?.createdAt)}
          </div>
          <div style={{ padding:"12px 14px", background:"#f9fafb", borderRadius:9,
            fontSize:13, color:C.muted }}>
            <b style={{ color:C.text }}>Account status</b> —{" "}
            <span style={{ color:profile?.isVerified?C.green:C.red, fontWeight:600 }}>
              {profile?.isVerified?"✓ Verified":"⚠ Not Verified"}
            </span>
          </div>
          <div style={{ marginTop:4 }}>
            <Btn variant="danger" onClick={handleLogout}>🚪 Log Out of Account</Btn>
          </div>
        </div>
      </Panel>
    </div>
  );

  // ── Section map ────────────────────────────────────────────────────────────
  const renderWishlist = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <Panel title={`Wishlist (${wishlist.length})`} subtitle="Products you've saved for later">
        {wishlist.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>❤️</div>
            <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Your wishlist is empty</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Browse products and tap ❤️ to save them here</div>
            <Btn onClick={()=>setSection("shop")}>Browse Shop</Btn>
          </div>
        ) : (() => {
            const pageItems = wishlist.slice((wishlistPage-1)*PRODUCTS_PER_PAGE, wishlistPage*PRODUCTS_PER_PAGE);
            return (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
                  {pageItems.map(p => (
                    <Card key={p._id} style={{ padding:0, overflow:"hidden" }}>
                      <div style={{ height:130, background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:42, position:"relative" }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          : "📦"}
                        <button onClick={()=>toggleWishlist(p)}
                          style={{ position:"absolute", top:8, right:8, background:"rgba(255,255,255,.9)",
                            border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer",
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                          ❤️
                        </button>
                      </div>
                      <div style={{ padding:"12px 12px 10px" }}>
                        <div style={{ fontWeight:600, fontSize:13, overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                        <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>{p.category?.name || "Product"}</div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:15, fontWeight:700, color:C.green }}>${p.price}</span>
                          <button onClick={()=>handleAddToCart(p._id)}
                            style={{ background:C.sidebar, color:C.gold, border:"none",
                              padding:"5px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                            + Cart
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Pagination page={wishlistPage} totalItems={wishlist.length}
                  perPage={PRODUCTS_PER_PAGE}
                  onChange={p=>{ setWishlistPage(p); window.scrollTo(0,0); }}/>
              </>
            );
          })()
        }
      </Panel>
    </div>
  );

  const sectionMap = {
    home:     renderHome,
    shop:     renderShop,
    orders:   renderOrders,
    cart:     renderCart,
    wishlist: renderWishlist,
    reviews:  renderReviews,
    messages: renderMessages,
    profile:  renderProfile,
    settings: renderSettings,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.2); } }
        * { box-sizing:border-box; }
        body { margin:0; font-family:'DM Sans',system-ui,sans-serif; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',system-ui,sans-serif" }}>

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside style={{ width:collapsed?68:220, background:C.sidebar, display:"flex",
          flexDirection:"column", flexShrink:0, transition:"width .25s cubic-bezier(.4,0,.2,1)",
          overflow:"hidden", position:"relative" }}>

          {/* Logo */}
          <div style={{ padding:"18px 14px 14px", borderBottom:"1px solid rgba(255,255,255,.08)",
            display:"flex", alignItems:"center", gap:10, minHeight:70 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:C.gold, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18, fontWeight:700, color:C.sidebar }}>◈</div>
            {!collapsed && (
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}>MyMarket</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", whiteSpace:"nowrap" }}>Customer Portal</div>
              </div>
            )}
          </div>

          {/* Toggle button */}
          <button onClick={()=>setCollapsed(p=>!p)}
            style={{ position:"absolute", top:20, right:-12, width:24, height:24,
              borderRadius:"50%", background:C.gold, border:"none", color:C.sidebar,
              cursor:"pointer", fontSize:12, fontWeight:700, display:"flex",
              alignItems:"center", justifyContent:"center", zIndex:10,
              boxShadow:"0 2px 8px rgba(0,0,0,.2)" }}>
            {collapsed?"›":"‹"}
          </button>

          {/* Nav */}
          <nav style={{ padding:"12px 8px", flex:1, overflowY:"auto" }}>
            {NAV.map(item=>{
              const badgeCount = badges[item.badge];
              const active = section===item.id;
              return (
                <div key={item.id} onClick={()=>setSection(item.id)}
                  title={collapsed?item.label:""}
                  style={{ display:"flex", alignItems:"center",
                    gap:collapsed?0:10, padding: collapsed?"11px 0":"9px 12px",
                    justifyContent:collapsed?"center":"flex-start",
                    borderRadius:8, cursor:"pointer", marginBottom:2, fontSize:13,
                    fontWeight:active?500:400,
                    color:active?C.gold:"rgba(255,255,255,.65)",
                    background:active?"rgba(198,168,75,.12)":"transparent",
                    borderLeft:active&&!collapsed?`3px solid ${C.gold}`:"3px solid transparent",
                    transition:"all .15s", position:"relative" }}
                  onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background=C.sidebarHover; e.currentTarget.style.color="#fff"; }}}
                  onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(255,255,255,.65)"; }}}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                  {!collapsed && <span style={{ whiteSpace:"nowrap" }}>{item.label}</span>}
                  {badgeCount && (
                    <span style={{ marginLeft:collapsed?0:"auto", position:collapsed?"absolute":"static",
                      top:collapsed?4:undefined, right:collapsed?4:undefined,
                      background:C.red, color:"#fff", fontSize:9, padding:"1px 5px",
                      borderRadius:20, fontWeight:700, minWidth:16, textAlign:"center" }}>
                      {badgeCount}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User info + Logout */}
          <div style={{ borderTop:"1px solid rgba(255,255,255,.08)" }}>
            <div style={{ padding:collapsed?"10px 0":"12px 14px",
              display:"flex", alignItems:"center", gap:10,
              justifyContent:collapsed?"center":"flex-start" }}>
              <Avatar name={profile?.name||"?"} size={32} bg={C.gold} color={C.sidebar}/>
              {!collapsed && (
                <div style={{ overflow:"hidden", flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#fff", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>
                    {profile?.name||"Customer"}
                  </div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", whiteSpace:"nowrap" }}>
                    {profile?.reputation?.rank||"Starter"}
                  </div>
                </div>
              )}
            </div>
            {/* Logout button */}
            <div onClick={handleLogout}
              title={collapsed?"Log Out":""}
              style={{ display:"flex", alignItems:"center", gap:collapsed?0:10,
                padding:collapsed?"11px 0":"9px 14px 14px",
                justifyContent:collapsed?"center":"flex-start",
                cursor:"pointer", fontSize:13, color:"rgba(255,80,60,.75)",
                transition:"color .15s" }}
              onMouseEnter={e=>e.currentTarget.style.color="#ff5040"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,80,60,.75)"}>
              <span style={{ fontSize:16, flexShrink:0 }}>🚪</span>
              {!collapsed && <span style={{ whiteSpace:"nowrap", fontWeight:500 }}>Log Out</span>}
            </div>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>

          {/* Topbar */}
          <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`,
            padding:"13px 24px", display:"flex", alignItems:"center", justifyContent:"space-between",
            position:"sticky", top:0, zIndex:100, backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:C.muted }}>
              <span>Home</span>
              <span style={{ fontSize:11 }}>›</span>
              <span style={{ color:C.text, fontWeight:500, textTransform:"capitalize" }}>{section}</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>

              {/* Cart icon */}
              <div onClick={()=>setSection("cart")}
                style={{ position:"relative", cursor:"pointer", width:36, height:36,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border:`1px solid ${C.border}`, borderRadius:8, background:"#fff" }}>
                <span style={{ fontSize:16 }}>🛒</span>
                {cartCount>0 && (
                  <span style={{ position:"absolute", top:-5, right:-5, background:C.red,
                    color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:20,
                    fontWeight:700 }}>{cartCount}</span>
                )}
              </div>

              {/* ── Notification Bell ─────────────────────────────────── */}
              <div ref={notifRef} style={{ position:"relative" }}>
                {/* Bell button */}
                <button onClick={()=>{ setNotifOpen(p=>!p); if(!notifOpen) loadNotifs(1,notifFilter); }}
                  style={{ position:"relative", width:36, height:36, borderRadius:8,
                    border:`1px solid ${C.border}`, background:"#fff", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:17, transition:"background .15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f3f5f1"}
                  onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  🔔
                  {unreadCount>0 && (
                    <span style={{ position:"absolute", top:-5, right:-5, background:C.red,
                      color:"#fff", fontSize:9, fontWeight:700, minWidth:16, height:16,
                      borderRadius:20, display:"flex", alignItems:"center",
                      justifyContent:"center", padding:"0 4px",
                      border:"2px solid #fff", animation: "pulse 2s infinite" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {notifOpen && (
                  <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0,
                    width:360, maxHeight:520, background:"#fff",
                    border:`1px solid ${C.border}`, borderRadius:12,
                    boxShadow:"0 8px 32px rgba(0,0,0,.12)", zIndex:200,
                    display:"flex", flexDirection:"column", overflow:"hidden" }}>

                    {/* Header */}
                    <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${C.border}`,
                      display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, color:C.text }}>Notifications</div>
                        <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up 🎉"}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        {/* Filter toggle */}
                        {["all","unread"].map(f=>(
                          <button key={f} onClick={()=>{ setNotifFilter(f); setNotifPage(1); loadNotifs(1,f); }}
                            style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                              cursor:"pointer", border:"none",
                              background: notifFilter===f ? C.sidebar : "#f3f5f1",
                              color:       notifFilter===f ? C.gold    : C.muted,
                              textTransform:"capitalize" }}>
                            {f}
                          </button>
                        ))}
                        {/* Mark all read */}
                        {unreadCount>0 && (
                          <button onClick={handleMarkAllRead}
                            style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                              cursor:"pointer", border:`1px solid ${C.green}40`,
                              background:`${C.green}10`, color:C.green }}>
                            ✓ All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* List */}
                    <div style={{ overflowY:"auto", flex:1 }}>
                      {notifLoading && notifs.length===0 ? (
                        <div style={{ padding:"30px 0", textAlign:"center" }}><Spinner size={20}/></div>
                      ) : notifs.length===0 ? (
                        <div style={{ padding:"40px 20px", textAlign:"center" }}>
                          <div style={{ fontSize:36, marginBottom:8 }}>🔕</div>
                          <div style={{ fontSize:13, color:C.muted }}>No notifications yet</div>
                        </div>
                      ) : (
                        notifs.map(n => {
                          const ns = notifStyle(n.type);
                          return (
                            <div key={n._id}
                              onClick={()=>{ if(!n.read) handleMarkRead(n._id); }}
                              style={{ display:"flex", gap:12, padding:"12px 16px",
                                borderBottom:`1px solid ${C.border}`,
                                background: n.read ? "#fff" : `${ns.bg}60`,
                                cursor: n.read ? "default" : "pointer",
                                transition:"background .15s",
                                position:"relative" }}
                              onMouseEnter={e=>{ e.currentTarget.style.background="#f8faf8"; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background = n.read ? "#fff" : `${ns.bg}60`; }}>
                              {/* Icon */}
                              <div style={{ width:36, height:36, borderRadius:10, background:ns.bg,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontSize:16, flexShrink:0 }}>
                                {ns.icon}
                              </div>
                              {/* Content */}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:"flex", alignItems:"flex-start",
                                  justifyContent:"space-between", gap:6 }}>
                                  <div style={{ fontWeight: n.read ? 500 : 700, fontSize:13,
                                    color:C.text, lineHeight:1.3 }}>{n.title}</div>
                                  {!n.read && (
                                    <span style={{ width:8, height:8, borderRadius:"50%",
                                      background:ns.accent, flexShrink:0, marginTop:3 }}/>
                                  )}
                                </div>
                                <div style={{ fontSize:12, color:C.muted, marginTop:3,
                                  lineHeight:1.5, wordBreak:"break-word" }}>{n.message}</div>
                                <div style={{ fontSize:10, color:C.muted, marginTop:5,
                                  display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ color:ns.accent, fontWeight:600,
                                    textTransform:"capitalize" }}>{n.type}</span>
                                  <span>·</span>
                                  <span>{ago(n.createdAt)}</span>
                                </div>
                              </div>
                              {/* Delete */}
                              <button onClick={(e)=>handleDeleteNotif(n._id,e)}
                                style={{ position:"absolute", top:10, right:12,
                                  background:"none", border:"none", cursor:"pointer",
                                  color:"#ccc", fontSize:14, fontWeight:700, lineHeight:1,
                                  opacity:0, transition:"opacity .15s" }}
                                onMouseEnter={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.color=C.red; }}
                                onMouseLeave={e=>{ e.currentTarget.style.opacity="0"; }}>
                                ×
                              </button>
                            </div>
                          );
                        })
                      )}

                      {/* Load more */}
                      {notifs.length < notifTotal && (
                        <div style={{ padding:"10px", textAlign:"center" }}>
                          <button onClick={handleLoadMore} disabled={notifLoading}
                            style={{ fontSize:12, fontWeight:600, color:C.green, background:"none",
                              border:`1px solid ${C.green}40`, borderRadius:8,
                              padding:"7px 20px", cursor:"pointer" }}>
                            {notifLoading ? <Spinner size={12}/> : "Load more"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`,
                      textAlign:"center" }}>
                      <span style={{ fontSize:11, color:C.muted }}>
                        Showing {notifs.length} of {notifTotal} notifications
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {/* ── End Notification Bell ─────────────────────────── */}

              {/* Greeting + logout */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Avatar name={profile?.name||"?"} size={32} bg={C.gold} color={C.sidebar}/>
                <span style={{ fontSize:13, fontWeight:500, color:C.text }}>
                  {profile?.name?.split(" ")[0]||"Customer"}
                </span>
                <button onClick={handleLogout}
                  style={{ marginLeft:4, padding:"6px 12px", borderRadius:8, fontSize:12,
                    fontWeight:600, cursor:"pointer", border:`1px solid ${C.red}30`,
                    background:`${C.red}08`, color:C.red, display:"flex",
                    alignItems:"center", gap:5 }}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:"20px 24px", overflowY:"auto" }}>
            {(sectionMap[section]||sectionMap.home)()}
          </div>
        </div>
      </div>

      {/* ── CONFIRM DIALOG ───────────────────────────────────────────────── */}
      {confirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:9998,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"28px 32px", maxWidth:380,
            width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.18)", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🚪</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>
              {confirm.message}
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
              This action cannot be undone.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setConfirm(null)}
                style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:13, fontWeight:600,
                  border:`1px solid ${C.border}`, background:"#fff", color:C.text, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={()=>{ confirm.onConfirm(); setConfirm(null); }}
                style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:13, fontWeight:600,
                  border:"none", background:C.red, color:"#fff", cursor:"pointer" }}>
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toastState && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
          background: toastState.type==="error"?C.red:toastState.type==="info"?C.blue:C.green,
          color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:500,
          boxShadow:"0 4px 24px rgba(0,0,0,.18)", display:"flex", alignItems:"center", gap:8,
          maxWidth:320, animation:"fadeIn .2s ease" }}>
          <span>{toastState.type==="error"?"✕":toastState.type==="info"?"ℹ":"✓"}</span>
          {toastState.msg}
        </div>
      )}
    </>
  );
}

// ─── Order tracker component ─────────────────────────────────────────────────
function OrderTracker({ status }) {
  const steps = ["pending","processing","shipped","delivered"];
  const curr  = steps.indexOf(status);
  return (
    <div style={{ display:"flex", alignItems:"center", padding:"14px 0", marginTop:8 }}>
      {steps.map((s,i)=>(
        <div key={s} style={{ display:"flex", alignItems:"center", flex:i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700,
              background: curr>=i ? C.green : "#e8ede9",
              color: curr>=i ? "#fff" : "#aaa",
              border:`2px solid ${curr>=i?C.green:"#e8ede9"}`,
              transition:"all .3s" }}>
              {curr>i?"✓":i+1}
            </div>
            <span style={{ fontSize:10, color: curr>=i?C.green:C.muted,
              textTransform:"capitalize", fontWeight: curr===i?600:400 }}>{s}</span>
          </div>
          {i<steps.length-1 && (
            <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:18,
              background: curr>i?C.green:"#e8ede9", transition:"background .3s" }}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Product modal ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onAddToCart, addingToCart }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!product?._id) return;
    setLoading(true);
    API.get(`/reviews/product/${product._id}`)
      .then(({data})=>setReviews(data.data||data||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[product?._id]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:14, maxWidth:700, width:"100%",
        maxHeight:"88vh", overflow:"auto", position:"relative" }}
        onClick={e=>e.stopPropagation()}>
        {/* Header image */}
        <div style={{ height:220, background:`linear-gradient(135deg,#e8f0ea,#c9dece)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:80, position:"relative" }}>
          {product.image
            ? <img src={product.image} alt={product.name}
                style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"14px 14px 0 0" }}/>
            : "📦"}
          <button onClick={onClose}
            style={{ position:"absolute", top:12, right:12, width:32, height:32,
              borderRadius:"50%", background:"rgba(0,0,0,.4)", color:"#fff",
              border:"none", cursor:"pointer", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <div>
              <h2 style={{ margin:"0 0 4px", fontSize:20, color:C.text }}>{product.name}</h2>
              <div style={{ fontSize:12, color:C.muted }}>{product.category?.name||"Uncategorized"}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6 }}>
                <Stars rating={Math.round(product.averageRating||0)} size={14}/>
                <span style={{ fontSize:12, color:C.muted }}>({product.totalReviews||0} reviews)</span>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:26, fontWeight:700, color:C.green }}>${product.price}</div>
              <div style={{ fontSize:12, color: product.stock>0?C.muted:C.red }}>
                {product.stock>0?`${product.stock} in stock`:"Out of stock"}
              </div>
            </div>
          </div>
          {product.description && (
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:16 }}>
              {product.description}
            </p>
          )}
          <button onClick={()=>onAddToCart(product._id)} disabled={product.stock===0||addingToCart===product._id}
            style={{ background:product.stock===0?"#ccc":C.sidebar, color:product.stock===0?"#999":C.gold,
              border:"none", padding:"11px 24px", borderRadius:9, fontSize:14, fontWeight:600,
              cursor:product.stock===0?"not-allowed":"pointer", width:"100%", marginBottom:20 }}>
            {addingToCart===product._id?"Adding…":"Add to Cart"}
          </button>

          {/* Reviews in modal */}
          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>Customer Reviews</div>
            {loading
              ? <div style={{ textAlign:"center" }}><Spinner/></div>
              : reviews.length===0
              ? <div style={{ fontSize:12, color:C.muted }}>No reviews yet</div>
              : reviews.slice(0,4).map((r,i)=>(
                <div key={r._id||i} style={{ marginBottom:12, padding:"10px 12px",
                  background:"#f9fafb", borderRadius:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <Avatar name={r.user?.name||"?"} size={24} bg={avatarColor(r.user?.name||"")}/>
                    <span style={{ fontWeight:500, fontSize:12 }}>{r.user?.name||"Customer"}</span>
                    <Stars rating={r.rating} size={11}/>
                    <span style={{ fontSize:11, color:C.muted, marginLeft:"auto" }}>{ago(r.createdAt)}</span>
                  </div>
                  <p style={{ fontSize:12, color:C.text, margin:0, lineHeight:1.5 }}>{r.comment}</p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
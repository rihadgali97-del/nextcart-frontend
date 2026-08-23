import React from "react";
import { C, STATUS, avatarColor, ITEMS_PER_PAGE } from "./constants";
import "../../styles/customer/dashboard.css";

// ─── Status pill (order status badge) ──────────────────────────────────────────
export const Pill = ({ label }) => {
  const s = STATUS[label?.toLowerCase()] || { bg:"#f1f1f1", color:"#555", icon:"•" };
  return (
    <span style={{ background:s.bg, color:s.color, padding:"3px 10px",
      borderRadius:20, fontSize:11, fontWeight:600, display:"inline-flex",
      alignItems:"center", gap:4, textTransform:"capitalize" }}>
      {s.icon} {label || "—"}
    </span>
  );
};

// ─── Avatar ─────────────────────────────────────────────────────────────────────
export const Avatar = ({ name="?", size=36, bg, color="#fff" }) => {
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

// ─── Star rating ────────────────────────────────────────────────────────────────
export const Stars = ({ rating=0, size=14, interactive=false, onChange }) => (
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

// ─── Card ───────────────────────────────────────────────────────────────────────
export const Card = ({ children, style={}, onClick }) => (
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

// ─── Panel (titled card with optional action link) ─────────────────────────────
export const Panel = ({ title, subtitle, action, onAction, children, style={} }) => (
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

// ─── Stat card ──────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, accent, icon }) => (
  <Card style={{ position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", top:14, right:14, fontSize:22, opacity:.15 }}>{icon}</div>
    <div style={{ fontSize:11, color:C.muted, fontWeight:500, marginBottom:6, letterSpacing:".3px" }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:"-.5px", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{sub}</div>}
    <div style={{ width:32, height:3, borderRadius:2, background:accent, marginTop:12 }} />
  </Card>
);

// ─── Input ──────────────────────────────────────────────────────────────────────
export const Input = ({ label, type="text", value, onChange, placeholder, disabled=false, error }) => (
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

// ─── Button ─────────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant="primary", disabled=false, style={}, type="button" }) => {
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

// ─── Spinner ────────────────────────────────────────────────────────────────────
export const Spinner = ({ size=18 }) => (
  <span className="nc-spinner"
    style={{ width:size, height:size, border:`2px solid ${C.border}`, borderTopColor:C.green }} />
);

// ─── Empty state ────────────────────────────────────────────────────────────────
export const Empty = ({ icon="📭", text="Nothing here yet" }) => (
  <div className="nc-empty-state">
    <div style={{ fontSize:40, marginBottom:10 }}>{icon}</div>
    <div style={{ fontSize:13, color:C.muted }}>{text}</div>
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, totalItems, perPage=ITEMS_PER_PAGE, onChange }) => {
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
export const Donut = ({ slices=[], size=110, label="" }) => {
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

// ─── Mini bar chart (pure SVG) ──────────────────────────────────────────────────
export const MiniBar = ({ data=[], color=C.green, height=80 }) => {
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

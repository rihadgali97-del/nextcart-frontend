import React from "react";
import { useState, useEffect } from "react";
import API from "../../services/api";
import { Tag, Plus, Trash2, Edit3, X, Check, RefreshCw } from "lucide-react";

const C = { dark:"#0f2a29", gold:"#c4a456", light:"#f8fafb", border:"#e8ede9", muted:"#7a8c7e" };

const EMPTY_FORM = {
  code:"", discountType:"percentage", value:"",
  minOrderAmount:"", maxDiscount:"", maxUses:"",
  expiryDate:"", description:"", isActive:true,
};

const Badge = ({ active }) => (
  <span style={{ padding:"2px 10px", borderRadius:20, fontSize:10, fontWeight:700,
    background: active?"#eaf3de":"#fcebeb",
    color:      active?"#3B6D11":"#A32D2D" }}>
    {active?"Active":"Inactive"}
  </span>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",
  { month:"short", day:"numeric", year:"numeric" }) : "No expiry";

export default function VendorCoupons() {
  const [coupons,  setCoupons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null); // coupon being edited
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/coupons/vendor");
      setCoupons(data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowForm(true); };
  const openEdit   = (c) => {
    setEditing(c);
    setForm({
      code:           c.code,
      discountType:   c.discountType,
      value:          c.value,
      minOrderAmount: c.minOrderAmount || "",
      maxDiscount:    c.maxDiscount    || "",
      maxUses:        c.maxUses        || "",
      expiryDate:     c.expiryDate ? c.expiryDate.split("T")[0] : "",
      description:    c.description   || "",
      isActive:       c.isActive,
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code)         { setError("Code is required"); return; }
    if (!form.value)        { setError("Value is required"); return; }
    if (form.discountType==="percentage" && Number(form.value)>100)
      { setError("Percentage cannot exceed 100"); return; }

    setSaving(true); setError("");
    try {
      if (editing) {
        const { data } = await API.put(`/coupons/vendor/${editing._id}`, form);
        setCoupons(prev => prev.map(c => c._id===editing._id ? data.data : c));
      } else {
        const { data } = await API.post("/coupons/vendor", form);
        setCoupons(prev => [data.data, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save coupon");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await API.delete(`/coupons/vendor/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch { alert("Failed to delete coupon"); }
  };

  const toggleActive = async (coupon) => {
    try {
      const { data } = await API.put(`/coupons/vendor/${coupon._id}`,
        { ...coupon, isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c._id===coupon._id ? data.data : c));
    } catch { }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

  return (
    <div style={{ padding:"28px 32px", minHeight:"100vh", background:C.light }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:900, color:C.dark, margin:0 }}>My Coupons</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>
            {coupons.length} coupon{coupons.length!==1?"s":""} · customers apply these at checkout
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchCoupons}
            style={{ padding:"10px 14px", borderRadius:14, border:`1px solid ${C.border}`,
              background:"#fff", cursor:"pointer" }}>
            <RefreshCw size={15} color={C.muted}/>
          </button>
          <button onClick={openCreate}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px",
              borderRadius:14, border:"none", background:C.dark, color:C.gold,
              fontWeight:700, fontSize:13, cursor:"pointer" }}>
            <Plus size={16}/> New Coupon
          </button>
        </div>
      </div>

      {/* Coupon grid */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", margin:"0 auto",
            border:`3px solid ${C.border}`, borderTopColor:C.gold,
            animation:"spin .7s linear infinite" }}/>
        </div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 0" }}>
          <Tag size={48} color={C.border} style={{ margin:"0 auto 16px" }}/>
          <div style={{ fontSize:18, fontWeight:700, color:C.dark, marginBottom:8 }}>No coupons yet</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
            Create your first coupon to attract more customers
          </div>
          <button onClick={openCreate}
            style={{ padding:"11px 24px", borderRadius:12, border:"none",
              background:C.dark, color:C.gold, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Create Coupon
          </button>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {coupons.map(c => (
            <div key={c._id} style={{ background:"#fff", border:`1px solid ${C.border}`,
              borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
              {/* Card top */}
              <div style={{ background:C.dark, padding:"18px 20px",
                display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:20, fontWeight:900, letterSpacing:".08em",
                    color:C.gold, fontFamily:"monospace" }}>{c.code}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:4 }}>
                    {c.description || (c.discountType==="percentage"
                      ? `${c.value}% off`
                      : `${c.value} ETB off`)}
                  </div>
                </div>
                <Badge active={c.isActive}/>
              </div>
              {/* Card body */}
              <div style={{ padding:"14px 20px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {[
                    { label:"Discount",  value: c.discountType==="percentage"?`${c.value}%`:`${c.value} ETB` },
                    { label:"Min order", value: c.minOrderAmount ? `${c.minOrderAmount} ETB` : "None" },
                    { label:"Uses",      value: c.maxUses ? `${c.usedCount}/${c.maxUses}` : `${c.usedCount} used` },
                    { label:"Expires",   value: fmtDate(c.expiryDate) },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.muted,
                        textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.dark }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display:"flex", gap:8, paddingTop:12,
                  borderTop:`1px solid ${C.border}` }}>
                  <button onClick={()=>toggleActive(c)}
                    style={{ flex:1, padding:"8px 0", borderRadius:9, fontSize:12,
                      fontWeight:700, cursor:"pointer", border:`1px solid ${C.border}`,
                      background:"#fff", color:c.isActive?"#A32D2D":"#3B6D11",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    {c.isActive ? <X size={12}/> : <Check size={12}/>}
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={()=>openEdit(c)}
                    style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700,
                      cursor:"pointer", border:`1px solid ${C.border}`, background:"#fff",
                      color:C.dark, display:"flex", alignItems:"center", gap:5 }}>
                    <Edit3 size={12}/> Edit
                  </button>
                  <button onClick={()=>handleDelete(c._id)}
                    style={{ padding:"8px 14px", borderRadius:9, fontSize:12, fontWeight:700,
                      cursor:"pointer", border:"1px solid #fcebeb", background:"#fcebeb",
                      color:"#A32D2D", display:"flex", alignItems:"center", gap:5 }}>
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
          zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={()=>setShowForm(false)}>
          <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:520,
            maxHeight:"90vh", overflowY:"auto", boxShadow:"0 8px 40px rgba(0,0,0,.15)" }}
            onClick={e=>e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:C.dark }}>
                {editing ? "Edit Coupon" : "New Coupon"}
              </h2>
              <button onClick={()=>setShowForm(false)}
                style={{ background:"none", border:"none", cursor:"pointer",
                  color:C.muted, fontSize:22, lineHeight:1 }}>×</button>
            </div>
            {/* Form */}
            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
              {error && (
                <div style={{ padding:"10px 14px", background:"#fcebeb",
                  borderRadius:8, color:"#A32D2D", fontSize:13 }}>⚠ {error}</div>
              )}
              {/* Code */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                  Coupon Code *
                </label>
                <input value={form.code} onChange={e=>set("code",e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                    borderRadius:9, fontSize:14, fontWeight:700, letterSpacing:".08em",
                    fontFamily:"monospace", boxSizing:"border-box", outline:"none" }}/>
              </div>
              {/* Type + Value */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                    Discount Type *
                  </label>
                  <select value={form.discountType} onChange={e=>set("discountType",e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                      borderRadius:9, fontSize:13, outline:"none", background:"#fff" }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (ETB)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                    Value * {form.discountType==="percentage"?"(%)":"(ETB)"}
                  </label>
                  <input type="number" value={form.value} onChange={e=>set("value",e.target.value)}
                    placeholder={form.discountType==="percentage"?"20":"50"}
                    style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                      borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                </div>
              </div>
              {/* Min order + Max discount */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                    Min Order (ETB)
                  </label>
                  <input type="number" value={form.minOrderAmount} onChange={e=>set("minOrderAmount",e.target.value)}
                    placeholder="0 = no minimum"
                    style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                      borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                </div>
                {form.discountType==="percentage" && (
                  <div>
                    <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                      Max Discount (ETB)
                    </label>
                    <input type="number" value={form.maxDiscount} onChange={e=>set("maxDiscount",e.target.value)}
                      placeholder="Optional cap"
                      style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                        borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                  </div>
                )}
              </div>
              {/* Max uses + Expiry */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                    Max Uses
                  </label>
                  <input type="number" value={form.maxUses} onChange={e=>set("maxUses",e.target.value)}
                    placeholder="Leave blank = unlimited"
                    style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                      borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                    Expiry Date
                  </label>
                  <input type="date" value={form.expiryDate} onChange={e=>set("expiryDate",e.target.value)}
                    style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                      borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
                </div>
              </div>
              {/* Description */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:C.dark, display:"block", marginBottom:5 }}>
                  Description (shown to customer)
                </label>
                <input value={form.description} onChange={e=>set("description",e.target.value)}
                  placeholder="e.g. 20% off on all items this weekend"
                  style={{ width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`,
                    borderRadius:9, fontSize:13, boxSizing:"border-box", outline:"none" }}/>
              </div>
              {/* Active toggle */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"12px 14px", background:"#f8fafb", borderRadius:10 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.dark }}>Active</span>
                <div onClick={()=>set("isActive",!form.isActive)}
                  style={{ width:44, height:24, borderRadius:12, cursor:"pointer",
                    background:form.isActive?"#1D9E75":"#ccc", position:"relative",
                    transition:"background .2s" }}>
                  <div style={{ position:"absolute", top:3,
                    left:form.isActive?22:3, width:18, height:18,
                    borderRadius:"50%", background:"#fff",
                    transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
                </div>
              </div>
              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                style={{ padding:"13px 0", borderRadius:12, border:"none",
                  background:saving?"#ccc":C.dark, color:saving?"#999":C.gold,
                  fontWeight:800, fontSize:14, cursor:saving?"not-allowed":"pointer",
                  transition:"all .15s" }}>
                {saving ? "Saving…" : editing ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
import React from "react";
import { useState } from "react";
import API from "../../services/api";

const C = {
  green:"#1D9E75", red:"#D85A30", gold:"#C6A84B",
  sidebar:"#0E2A23", border:"#e8ede9", muted:"#7a8c7e", text:"#1a2b1f",
};

export default function CouponInput({ orderAmount, vendorId, onApply, onRemove }) {
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [applied,  setApplied]  = useState(null); // { code, discount, finalAmount }

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Enter a coupon code"); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await API.post("/coupons/validate", {
        code:        trimmed,
        orderAmount: Number(orderAmount),
        vendorId:    vendorId || undefined,
      });
      const result = {
        code:        data.coupon.code,
        description: data.coupon.description,
        discount:    data.discount,
        finalAmount: data.finalAmount,
      };
      setApplied(result);
      onApply?.(data.coupon, data.discount, data.finalAmount);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setCode("");
    setError("");
    onRemove?.();
  };

  // ── Applied state ─────────────────────────────────────────────────────────────
  if (applied) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"12px 16px", borderRadius:10,
      background:"#eaf3de", border:"1px solid #c3ddb5" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:18 }}>🎉</span>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#3B6D11" }}>
            {applied.code} applied
          </div>
          <div style={{ fontSize:11, color:"#3B6D11", opacity:.8, marginTop:1 }}>
            {applied.description || `You save $${applied.discount.toFixed(2)}`}
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:15, fontWeight:800, color:"#3B6D11" }}>
          −${applied.discount.toFixed(2)}
        </span>
        <button onClick={handleRemove}
          style={{ background:"none", border:"none", cursor:"pointer",
            color:"#3B6D11", fontSize:18, lineHeight:1, opacity:.7 }}>×</button>
      </div>
    </div>
  );

  // ── Input state ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div style={{ display:"flex", gap:8 }}>
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:10, top:"50%",
            transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>🏷️</span>
          <input
            value={code}
            onChange={e=>{ setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={e=>e.key==="Enter"&&handleApply()}
            placeholder="Enter coupon code"
            style={{ width:"100%", padding:"10px 12px 10px 34px",
              border:`1.5px solid ${error?C.red:C.border}`,
              borderRadius:9, fontSize:13, color:C.text, outline:"none",
              boxSizing:"border-box", letterSpacing:".05em", fontWeight:600,
              textTransform:"uppercase", transition:"border-color .15s" }}
            onFocus={e=>e.target.style.borderColor=C.green}
            onBlur={e=>e.target.style.borderColor=error?C.red:C.border}
          />
        </div>
        <button onClick={handleApply} disabled={loading || !code.trim()}
          style={{ padding:"10px 20px", borderRadius:9, border:"none",
            background: loading || !code.trim() ? "#ccc" : C.sidebar,
            color: loading || !code.trim() ? "#999" : C.gold,
            fontWeight:700, fontSize:13, cursor: loading||!code.trim()?"not-allowed":"pointer",
            whiteSpace:"nowrap", transition:"all .15s", flexShrink:0 }}>
          {loading ? "Checking…" : "Apply"}
        </button>
      </div>
      {error && (
        <div style={{ fontSize:12, color:C.red, display:"flex",
          alignItems:"center", gap:5 }}>
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}
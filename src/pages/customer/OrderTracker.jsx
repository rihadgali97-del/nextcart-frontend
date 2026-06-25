import { C } from "./constants";
import "./dashboard.css";

// ─── Order progress tracker (pending → processing → shipped → delivered) ──────
export default function OrderTracker({ status }) {
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
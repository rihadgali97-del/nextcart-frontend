import React from "react";

export function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:6,
        border:`1px solid ${color}30`,background:`${color}10`,color,cursor:"pointer",whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

export function Pagination({ page, onChange }) {
  return (
    <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end",alignItems:"center"}}>
      <button disabled={page<=1} onClick={()=>onChange(page-1)}
        style={{padding:"6px 12px",fontSize:12,border:"1px solid #e8ede9",borderRadius:7,
          background:page<=1?"#f3f5f1":"#fff",color:page<=1?"#7a8c7e":"#1a2b1f",
          cursor:page<=1?"default":"pointer"}}>← Prev</button>
      <span style={{fontSize:12,color:"#7a8c7e"}}>Page {page}</span>
      <button onClick={()=>onChange(page+1)}
        style={{padding:"6px 12px",fontSize:12,border:"1px solid #e8ede9",borderRadius:7,
          background:"#fff",cursor:"pointer",color:"#1a2b1f"}}>Next →</button>
    </div>
  );
}

export function SettingRow({ label, children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,paddingBottom:12,borderBottom:"1px solid #e8ede9"}}>
      <div style={{width:200,fontSize:13,fontWeight:500,color:"#1a2b1f",textTransform:"capitalize",flexShrink:0}}>
        {label.replace(/([A-Z])/g," $1").trim()}
      </div>
      {children}
    </div>
  );
}

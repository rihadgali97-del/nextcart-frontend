import { useState, useEffect } from "react";
import API from "../../services/api";
import { C, avatarColor } from "./constants";
import { ago } from "./helpers";
import { Avatar, Stars, Spinner } from "./UI";
import "../../styles/customer/dashboard.css";

// ─── Product detail modal (image, price, description, reviews, message vendor) ─
export default function ProductModal({ product, onClose, onAddToCart, addingToCart, onMessageVendor }) {
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
    <div className="nc-confirm-overlay" style={{ zIndex:500 }}
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
              cursor:product.stock===0?"not-allowed":"pointer", width:"100%", marginBottom:10 }}>
            {addingToCart===product._id?"Adding…":"Add to Cart"}
          </button>

          {/* Message vendor from product modal */}
          {product.vendor && (
            <button onClick={()=>{
              onClose();
              onMessageVendor?.(product.vendor?._id||product.vendor,
                product.vendor?.name||"Vendor");
            }}
            style={{ width:"100%", padding:"10px 24px", borderRadius:9, fontSize:13,
              fontWeight:600, cursor:"pointer", marginBottom:20,
              border:`1px solid ${C.sidebar}`, background:`${C.sidebar}10`,
              color:C.sidebar, display:"flex", alignItems:"center",
              justifyContent:"center", gap:6 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.sidebar; e.currentTarget.style.color=C.gold; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=`${C.sidebar}10`; e.currentTarget.style.color=C.sidebar; }}>
              💬 Message Vendor
            </button>
          )}

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

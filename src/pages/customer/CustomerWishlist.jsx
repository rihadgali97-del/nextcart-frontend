import React, { useState } from "react";
import { C, PRODUCTS_PER_PAGE } from "./constants";
import { Panel, Card, Btn, Pagination } from "./UI";

export default function CustomerWishlist({ wishlist, toggleWishlist, handleAddToCart, setSection }) {
  const [wishlistPage, setWishlistPage] = useState(1);

  if (wishlist.length===0) return (
    <Panel title="Wishlist (0)" subtitle="Products you've saved for later">
      <div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{fontSize:48,marginBottom:12}}>❤️</div>
        <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>Your wishlist is empty</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Browse products and tap ❤️ to save them here</div>
        <Btn onClick={()=>setSection("shop")}>Browse Shop</Btn>
      </div>
    </Panel>
  );

  const pi = wishlist.slice((wishlistPage-1)*PRODUCTS_PER_PAGE, wishlistPage*PRODUCTS_PER_PAGE);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Panel title={`Wishlist (${wishlist.length})`} subtitle="Products you've saved for later">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
          {pi.map(p=>(
            <Card key={p._id} style={{padding:0,overflow:"hidden"}}>
              <div style={{height:130,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:42,position:"relative"}}>
                {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                <button onClick={()=>toggleWishlist(p)}
                  style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.9)",
                    border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>❤️</button>
              </div>
              <div style={{padding:"12px 12px 10px"}}>
                <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{p.category?.name||"Product"}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.green}}>${p.price}</span>
                  <button onClick={()=>handleAddToCart(p._id)}
                    style={{background:C.sidebar,color:C.gold,border:"none",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Cart</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Pagination page={wishlistPage} totalItems={wishlist.length}
          perPage={PRODUCTS_PER_PAGE} onChange={p=>{ setWishlistPage(p); window.scrollTo(0,0); }}/>
      </Panel>
    </div>
  );
}
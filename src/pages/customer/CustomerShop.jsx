import React, { useState, useEffect } from "react";
import { C, PRODUCTS_PER_PAGE } from "./constants";
import { Card, Btn, Spinner, Empty, Stars, Pagination } from "./UI";
import ProductModal from "./ProductModal";

export default function CustomerShop({
  products, loading, categories,
  handleAddToCart, addingToCart,
  toggleWishlist, isWishlisted,
  selectedProduct, setSelectedProduct,
  openMessageVendor, loadProducts,
}) {
  const [shopSearch,   setShopSearch]   = useState("");
  const [shopCategory, setShopCategory] = useState("");
  const [shopSort,     setShopSort]     = useState("newest");
  const [shopPage,     setShopPage]     = useState(1);

  useEffect(() => { setShopPage(1); }, [shopSearch, shopCategory, shopSort]);

  const filtered = products
    .filter(p =>
      (!shopSearch || p.name?.toLowerCase().includes(shopSearch.toLowerCase()) ||
       p.description?.toLowerCase().includes(shopSearch.toLowerCase())) &&
      (!shopCategory || p.category?._id===shopCategory || p.category===shopCategory)
    )
    .sort((a,b) => {
      if (shopSort==="price_asc")  return a.price - b.price;
      if (shopSort==="price_desc") return b.price - a.price;
      if (shopSort==="rating")     return (b.averageRating||0) - (a.averageRating||0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const pageItems = filtered.slice((shopPage-1)*PRODUCTS_PER_PAGE, shopPage*PRODUCTS_PER_PAGE);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Search + filters */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 220px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
            <input value={shopSearch} onChange={e=>setShopSearch(e.target.value)}
              placeholder="Search products, brands, keywords…"
              style={{width:"100%",padding:"9px 10px 9px 32px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <select value={shopCategory} onChange={e=>setShopCategory(e.target.value)}
            style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff",color:C.text,cursor:"pointer"}}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={shopSort} onChange={e=>setShopSort(e.target.value)}
            style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff",color:C.text,cursor:"pointer"}}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <Btn onClick={()=>loadProducts()} variant="ghost">↻ Refresh</Btn>
        </div>
      </div>

      {/* Category pills */}
      {categories.length>0 && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShopCategory("")}
            style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",
              border:`1px solid ${shopCategory===""?C.sidebar:C.border}`,
              background:shopCategory===""?C.sidebar:"#fff",
              color:shopCategory===""?C.gold:C.muted}}>All</button>
          {categories.map(c=>(
            <button key={c._id} onClick={()=>setShopCategory(c._id===shopCategory?"":c._id)}
              style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",
                border:`1px solid ${shopCategory===c._id?C.sidebar:C.border}`,
                background:shopCategory===c._id?C.sidebar:"#fff",
                color:shopCategory===c._id?C.gold:C.muted}}>{c.name}</button>
          ))}
        </div>
      )}

      {/* Products */}
      {loading.products
        ? <div style={{padding:"60px 0",textAlign:"center"}}><Spinner size={28}/></div>
        : filtered.length===0
        ? <Empty icon="🛍" text="No products found"/>
        : (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {pageItems.map(p=>(
                <Card key={p._id} onClick={()=>setSelectedProduct(p)}
                  style={{padding:0,overflow:"hidden",cursor:"pointer"}}>
                  <div style={{height:160,background:`linear-gradient(135deg,#e8f0ea,#d4e5d8)`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:48,position:"relative",overflow:"hidden"}}>
                    {p.image
                      ?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :"📦"}
                    <button onClick={e=>{e.stopPropagation();toggleWishlist(p);}}
                      style={{position:"absolute",top:8,left:8,width:30,height:30,borderRadius:"50%",
                        background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
                        boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}>
                      {isWishlisted(p._id)?"❤️":"🤍"}
                    </button>
                    {p.stock<5&&p.stock>0&&(
                      <span style={{position:"absolute",top:8,right:8,background:C.red,color:"#fff",
                        fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20}}>Low Stock</span>
                    )}
                    {p.stock===0&&(
                      <span style={{position:"absolute",top:8,right:8,background:"#333",color:"#fff",
                        fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20}}>Out of Stock</span>
                    )}
                  </div>
                  <div style={{padding:"14px 14px 12px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:3,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{p.category?.name||"Uncategorized"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}>
                      <Stars rating={Math.round(p.averageRating||0)} size={12}/>
                      <span style={{fontSize:11,color:C.muted}}>({p.totalReviews||0})</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:16,fontWeight:700,color:C.green}}>${p.price}</span>
                      <button onClick={e=>handleAddToCart(p._id,e)} disabled={p.stock===0}
                        style={{background:p.stock===0?"#ccc":C.sidebar,color:p.stock===0?"#999":C.gold,
                          border:"none",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,
                          cursor:p.stock===0?"not-allowed":"pointer"}}>
                        {addingToCart===p._id?<Spinner size={12}/>:"+ Cart"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={shopPage} totalItems={filtered.length}
              perPage={PRODUCTS_PER_PAGE} onChange={p=>{setShopPage(p);window.scrollTo(0,0);}}/>
          </>
        )
      }

      {/* Product modal */}
      {selectedProduct&&(
        <ProductModal product={selectedProduct}
          onClose={()=>setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
          onMessageVendor={openMessageVendor}/>
      )}
    </div>
  );
}
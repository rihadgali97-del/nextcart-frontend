import React from "react";
import { C } from "./constants";
import { Card, Btn, Spinner, Pagination } from "./UI";
import useNearbySearch from "./useNearbySearch";

export default function CustomerNearby({
  section, categories,
  selectedProduct, setSelectedProduct,
  handleAddToCart, addingToCart,
  toggleWishlist, isWishlisted,
  openMessageVendor,
  ProductModal,
}) {
  const {
    nearbyQuery, setNearbyQuery,
    nearbyCategory, setNearbyCategory,
    nearbyMinPrice, setNearbyMinPrice,
    nearbyMaxPrice, setNearbyMaxPrice,
    nearbyRadius, setNearbyRadius,
    nearbyPage, setNearbyPage,
    nearbyProducts, nearbyPagination,
    nearbyLoading, nearbyError,
    nearbyLocStatus, nearbyProxInfo, nearbyRankMap,
    NEARBY_LIMIT,
    requestNearbyLocation, clearNearbyLocation,
  } = useNearbySearch(section);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Header banner */}
      <div style={{background:`linear-gradient(120deg,${C.sidebar} 0%,#1a4d38 100%)`,
        borderRadius:14,padding:"20px 24px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4}}>📍 Find Nearby Products</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>
            Discover products from vendors closest to you, ranked by proximity + trust score
          </div>
        </div>
        {nearbyLocStatus!=="granted" ? (
          <button onClick={requestNearbyLocation} disabled={nearbyLocStatus==="requesting"}
            style={{padding:"10px 20px",borderRadius:10,border:"none",
              background:nearbyLocStatus==="requesting"?"rgba(255,255,255,.2)":C.gold,
              color:C.sidebar,fontWeight:800,fontSize:13,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {nearbyLocStatus==="requesting"
              ? <><span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(0,0,0,.2)",borderTopColor:C.sidebar,borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Locating…</>
              : nearbyLocStatus==="denied" ? "⚠ Location Denied" : "📍 Enable Near Me"}
          </button>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>✓ Location active · {nearbyRadius}km radius</div>
            <button onClick={clearNearbyLocation}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",
                background:"transparent",color:C.gold,fontSize:11,fontWeight:700,cursor:"pointer"}}>× Clear</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
            <input value={nearbyQuery}
              onChange={e=>{setNearbyQuery(e.target.value);setNearbyPage(1);}}
              placeholder="Search products near you…"
              style={{width:"100%",padding:"9px 10px 9px 32px",border:`1px solid ${C.border}`,
                borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <select value={nearbyCategory}
            onChange={e=>{setNearbyCategory(e.target.value);setNearbyPage(1);}}
            style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,
              fontSize:13,background:C.card,color:C.text,cursor:"pointer"}}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Min $" value={nearbyMinPrice}
            onChange={e=>{setNearbyMinPrice(e.target.value);setNearbyPage(1);}}
            style={{width:80,padding:"9px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none"}}/>
          <span style={{color:C.muted}}>—</span>
          <input type="number" placeholder="Max $" value={nearbyMaxPrice}
            onChange={e=>{setNearbyMaxPrice(e.target.value);setNearbyPage(1);}}
            style={{width:80,padding:"9px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none"}}/>
          {nearbyLocStatus==="granted" && (
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>Radius:</span>
              <input type="range" min={5} max={200} step={5} value={nearbyRadius}
                onChange={e=>{setNearbyRadius(Number(e.target.value));setNearbyPage(1);}}
                style={{width:100,accentColor:C.gold}}/>
              <span style={{fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap"}}>{nearbyRadius}km</span>
            </div>
          )}
        </div>
      </Card>

      {/* Status bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:13,color:C.muted}}>
          {nearbyLoading
            ? <span style={{display:"flex",alignItems:"center",gap:6}}>
                <Spinner size={13}/>
                {nearbyProducts.length>0?"Updating results…":"Searching…"}
              </span>
            : nearbyLocStatus!=="granted"
            ? <span>Enable location to find nearby products</span>
            : <span>
                <b style={{color:C.text}}>{nearbyPagination.total}</b> products found
                {nearbyProxInfo?.enabled&&(
                  <span style={{color:C.green,marginLeft:6}}>· 📍 within {nearbyProxInfo.radiusKm}km of you</span>
                )}
              </span>
          }
        </div>
        <div style={{display:"flex",gap:8}}>
          {["📍 Proximity","🌟 Trust","⭐ Rating"].map(l=>(
            <span key={l} style={{fontSize:11,color:C.muted,padding:"3px 10px",
              borderRadius:20,background:C.card,border:`1px solid ${C.border}`}}>{l}</span>
          ))}
        </div>
      </div>

      {/* Error */}
      {nearbyError&&(
        <div style={{padding:"12px 16px",background:`${C.red}10`,border:`1px solid ${C.red}30`,
          borderRadius:9,color:C.red,fontSize:13}}>⚠ {nearbyError}</div>
      )}

      {/* Loading spinner (first search only) */}
      {nearbyLoading && nearbyProducts.length===0 && (
        <Card style={{textAlign:"center",padding:"60px 20px"}}>
          <Spinner size={32}/>
          <div style={{fontSize:14,color:C.muted,marginTop:16}}>Finding nearby products…</div>
        </Card>
      )}

      {/* Empty state */}
      {!nearbyLoading && nearbyProducts.length===0 && (
        <Card style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:52,marginBottom:12}}>{nearbyLocStatus==="granted"?"📍":"🗺"}</div>
          <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:8}}>
            {nearbyLocStatus==="granted"
              ? `No products found within ${nearbyRadius}km`
              : "Enable location to find nearby products"}
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>
            {nearbyLocStatus==="granted"
              ? "Try increasing the radius or clearing filters"
              : "Click 'Enable Near Me' above to share your location"}
          </div>
          {nearbyLocStatus==="granted"
            ? <Btn onClick={()=>{setNearbyRadius(100);setNearbyPage(1);}}>Expand to 100km</Btn>
            : <Btn onClick={requestNearbyLocation}>📍 Enable Near Me</Btn>}
        </Card>
      )}

      {/* Product grid */}
      {nearbyProducts.length>0 && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
            {nearbyProducts.map((p,i)=>{
              const rank=nearbyLocStatus==="granted"?(nearbyRankMap[p._id]??i):undefined;
              return (
                <Card key={p._id} style={{padding:0,overflow:"hidden",cursor:"pointer"}}
                  onClick={()=>setSelectedProduct(p)}>
                  <div style={{height:160,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:46,position:"relative",overflow:"hidden"}}>
                    {p.image
                      ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : "📦"}
                    {rank!==undefined && (
                      <div style={{position:"absolute",top:8,left:8,
                        background:rank===0?"#1D9E75":rank<3?"#C6A84B":C.blue,
                        color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20}}>
                        📍 {rank===0?"Nearest":rank<3?"Very Close":rank<8?"Nearby":"In Range"}
                      </div>
                    )}
                    <button onClick={e=>{e.stopPropagation();toggleWishlist(p);}}
                      style={{position:"absolute",top:8,right:8,width:28,height:28,
                        borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"none",
                        cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {isWishlisted(p._id)?"❤️":"🤍"}
                    </button>
                    {p.stock===0 && (
                      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{color:"#fff",fontWeight:700,fontSize:13}}>Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{p.category?.name||"—"}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>
                      🏪 {p.vendor?.name||"Vendor"}
                      {p.vendor?.city&&<span style={{color:C.blue,marginLeft:4}}>· {p.vendor.city}</span>}
                    </div>
                    {p.vendor?.trustScore!==undefined && (
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:2}}>
                          <span>Trust</span>
                          <span style={{fontWeight:700,color:C.text}}>{Math.round(p.vendor.trustScore)}/100</span>
                        </div>
                        <div style={{height:3,background:"#e8ede9",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:2,
                            width:`${Math.min(p.vendor.trustScore,100)}%`,
                            background:`linear-gradient(90deg,${C.sidebar},${C.gold})`}}/>
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                      <span style={{fontSize:16,fontWeight:800,color:C.green}}>${Number(p.price).toFixed(2)}</span>
                      <button onClick={e=>{e.stopPropagation();handleAddToCart(p._id,e);}}
                        disabled={p.stock===0}
                        style={{background:p.stock===0?"#ccc":C.sidebar,color:p.stock===0?"#999":C.gold,
                          border:"none",padding:"6px 12px",borderRadius:7,fontSize:12,
                          fontWeight:600,cursor:p.stock===0?"not-allowed":"pointer"}}>
                        {addingToCart===p._id?<Spinner size={12}/>:"+ Cart"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {nearbyPagination.pages>1 && (
            <Pagination page={nearbyPage} totalItems={nearbyPagination.total}
              perPage={NEARBY_LIMIT} onChange={p=>{setNearbyPage(p);window.scrollTo(0,0);}}/>
          )}
        </>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct}
          onClose={()=>setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
          onMessageVendor={openMessageVendor}/>
      )}
    </div>
  );
}
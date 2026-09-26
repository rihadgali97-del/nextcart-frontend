import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import gebeyaPlusLogo from "../../assets/gebeya-logo.png";
import API, { getUserProfile, updateProfile, changePassword, getCategories, getConversations } from "../../services/api";
import { toast as appToast } from "../../services/toast";

import { C, NAV, notifStyle, avatarColor, PRODUCTS_PER_PAGE } from "./constants";
import { notifAPI, fmt, ago, fmtDate, toast, registerToast } from "./helpers";
import { Avatar, Card, Spinner } from "./UI";

import CustomerHome     from "./CustomerHome";
import CustomerShop     from "./CustomerShop";
import CustomerNearby   from "./CustomerNearby";
import CustomerOrders   from "./CustomerOrders";
import CustomerCart     from "./CustomerCart";
import CustomerWishlist from "./CustomerWishlist";
import CustomerReviews  from "./CustomerReviews";
import CustomerMessages from "./CustomerMessages";
import CustomerProfile  from "./CustomerProfile";
import ProductModal     from "./ProductModal";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [section,    setSection]    = useState("home");
  const [collapsed,  setCollapsed]  = useState(false);
  const [profile,    setProfile]    = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [cart,       setCart]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [myReviews,  setMyReviews]  = useState([]);
  const [convos,     setConvos]     = useState([]);
  const [loading,    setLoading]    = useState({});
  const [toastState, setToastState] = useState(null);

  // ── Wishlist ────────────────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nc_wishlist")||"[]"); } catch { return []; }
  });
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p=>p._id===product._id);
      const next   = exists
        ? prev.filter(p=>p._id!==product._id)
        : [...prev,{_id:product._id,name:product.name,price:product.price,image:product.image,category:product.category}];
      localStorage.setItem("nc_wishlist",JSON.stringify(next));
      toast[exists?"info":"success"](exists?"Removed from wishlist":"Added to wishlist ❤️");
      return next;
    });
  };
  const isWishlisted = (id) => wishlist.some(p=>p._id===id);

  // ── Confirm + logout ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!await appToast.confirm("Are you sure you want to log out?", "Log out")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("nc_wishlist");
    appToast.success("You have been logged out.");
    navigate("/login");
  };

  // ── Toast ───────────────────────────────────────────────────────────────────
  registerToast(setToastState);
  useEffect(() => {
    if (toastState) { const t=setTimeout(()=>setToastState(null),3200); return ()=>clearTimeout(t); }
  }, [toastState]);
  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));

  // ── Socket.io ───────────────────────────────────────────────────────────────
  const socketRef     = useRef(null);
  const activeChatRef = useRef(null);
  useEffect(() => {
    if (!profile?._id) return;
    const socket = io("http://localhost:5000",{transports:["websocket"],reconnectionAttempts:5});
    socketRef.current = socket;
    socket.emit("join_chat", profile._id);
    socket.on("orderUpdate",({orderId,status,message})=>{
      setOrders(prev=>prev.map(o=>o._id===orderId?{...o,status}:o));
      toast.info(`📦 ${message}`);
    });
    socket.on("receive_message",(msg)=>{
      setChatMessages(prev=>{
        const aid=activeChatRef.current;
        if(msg.sender===aid||msg.receiver===aid) return [...prev,msg];
        return prev;
      });
    });
    socket.on("message_sent",(msg)=>{
      setChatMessages(prev=>prev.map(m=>m._tempId===msg._tempId?{...msg}:m));
    });
    return ()=>socket.disconnect();
  },[profile?._id]);

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [activeChat,   setActiveChat]   = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const chatBottomRef = useRef(null);
  useEffect(()=>{ activeChatRef.current=activeChat?._id; },[activeChat]);
  useEffect(()=>{ chatBottomRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMessages]);

  const openChat = async (convo) => {
    const otherId=convo._id||convo.userDetails?._id;
    const otherName=convo.userDetails?.name||"Unknown";
    setActiveChat({_id:otherId,name:otherName});
    setChatMessages([]); setChatLoading(true);
    setConvos(prev=>prev.map(c=>(c._id||c.userDetails?._id)===otherId?{...c,unread:0}:c));
    try {
      const {data}=await API.get(`/messages/history/${otherId}`);
      setChatMessages(Array.isArray(data)?data:data.messages||data.data||[]);
    } catch {}
    finally { setChatLoading(false); }
  };

  const sendMessage = () => {
    const text=chatInput.trim();
    if(!text||!activeChat||!socketRef.current) return;
    const tempId=Date.now().toString();
    setChatMessages(prev=>[...prev,{_tempId:tempId,sender:profile._id,receiver:activeChat._id,text,createdAt:new Date().toISOString(),pending:true}]);
    setChatInput("");
    socketRef.current.emit("send_message",{senderId:profile._id,receiverId:activeChat._id,text,_tempId:tempId});
  };

  const openMessageVendor = (vendorId, vendorName) => {
    setSelectedProduct(null);
    setActiveChat({_id:vendorId,name:vendorName});
    setChatMessages([]); setChatLoading(true);
    API.get(`/messages/history/${vendorId}`)
      .then(({data})=>setChatMessages(Array.isArray(data)?data:data.messages||data.data||[]))
      .catch(()=>{}).finally(()=>setChatLoading(false));
    loadConvos();
    setSection("messages");
  };

  // ── Notifications ───────────────────────────────────────────────────────────
  const [notifs,       setNotifs]       = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter,  setNotifFilter]  = useState("all");
  const [notifTotal,   setNotifTotal]   = useState(0);
  const [notifPage,    setNotifPage]    = useState(1);
  const notifRef = useRef(null);
  const NOTIF_PER_PAGE = 8;

  const loadNotifs = useCallback(async (page=1,filter="all") => {
    setNotifLoading(true);
    try {
      const params={page,limit:NOTIF_PER_PAGE};
      if(filter==="unread") params.read=false;
      const {data}=await notifAPI.getAll(params);
      const result=data.data||data;
      const list=result.notifications||result;
      const total=result.pagination?.total||list.length;
      setNotifs(page===1?list:prev=>[...prev,...list]);
      setNotifTotal(total);
      setUnreadCount(list.filter(n=>!n.read).length+(page>1?unreadCount:0));
    } catch {}
    finally { setNotifLoading(false); }
  },[]);

  useEffect(()=>{
    loadNotifs(1,notifFilter);
    const t=setInterval(()=>loadNotifs(1,notifFilter),60_000);
    return ()=>clearInterval(t);
  },[notifFilter]);

  useEffect(()=>{
    const handler=(e)=>{ if(notifRef.current&&!notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);

  const handleMarkRead    = async(id)=>{ try{ await notifAPI.markRead(id); setNotifs(prev=>prev.map(n=>n._id===id?{...n,read:true}:n)); setUnreadCount(p=>Math.max(0,p-1)); }catch{} };
  const handleMarkAllRead = async()=>{ try{ await notifAPI.markAllRead(); setNotifs(prev=>prev.map(n=>({...n,read:true}))); setUnreadCount(0); }catch{} };
  const handleDeleteNotif = async(id,e)=>{ e.stopPropagation(); try{ await notifAPI.remove(id); setNotifs(prev=>prev.filter(n=>n._id!==id)); setNotifTotal(p=>p-1); }catch{} };
  const handleLoadMore    = ()=>{ const n=notifPage+1; setNotifPage(n); loadNotifs(n,notifFilter); };

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async()=>{ setLoad("profile",true); try{ const {data}=await getUserProfile(); setProfile(data.data||data); }catch{} finally{ setLoad("profile",false); } },[]);
  const loadOrders  = useCallback(async()=>{ setLoad("orders",true);  try{ const {data}=await API.get("/orders"); setOrders(Array.isArray(data)?data:(data.orders||data.data||[])); }catch{} finally{ setLoad("orders",false); } },[]);
  const loadCart    = useCallback(async()=>{
    setLoad("cart",true);
    try {
      const {data}=await API.get("/cart");
      const raw=data.items||data.cart?.items||[];
      setCart(raw.map(item=>({
        _id:item._id, productId:item.product?._id||item.product, product:item.product,
        name:item.product?.name||item.name||"Unknown",
        price:Number(item.product?.price??item.price??0),
        image:item.product?.image||item.image||null,
        vendor:item.product?.vendor||item.vendor||null,
        quantity:item.quantity||1,
      })));
    } catch {} finally { setLoad("cart",false); }
  },[]);
  const loadCategories = useCallback(async()=>{ try{ const {data}=await getCategories(); setCategories(Array.isArray(data)?data:(data.data||[])); }catch{} },[]);
  const loadProducts   = useCallback(async(params={})=>{ setLoad("products",true); try{ const {data}=await API.get("/products",{params}); setProducts(data.products||data.data||data||[]); }catch{} finally{ setLoad("products",false); } },[]);
  const loadMyReviews  = useCallback(async()=>{ setLoad("reviews",true); try{ const {data}=await API.get("/reviews/mine"); setMyReviews(data.data||data||[]); }catch{} finally{ setLoad("reviews",false); } },[]);
  const loadConvos     = useCallback(async()=>{ setLoad("convos",true); try{ const {data}=await getConversations(); setConvos(data||[]); }catch{} finally{ setLoad("convos",false); } },[]);

  useEffect(()=>{ loadProfile(); loadOrders(); loadCart(); loadCategories(); },[]);
  useEffect(()=>{
    if(section==="shop")     loadProducts();
    if(section==="reviews")  loadMyReviews();
    if(section==="messages") loadConvos();
  },[section]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const cartTotal = cart.reduce((a,i)=>a+(Number(i.price||0)*Number(i.quantity||0)),0);
  const cartCount = cart.reduce((a,i)=>a+Number(i.quantity||0),0);
  const badges = {
    orders:   orders.filter(o=>["pending","processing","shipped"].includes(o.status)).length||null,
    cart:     cartCount||null,
    wishlist: wishlist.length||null,
    messages: convos.filter(c=>c.unread).length||null,
  };

  // ── Cart handlers ────────────────────────────────────────────────────────────
  const [addingToCart,    setAddingToCart]    = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkingOut,     setCheckingOut]     = useState(false);

  const handleAddToCart = async (productId,e) => {
    e?.stopPropagation(); setAddingToCart(productId);
    try { await API.post("/cart",{product:productId,productId,quantity:1}); await loadCart(); toast.success("Added to cart!"); }
    catch { toast.error("Failed to add to cart"); }
    finally { setAddingToCart(null); }
  };
  const updateCartQty = async(productId,quantity)=>{ if(quantity<1) return removeFromCart(productId); try{ await API.post("/cart",{product:productId,productId,quantity}); await loadCart(); }catch{ toast.error("Failed to update cart"); } };
  const removeFromCart = async(productId)=>{ try{ await API.delete(`/cart/${productId}`); await loadCart(); toast.success("Removed from cart"); }catch{ toast.error("Failed to remove item"); } };
  const clearCartFn    = async()=>{ if(!await appToast.confirm("Clear the entire cart?", "Clear cart")) return; try{ await API.delete("/cart"); setCart([]); toast.success("Cart cleared"); }catch{ toast.error("Failed to clear cart"); } };

  const handleCheckout = async (shippingForm, discountedTotal, appliedCoupon) => {
    if (cart.length===0){ toast.error("Cart is empty"); return; }
    setCheckingOut(true);
    try {
      const {data}=await API.post("/orders",{
        orderItems:cart.map(i=>({product:i.productId||i.product?._id,name:i.name,quantity:i.quantity,price:i.price,image:i.image||"",vendor:i.vendor?._id||i.vendor||""})),
        shippingAddress:{address:shippingForm.address,city:shippingForm.city,postalCode:shippingForm.postalCode,country:shippingForm.country},
        paymentMethod:shippingForm.paymentMethod, totalPrice:discountedTotal,
        couponCode:appliedCoupon?.code||undefined, discount:appliedCoupon?.discount||0,
      });
      const orderId=data.order?._id, paymentInfo=data.paymentInfo, method=shippingForm.paymentMethod;
      if(method==="cash"){ try{await API.delete("/cart");}catch{} setCart([]); toast.success("Order placed! Pay on delivery."); await loadOrders(); setSection("orders"); return; }
      localStorage.setItem("pending_order_id",orderId||"");
      if(method!=="chapa"){
        try{await API.delete("/cart");}catch{} setCart([]);
      }
      if(method==="telebirr"||method==="cbe"){
        const url=paymentInfo?.url||paymentInfo?.toPayUrl;
        if(url&&!url.startsWith("/")) localStorage.setItem("telebirr_redirect_url",url);
        navigate(`/telebirr-pay?orderId=${orderId}&amount=${discountedTotal.toFixed(2)}${(!url||url.startsWith("/"))?"&mock=true":""}`);
        return;
      }
      if(method==="chapa"){
        const chapaUrl=paymentInfo?.url;
        if(!chapaUrl) throw new Error("Chapa checkout URL was not returned.");
        localStorage.setItem("pending_payment_method","chapa");
        localStorage.setItem("pending_payment_reference",paymentInfo.tx_ref||"");
        window.location.href=chapaUrl;
        return;
      }
      if(method==="stripe"){ const su=paymentInfo?.checkout_url||paymentInfo?.url; if(su){setTimeout(()=>window.location.href=su,600);return;} }
      toast.success("Order placed successfully!"); await loadOrders(); setSection("orders");
    } catch(err){ toast.error(err.response?.data?.message||"Checkout failed"); }
    finally { setCheckingOut(false); }
  };

  // ── Global search ────────────────────────────────────────────────────────────
  const [globalSearch,        setGlobalSearch]        = useState("");
  const [globalResults,       setGlobalResults]       = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchOpen,    setGlobalSearchOpen]    = useState(false);
  const globalSearchRef   = useRef(null);
  const globalSearchTimer = useRef(null);

  useEffect(()=>{
    if(!globalSearch.trim()){ setGlobalResults([]); setGlobalSearchOpen(false); return; }
    clearTimeout(globalSearchTimer.current);
    globalSearchTimer.current = setTimeout(async()=>{
      setGlobalSearchLoading(true);
      try {
        const {data}=await API.get("/search",{params:{q:globalSearch.trim(),limit:8,_t:Date.now()},headers:{"Cache-Control":"no-cache"}});
        const results=data?.data||data?.products||(Array.isArray(data)?data:[]);
        setGlobalResults(results);
        setGlobalSearchOpen(results.length>0);
      } catch { setGlobalResults([]); }
      finally { setGlobalSearchLoading(false); }
    },300);
    return ()=>clearTimeout(globalSearchTimer.current);
  },[globalSearch]);

  useEffect(()=>{
    const handler=(e)=>{ if(globalSearchRef.current&&!globalSearchRef.current.contains(e.target)) setGlobalSearchOpen(false); };
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);

  // ── Section map ──────────────────────────────────────────────────────────────
  const commonProps = { setSection, loading, profile, orders, cart, cartCount, cartTotal, categories, products, myReviews, convos, wishlist, toggleWishlist, isWishlisted, handleAddToCart, addingToCart, selectedProduct, setSelectedProduct, openMessageVendor };

  const sectionMap = {
    home:     <CustomerHome     {...commonProps}/>,
    shop:     <CustomerShop     {...commonProps} loadProducts={loadProducts}/>,
    nearby:   <CustomerNearby   {...commonProps} section={section} ProductModal={ProductModal}/>,
    orders:   <CustomerOrders   {...commonProps} setActiveChat={setActiveChat} setChatMessages={setChatMessages} setChatLoading={setChatLoading} loadConvos={loadConvos}/>,
    cart:     <CustomerCart     {...commonProps} updateCartQty={updateCartQty} removeFromCart={removeFromCart} clearCartFn={clearCartFn} handleCheckout={handleCheckout} checkingOut={checkingOut}/>,
    wishlist: <CustomerWishlist {...commonProps}/>,
    reviews:  <CustomerReviews  {...commonProps} loadMyReviews={loadMyReviews}/>,
    messages: <CustomerMessages {...commonProps} activeChat={activeChat} setActiveChat={setActiveChat} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading} chatBottomRef={chatBottomRef} sendMessage={sendMessage} openChat={openChat}/>,
    profile:  <CustomerProfile  profile={profile} setProfile={setProfile} handleLogout={handleLogout}/>,
    settings: <CustomerProfile  profile={profile} setProfile={setProfile} handleLogout={handleLogout}/>,
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}} *{box-sizing:border-box} body{margin:0;font-family:'DM Sans',system-ui,sans-serif} ::-webkit-scrollbar{width:5px;height:5px} ::-webkit-scrollbar-track{background:#f1f1f1} ::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}`}</style>

      <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',system-ui,sans-serif"}}>

        {/* ── SIDEBAR ── */}
        <aside style={{width:collapsed?68:220,background:C.sidebar,display:"flex",flexDirection:"column",
          flexShrink:0,transition:"width .25s cubic-bezier(.4,0,.2,1)",overflow:"hidden",position:"relative"}}>
          <div style={{padding:"18px 14px 14px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:10,minHeight:70}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"#fff",overflow:"hidden",display:"flex",alignItems:"flex-start",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
              <img src={gebeyaPlusLogo} alt="Gebeya+" style={{width:50,maxWidth:"none",transform:"scale(1.5) translateY(-2px)",objectFit:"contain"}}/>
            </div>
            {!collapsed&&(
              <div style={{overflow:"hidden"}}>
                <div style={{fontSize:15,fontWeight:900,color:"#fff",whiteSpace:"nowrap",letterSpacing:"-.2px"}}>GebeyaPlus</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:".15em",fontWeight:700}}>Customer Portal</div>
              </div>
            )}
          </div>
          <button onClick={()=>setCollapsed(p=>!p)}
            style={{position:"absolute",top:20,right:-12,width:24,height:24,borderRadius:"50%",background:C.gold,border:"none",color:C.sidebar,cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
            {collapsed?"›":"‹"}
          </button>
          <nav style={{padding:"12px 8px",flex:1,overflowY:"auto"}}>
            {NAV.map(item=>{
              const badgeCount=badges[item.badge], active=section===item.id;
              return (
                <div key={item.id} onClick={()=>setSection(item.id)} title={collapsed?item.label:""}
                  style={{display:"flex",alignItems:"center",gap:collapsed?0:10,padding:collapsed?"11px 0":"9px 12px",justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer",marginBottom:2,fontSize:13,fontWeight:active?500:400,color:active?C.gold:"rgba(255,255,255,.65)",background:active?"rgba(198,168,75,.12)":"transparent",borderLeft:active&&!collapsed?`3px solid ${C.gold}`:"3px solid transparent",transition:"all .15s",position:"relative"}}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color="#fff";}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.65)";}}} >
                  <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                  {!collapsed&&<span style={{whiteSpace:"nowrap"}}>{item.label}</span>}
                  {badgeCount&&<span style={{marginLeft:collapsed?0:"auto",position:collapsed?"absolute":"static",top:collapsed?4:undefined,right:collapsed?4:undefined,background:C.red,color:"#fff",fontSize:9,padding:"1px 5px",borderRadius:20,fontWeight:700,minWidth:16,textAlign:"center"}}>{badgeCount}</span>}
                </div>
              );
            })}
          </nav>
          <div style={{borderTop:"1px solid rgba(255,255,255,.08)"}}>
            <div style={{padding:collapsed?"10px 0":"12px 14px",display:"flex",alignItems:"center",gap:10,justifyContent:collapsed?"center":"flex-start"}}>
              <Avatar name={profile?.name||"?"} size={32} bg={C.gold} color={C.sidebar}/>
              {!collapsed&&(
                <div style={{overflow:"hidden",flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{profile?.name||"Customer"}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap"}}>{profile?.reputation?.rank||"Starter"}</div>
                </div>
              )}
            </div>
            <div onClick={handleLogout} title={collapsed?"Log Out":""}
              style={{display:"flex",alignItems:"center",gap:collapsed?0:10,padding:collapsed?"11px 0":"9px 14px 14px",justifyContent:collapsed?"center":"flex-start",cursor:"pointer",fontSize:13,color:"rgba(255,80,60,.75)",transition:"color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#ff5040"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,80,60,.75)"}>
              <span style={{fontSize:16,flexShrink:0}}>🚪</span>
              {!collapsed&&<span style={{whiteSpace:"nowrap",fontWeight:500}}>Log Out</span>}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

          {/* Topbar */}
          <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(8px)"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.muted,flexShrink:0}}>
              <span>Home</span><span style={{fontSize:11}}>›</span>
              <span style={{color:C.text,fontWeight:500,textTransform:"capitalize"}}>{section}</span>
            </div>

            {/* Global search */}
            <div ref={globalSearchRef} style={{position:"relative",flex:1,maxWidth:480}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.muted}}>🔍</span>
              {globalSearchLoading&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"inline-block",width:14,height:14,border:`2px solid ${C.border}`,borderTopColor:C.green,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>}
              <input value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}
                placeholder="Search products, categories, vendors…"
                style={{width:"100%",padding:"9px 36px 9px 36px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.text,outline:"none",background:"#f9fafb",boxSizing:"border-box",transition:"all .15s"}}
                onFocus={e=>{ e.target.style.borderColor=C.green; e.target.style.background="#fff"; if(globalResults.length>0)setGlobalSearchOpen(true); }}
                onBlur={e=>{ e.target.style.borderColor=C.border; e.target.style.background="#f9fafb"; }}/>
              {globalSearchOpen&&globalResults.length>0&&(
                <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:300,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em"}}>{globalResults.length} results for "{globalSearch}"</span>
                    <button onClick={()=>{ setGlobalSearchOpen(false); setSection("shop"); setGlobalSearch(""); }} style={{fontSize:11,fontWeight:700,color:C.green,background:"none",border:"none",cursor:"pointer",padding:0}}>View all →</button>
                  </div>
                  {globalResults.map((p,i)=>(
                    <div key={p._id} onClick={()=>{ setGlobalSearch(""); setGlobalResults([]); setGlobalSearchOpen(false); setSelectedProduct(p); setSection("shop"); }}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:"pointer",transition:"background .1s",borderBottom:i<globalResults.length-1?`1px solid ${C.border}40`:"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafb"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{width:40,height:40,borderRadius:8,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                        {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{p.category?.name||"Product"}{p.vendor?.name&&<span style={{color:C.muted}}> · {p.vendor.name}</span>}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.green}}>${Number(p.price).toFixed(2)}</div>
                        <div style={{fontSize:10,color:p.stock>0?C.muted:C.red,fontWeight:500,marginTop:1}}>{p.stock>0?`${p.stock} in stock`:"Out of stock"}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{padding:"10px 14px",background:"#f9fafb",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
                    <button onClick={()=>{ setGlobalSearchOpen(false); setSection("shop"); setGlobalSearch(""); }} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:C.sidebar,color:C.gold,fontSize:12,fontWeight:700,cursor:"pointer"}}>🛍 Browse all in Shop</button>
                    <button onClick={()=>{ setGlobalSearchOpen(false); setSection("nearby"); setGlobalSearch(""); }} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:12,fontWeight:600,cursor:"pointer"}}>📍 Search nearby</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              {/* Cart */}
              <div onClick={()=>setSection("cart")} style={{position:"relative",cursor:"pointer",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${C.border}`,borderRadius:8,background:"#fff"}}>
                <span style={{fontSize:16}}>🛒</span>
                {cartCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:C.red,color:"#fff",fontSize:9,padding:"1px 5px",borderRadius:20,fontWeight:700}}>{cartCount}</span>}
              </div>
              {/* Bell */}
              <div ref={notifRef} style={{position:"relative"}}>
                <button onClick={()=>{ setNotifOpen(p=>!p); if(!notifOpen)loadNotifs(1,notifFilter); }}
                  style={{position:"relative",width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>
                  🔔
                  {unreadCount>0&&<span style={{position:"absolute",top:-5,right:-5,background:C.red,color:"#fff",fontSize:9,fontWeight:700,minWidth:16,height:16,borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px",border:"2px solid #fff",animation:"pulse 2s infinite"}}>{unreadCount>99?"99+":unreadCount}</span>}
                </button>
                {notifOpen&&(
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:360,maxHeight:520,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                    <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:C.text}}>Notifications</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>{unreadCount>0?`${unreadCount} unread`:"All caught up 🎉"}</div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {["all","unread"].map(f=>(
                          <button key={f} onClick={()=>{ setNotifFilter(f); setNotifPage(1); loadNotifs(1,f); }}
                            style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:"none",background:notifFilter===f?C.sidebar:"#f3f5f1",color:notifFilter===f?C.gold:C.muted,textTransform:"capitalize"}}>{f}</button>
                        ))}
                        {unreadCount>0&&<button onClick={handleMarkAllRead} style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${C.green}40`,background:`${C.green}10`,color:C.green}}>✓ All</button>}
                      </div>
                    </div>
                    <div style={{overflowY:"auto",flex:1}}>
                      {notifLoading&&notifs.length===0?<div style={{padding:"30px 0",textAlign:"center"}}><Spinner size={20}/></div>
                        :notifs.length===0?<div style={{padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>🔕</div><div style={{fontSize:13,color:C.muted}}>No notifications yet</div></div>
                        :notifs.map(n=>{
                          const ns=notifStyle(n.type);
                          return (
                            <div key={n._id} onClick={()=>{if(!n.read)handleMarkRead(n._id);}}
                              style={{display:"flex",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:n.read?"#fff":`${ns.bg}60`,cursor:n.read?"default":"pointer",transition:"background .15s",position:"relative"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#f8faf8"}
                              onMouseLeave={e=>e.currentTarget.style.background=n.read?"#fff":`${ns.bg}60`}>
                              <div style={{width:36,height:36,borderRadius:10,background:ns.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ns.icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontWeight:n.read?500:700,fontSize:13,color:C.text,lineHeight:1.3}}>{n.title}</div>
                                <div style={{fontSize:12,color:C.muted,marginTop:3,lineHeight:1.5,wordBreak:"break-word"}}>{n.message}</div>
                                <div style={{fontSize:10,color:C.muted,marginTop:5,display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{color:ns.accent,fontWeight:600,textTransform:"capitalize"}}>{n.type}</span>
                                  <span>·</span><span>{ago(n.createdAt)}</span>
                                </div>
                              </div>
                              <button onClick={e=>handleDeleteNotif(n._id,e)}
                                style={{position:"absolute",top:10,right:12,background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:14,fontWeight:700,lineHeight:1,opacity:0,transition:"opacity .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.color=C.red;}}
                                onMouseLeave={e=>e.currentTarget.style.opacity="0"}>×</button>
                            </div>
                          );
                        })
                      }
                      {notifs.length<notifTotal&&(
                        <div style={{padding:"10px",textAlign:"center"}}>
                          <button onClick={handleLoadMore} disabled={notifLoading} style={{fontSize:12,fontWeight:600,color:C.green,background:"none",border:`1px solid ${C.green}40`,borderRadius:8,padding:"7px 20px",cursor:"pointer"}}>
                            {notifLoading?<Spinner size={12}/>:"Load more"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,textAlign:"center"}}>
                      <span style={{fontSize:11,color:C.muted}}>Showing {notifs.length} of {notifTotal} notifications</span>
                    </div>
                  </div>
                )}
              </div>
              {/* User */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Avatar name={profile?.name||"?"} size={32} bg={C.gold} color={C.sidebar}/>
                <span style={{fontSize:13,fontWeight:500,color:C.text}}>{profile?.name?.split(" ")[0]||"Customer"}</span>
                <button onClick={handleLogout} style={{marginLeft:4,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${C.red}30`,background:`${C.red}08`,color:C.red,display:"flex",alignItems:"center",gap:5}}>🚪 Logout</button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{flex:1,padding:"20px 24px",overflowY:"auto"}}>
            {sectionMap[section]||sectionMap.home}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {/* Toast */}
      {toastState&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toastState.type==="error"?C.red:toastState.type==="info"?C.blue:C.green,color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 4px 24px rgba(0,0,0,.18)",display:"flex",alignItems:"center",gap:8,maxWidth:320}}>
          <span>{toastState.type==="error"?"✕":toastState.type==="info"?"ℹ":"✓"}</span>
          {toastState.msg}
        </div>
      )}

      {/* Product modal (global — accessible from shop + nearby) */}
      {selectedProduct&&(
        <ProductModal product={selectedProduct}
          onClose={()=>setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          addingToCart={addingToCart}
          onMessageVendor={openMessageVendor}/>
      )}
    </>
  );
}

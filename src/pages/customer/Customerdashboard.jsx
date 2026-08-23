import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import nextCartLogo from "../../assets/nextcart-logo.png";
import DeliveryMap from "./DeliveryMap";
import CustomerMessages from "./CustomerMessages";
import CustomerHome from "./CustomerHome";
import OrderTracker from "./OrderTracker";
import ProductModal from "./ProductModal";
import useNearbySearch from "./useNearbySearch";
import { Pill, Avatar, Stars, Card, Panel, StatCard, Input, Btn, Spinner, Empty, Pagination, Donut, MiniBar } from "./UI";
import { C, STATUS, avatarColor, NAV, ITEMS_PER_PAGE, PRODUCTS_PER_PAGE, NEARBY_LIMIT, notifStyle } from "./constants";
import { notifAPI, fmt, ago, fmtDate, toast, registerToastSetter } from "./helpers";
import API, {
  getUserProfile,
  updateProfile,
  changePassword,
  getCategories,
  getConversations,
  reportReview,
  deleteReview,
} from "../../services/api";


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [section,    setSection]    = useState("home");
  const nearby = useNearbySearch(section);
  const {
    nearbyQuery, setNearbyQuery, nearbyCategory, setNearbyCategory,
    nearbyMinPrice, setNearbyMinPrice, nearbyMaxPrice, setNearbyMaxPrice,
    nearbyRadius, setNearbyRadius, nearbyPage, setNearbyPage,
    nearbyProducts, nearbyPagination, nearbyLoading, nearbyError,
    nearbyLocation, setNearbyLocation, nearbyLocStatus, setNearbyLocStatus,
    nearbyProxInfo, nearbyRankMap, requestNearbyLocation,
  } = nearby;
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

  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nc_wishlist") || "[]"); } catch { return []; }
  });
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p._id === product._id);
      const next = exists ? prev.filter(p => p._id !== product._id)
        : [...prev, { _id:product._id, name:product.name, price:product.price,
            image:product.image, category:product.category, averageRating:product.averageRating }];
      localStorage.setItem("nc_wishlist", JSON.stringify(next));
      toast[exists?"info":"success"](exists ? "Removed from wishlist" : "Added to wishlist ❤️");
      return next;
    });
  };
  const isWishlisted = (id) => wishlist.some(p => p._id === id);

  const [confirm, setConfirm] = useState(null);
  const showConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  const handleLogout = () => {
    showConfirm("Are you sure you want to log out?", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("nc_wishlist");
      navigate("/login");
    });
  };

  // ── Socket.io ─────────────────────────────────────────────────────────────
  const socketRef = useRef(null);
  useEffect(() => {
    if (!profile?._id) return;
    const socket = io("http://localhost:5000", { transports:["websocket"], reconnectionAttempts:5 });
    socketRef.current = socket;
    socket.emit("join_chat", profile._id);
    socket.on("orderUpdate", ({ orderId, status, message }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.info(`📦 ${message}`);
      loadNotifs(1, notifFilter);
    });
    socket.on("receive_message", (msg) => {
      setChatMessages(prev => {
        const aid = activeChatRef.current;
        if (msg.sender === aid || msg.receiver === aid) return [...prev, msg];
        return prev;
      });
      setConvos(prev => prev.map(c => {
        const oid = c._id?.toString() || c.userDetails?._id?.toString();
        if (oid === msg.sender?.toString()) return { ...c, lastMessage:msg.text, lastTimestamp:msg.createdAt };
        return c;
      }));
      if (section !== "messages") {
        setConvos(prev => prev.map(c => {
          const oid = c._id?.toString() || c.userDetails?._id?.toString();
          return oid === msg.sender?.toString() ? { ...c, unread:(c.unread||0)+1 } : c;
        }));
      }
    });
    socket.on("message_sent", (msg) => {
      setChatMessages(prev => prev.map(m => m._tempId === msg._tempId ? { ...msg } : m));
    });
    return () => { socket.disconnect(); };
  }, [profile?._id]);

  const [activeChat,   setActiveChat]   = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState("");
  const [chatLoading,  setChatLoading]  = useState(false);
  const activeChatRef = useRef(null);
  const chatBottomRef = useRef(null);
  useEffect(() => { activeChatRef.current = activeChat?._id; }, [activeChat]);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  const openChat = async (convo) => {
    const otherId = convo._id || convo.userDetails?._id;
    const otherName = convo.userDetails?.name || "Unknown";
    setActiveChat({ _id:otherId, name:otherName });
    setChatMessages([]);
    setChatLoading(true);
    setConvos(prev => prev.map(c => (c._id||c.userDetails?._id)===otherId ? {...c,unread:0} : c));
    try {
      const { data } = await API.get(`/messages/history/${otherId}`);
      setChatMessages(Array.isArray(data) ? data : data.messages || data.data || []);
    } catch { toast.error("Failed to load messages"); }
    finally { setChatLoading(false); }
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || !activeChat || !socketRef.current) return;
    const tempId = Date.now().toString();
    setChatMessages(prev => [...prev, {
      _tempId:tempId, sender:profile._id, receiver:activeChat._id,
      text, createdAt:new Date().toISOString(), pending:true,
    }]);
    setChatInput("");
    socketRef.current.emit("send_message", {
      senderId:profile._id, receiverId:activeChat._id, text, _tempId:tempId,
    });
    setConvos(prev => prev.map(c =>
      (c._id||c.userDetails?._id)===activeChat._id
        ? {...c, lastMessage:text, lastTimestamp:new Date().toISOString()} : c
    ));
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifs,       setNotifs]       = useState([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPage,    setNotifPage]    = useState(1);
  const [notifTotal,   setNotifTotal]   = useState(0);
  const [notifFilter,  setNotifFilter]  = useState("all");
  const notifRef = useRef(null);
  const NOTIF_PER_PAGE = 8;

  const loadNotifs = useCallback(async (page=1, filter="all") => {
    setNotifLoading(true);
    try {
      const params = { page, limit:NOTIF_PER_PAGE };
      if (filter === "unread") params.read = false;
      const { data } = await notifAPI.getAll(params);
      const result = data.data || data;
      const list = result.notifications || result;
      const total = result.pagination?.total || list.length;
      setNotifs(page===1 ? list : prev => [...prev,...list]);
      setNotifTotal(total);
      setUnreadCount(list.filter(n=>!n.read).length + (page>1 ? unreadCount : 0));
    } catch {}
    finally { setNotifLoading(false); }
  }, []);

  useEffect(() => {
    loadNotifs(1, notifFilter);
    const timer = setInterval(() => loadNotifs(1, notifFilter), 60_000);
    return () => clearInterval(timer);
  }, [notifFilter]);
  useEffect(() => {
    const handler = event => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const handleMarkRead = async id => {
    try { await notifAPI.markRead(id); setNotifs(prev=>prev.map(n=>n._id===id?{...n,read:true}:n)); setUnreadCount(prev=>Math.max(0,prev-1)); }
    catch { toast.error("Failed to mark as read"); }
  };
  const handleMarkAllRead = async () => {
    try { await notifAPI.markAllRead(); setNotifs(prev=>prev.map(n=>({...n,read:true}))); setUnreadCount(0); toast.success("All notifications marked as read"); }
    catch { toast.error("Failed to mark all as read"); }
  };
  const handleDeleteNotif = async (id, event) => {
    event.stopPropagation();
    try { await notifAPI.remove(id); setNotifs(prev=>prev.filter(n=>n._id!==id)); setNotifTotal(prev=>prev-1); }
    catch { toast.error("Failed to delete notification"); }
  };
  const handleLoadMore = () => { const nextPage=notifPage+1; setNotifPage(nextPage); loadNotifs(nextPage,notifFilter); };

  registerToastSetter(setToastState);
  useEffect(() => {
    if (toastState) { const timer=setTimeout(()=>setToastState(null),3200); return ()=>clearTimeout(timer); }
  }, [toastState]);

  const setLoad = (key,value) => setLoading(previous => ({...previous,[key]:value}));
  const loadProfile = useCallback(async () => {
    setLoad("profile",true);
    try { const {data}=await getUserProfile(); setProfile(data.data||data); }
    catch { toast.error("Failed to load profile"); }
    finally { setLoad("profile",false); }
  },[]);
  const loadOrders = useCallback(async () => {
    setLoad("orders",true);
    try { const {data}=await API.get("/orders"); setOrders(Array.isArray(data)?data:(data.orders||data.data||[])); }
    catch { toast.error("Failed to load orders"); }
    finally { setLoad("orders",false); }
  },[]);
  const loadCart = useCallback(async () => {
    setLoad("cart",true);
    try { const {data}=await API.get("/cart"); const raw=data.items||data.cart?.items||[]; setCart(raw.map(item=>({_id:item._id,productId:item.product?._id||item.product,product:item.product,name:item.product?.name||item.name||"Unknown",price:Number(item.product?.price??item.price??0),image:item.product?.image||item.image||null,vendor:item.product?.vendor||item.vendor||null,quantity:item.quantity||1}))); }
    catch {}
    finally { setLoad("cart",false); }
  },[]);
  const loadCategories = useCallback(async () => { try { const {data}=await getCategories(); setCategories(Array.isArray(data)?data:(data.data||[])); } catch {} },[]);
  const loadProducts = useCallback(async (params={}) => { setLoad("products",true); try { const {data}=await API.get("/products",{params}); setProducts(data.products||data.data||data||[]); } catch { toast.error("Failed to load products"); } finally { setLoad("products",false); } },[]);
  const loadMyReviews = useCallback(async () => { setLoad("reviews",true); try { const {data}=await API.get("/reviews/mine"); setMyReviews(data.data||data||[]); } catch { toast.error("Failed to load reviews"); } finally { setLoad("reviews",false); } },[]);
  const loadConvos = useCallback(async () => {
    setLoad("convos",true);
    try { const {data}=await getConversations(); setConvos(data||[]); } catch {}
    finally { setLoad("convos",false); }
  },[]);

  useEffect(()=>{ loadProfile(); loadOrders(); loadCart(); loadCategories(); },[]);
  useEffect(()=>{ if(section==="shop") loadProducts(); if(section==="reviews") loadMyReviews(); if(section==="messages") loadConvos(); },[section]);

  useEffect(()=>{ loadProfile(); loadOrders(); loadCart(); loadCategories(); },[]);
  useEffect(()=>{
    if(section==="shop")     loadProducts();
    if(section==="reviews")  loadMyReviews();
    if(section==="messages") loadConvos();
  },[section]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalSpent     = orders.filter(o=>o.isPaid).reduce((a,o)=>a+o.totalPrice,0);
  const pendingCount   = orders.filter(o=>["pending","processing","shipped"].includes(o.status)).length;
  const deliveredCount = orders.filter(o=>o.status==="delivered").length;
  const cartTotal      = cart.reduce((a,i)=>a+(Number(i.price||0)*Number(i.quantity||0)),0);
  const cartCount      = cart.reduce((a,i)=>a+Number(i.quantity||0),0);
  const orderStatusCounts = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]||0)+1; return acc; },{});
  const spendingByMonth = (() => {
    const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map={};
    orders.filter(o=>o.isPaid).forEach(o=>{ const m=months[new Date(o.createdAt).getMonth()]; map[m]=(map[m]||0)+o.totalPrice; });
    return months.slice(0,new Date().getMonth()+1).map(m=>({ label:m, value:map[m]||0 }));
  })();
  const badges = {
    orders:   pendingCount||null, cart:cartCount||null,
    wishlist: wishlist.length||null, messages:convos.filter(c=>c.unread).length||null,
  };

  const [ordersPage,   setOrdersPage]   = useState(1);
  const [reviewsPage,  setReviewsPage]  = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [shopPage,     setShopPage]     = useState(1);
  useEffect(()=>{ setOrdersPage(1);setReviewsPage(1);setMessagesPage(1);setWishlistPage(1);setShopPage(1); },[section]);

  // ── Shop state ────────────────────────────────────────────────────────────
  const [shopSearch,      setShopSearch]      = useState("");
  const [shopCategory,    setShopCategory]    = useState("");
  const [shopSort,        setShopSort]        = useState("newest");
  const [addingToCart,    setAddingToCart]    = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  useEffect(()=>{ setShopPage(1); },[shopSearch,shopCategory,shopSort]);

  const filteredProducts = products
    .filter(p=>(!shopSearch||p.name?.toLowerCase().includes(shopSearch.toLowerCase())||p.description?.toLowerCase().includes(shopSearch.toLowerCase()))&&(!shopCategory||p.category?._id===shopCategory||p.category===shopCategory))
    .sort((a,b)=>{ if(shopSort==="price_asc") return a.price-b.price; if(shopSort==="price_desc") return b.price-a.price; if(shopSort==="rating") return (b.averageRating||0)-(a.averageRating||0); return new Date(b.createdAt)-new Date(a.createdAt); });

  const handleAddToCart = async (productId, e) => {
    e?.stopPropagation(); setAddingToCart(productId);
    try { await API.post("/cart",{product:productId,productId,quantity:1}); await loadCart(); toast.success("Added to cart!"); }
    catch { toast.error("Failed to add to cart"); }
    finally { setAddingToCart(null); }
  };

  const openMessageVendor = (vendorId, vendorName) => {
    setSelectedProduct(null);
    setActiveChat({_id:vendorId,name:vendorName});
    setChatMessages([]); setChatLoading(true);
    API.get(`/messages/history/${vendorId}`)
      .then(({data})=>setChatMessages(Array.isArray(data)?data:data.messages||data.data||[]))
      .catch(()=>{}).finally(()=>setChatLoading(false));
    loadConvos(); setSection("messages");
  };

  // ── Orders state ──────────────────────────────────────────────────────────
  const [orderFilter,   setOrderFilter]   = useState("all");
  const [orderSearch,   setOrderSearch]   = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null); // order being tracked on map
  useEffect(()=>{ setOrdersPage(1); },[orderFilter,orderSearch]);
  const filteredOrders = orders.filter(o=>{
    const ms=!orderSearch||o._id?.toLowerCase().includes(orderSearch.toLowerCase())||o.status?.toLowerCase().includes(orderSearch.toLowerCase());
    return ms&&(orderFilter==="all"||o.status===orderFilter);
  });

  // ── Cart handlers ─────────────────────────────────────────────────────────
  const [checkingOut,    setCheckingOut]    = useState(false);
  const [shippingForm,   setShippingForm]   = useState({ address:"",city:"",postalCode:"",country:"",paymentMethod:"cash" });
  const [shippingErrors, setShippingErrors] = useState({});
  const updateCartQty = async (productId,quantity) => {
    if(quantity<1) return removeFromCart(productId);
    try { await API.post("/cart",{product:productId,productId,quantity}); await loadCart(); }
    catch { toast.error("Failed to update cart"); }
  };
  const removeFromCart = async (productId) => {
    try { await API.delete(`/cart/${productId}`); await loadCart(); toast.success("Removed from cart"); }
    catch { toast.error("Failed to remove item"); }
  };
  const clearCartFn = async () => {
    if(!window.confirm("Clear the entire cart?")) return;
    try { await API.delete("/cart"); setCart([]); toast.success("Cart cleared"); }
    catch { toast.error("Failed to clear cart"); }
  };
  const validateShipping = () => {
    const e={};
    if(!shippingForm.address) e.address="Required";
    if(!shippingForm.city)    e.city="Required";
    if(!shippingForm.country) e.country="Required";
    setShippingErrors(e); return Object.keys(e).length===0;
  };
  const handleCheckout = async () => {
    if(!validateShipping()) return;
    if(cart.length===0){ toast.error("Cart is empty"); return; }
    setCheckingOut(true);
    try {
      const {data}=await API.post("/orders",{
        orderItems:cart.map(i=>({ product:i.productId||i.product?._id,name:i.name,quantity:i.quantity,price:i.price,image:i.image||"",vendor:i.vendor?._id||i.vendor||"" })),
        shippingAddress:{ address:shippingForm.address,city:shippingForm.city,postalCode:shippingForm.postalCode,country:shippingForm.country },
        paymentMethod:shippingForm.paymentMethod, totalPrice:cartTotal,
      });
      const orderId=data.order?._id, paymentInfo=data.paymentInfo, method=shippingForm.paymentMethod;
      if(method==="cash"){ try{await API.delete("/cart");}catch{} setCart([]); toast.success("Order placed! Pay on delivery."); await loadOrders(); setSection("orders"); return; }
      localStorage.setItem("pending_order_id",orderId||"");
      localStorage.setItem("pending_payment_method",method);
      localStorage.setItem("pending_order_amount",String(cartTotal));
      try{await API.delete("/cart");}catch{} setCart([]);
      if(method==="telebirr"||method==="Telebirr"||method==="cbe"){
        const directUrl=paymentInfo?.url||paymentInfo?.toPayUrl||paymentInfo?.redirectUrl;
        if(directUrl&&!directUrl.startsWith("/")) localStorage.setItem("telebirr_redirect_url",directUrl);
        toast.success("Proceeding to payment…");
        navigate(`/telebirr-pay?orderId=${orderId}&amount=${cartTotal.toFixed(2)}${(!directUrl||directUrl.startsWith("/"))?"&mock=true":""}`);
        return;
      }
      if(method==="stripe"||method==="Stripe"){
        const su=paymentInfo?.checkout_url||paymentInfo?.url;
        if(su){ toast.success("Redirecting to Stripe…"); setTimeout(()=>{ window.location.href=su; },600); return; }
      }
      toast.success("Order placed successfully!"); await loadOrders(); setSection("orders");
    } catch(err){ toast.error(err.response?.data?.message||"Checkout failed. Please try again."); }
    finally { setCheckingOut(false); }
  };

  // ── Review handlers ───────────────────────────────────────────────────────
  const [reviewForm,   setReviewForm]   = useState({ productId:"",rating:5,comment:"" });
  const [submitting,   setSubmitting]   = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const handleSubmitReview = async () => {
    if(!reviewForm.productId){ toast.error("Enter a product ID"); return; }
    if(!reviewForm.comment.trim()){ toast.error("Write a comment"); return; }
    setSubmitting(true);
    try { await API.post("/reviews",reviewForm); toast.success("Review submitted!"); setReviewForm({productId:"",rating:5,comment:""}); loadMyReviews(); }
    catch(err){ toast.error(err.response?.data?.message||"Failed to submit review"); }
    finally { setSubmitting(false); }
  };
  const handleDeleteReview = async (id) => {
    if(!window.confirm("Delete this review?")) return;
    try { await deleteReview(id); toast.success("Review deleted"); loadMyReviews(); }
    catch { toast.error("Failed to delete review"); }
  };
  const filtered_reviews = myReviews.filter(r=>!reviewSearch||r.product?.name?.toLowerCase().includes(reviewSearch.toLowerCase())||r.comment?.toLowerCase().includes(reviewSearch.toLowerCase()));

  // ── Profile handlers ──────────────────────────────────────────────────────
  const [profileForm,   setProfileForm]   = useState({ name:"",email:"" });
  const [pwForm,        setPwForm]        = useState({ currentPassword:"",newPassword:"",confirmPassword:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw,      setSavingPw]      = useState(false);
  const [pwErrors,      setPwErrors]      = useState({});
  useEffect(()=>{ if(profile) setProfileForm({name:profile.name||"",email:profile.email||""}); },[profile]);
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try { const {data}=await updateProfile(profileForm); setProfile(data.data||data); toast.success("Profile updated!"); }
    catch { toast.error("Failed to update profile"); }
    finally { setSavingProfile(false); }
  };
  const handleChangePassword = async () => {
    const e={};
    if(!pwForm.currentPassword) e.currentPassword="Required";
    if(pwForm.newPassword.length<6) e.newPassword="Min 6 characters";
    if(pwForm.newPassword!==pwForm.confirmPassword) e.confirmPassword="Passwords don't match";
    setPwErrors(e); if(Object.keys(e).length>0) return;
    setSavingPw(true);
    try { await changePassword({currentPassword:pwForm.currentPassword,newPassword:pwForm.newPassword}); toast.success("Password changed!"); setPwForm({currentPassword:"",newPassword:"",confirmPassword:""}); }
    catch(err){ toast.error(err.response?.data?.message||"Failed to change password"); }
    finally { setSavingPw(false); }
  };

  // ── Settings ──────────────────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({ email:true,push:true });
  const [savingNotif,   setSavingNotif]   = useState(false);
  useEffect(()=>{ if(profile?.settings?.notifications) setNotifSettings(profile.settings.notifications); },[profile]);
  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try { await API.put("/profile/notifications",{notifications:notifSettings}); toast.success("Preferences saved!"); }
    catch { toast.error("Failed to save preferences"); }
    finally { setSavingNotif(false); }
  };
  const Toggle = ({ checked, onChange, label }) => (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#f9fafb",borderRadius:9,marginBottom:8 }}>
      <span style={{ fontSize:13,fontWeight:500,color:C.text }}>{label}</span>
      <div onClick={()=>onChange(!checked)} style={{ width:44,height:24,borderRadius:12,background:checked?C.green:"#ccc",position:"relative",cursor:"pointer",transition:"background .2s" }}>
        <div style={{ position:"absolute",top:3,left:checked?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
      </div>
    </div>
  );

  // ── Global search (topbar) ────────────────────────────────────────────────
  const [globalSearch,        setGlobalSearch]        = useState("");
  const [globalResults,       setGlobalResults]       = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchOpen,    setGlobalSearchOpen]    = useState(false);
  const globalSearchRef  = useRef(null);
  const globalInputRef   = useRef(null);
  const globalSearchTimer= useRef(null);

  useEffect(() => {
    if (!globalSearch.trim()) { setGlobalResults([]); setGlobalSearchOpen(false); return; }
    clearTimeout(globalSearchTimer.current);
    globalSearchTimer.current = setTimeout(async () => {
      setGlobalSearchLoading(true);
      try {
        const { data } = await API.get("/search", {
          params: { q: globalSearch.trim(), limit: 8, _t: Date.now() },
          headers: { "Cache-Control": "no-cache" },
        });
        const results = data?.data || data?.products || (Array.isArray(data) ? data : []);
        setGlobalResults(results);
        setGlobalSearchOpen(results.length > 0);
      } catch { setGlobalResults([]); }
      finally { setGlobalSearchLoading(false); }
    }, 300);
    return () => clearTimeout(globalSearchTimer.current);
  }, [globalSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (globalSearchRef.current && !globalSearchRef.current.contains(e.target))
        setGlobalSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGlobalResultClick = (product) => {
    setGlobalSearch("");
    setGlobalResults([]);
    setGlobalSearchOpen(false);
    setSelectedProduct(product);
    if (section !== "shop") setSection("shop");
  };
  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ══════════════════════════════════════════════════════════════════════════
  const renderHome = () => (
    <CustomerHome
      profile={profile}
      orders={orders}
      loading={loading}
      totalSpent={totalSpent}
      deliveredCount={deliveredCount}
      pendingCount={pendingCount}
      cartCount={cartCount}
      cartTotal={cartTotal}
      spendingByMonth={spendingByMonth}
      orderStatusCounts={orderStatusCounts}
      setSection={setSection}
    />
  );

  const renderShop = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Card>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 220px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
            <input value={shopSearch} onChange={e=>setShopSearch(e.target.value)} placeholder="Search products…"
              style={{width:"100%",padding:"9px 10px 9px 32px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <select value={shopCategory} onChange={e=>setShopCategory(e.target.value)} style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.card,color:C.text,cursor:"pointer"}}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={shopSort} onChange={e=>setShopSort(e.target.value)} style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.card,color:C.text,cursor:"pointer"}}>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <Btn onClick={()=>loadProducts()} variant="ghost">↻ Refresh</Btn>
        </div>
      </Card>
      {categories.length>0&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>setShopCategory("")} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${shopCategory===""?C.sidebar:C.border}`,background:shopCategory===""?C.sidebar:"#fff",color:shopCategory===""?C.gold:C.muted}}>All</button>
          {categories.map(c=>(
            <button key={c._id} onClick={()=>setShopCategory(c._id===shopCategory?"":c._id)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${shopCategory===c._id?C.sidebar:C.border}`,background:shopCategory===c._id?C.sidebar:"#fff",color:shopCategory===c._id?C.gold:C.muted}}>{c.name}</button>
          ))}
        </div>
      )}
      {loading.products?<div style={{padding:"60px 0",textAlign:"center"}}><Spinner size={28}/></div>
        :filteredProducts.length===0?<Empty icon="🛍" text="No products found"/>
        :(()=>{
          const pi=filteredProducts.slice((shopPage-1)*PRODUCTS_PER_PAGE,shopPage*PRODUCTS_PER_PAGE);
          return(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {pi.map(p=>(
                <Card key={p._id} onClick={()=>setSelectedProduct(p)} style={{padding:0,overflow:"hidden",cursor:"pointer"}}>
                  <div style={{height:160,background:`linear-gradient(135deg,#e8f0ea,#d4e5d8)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,position:"relative",overflow:"hidden"}}>
                    {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                    <button onClick={e=>{e.stopPropagation();toggleWishlist(p);}} style={{position:"absolute",top:8,left:8,width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:"0 1px 4px rgba(0,0,0,.15)"}}>
                      {isWishlisted(p._id)?"❤️":"🤍"}
                    </button>
                    {p.stock<5&&p.stock>0&&<span style={{position:"absolute",top:8,right:8,background:C.red,color:"#fff",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20}}>Low Stock</span>}
                    {p.stock===0&&<span style={{position:"absolute",top:8,right:8,background:"#333",color:"#fff",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:20}}>Out of Stock</span>}
                  </div>
                  <div style={{padding:"14px 14px 12px"}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{p.category?.name||"Uncategorized"}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10}}><Stars rating={Math.round(p.averageRating||0)} size={12}/><span style={{fontSize:11,color:C.muted}}>({p.totalReviews||0})</span></div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:16,fontWeight:700,color:C.green}}>${p.price}</span>
                      <button onClick={e=>handleAddToCart(p._id,e)} disabled={p.stock===0} style={{background:p.stock===0?"#ccc":C.sidebar,color:p.stock===0?"#999":C.gold,border:"none",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:p.stock===0?"not-allowed":"pointer"}}>
                        {addingToCart===p._id?<Spinner size={12}/>:"+ Cart"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={shopPage} totalItems={filteredProducts.length} perPage={PRODUCTS_PER_PAGE} onChange={p=>{setShopPage(p);window.scrollTo(0,0);}}/>
          </>);
        })()
      }
      {selectedProduct&&<ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAddToCart={handleAddToCart} addingToCart={addingToCart} onMessageVendor={openMessageVendor}/>}
    </div>
  );

  const renderOrders = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <StatCard label="Total Orders" value={orders.length}    sub="All time"         accent={C.gold}   icon="📦"/>
        <StatCard label="Active"       value={pendingCount}     sub="Pending/shipping" accent={C.blue}   icon="🚚"/>
        <StatCard label="Delivered"    value={deliveredCount}   sub="Completed"        accent={C.green}  icon="✅"/>
        <StatCard label="Total Spent"  value={fmt(totalSpent)}  sub="On paid orders"   accent={C.purple} icon="💳"/>
      </div>
      <Panel title="Order History" subtitle="Track and manage all your orders">
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 180px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13}}>🔍</span>
            <input value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Search order ID or status…"
              style={{width:"100%",padding:"8px 10px 8px 30px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
          </div>
          {["all","pending","processing","shipped","delivered"].map(f=>(
            <button key={f} onClick={()=>setOrderFilter(f)} style={{padding:"7px 13px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${orderFilter===f?C.sidebar:C.border}`,background:orderFilter===f?C.sidebar:"#fff",color:orderFilter===f?C.gold:C.muted,textTransform:"capitalize"}}>
              {f==="all"?"All":f}
            </button>
          ))}
        </div>
        {loading.orders?<div style={{padding:"40px",textAlign:"center"}}><Spinner size={24}/></div>
          :filteredOrders.length===0?<Empty icon="📦" text="No orders found"/>
          :(()=>{
            const pi=filteredOrders.slice((ordersPage-1)*ITEMS_PER_PAGE,ordersPage*ITEMS_PER_PAGE);
            return(<>
              {pi.map(o=>(
                <div key={o._id} onClick={()=>setSelectedOrder(selectedOrder?._id===o._id?null:o)}
                  style={{border:`1px solid ${C.border}`,borderRadius:10,marginBottom:10,overflow:"hidden",cursor:"pointer",background:selectedOrder?._id===o._id?"#f8faf8":"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:STATUS[o.status?.toLowerCase()]?.bg||"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                      {STATUS[o.status?.toLowerCase()]?.icon||"📦"}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13}}>Order #{o._id?.slice(-8).toUpperCase()}</div>
                      <div style={{fontSize:11,color:C.muted}}>{fmtDate(o.createdAt)} · {o.orderItems?.length||0} item(s)</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,fontSize:14,color:C.green}}>{fmt(o.totalPrice)}</div>
                      <Pill label={o.status}/>
                    </div>
                    <span style={{color:C.muted,fontSize:14,marginLeft:8}}>{selectedOrder?._id===o._id?"▲":"▼"}</span>
                  </div>
                  {selectedOrder?._id===o._id&&(
                    <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`}}>
                      <OrderTracker status={o.status}/>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>Items</div>
                          {(o.orderItems||[]).map((item,j)=>(
                            <div key={j} style={{display:"flex",gap:10,marginBottom:8,padding:"8px 10px",background:"#f9fafb",borderRadius:8}}>
                              <div style={{width:36,height:36,borderRadius:6,background:"#e8ede9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                                {item.image?<img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}/>:"📦"}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:12,fontWeight:500}}>{item.name}</div>
                                <div style={{fontSize:11,color:C.muted}}>x{item.quantity} · ${Number(item.price||0).toFixed(2)}</div>
                              </div>
                              <div style={{fontWeight:600,fontSize:12}}>${(Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>Delivery Info</div>
                          <div style={{background:"#f9fafb",borderRadius:8,padding:"10px 12px",fontSize:12,lineHeight:1.8}}>
                            <div><b>Address:</b> {o.shippingAddress?.address||"—"}</div>
                            <div><b>City:</b> {o.shippingAddress?.city||"—"}</div>
                            <div><b>Country:</b> {o.shippingAddress?.country||"—"}</div>
                            <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`}}>
                              <b>Payment:</b> {o.paymentMethod} &nbsp;
                              <span style={{color:o.isPaid?C.green:C.red,fontWeight:600}}>{o.isPaid?"✓ Paid":"⏳ Unpaid"}</span>
                            </div>
                            <div><b>Placed:</b> {fmtDate(o.createdAt)}</div>
                            {o.paidAt&&<div><b>Paid at:</b> {fmtDate(o.paidAt)}</div>}
                          </div>
                          {o.orderItems?.[0]?.vendor&&(
                            <button onClick={()=>{ const vId=o.orderItems[0].vendor?._id||o.orderItems[0].vendor; const vName=o.orderItems[0].vendor?.name||"Vendor"; setActiveChat({_id:vId,name:vName}); setChatMessages([]); setChatLoading(true); API.get(`/messages/history/${vId}`).then(({data})=>setChatMessages(Array.isArray(data)?data:data.messages||data.data||[])).catch(()=>{}).finally(()=>setChatLoading(false)); loadConvos(); setSection("messages"); }}
                              style={{marginTop:10,width:"100%",padding:"9px 0",borderRadius:8,border:`1px solid ${C.sidebar}`,background:`${C.sidebar}10`,color:C.sidebar,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .15s"}}
                              onMouseEnter={e=>{e.currentTarget.style.background=C.sidebar;e.currentTarget.style.color=C.gold;}}
                              onMouseLeave={e=>{e.currentTarget.style.background=`${C.sidebar}10`;e.currentTarget.style.color=C.sidebar;}}>
                              💬 Message Vendor
                            </button>
                          )}
                          {/* Track on map button — shown for active orders */}
                          {["processing","shipped"].includes(o.status)&&(
                            <button onClick={()=>setTrackingOrder(o)}
                              style={{marginTop:8,width:"100%",padding:"9px 0",borderRadius:8,
                                border:"none",background:C.green,color:"#fff",
                                fontSize:12,fontWeight:700,cursor:"pointer",
                                display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                              🗺 Track Live Delivery
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Pagination page={ordersPage} totalItems={filteredOrders.length} onChange={p=>{setOrdersPage(p);window.scrollTo(0,0);}}/>
            </>);
          })()
        }
      </Panel>
      {/* Live delivery map modal */}
      {trackingOrder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,
          display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
          onClick={()=>setTrackingOrder(null)}>
          <div style={{width:"100%",maxWidth:720,maxHeight:"90vh",overflowY:"auto",borderRadius:14}}
            onClick={e=>e.stopPropagation()}>
            <DeliveryMap order={trackingOrder} onClose={()=>setTrackingOrder(null)}/>
          </div>
        </div>
      )}
    </div>
  );

  const renderCart = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {cart.length===0?(
        <Card style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:56,marginBottom:12}}>🛒</div>
          <div style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:8}}>Your cart is empty</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Discover products you'll love</div>
          <Btn onClick={()=>setSection("shop")}>Browse Products</Btn>
        </Card>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,alignItems:"start"}}>
          <Panel title={`Cart (${cartCount} item${cartCount!==1?"s":""})`} action="Clear all" onAction={clearCartFn}>
            {cart.map((item,i)=>(
              <div key={item.product?._id||i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<cart.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{width:60,height:60,borderRadius:10,background:"#e8ede9",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                  {item.image||item.product?.image?<img src={item.image||item.product?.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500,fontSize:13}}>{item.name||item.product?.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>${Number(item.price||0).toFixed(2)} each</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                    <button onClick={()=>updateCartQty(item.product?._id||item.productId,item.quantity-1)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>−</button>
                    <span style={{fontSize:13,fontWeight:600,minWidth:24,textAlign:"center"}}>{item.quantity}</span>
                    <button onClick={()=>updateCartQty(item.product?._id||item.productId,item.quantity+1)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>+</button>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:C.green}}>${(Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</div>
                  <button onClick={()=>removeFromCart(item.product?._id||item.productId)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,marginTop:6}}>Remove</button>
                </div>
              </div>
            ))}
          </Panel>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Panel title="Order Summary">
              <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:13}}>
                {cart.map((item,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",color:C.muted}}>
                    <span>{item.name||item.product?.name} ×{item.quantity}</span>
                    <span>${(Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:10,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14}}>
                  <span>Total</span><span style={{color:C.green}}>{fmt(cartTotal)}</span>
                </div>
              </div>
            </Panel>
            <Panel title="Shipping Details">
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <Input label="Street Address" value={shippingForm.address} onChange={v=>setShippingForm(p=>({...p,address:v}))} placeholder="123 Main St" error={shippingErrors.address}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Input label="City" value={shippingForm.city} onChange={v=>setShippingForm(p=>({...p,city:v}))} placeholder="Addis Ababa" error={shippingErrors.city}/>
                  <Input label="Postal Code" value={shippingForm.postalCode} onChange={v=>setShippingForm(p=>({...p,postalCode:v}))} placeholder="1000"/>
                </div>
                <Input label="Country" value={shippingForm.country} onChange={v=>setShippingForm(p=>({...p,country:v}))} placeholder="Ethiopia" error={shippingErrors.country}/>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <label style={{fontSize:12,fontWeight:500,color:C.text}}>Payment Method</label>
                  <select value={shippingForm.paymentMethod} onChange={e=>setShippingForm(p=>({...p,paymentMethod:e.target.value}))} style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff",color:C.text}}>
                    <option value="cash">Cash on Delivery</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="cbe">CBE Birr</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>
                <Btn onClick={handleCheckout} disabled={checkingOut} style={{marginTop:6}}>
                  {checkingOut?"Placing Order…":`Place Order · ${fmt(cartTotal)}`}
                </Btn>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Panel title={`Wishlist (${wishlist.length})`} subtitle="Products you've saved for later">
        {wishlist.length===0?(
          <div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>❤️</div>
            <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:8}}>Your wishlist is empty</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Browse products and tap ❤️ to save them here</div>
            <Btn onClick={()=>setSection("shop")}>Browse Shop</Btn>
          </div>
        ):(()=>{
          const pi=wishlist.slice((wishlistPage-1)*PRODUCTS_PER_PAGE,wishlistPage*PRODUCTS_PER_PAGE);
          return(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
              {pi.map(p=>(
                <Card key={p._id} style={{padding:0,overflow:"hidden"}}>
                  <div style={{height:130,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,position:"relative"}}>
                    {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                    <button onClick={()=>toggleWishlist(p)} style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,.9)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>❤️</button>
                  </div>
                  <div style={{padding:"12px 12px 10px"}}>
                    <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:8}}>{p.category?.name||"Product"}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontSize:15,fontWeight:700,color:C.green}}>${p.price}</span>
                      <button onClick={()=>handleAddToCart(p._id)} style={{background:C.sidebar,color:C.gold,border:"none",padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>+ Cart</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={wishlistPage} totalItems={wishlist.length} perPage={PRODUCTS_PER_PAGE} onChange={p=>{setWishlistPage(p);window.scrollTo(0,0);}}/>
          </>);
        })()}
      </Panel>
    </div>
  );

  const renderReviews = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        <Panel title="Write a Review" subtitle="Share your experience with a product">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Input label="Product ID" value={reviewForm.productId} onChange={v=>setReviewForm(p=>({...p,productId:v}))} placeholder="Paste the product ID from your order"/>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:C.text,marginBottom:6}}>Rating</div>
              <Stars rating={reviewForm.rating} size={26} interactive onChange={v=>setReviewForm(p=>({...p,rating:v}))}/>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>{["","Terrible","Bad","Okay","Good","Excellent"][reviewForm.rating]}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:500,color:C.text}}>Comment</label>
              <textarea value={reviewForm.comment} onChange={e=>setReviewForm(p=>({...p,comment:e.target.value}))} placeholder="Describe your experience…" rows={4}
                style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.text,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
            </div>
            <Btn onClick={handleSubmitReview} disabled={submitting}>{submitting?"Submitting…":"Submit Review"}</Btn>
          </div>
        </Panel>
        <Panel title="Your Review Stats">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:700,color:C.green}}>{myReviews.length}</div>
              <div style={{fontSize:11,color:C.muted}}>Total Reviews</div>
            </div>
            <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:700,color:C.gold}}>{myReviews.length>0?(myReviews.reduce((a,r)=>a+(r.rating||0),0)/myReviews.length).toFixed(1):"—"}</div>
              <div style={{fontSize:11,color:C.muted}}>Avg Rating Given</div>
            </div>
          </div>
          {[5,4,3,2,1].map(star=>{
            const count=myReviews.filter(r=>r.rating===star).length;
            const pct=myReviews.length?(count/myReviews.length)*100:0;
            return(
              <div key={star} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:11,color:C.muted,width:12}}>{star}</span>
                <span style={{fontSize:11,color:C.gold}}>★</span>
                <div style={{flex:1,height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:C.gold,borderRadius:3,transition:"width .4s ease"}}/>
                </div>
                <span style={{fontSize:11,color:C.muted,width:16,textAlign:"right"}}>{count}</span>
              </div>
            );
          })}
        </Panel>
      </div>
      <Panel title={`My Reviews (${filtered_reviews.length})`}>
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13}}>🔍</span>
          <input value={reviewSearch} onChange={e=>{setReviewSearch(e.target.value);setReviewsPage(1);}} placeholder="Search reviews…"
            style={{width:"100%",padding:"8px 10px 8px 30px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {loading.reviews?<div style={{textAlign:"center",padding:30}}><Spinner size={22}/></div>
          :filtered_reviews.length===0?<Empty icon="⭐" text="No reviews yet — buy something and share your thoughts!"/>
          :(()=>{
            const pi=filtered_reviews.slice((reviewsPage-1)*ITEMS_PER_PAGE,reviewsPage*ITEMS_PER_PAGE);
            return(<>
              {pi.map((r,i)=>(
                <div key={r._id} style={{padding:"14px 0",borderBottom:i<pi.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:13}}>{r.product?.name||"Product #"+r.product?.toString()?.slice(-6)}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0"}}>
                        <Stars rating={r.rating} size={13}/>
                        <span style={{fontSize:11,color:C.muted}}>{ago(r.createdAt)}</span>
                        {r.reported&&<span style={{fontSize:10,color:C.red,fontWeight:600}}>⚠ Reported</span>}
                      </div>
                      <p style={{fontSize:12.5,color:C.text,margin:0,lineHeight:1.6}}>{r.comment}</p>
                    </div>
                    <button onClick={()=>handleDeleteReview(r._id)} style={{background:`${C.red}08`,border:`1px solid ${C.red}30`,color:C.red,cursor:"pointer",fontSize:11,fontWeight:600,padding:"4px 8px",borderRadius:6}}>Delete</button>
                  </div>
                </div>
              ))}
              <Pagination page={reviewsPage} totalItems={filtered_reviews.length} onChange={p=>{setReviewsPage(p);window.scrollTo(0,0);}}/>
            </>);
          })()
        }
      </Panel>
    </div>
  );

  const renderMessages = () => (
    <CustomerMessages
      colors={C}
      conversations={convos}
      activeChat={activeChat}
      chatMessages={chatMessages}
      conversationsLoading={loading.convos}
      chatLoading={chatLoading}
      profile={profile}
      chatInput={chatInput}
      setChatInput={setChatInput}
      openChat={openChat}
      setActiveChat={setActiveChat}
      sendMessage={sendMessage}
      chatBottomRef={chatBottomRef}
      avatarColor={avatarColor}
      ago={ago}
    />
  );

  const renderProfile = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Panel title="Personal Information" subtitle="Update your public profile details">
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"14px",background:"#f9fafb",borderRadius:10}}>
            <Avatar name={profile?.name||"?"} size={52} bg={C.gold} color={C.sidebar}/>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{profile?.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{profile?.email}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <span style={{fontSize:11,background:`${C.green}18`,color:C.green,padding:"2px 8px",borderRadius:20,fontWeight:600}}>{profile?.reputation?.rank||"Starter"}</span>
                <span style={{fontSize:11,color:C.muted}}>Score: <b>{profile?.reputation?.score||0}</b></span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Input label="Full Name" value={profileForm.name} onChange={v=>setProfileForm(p=>({...p,name:v}))} placeholder="Your name"/>
            <Input label="Email Address" value={profileForm.email} onChange={v=>setProfileForm(p=>({...p,email:v}))} placeholder="you@example.com"/>
            <Btn onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile?"Saving…":"Save Changes"}</Btn>
          </div>
        </Panel>
        <Panel title="Your Reputation" subtitle="Trust engine metrics from your activity">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[
              {label:"Trust Score",value:profile?.reputation?.score||0,accent:C.green},
              {label:"Rank",value:profile?.reputation?.rank||"Starter",accent:C.gold},
              {label:"Successful Orders",value:profile?.reputation?.metrics?.successfulOrders||0,accent:C.blue},
              {label:"Cancelled Orders",value:profile?.reputation?.metrics?.cancelledOrders||0,accent:C.red},
            ].map(s=>(
              <div key={s.label} style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",borderLeft:`3px solid ${s.accent}`}}>
                <div style={{fontSize:18,fontWeight:700,color:C.text}}>{s.value}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
              <span style={{color:C.muted}}>Trust Progress</span>
              <span style={{fontWeight:600,color:C.green}}>{profile?.reputation?.score||0}/100</span>
            </div>
            <div style={{height:8,background:"#e8ede9",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${profile?.reputation?.score||0}%`,height:"100%",background:`linear-gradient(90deg,${C.green},${C.gold})`,borderRadius:4,transition:"width .6s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              {["Unverified","Starter","Trusted","Elite","Legendary"].map(r=>(
                <span key={r} style={{fontSize:9,color:C.muted}}>{r}</span>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Change Password" subtitle="Keep your account secure with a strong password">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={v=>setPwForm(p=>({...p,currentPassword:v}))} placeholder="••••••••" error={pwErrors.currentPassword}/>
          <Input label="New Password" type="password" value={pwForm.newPassword} onChange={v=>setPwForm(p=>({...p,newPassword:v}))} placeholder="••••••••" error={pwErrors.newPassword}/>
          <Input label="Confirm Password" type="password" value={pwForm.confirmPassword} onChange={v=>setPwForm(p=>({...p,confirmPassword:v}))} placeholder="••••••••" error={pwErrors.confirmPassword}/>
        </div>
        <div style={{marginTop:14}}>
          <Btn onClick={handleChangePassword} disabled={savingPw} variant="secondary">{savingPw?"Updating…":"Update Password"}</Btn>
        </div>
      </Panel>
    </div>
  );

  const renderSettings = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Panel title="Notification Preferences" subtitle="Control how we reach you">
        <Toggle checked={notifSettings.email} label="📧 Email Notifications" onChange={v=>setNotifSettings(p=>({...p,email:v}))}/>
        <Toggle checked={notifSettings.push} label="🔔 Push Notifications" onChange={v=>setNotifSettings(p=>({...p,push:v}))}/>
        <div style={{marginTop:8}}><Btn onClick={handleSaveNotif} disabled={savingNotif}>{savingNotif?"Saving…":"Save Preferences"}</Btn></div>
      </Panel>
      <Panel title="Account" subtitle="Manage your account data">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"12px 14px",background:"#f9fafb",borderRadius:9,fontSize:13,color:C.muted}}><b style={{color:C.text}}>Member since</b> — {fmtDate(profile?.createdAt)}</div>
          <div style={{padding:"12px 14px",background:"#f9fafb",borderRadius:9,fontSize:13,color:C.muted}}><b style={{color:C.text}}>Account status</b> — <span style={{color:profile?.isVerified?C.green:C.red,fontWeight:600}}>{profile?.isVerified?"✓ Verified":"⚠ Not Verified"}</span></div>
          <div style={{marginTop:4}}><Btn variant="danger" onClick={handleLogout}>🚪 Log Out of Account</Btn></div>
        </div>
      </Panel>
    </div>
  );

  const renderNearby = () => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{background:`linear-gradient(120deg,${C.sidebar} 0%,#1a4d38 100%)`,borderRadius:14,padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4}}>📍 Find Nearby Products</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>Discover products from vendors closest to you, ranked by proximity + trust score</div>
        </div>
        {nearbyLocStatus!=="granted"?(
          <button onClick={requestNearbyLocation} disabled={nearbyLocStatus==="requesting"}
            style={{padding:"10px 20px",borderRadius:10,border:"none",background:nearbyLocStatus==="requesting"?"rgba(255,255,255,.2)":C.gold,color:C.sidebar,fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {nearbyLocStatus==="requesting"?<><Spinner size={14}/> Locating…</>:nearbyLocStatus==="denied"?"⚠ Location Denied":"📍 Enable Near Me"}
          </button>
        ):(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>✓ Location active · {nearbyRadius}km radius</div>
            <button onClick={()=>{setNearbyLocation(null);setNearbyLocStatus("idle");setNearbyProducts([]);}}
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"transparent",color:C.gold,fontSize:11,fontWeight:700,cursor:"pointer"}}>× Clear</button>
          </div>
        )}
      </div>
      <Card>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative",flex:"1 1 200px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:14}}>🔍</span>
            <input value={nearbyQuery} onChange={e=>{setNearbyQuery(e.target.value);setNearbyPage(1);}} placeholder="Search products near you…"
              style={{width:"100%",padding:"9px 10px 9px 32px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <select value={nearbyCategory} onChange={e=>{setNearbyCategory(e.target.value);setNearbyPage(1);}} style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:C.card,color:C.text,cursor:"pointer"}}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input type="number" placeholder="Min $" value={nearbyMinPrice} onChange={e=>{setNearbyMinPrice(e.target.value);setNearbyPage(1);}} style={{width:80,padding:"9px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none"}}/>
          <span style={{color:C.muted}}>—</span>
          <input type="number" placeholder="Max $" value={nearbyMaxPrice} onChange={e=>{setNearbyMaxPrice(e.target.value);setNearbyPage(1);}} style={{width:80,padding:"9px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,outline:"none"}}/>
          {nearbyLocStatus==="granted"&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
              <span style={{fontSize:12,color:C.muted,whiteSpace:"nowrap"}}>Radius:</span>
              <input type="range" min={5} max={200} step={5} value={nearbyRadius} onChange={e=>{setNearbyRadius(Number(e.target.value));setNearbyPage(1);}} style={{width:100,accentColor:C.gold}}/>
              <span style={{fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap"}}>{nearbyRadius}km</span>
            </div>
          )}
        </div>
      </Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:13,color:C.muted}}>
          {nearbyLoading?<span style={{display:"flex",alignItems:"center",gap:6}}><Spinner size={13}/>{nearbyProducts.length>0?"Updating results…":"Searching…"}</span>
            :nearbyLocStatus!=="granted"?<span>Enable location to find nearby products</span>
            :<span><b style={{color:C.text}}>{nearbyPagination.total}</b> products found{nearbyProxInfo?.enabled&&<span style={{color:C.green,marginLeft:6}}>· 📍 within {nearbyProxInfo.radiusKm}km of you</span>}</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          {["📍 Proximity","🌟 Trust","⭐ Rating"].map(l=>(
            <span key={l} style={{fontSize:11,color:C.muted,padding:"3px 10px",borderRadius:20,background:C.card,border:`1px solid ${C.border}`}}>{l}</span>
          ))}
        </div>
      </div>
      {nearbyError&&<div style={{padding:"12px 16px",background:`${C.red}10`,border:`1px solid ${C.red}30`,borderRadius:9,color:C.red,fontSize:13}}>⚠ {nearbyError}</div>}
      {/* Loading spinner — only shown on first search (no results yet) */}
      {nearbyLoading && nearbyProducts.length === 0 && (
        <Card style={{textAlign:"center",padding:"60px 20px"}}>
          <Spinner size={32}/>
          <div style={{fontSize:14,color:C.muted,marginTop:16}}>Finding nearby products…</div>
        </Card>
      )}

      {/* Empty state — only shown when NOT loading and no results */}
      {!nearbyLoading && nearbyProducts.length === 0 && (
        <Card style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:52,marginBottom:12}}>{nearbyLocStatus==="granted"?"📍":"🗺"}</div>
          <div style={{fontSize:17,fontWeight:700,color:C.text,marginBottom:8}}>
            {nearbyLocStatus==="granted"?`No products found within ${nearbyRadius}km`:"Enable location to find nearby products"}
          </div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>
            {nearbyLocStatus==="granted"?"Try increasing the radius or clearing filters":"Click 'Enable Near Me' above to share your location"}
          </div>
          {nearbyLocStatus==="granted"
            ?<Btn onClick={()=>{setNearbyRadius(100);setNearbyPage(1);}}>Expand to 100km</Btn>
            :<Btn onClick={requestNearbyLocation}>📍 Enable Near Me</Btn>}
        </Card>
      )}

      {/* Product grid — always shown when results exist (even while loading more) */}
      {nearbyProducts.length > 0 && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16}}>
            {nearbyProducts.map((p,i)=>{
              const rank=nearbyLocStatus==="granted"?(nearbyRankMap[p._id]??i):undefined;
              return(
                <Card key={p._id} style={{padding:0,overflow:"hidden",cursor:"pointer"}} onClick={()=>setSelectedProduct(p)}>
                  <div style={{height:160,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,position:"relative",overflow:"hidden"}}>
                    {p.image?<img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"📦"}
                    {rank!==undefined&&<div style={{position:"absolute",top:8,left:8,background:rank===0?"#1D9E75":rank<3?"#C6A84B":C.blue,color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20}}>📍 {rank===0?"Nearest":rank<3?"Very Close":rank<8?"Nearby":"In Range"}</div>}
                    <button onClick={e=>{e.stopPropagation();toggleWishlist(p);}} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.9)",border:"none",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {isWishlisted(p._id)?"❤️":"🤍"}
                    </button>
                    {p.stock===0&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontWeight:700,fontSize:13}}>Out of Stock</span></div>}
                  </div>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{p.category?.name||"—"}</div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>🏪 {p.vendor?.name||"Vendor"}{p.vendor?.city&&<span style={{color:C.blue,marginLeft:4}}>· {p.vendor.city}</span>}</div>
                    {p.vendor?.trustScore!==undefined&&(
                      <div style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:2}}><span>Trust</span><span style={{fontWeight:700,color:C.text}}>{Math.round(p.vendor.trustScore)}/100</span></div>
                        <div style={{height:3,background:"#e8ede9",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,width:`${Math.min(p.vendor.trustScore,100)}%`,background:`linear-gradient(90deg,${C.sidebar},${C.gold})`}}/></div>
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                      <span style={{fontSize:16,fontWeight:800,color:C.green}}>${Number(p.price).toFixed(2)}</span>
                      <button onClick={e=>{e.stopPropagation();handleAddToCart(p._id,e);}} disabled={p.stock===0}
                        style={{background:p.stock===0?"#ccc":C.sidebar,color:p.stock===0?"#999":C.gold,border:"none",padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:600,cursor:p.stock===0?"not-allowed":"pointer"}}>
                        {addingToCart===p._id?<Spinner size={12}/>:"+ Cart"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          {nearbyPagination.pages>1&&<Pagination page={nearbyPage} totalItems={nearbyPagination.total} perPage={NEARBY_LIMIT} onChange={p=>{setNearbyPage(p);window.scrollTo(0,0);}}/>}
        </>
      )}
      {selectedProduct&&<ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAddToCart={handleAddToCart} addingToCart={addingToCart} onMessageVendor={openMessageVendor}/>}
    </div>
  );

  const sectionMap = { home:renderHome,shop:renderShop,nearby:renderNearby,orders:renderOrders,cart:renderCart,wishlist:renderWishlist,reviews:renderReviews,messages:renderMessages,profile:renderProfile,settings:renderSettings };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.2); } }
        * { box-sizing:border-box; }
        body { margin:0; font-family:'DM Sans',system-ui,sans-serif; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#f1f1f1; }
        ::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }
      `}</style>

      <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',system-ui,sans-serif"}}>

        {/* SIDEBAR */}
        <aside style={{width:collapsed?68:220,background:C.sidebar,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .25s cubic-bezier(.4,0,.2,1)",overflow:"hidden",position:"relative"}}>
          <div style={{padding:"18px 14px 14px",borderBottom:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:10,minHeight:70}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"#fff",overflow:"hidden",display:"flex",alignItems:"flex-start",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
              <img src={nextCartLogo} alt="NextCart" style={{width:50,maxWidth:"none",transform:"scale(1.5) translateY(-2px)",objectFit:"contain"}}/>
            </div>
            {!collapsed&&(
              <div style={{overflow:"hidden"}}>
                <div style={{fontSize:15,fontWeight:900,color:"#fff",whiteSpace:"nowrap",letterSpacing:"-.2px"}}>Next<span style={{color:C.gold}}>Cart</span></div>
                <div style={{fontSize:9,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:".15em",fontWeight:700}}>Customer Portal</div>
              </div>
            )}
          </div>
          <button onClick={()=>setCollapsed(p=>!p)} style={{position:"absolute",top:20,right:-12,width:24,height:24,borderRadius:"50%",background:C.gold,border:"none",color:C.sidebar,cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}>
            {collapsed?"›":"‹"}
          </button>
          <nav style={{padding:"12px 8px",flex:1,overflowY:"auto"}}>
            {NAV.map(item=>{
              const badgeCount=badges[item.badge], active=section===item.id;
              return(
                <div key={item.id} onClick={()=>setSection(item.id)} title={collapsed?item.label:""}
                  style={{display:"flex",alignItems:"center",gap:collapsed?0:10,padding:collapsed?"11px 0":"9px 12px",justifyContent:collapsed?"center":"flex-start",borderRadius:8,cursor:"pointer",marginBottom:2,fontSize:13,fontWeight:active?500:400,color:active?C.gold:"rgba(255,255,255,.65)",background:active?"rgba(198,168,75,.12)":"transparent",borderLeft:active&&!collapsed?`3px solid ${C.gold}`:"3px solid transparent",transition:"all .15s",position:"relative"}}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color="#fff";}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.65)";}}}>
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

        {/* MAIN */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          {/* Topbar */}
          <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,position:"sticky",top:0,zIndex:100,backdropFilter:"blur(8px)"}}>
            {/* Breadcrumb */}
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.muted,flexShrink:0}}>
              <span>Home</span><span style={{fontSize:11}}>›</span>
              <span style={{color:C.text,fontWeight:500,textTransform:"capitalize"}}>{section}</span>
            </div>

            {/* Global search bar */}
            <div ref={globalSearchRef} style={{position:"relative",flex:1,maxWidth:480}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:C.muted}}>🔍</span>
              {globalSearchLoading && (
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"inline-block",width:14,height:14,border:`2px solid ${C.border}`,borderTopColor:C.green,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
              )}
              <input
                ref={globalInputRef}
                value={globalSearch}
                onChange={e=>setGlobalSearch(e.target.value)}
                onFocus={e=>{ e.target.style.borderColor=C.green; e.target.style.background="#fff"; if(globalResults.length>0) setGlobalSearchOpen(true); }}
                onBlur={e=>{ e.target.style.borderColor=C.border; e.target.style.background="#f9fafb"; }}
                placeholder="Search products, categories, vendors…"
                style={{width:"100%",padding:"9px 36px 9px 36px",border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.text,outline:"none",background:"#f9fafb",boxSizing:"border-box",transition:"all .15s"}}
              />
              {/* Dropdown results */}
              {globalSearchOpen && globalResults.length > 0 && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:300,overflow:"hidden"}}>
                  {/* Header */}
                  <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em"}}>
                      {globalResults.length} results for "{globalSearch}"
                    </span>
                    <button onClick={()=>{
                      setGlobalSearchOpen(false);
                      setShopSearch(globalSearch);
                      setSection("shop");
                      setGlobalSearch("");
                    }} style={{fontSize:11,fontWeight:700,color:C.green,background:"none",border:"none",cursor:"pointer",padding:0}}>
                      View all →
                    </button>
                  </div>
                  {/* Results list */}
                  {globalResults.map((p,i)=>(
                    <div key={p._id} onClick={()=>handleGlobalResultClick(p)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",cursor:"pointer",transition:"background .1s",borderBottom:i<globalResults.length-1?`1px solid ${C.border}40`:"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafb"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      {/* Product image */}
                      <div style={{width:40,height:40,borderRadius:8,background:"linear-gradient(135deg,#e8f0ea,#d4e5d8)",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          : "📦"}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:1}}>
                          {p.category?.name||"Product"}
                          {p.vendor?.name && <span style={{color:C.muted}}> · {p.vendor.name}</span>}
                        </div>
                      </div>
                      {/* Price + stock */}
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.green}}>${Number(p.price).toFixed(2)}</div>
                        <div style={{fontSize:10,color:p.stock>0?C.muted:C.red,fontWeight:500,marginTop:1}}>
                          {p.stock>0?`${p.stock} in stock`:"Out of stock"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Footer */}
                  <div style={{padding:"10px 14px",background:"#f9fafb",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
                    <button onClick={()=>{
                      setGlobalSearchOpen(false);
                      setShopSearch(globalSearch);
                      setSection("shop");
                      setGlobalSearch("");
                    }} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:C.sidebar,color:C.gold,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      🛍 Browse all results in Shop
                    </button>
                    <button onClick={()=>{
                      setGlobalSearchOpen(false);
                      setNearbyQuery(globalSearch);
                      setSection("nearby");
                      setGlobalSearch("");
                    }} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      📍 Search nearby vendors
                    </button>
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
                <button onClick={()=>{setNotifOpen(p=>!p);if(!notifOpen)loadNotifs(1,notifFilter);}}
                  style={{position:"relative",width:36,height:36,borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f3f5f1"}
                  onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
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
                          <button key={f} onClick={()=>{setNotifFilter(f);setNotifPage(1);loadNotifs(1,f);}}
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
                          return(
                            <div key={n._id} onClick={()=>{if(!n.read)handleMarkRead(n._id);}}
                              style={{display:"flex",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:n.read?"#fff":`${ns.bg}60`,cursor:n.read?"default":"pointer",transition:"background .15s",position:"relative"}}
                              onMouseEnter={e=>{e.currentTarget.style.background="#f8faf8";}}
                              onMouseLeave={e=>{e.currentTarget.style.background=n.read?"#fff":`${ns.bg}60`;}}>
                              <div style={{width:36,height:36,borderRadius:10,background:ns.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ns.icon}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:6}}>
                                  <div style={{fontWeight:n.read?500:700,fontSize:13,color:C.text,lineHeight:1.3}}>{n.title}</div>
                                  {!n.read&&<span style={{width:8,height:8,borderRadius:"50%",background:ns.accent,flexShrink:0,marginTop:3}}/>}
                                </div>
                                <div style={{fontSize:12,color:C.muted,marginTop:3,lineHeight:1.5,wordBreak:"break-word"}}>{n.message}</div>
                                <div style={{fontSize:10,color:C.muted,marginTop:5,display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{color:ns.accent,fontWeight:600,textTransform:"capitalize"}}>{n.type}</span>
                                  <span>·</span><span>{ago(n.createdAt)}</span>
                                </div>
                              </div>
                              <button onClick={e=>handleDeleteNotif(n._id,e)}
                                style={{position:"absolute",top:10,right:12,background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:14,fontWeight:700,lineHeight:1,opacity:0,transition:"opacity .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.color=C.red;}}
                                onMouseLeave={e=>{e.currentTarget.style.opacity="0";}}>×</button>
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
                <button onClick={handleLogout} style={{marginLeft:4,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${C.red}30`,background:`${C.red}08`,color:C.red,display:"flex",alignItems:"center",gap:5}}>
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
          {/* Content */}
          <div style={{flex:1,padding:"20px 24px",overflowY:"auto"}}>
            {(sectionMap[section]||sectionMap.home)()}
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:14,padding:"28px 32px",maxWidth:380,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,.18)",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>🚪</div>
            <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>{confirm.message}</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:24}}>This action cannot be undone.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirm(null)} style={{flex:1,padding:"10px 0",borderRadius:9,fontSize:13,fontWeight:600,border:`1px solid ${C.border}`,background:"#fff",color:C.text,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{confirm.onConfirm();setConfirm(null);}} style={{flex:1,padding:"10px 0",borderRadius:9,fontSize:13,fontWeight:600,border:"none",background:C.red,color:"#fff",cursor:"pointer"}}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastState&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:toastState.type==="error"?C.red:toastState.type==="info"?C.blue:C.green,color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 4px 24px rgba(0,0,0,.18)",display:"flex",alignItems:"center",gap:8,maxWidth:320}}>
          <span>{toastState.type==="error"?"✕":toastState.type==="info"?"ℹ":"✓"}</span>
          {toastState.msg}
        </div>
      )}
    </>
  );
}


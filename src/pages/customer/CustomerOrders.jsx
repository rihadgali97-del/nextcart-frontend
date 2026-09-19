import React, { useState } from "react";
import API from "../../services/api";
import { C, STATUS, ITEMS_PER_PAGE } from "./constants";
import { fmt, fmtDate } from "./helpers";
import { StatCard, Panel, Empty, Spinner, Pill, Pagination } from "./UI";
import OrderTracker from "./OrderTracker";
import DeliveryMap from "./DeliveryMap";

export default function CustomerOrders({
  orders, loading, setSection,
  setActiveChat, setChatMessages, setChatLoading, loadConvos,
}) {
  const [orderFilter,   setOrderFilter]   = useState("all");
  const [orderSearch,   setOrderSearch]   = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersPage,    setOrdersPage]    = useState(1);
  const [trackingOrder, setTrackingOrder] = useState(null);

  const totalSpent     = orders.filter(o=>o.isPaid).reduce((a,o)=>a+o.totalPrice,0);
  const pendingCount   = orders.filter(o=>["pending","processing","shipped"].includes(o.status)).length;
  const deliveredCount = orders.filter(o=>o.status==="delivered").length;

  const filteredOrders = orders.filter(o => {
    const ms = !orderSearch ||
      o._id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status?.toLowerCase().includes(orderSearch.toLowerCase());
    return ms && (orderFilter==="all" || o.status===orderFilter);
  });

  const openVendorChat = (o) => {
    const vId   = o.orderItems[0].vendor?._id || o.orderItems[0].vendor;
    const vName = o.orderItems[0].vendor?.name || "Vendor";
    setActiveChat({ _id:vId, name:vName });
    setChatMessages([]); setChatLoading(true);
    API.get(`/messages/history/${vId}`)
      .then(({data})=>setChatMessages(Array.isArray(data)?data:data.messages||data.data||[]))
      .catch(()=>{}).finally(()=>setChatLoading(false));
    loadConvos();
    setSection("messages");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <StatCard label="Total Orders" value={orders.length}   sub="All time"         accent={C.gold}   icon="📦"/>
        <StatCard label="Active"       value={pendingCount}    sub="Pending/shipping" accent={C.blue}   icon="🚚"/>
        <StatCard label="Delivered"    value={deliveredCount}  sub="Completed"        accent={C.green}  icon="✅"/>
        <StatCard label="Total Spent"  value={fmt(totalSpent)} sub="On paid orders"   accent={C.purple} icon="💳"/>
      </div>

      <Panel title="Order History" subtitle="Track and manage all your orders">
        {/* Filters */}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:"1 1 180px"}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13}}>🔍</span>
            <input value={orderSearch} onChange={e=>{ setOrderSearch(e.target.value); setOrdersPage(1); }}
              placeholder="Search order ID or status…"
              style={{width:"100%",padding:"8px 10px 8px 30px",border:`1px solid ${C.border}`,
                borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
          </div>
          {["all","pending","processing","shipped","delivered"].map(f=>(
            <button key={f} onClick={()=>{ setOrderFilter(f); setOrdersPage(1); }}
              style={{padding:"7px 13px",borderRadius:8,fontSize:12,fontWeight:500,cursor:"pointer",
                border:`1px solid ${orderFilter===f?C.sidebar:C.border}`,
                background:orderFilter===f?C.sidebar:"#fff",
                color:orderFilter===f?C.gold:C.muted,textTransform:"capitalize"}}>
              {f==="all"?"All":f}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading.orders
          ? <div style={{padding:"40px",textAlign:"center"}}><Spinner size={24}/></div>
          : filteredOrders.length===0
          ? <Empty icon="📦" text="No orders found"/>
          : (() => {
              const pi = filteredOrders.slice((ordersPage-1)*ITEMS_PER_PAGE, ordersPage*ITEMS_PER_PAGE);
              return (
                <>
                  {pi.map(o=>(
                    <div key={o._id}
                      onClick={()=>setSelectedOrder(selectedOrder?._id===o._id?null:o)}
                      style={{border:`1px solid ${C.border}`,borderRadius:10,marginBottom:10,
                        overflow:"hidden",cursor:"pointer",
                        background:selectedOrder?._id===o._id?"#f8faf8":"#fff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
                        <div style={{width:40,height:40,borderRadius:10,
                          background:STATUS[o.status?.toLowerCase()]?.bg||"#f5f5f5",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
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
                        <span style={{color:C.muted,fontSize:14,marginLeft:8}}>
                          {selectedOrder?._id===o._id?"▲":"▼"}
                        </span>
                      </div>

                      {/* Expanded order detail */}
                      {selectedOrder?._id===o._id&&(
                        <div style={{padding:"0 16px 16px",borderTop:`1px solid ${C.border}`}}>
                          <OrderTracker status={o.status}/>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:8}}>Items</div>
                              {(o.orderItems||[]).map((item,j)=>(
                                <div key={j} style={{display:"flex",gap:10,marginBottom:8,
                                  padding:"8px 10px",background:"#f9fafb",borderRadius:8}}>
                                  <div style={{width:36,height:36,borderRadius:6,background:"#e8ede9",
                                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                                    {item.image
                                      ?<img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:6}}/>
                                      :"📦"}
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
                                  <b>Payment:</b> {o.paymentMethod}&nbsp;
                                  <span style={{color:o.isPaid?C.green:C.red,fontWeight:600}}>
                                    {o.isPaid?"✓ Paid":"⏳ Unpaid"}
                                  </span>
                                </div>
                                <div><b>Placed:</b> {fmtDate(o.createdAt)}</div>
                                {o.paidAt&&<div><b>Paid at:</b> {fmtDate(o.paidAt)}</div>}
                              </div>
                              {o.orderItems?.[0]?.vendor&&(
                                <button onClick={()=>openVendorChat(o)}
                                  style={{marginTop:10,width:"100%",padding:"9px 0",borderRadius:8,
                                    border:`1px solid ${C.sidebar}`,background:`${C.sidebar}10`,
                                    color:C.sidebar,fontSize:12,fontWeight:600,cursor:"pointer",
                                    display:"flex",alignItems:"center",justifyContent:"center",
                                    gap:6,transition:"all .15s"}}
                                  onMouseEnter={e=>{e.currentTarget.style.background=C.sidebar;e.currentTarget.style.color=C.gold;}}
                                  onMouseLeave={e=>{e.currentTarget.style.background=`${C.sidebar}10`;e.currentTarget.style.color=C.sidebar;}}>
                                  💬 Message Vendor
                                </button>
                              )}
                              {["processing","shipped"].includes(o.status)&&(
                                <button onClick={()=>setTrackingOrder(o)}
                                  style={{marginTop:8,width:"100%",padding:"9px 0",borderRadius:8,
                                    border:"none",background:C.green,color:"#fff",fontSize:12,
                                    fontWeight:700,cursor:"pointer",display:"flex",
                                    alignItems:"center",justifyContent:"center",gap:6}}>
                                  🗺 Track Live Delivery
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Pagination page={ordersPage} totalItems={filteredOrders.length}
                    onChange={p=>{ setOrdersPage(p); window.scrollTo(0,0); }}/>
                </>
              );
            })()
        }
      </Panel>

      {/* Delivery map modal */}
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
}
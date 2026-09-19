import React from "react";
import { C, STATUS } from "./constants";
import { fmt, fmtDate } from "./helpers";
import { Avatar, StatCard, Panel, MiniBar, Donut, Empty, Spinner, Pill } from "./UI";

export default function CustomerHome({ profile, orders, loading, cartCount, cartTotal, setSection }) {
  const totalSpent      = orders.filter(o=>o.isPaid).reduce((a,o)=>a+o.totalPrice,0);
  const pendingCount    = orders.filter(o=>["pending","processing","shipped"].includes(o.status)).length;
  const deliveredCount  = orders.filter(o=>o.status==="delivered").length;
  const orderStatusCounts = orders.reduce((acc,o)=>{ acc[o.status]=(acc[o.status]||0)+1; return acc; },{});

  const spendingByMonth = (() => {
    const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map={};
    orders.filter(o=>o.isPaid).forEach(o=>{ const m=months[new Date(o.createdAt).getMonth()]; map[m]=(map[m]||0)+o.totalPrice; });
    return months.slice(0,new Date().getMonth()+1).map(m=>({ label:m, value:map[m]||0 }));
  })();

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Welcome banner */}
      <div style={{background:`linear-gradient(120deg,${C.sidebar} 0%,#1a4d38 100%)`,borderRadius:14,padding:"24px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.55)",marginBottom:4}}>Welcome back 👋</div>
          <div style={{fontSize:22,fontWeight:700,color:"#fff"}}>{profile?.name||"Customer"}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginTop:4}}>{profile?.email}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
            <span style={{fontSize:11,background:C.gold+"25",color:C.gold,padding:"3px 10px",borderRadius:20,fontWeight:600}}>{profile?.reputation?.rank||"Starter"}</span>
            <span style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>Trust score: <b style={{color:C.gold}}>{profile?.reputation?.score||0}</b>/100</span>
          </div>
        </div>
        <Avatar name={profile?.name||"?"} size={60} bg={C.gold} color={C.sidebar}/>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <StatCard label="Total Spent"   value={fmt(totalSpent)}  sub="All paid orders"              accent={C.green}  icon="💰"/>
        <StatCard label="Total Orders"  value={orders.length}    sub={`${deliveredCount} delivered`} accent={C.gold}   icon="📦"/>
        <StatCard label="Active Orders" value={pendingCount}     sub="In progress"                  accent={C.blue}   icon="🚚"/>
        <StatCard label="Cart Items"    value={cartCount}        sub={`${fmt(cartTotal)} total`}     accent={C.red}    icon="🛒"/>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14}}>
        <Panel title="Spending Over Time" subtitle="Monthly breakdown">
          {spendingByMonth.length>0
            ? <MiniBar data={spendingByMonth} color={C.green} height={90}/>
            : <Empty icon="📊" text="No spending data yet"/>}
        </Panel>
        <Panel title="Order Breakdown">
          <Donut label="orders" slices={[
            {label:"Pending",    value:orderStatusCounts.pending||0,    color:C.gold},
            {label:"Processing", value:orderStatusCounts.processing||0, color:C.blue},
            {label:"Shipped",    value:orderStatusCounts.shipped||0,    color:"#0c5a9e"},
            {label:"Delivered",  value:orderStatusCounts.delivered||0,  color:C.green},
          ]}/>
        </Panel>
      </div>

      {/* Recent orders + Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14}}>
        <Panel title="Recent Orders" action="View all →" onAction={()=>setSection("orders")}>
          {loading.orders
            ? <div style={{padding:"20px 0",textAlign:"center"}}><Spinner/></div>
            : orders.length===0
            ? <Empty icon="📦" text="No orders yet — go shopping!"/>
            : orders.slice(0,5).map((o,i)=>(
              <div key={o._id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<4?`1px solid ${C.border}`:"none"}}>
                <div style={{width:38,height:38,borderRadius:10,background:STATUS[o.status?.toLowerCase()]?.bg||"#f1f1f1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                  {STATUS[o.status?.toLowerCase()]?.icon||"📦"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,fontSize:12.5}}>Order #{o._id?.slice(-6).toUpperCase()}</div>
                  <div style={{fontSize:11,color:C.muted}}>{fmtDate(o.createdAt)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:600,fontSize:13}}>{fmt(o.totalPrice)}</div>
                  <Pill label={o.status}/>
                </div>
              </div>
            ))
          }
        </Panel>
        <Panel title="Quick Actions">
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {icon:"🛍", label:"Browse Products",    action:()=>setSection("shop")},
              {icon:"📍", label:"Find Nearby Vendors", action:()=>setSection("nearby")},
              {icon:"📦", label:"Track My Orders",    action:()=>setSection("orders")},
              {icon:"⭐", label:"Write a Review",     action:()=>setSection("reviews")},
              {icon:"💬", label:"My Messages",        action:()=>setSection("messages")},
              {icon:"👤", label:"Edit Profile",       action:()=>setSection("profile")},
            ].map(item=>(
              <button key={item.label} onClick={item.action}
                style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
                  borderRadius:9,border:`1px solid ${C.border}`,background:"#fafbfa",
                  cursor:"pointer",fontSize:13,fontWeight:500,color:C.text,
                  textAlign:"left",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.sidebar;e.currentTarget.style.color=C.gold;}}
                onMouseLeave={e=>{e.currentTarget.style.background="#fafbfa";e.currentTarget.style.color=C.text;}}>
                <span style={{fontSize:18}}>{item.icon}</span>{item.label}
                <span style={{marginLeft:"auto",color:C.muted,fontSize:14}}>›</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
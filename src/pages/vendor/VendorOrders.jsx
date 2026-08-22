import React, { useEffect, useState, useMemo } from 'react';
import { getVendorOrders, updateOrderStatus } from '../../services/api';
import VendorDeliveryMap from './VendorDeliveryMap';
import {
  Package, Search, TrendingUp, CheckCircle, DollarSign,
  BarChart3, ChevronRight, X, MapPin, User, Mail,
  CreditCard, ShoppingBag, RefreshCw, Clock, XCircle, Navigation
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const C = { dark:'#0f2a29', gold:'#c4a456', light:'#f8fafb', border:'#e8ede9', muted:'#7a8c7e' };

const STATUS_STYLE = {
  pending:    { bg:'#fef3c7', color:'#92400e', dot:'#f59e0b' },
  processing: { bg:'#dbeafe', color:'#1e40af', dot:'#3b82f6' },
  shipped:    { bg:'#d1fae5', color:'#065f46', dot:'#10b981' },
  delivered:  { bg:'#dcfce7', color:'#14532d', dot:'#22c55e' },
  cancelled:  { bg:'#fee2e2', color:'#991b1b', dot:'#ef4444' },
};
const sStyle = (s) => STATUS_STYLE[s?.toLowerCase()] || { bg:'#f1f5f9', color:'#64748b', dot:'#94a3b8' };

export default function VendorOrders() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeTab,     setActiveTab]     = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating,      setUpdating]      = useState(false);
  const [mapOrder,      setMapOrder]      = useState(null); // order shown in delivery map

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getVendorOrders();
      const d   = res.data;
      setOrders(Array.isArray(d?.orders||d) ? (d.orders||d) : []);
    } catch (e) { console.error('Orders error:', e); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id===orderId ? {...o,status:newStatus} : o));
      if (selectedOrder?._id===orderId) setSelectedOrder(p=>({...p,status:newStatus}));
    } catch { alert('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const filteredOrders = useMemo(() => orders.filter(o => {
    const ms = !searchQuery ||
      o._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const mt = activeTab==='all' || o.status?.toLowerCase()===activeTab;
    return ms && mt;
  }), [orders, searchQuery, activeTab]);

  const stats = useMemo(() => {
    const totalRevenue = orders.filter(o=>o.status==='delivered').reduce((a,o)=>a+(o.totalPrice||0),0);
    const delivered    = orders.filter(o=>o.status==='delivered').length;
    const pending      = orders.filter(o=>['pending','processing'].includes(o.status)).length;
    const cancelled    = orders.filter(o=>o.status==='cancelled').length;
    const distribution = [
      { name:'Delivered', value:delivered, color:'#22c55e' },
      { name:'Pending',   value:pending,   color:'#f59e0b' },
      { name:'Cancelled', value:cancelled, color:'#ef4444' },
    ].filter(d=>d.value>0);
    const chartData = [...orders].reverse().slice(-10);
    return { totalRevenue, delivered, distribution, chartData };
  }, [orders]);

  const tabs = ['all','pending','processing','shipped','delivered','cancelled'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:C.light }}>
      <div className="w-10 h-10 border-4 border-[#c4a456] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen relative" style={{ background:C.light }}>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color:C.dark }}>Manage Orders</h1>
          <p className="text-slate-500 font-medium mt-1">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Search order ID or customer…"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:border-[#c4a456] outline-none transition-all text-sm"/>
          </div>
          <button onClick={fetchOrders}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-[#c4a456] transition-all shadow-sm">
            <RefreshCw size={17} className="text-slate-400"/>
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} style={{ color:C.gold }}/>
              <h3 className="font-black uppercase text-[10px] tracking-widest" style={{ color:C.dark }}>
                Revenue Performance
              </h3>
            </div>
            <p className="text-xl font-black" style={{ color:C.dark }}>
              {stats.totalRevenue.toLocaleString()} ETB
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData.length>0?stats.chartData:[{totalPrice:0}]}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="_id" hide/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}/>
                <Area type="monotone" dataKey="totalPrice" stroke={C.gold} strokeWidth={3}
                  fill="url(#orderGrad)" dot={{ r:4, fill:C.gold }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color:C.gold }}/>
            <h3 className="font-black uppercase text-[10px] tracking-widest" style={{ color:C.dark }}>Status</h3>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.distribution.length>0?stats.distribution:[{name:'Empty',value:1,color:'#f1f5f9'}]}
                  innerRadius={35} outerRadius={55} paddingAngle={6} dataKey="value">
                  {stats.distribution.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, border:'none' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-2">
            {stats.distribution.map(d=>(
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background:d.color }}/>
                  <span className="font-bold text-slate-500">{d.name}</span>
                </div>
                <span className="font-black" style={{ color:C.dark }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto bg-slate-50/50">
          {tabs.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap
                ${activeTab===t?'border-[#c4a456] text-[#c4a456]':'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {['Order','Customer','Amount','Status',''].map(h=>(
                  <th key={h} className={`p-5 ${h===''?'text-right':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length===0?(
                <tr><td colSpan="5" className="p-16 text-center">
                  <Package size={40} className="mx-auto mb-3 text-slate-200"/>
                  <p className="font-bold text-slate-300 text-sm">No orders found</p>
                </td></tr>
              ):filteredOrders.map(order=>{
                const ss=sStyle(order.status);
                return(
                  <tr key={order._id} onClick={()=>setSelectedOrder(order)}
                    className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl text-slate-500 group-hover:text-[#c4a456] transition-all"
                          style={{ background:`${C.gold}12` }}>
                          <Package size={17}/>
                        </div>
                        <div>
                          <p className="font-black text-sm" style={{ color:C.dark }}>
                            #{order._id?.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {order.createdAt?new Date(order.createdAt).toLocaleDateString():'—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-sm" style={{ color:C.dark }}>{order.user?.name||'Guest'}</p>
                      <p className="text-xs text-slate-400">{order.orderItems?.length||0} items</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-sm" style={{ color:C.dark }}>
                        {order.totalPrice?.toLocaleString()} ETB
                      </p>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit"
                        style={{ background:ss.bg, color:ss.color }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background:ss.dot }}/>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-[#c4a456] transition-all inline"/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder&&(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">

            {/* Left: Customer info */}
            <div className="w-full md:w-72 bg-slate-50 p-7 border-r border-slate-100 space-y-7 overflow-y-auto flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest"
                  style={{ background:sStyle(selectedOrder.status).bg, color:sStyle(selectedOrder.status).color }}>
                  {selectedOrder.status}
                </span>
                <button onClick={()=>setSelectedOrder(null)} className="md:hidden text-slate-400"><X size={18}/></button>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm" style={{ color:C.gold }}><User size={15}/></div>
                    <p className="font-bold text-sm" style={{ color:C.dark }}>{selectedOrder.user?.name||'Guest'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400"><Mail size={15}/></div>
                    <p className="text-xs text-slate-500 truncate">{selectedOrder.user?.email||'—'}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shipping To</p>
                <div className="flex gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 h-fit"><MapPin size={15}/></div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {selectedOrder.shippingAddress?.address||'—'},{' '}
                    {selectedOrder.shippingAddress?.city||'—'},{' '}
                    {selectedOrder.shippingAddress?.country||'Ethiopia'}
                  </p>
                </div>
              </div>

              {/* ── VIEW ON MAP button ── */}
              <button
                onClick={()=>{ setSelectedOrder(null); setMapOrder(selectedOrder); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all"
                style={{ background:C.dark, color:C.gold }}>
                <Navigation size={16}/>
                View Customer on Map
              </button>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                  <span className="text-lg font-black" style={{ color:C.dark }}>
                    {selectedOrder.totalPrice?.toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Payment</span>
                  <span className={`text-xs font-black uppercase ${selectedOrder.isPaid?'text-emerald-600':'text-amber-600'}`}>
                    {selectedOrder.isPaid?'✓ Paid':'⏳ Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Items + status update */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="p-7 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black" style={{ color:C.dark }}>
                    Order #{selectedOrder._id?.slice(-6).toUpperCase()}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedOrder.createdAt?new Date(selectedOrder.createdAt).toLocaleDateString('en-US',
                      { month:'long', day:'numeric', year:'numeric' }):'—'}
                  </p>
                </div>
                <button onClick={()=>setSelectedOrder(null)}
                  className="hidden md:flex p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20}/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-7 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Items ({selectedOrder.orderItems?.length||0})
                </p>
                {selectedOrder.orderItems?.map((item,i)=>(
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-[#c4a456]/30 hover:bg-amber-50/20 transition-all">
                    <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                      {item.image
                        ?<img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                        :<ShoppingBag size={18} className="text-slate-300"/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color:C.dark }}>{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm" style={{ color:C.dark }}>
                        {(item.price*item.quantity).toLocaleString()} ETB
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">{item.price}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl flex items-center justify-between gap-4" style={{ background:C.dark }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,.08)' }}>
                      <CreditCard size={17} style={{ color:C.gold }}/>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-wider">Update Status</p>
                      <p className="text-sm font-bold text-white capitalize">{selectedOrder.status}</p>
                    </div>
                  </div>
                  <select value={selectedOrder.status}
                    onChange={e=>handleStatusUpdate(selectedOrder._id,e.target.value)}
                    disabled={updating}
                    className="bg-white/10 text-white text-xs font-bold py-2.5 px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-[#c4a456] cursor-pointer hover:bg-white/15 transition-all disabled:opacity-50">
                    {['pending','processing','shipped','delivered','cancelled'].map(s=>(
                      <option key={s} value={s} className="bg-[#0f2a29]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Map Modal */}
      {mapOrder&&(
        <VendorDeliveryMap
          order={mapOrder}
          vendorLocation={mapOrder?.orderItems?.[0]?.vendor?.location}
          onClose={()=>setMapOrder(null)}
        />
      )}
    </div>
  );
}
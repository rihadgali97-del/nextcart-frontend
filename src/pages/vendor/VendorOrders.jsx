import React, { useEffect, useState, useMemo } from 'react';
import { getVendorOrders, updateOrderStatus } from '../../services/api'; 
import { 
  Package, Search, Filter, TrendingUp, CheckCircle, 
  Clock, XCircle, DollarSign, BarChart3, ChevronRight,
  X, MapPin, User, Mail, CreditCard, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // --- Modal State ---
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getVendorOrders();
      // Adjusting to handle different potential API response structures
      const apiResult = response.data;
      const orderData = apiResult?.orders || apiResult || [];
      
      if (Array.isArray(orderData)) {
        setOrders(orderData);
      }
    } catch (error) {
      console.error("Error loading vendor orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Refresh local list and update modal state
      fetchOrders(); 
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update status. Please try again.");
    }
  };

  // --- FILTERING LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderId = order._id || "";
      const customerName = order.user?.name || "";
      
      const matchesSearch = 
        orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        customerName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesTab = activeTab === "all" || order.status?.toLowerCase() === activeTab.toLowerCase();
      
      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

  // --- ANALYTICS PROCESSING ---
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, curr) => 
      curr.status === 'delivered' ? acc + (curr.totalPrice || 0) : acc, 0
    );
    
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

    const distribution = [
      { name: 'Delivered', value: deliveredCount, color: '#10b981' },
      { name: 'Pending', value: pendingCount, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelledCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return { totalRevenue, deliveredCount, distribution };
  }, [orders]);

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen relative">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage Orders</h1>
          <p className="text-slate-500 font-medium italic">NextCart Vendor Pro Dashboard</p>
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" /> Revenue Performance
            </h3>
            <div className="text-2xl font-black text-slate-900">{stats.totalRevenue.toLocaleString()} ETB</div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orders.length > 0 ? [...orders].reverse().slice(-10) : [{totalPrice: 0}]}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" hide />
                <Tooltip />
                <Area type="monotone" dataKey="totalPrice" stroke="#f59e0b" strokeWidth={3} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <BarChart3 size={20} className="text-slate-400" /> Order Status
          </h3>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.distribution.length > 0 ? stats.distribution : [{name: 'Empty', value: 1, color: '#f1f5f9'}]} innerRadius={40} outerRadius={60} paddingAngle={8} dataKey="value">
                  {stats.distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-[10px] font-black uppercase tracking-widest mt-4">
            <span className="text-green-600">Delivered</span>
            <span className="text-amber-500">Pending</span>
            <span className="text-red-500">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto bg-slate-50/50">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap
                ${activeTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Order</th>
                <th className="p-6">Customer</th>
                <th className="p-6">Revenue</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    onClick={() => handleOpenModal(order)}
                    className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-xl text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">#{order._id?.slice(-6).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-slate-700">{order.user?.name || "Guest"}</p>
                      <p className="text-xs text-slate-400">{order.orderItems?.length || 0} items</p>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-900">{order.totalPrice?.toLocaleString()} ETB</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-amber-500 transition-colors inline" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-300 italic">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ORDER DETAILS MODAL --- */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            
            {/* Left Sidebar: Customer & Summary */}
            <div className="w-full md:w-80 bg-slate-50 p-8 border-r border-slate-100 space-y-8 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full tracking-widest">
                  {selectedOrder.status}
                </span>
                <button onClick={() => setIsModalOpen(false)} className="md:hidden text-slate-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Customer Info</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-amber-600"><User size={16} /></div>
                    <p className="text-sm font-bold text-slate-800">{selectedOrder.user?.name || 'Guest User'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400"><Mail size={16} /></div>
                    <p className="text-xs font-medium text-slate-600 truncate">{selectedOrder.user?.email || 'No email provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Shipping To</h4>
                <div className="flex gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400 h-fit"><MapPin size={16} /></div>
                  <p className="text-xs leading-relaxed font-medium text-slate-600">
                    {selectedOrder.shippingAddress?.address || 'N/A'},<br />
                    {selectedOrder.shippingAddress?.city || 'N/A'}<br />
                    {selectedOrder.shippingAddress?.country || 'Ethiopia'}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                  <span className="text-lg font-black text-slate-900">{selectedOrder.totalPrice?.toLocaleString()} ETB</span>
                </div>
              </div>
            </div>

            {/* Right Side: Product List & Status Update */}
            <div className="flex-1 p-8 flex flex-col min-h-0 bg-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Order #{selectedOrder._id?.slice(-6).toUpperCase()}</h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Order Items ({selectedOrder.orderItems?.length || 0})
                </h4>
                {selectedOrder.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-amber-100 hover:bg-amber-50/30 transition-all group">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm">{(item.price * item.quantity).toLocaleString()} ETB</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{item.price} / unit</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Management Bar */}
              <div className="mt-auto p-4 bg-slate-900 rounded-3xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 pl-2">
                  <div className="bg-slate-800 p-2 rounded-xl text-amber-500"><CreditCard size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase">Manage Delivery</p>
                    <p className="text-sm font-bold text-white capitalize">{selectedOrder.status}</p>
                  </div>
                </div>
                
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                  className="bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-xl border-none outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancel Order</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;
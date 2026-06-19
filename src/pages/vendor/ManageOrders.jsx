import React, { useEffect, useState, useMemo } from 'react';
import API from '../../services/api';
import { 
  Package, Search, Filter, TrendingUp, CheckCircle, 
  Clock, XCircle, ChevronRight, Download, DollarSign 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders/vendor/all');
      const fetchedOrders = res.data.orders || res.data.data || res.data || [];
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Order fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // --- Search & Filter Logic ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (order.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || order.status === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // --- Analytics Calculations ---
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, curr) => curr.status === 'delivered' ? acc + curr.totalPrice : acc, 0);
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    
    // Chart Data: Status Distribution
    const statusData = [
      { name: 'Delivered', value: completed, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' },
    ];

    return { totalRevenue, pending, completed, statusData };
  }, [orders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 font-medium">Monitor your sales performance and fulfillment.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" /> Revenue Breakdown (ETB)
            </h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orders.slice(0, 10).reverse()}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" tickFormatter={(str) => `#${str.slice(-4)}`} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="totalPrice" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-lg shadow-blue-200">
            <DollarSign className="mb-2 opacity-80" />
            <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
            <h2 className="text-3xl font-black">{stats.totalRevenue.toLocaleString()} ETB</h2>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Completion Rate</p>
              <h2 className="text-2xl font-black text-slate-800">
                {orders.length ? Math.round((stats.completed / orders.length) * 100) : 0}%
              </h2>
            </div>
            <div className="h-16 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.statusData} innerRadius={20} outerRadius={30} paddingAngle={5} dataKey="value">
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Name..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-slate-400 hidden md:block" />
          <select 
            className="w-full md:w-48 bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Order Details</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Total Price</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="p-6 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <Package size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-medium">No orders matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 flex items-center gap-2">
                            #{order._id.slice(-6).toUpperCase()}
                            {order.paymentMethod !== 'cash' && (
                              <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-md">PAID</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{order.user?.name || 'Guest'} • {new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-black text-slate-800">{order.totalPrice.toLocaleString()} ETB</div>
                      <div className="text-xs text-slate-400">{order.orderItems.length} Items</div>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                          order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-green-500' : 
                          order.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                        />
                        {order.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <div className="flex justify-end gap-2">
                           <button 
                            onClick={() => updateStatus(order._id, 'shipped')}
                            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                          >
                            Ship
                          </button>
                          <button 
                            onClick={() => updateStatus(order._id, 'delivered')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-100"
                          >
                            Complete
                          </button>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-1 font-bold text-xs ${order.status === 'delivered' ? 'text-green-600' : 'text-red-500'}`}>
                          {order.status === 'delivered' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          {order.status === 'delivered' ? 'Archived' : 'Cancelled'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;
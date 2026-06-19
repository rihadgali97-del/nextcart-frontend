import React, { useEffect, useState, useMemo } from 'react';
import API from '../../services/api';
import { Edit3, Trash2, Plus, Package, Search, BarChart3, PieChart as PieIcon, TrendingUp, AlertCircle, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const ProductInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data } = await API.get('/products/vendor-inventory');
        setProducts(data);
      } catch (err) {
        console.error("Inventory fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // --- ANALYTICS LOGIC ---
  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowStock = products.filter(p => p.stock <= (p.lowStockThreshold || 5)).length;
    
    // Data for Bar Chart (Stock levels)
    const barData = products.slice(0, 8).map(p => ({ name: p.name.substring(0, 10), stock: p.stock }));
    
    // Data for Pie Chart (Category distribution)
    const categories = products.reduce((acc, p) => {
      const catName = p.category?.name || "Uncategorized";
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    const pieData = Object.keys(categories).map(key => ({ name: key, value: categories[key] }));

    return { totalValue, lowStock, barData, pieData };
  }, [products]);

  // --- SEARCH LOGIC ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const COLORS = ['#0f2a29', '#c4a456', '#1a3433', '#e5c77e'];

  return (
    <div className="p-8 space-y-8 bg-[#f8fafb] min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#0f2a29]">Store Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time inventory analytics and management</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#c4a456] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#c4a456] w-64 shadow-sm transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#0f2a29] text-[#c4a456] px-6 py-3 rounded-2xl font-bold hover:bg-[#1a3433] transition-all shadow-xl shadow-slate-200">
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Stock Levels */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-[#c4a456]" size={20} />
            <h3 className="font-black text-[#0f2a29] uppercase text-xs tracking-widest">Inventory Levels</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafb'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="stock" fill="#0f2a29" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Mix */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="text-[#c4a456]" size={20} />
            <h3 className="font-black text-[#0f2a29] uppercase text-xs tracking-widest">Category Mix</h3>
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
             <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">Store Value</p>
                <p className="text-lg font-black text-[#0f2a29]">${stats.totalValue.toLocaleString()}</p>
             </div>
             <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-[10px] font-black text-red-400 uppercase">Low Stock</p>
                <p className="text-lg font-black text-red-600">{stats.lowStock}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
            <div className="p-2 bg-[#c4a456]/10 rounded-xl text-[#c4a456]">
                <TrendingUp size={20} />
            </div>
            <h3 className="font-black text-[#0f2a29]">Live Stock Management</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Product</th>
              <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Price</th>
              <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Stock Status</th>
              <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400">Trust Rating</th>
              <th className="p-6 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center font-bold text-slate-400 animate-pulse">Synchronizing Data...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <Package size={48} />
                    <p className="font-bold uppercase tracking-widest text-xs">No matching assets found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                        <img src={product.image || '/placeholder-p.png'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-black text-[#0f2a29]">{product.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category?.name || 'General'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-black text-[#0f2a29]">${product.price.toFixed(2)}</td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${product.stock > product.lowStockThreshold ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {product.stock} Units
                            </span>
                            {product.stock <= product.lowStockThreshold && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#c4a456]" style={{width: `${Math.min(product.stock * 2, 100)}%`}}></div>
                        </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-[#c4a456]" fill="#c4a456" />
                      <span className="text-sm font-black text-[#0f2a29]">{product.averageRating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-bold">({product.totalReviews})</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-slate-50 hover:bg-[#0f2a29] hover:text-[#c4a456] text-slate-400 rounded-xl transition-all border border-slate-100 shadow-sm"><Edit3 size={16} /></button>
                      <button className="p-3 bg-red-50 hover:bg-red-600 hover:text-white text-red-400 rounded-xl transition-all border border-red-100 shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductInventory;
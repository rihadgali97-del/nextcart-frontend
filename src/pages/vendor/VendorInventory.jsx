import React, { useEffect, useState, useMemo } from "react";
// Using your existing service imports
import { getVendorInventory, deleteProduct, getCategories, addProduct } from "../../services/api"; 
import { 
  Edit3, Trash2, Plus, Package, Search, 
  BarChart3, PieChart as PieIcon, TrendingUp, AlertCircle, X, Star 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

const VendorInventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: ""
  });

  const COLORS = ['#0f2a29', '#c4a456', '#1a3433', '#e5c77e'];

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getVendorInventory();
      // Adjusting to match your API response structure
      setProducts(response.data.data || response.data || []);
    } catch (err) {
      setError("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data.data || response.data || []);
    } catch (err) {
      console.error("Could not load categories");
    }
  };

  // --- Analytics Logic ---
  const stats = useMemo(() => {
    if (!products.length) return { totalValue: 0, lowStock: 0, barData: [], pieData: [] };
    
    const totalValue = products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock)), 0);
    const lowStock = products.filter(p => p.stock <= 5).length;
    
    const barData = products.slice(0, 6).map(p => ({ name: p.name.substring(0, 10), stock: p.stock }));
    
    const categoryCounts = products.reduce((acc, p) => {
      const catName = p.category?.name || "General";
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {});
    const pieData = Object.keys(categoryCounts).map(key => ({ name: key, value: categoryCounts[key] }));

    return { totalValue, lowStock, barData, pieData };
  }, [products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addProduct(formData);
      const newProd = response.data.data || response.data;
      setProducts([newProd, ...products]);
      setIsModalOpen(false);
      setFormData({ name: "", description: "", price: "", stock: "", category: "", image: "" });
    } catch (err) {
      alert("Error adding product: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p._id !== id));
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#f8fafb] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0f2a29] tracking-tight">Store Intelligence</h1>
          <p className="text-slate-500 text-sm font-bold opacity-70">NextCart Vendor Dashboard</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#c4a456] shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0f2a29] text-[#c4a456] p-3.5 rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-[#0f2a29]/10"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-[#c4a456]" size={18} />
            <h3 className="font-black text-[#0f2a29] uppercase text-[10px] tracking-widest">Live Stock Levels</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafb'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="stock" fill="#0f2a29" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f2a29] p-8 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <PieIcon className="text-[#c4a456] mb-4" size={24} />
            <p className="text-[#c4a456] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Store Value</p>
            <h2 className="text-4xl font-black">${stats.totalValue.toLocaleString()}</h2>
          </div>
          <div className="mt-8 flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase">Low Stock Alerts</p>
              <p className={`text-xl font-black ${stats.lowStock > 0 ? 'text-red-400' : 'text-green-400'}`}>{stats.lowStock} Items</p>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-[#c4a456]" size={20} />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#c4a456]/10 rounded-full blur-3xl group-hover:bg-[#c4a456]/20 transition-all"></div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/30">
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Name</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Category</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Stock</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Price</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center font-black text-slate-300 animate-pulse tracking-widest text-xs">Syncing with NextCart...</td></tr>
            ) : filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                      {product.image ? <img src={product.image} className="w-full h-full object-cover" alt="" /> : <Package size={20} />}
                    </div>
                    <div>
                      <p className="font-black text-[#0f2a29]">{product.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-[#c4a456]" fill="#c4a456" />
                        <span className="text-[10px] font-bold text-slate-400">{product.averageRating || "5.0"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                    {product.category?.name || "General"}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-xs font-black ${product.stock <= 5 ? 'text-red-500' : 'text-[#0f2a29]'}`}>
                      {product.stock} Units
                    </span>
                  </div>
                </td>
                <td className="p-6 text-center font-black text-[#0f2a29]">${product.price}</td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(product._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal (Your original functionality) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#0f2a29]">New Product</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" placeholder="Name" required className="w-full p-4 bg-slate-50 rounded-2xl border-none" onChange={handleInputChange} value={formData.name} />
              <textarea name="description" placeholder="Description" rows="2" className="w-full p-4 bg-slate-50 rounded-2xl border-none" onChange={handleInputChange} value={formData.description} />
              <div className="grid grid-cols-2 gap-4">
                <input name="price" type="number" placeholder="Price" required className="w-full p-4 bg-slate-50 rounded-2xl border-none" onChange={handleInputChange} value={formData.price} />
                <input name="stock" type="number" placeholder="Stock" required className="w-full p-4 bg-slate-50 rounded-2xl border-none" onChange={handleInputChange} value={formData.stock} />
              </div>
              <select name="category" required className="w-full p-4 bg-slate-50 rounded-2xl border-none" onChange={handleInputChange} value={formData.category}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-[#0f2a29] text-[#c4a456] py-4 rounded-2xl font-black">Publish Asset</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInventory;
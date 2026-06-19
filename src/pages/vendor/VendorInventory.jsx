import React, { useEffect, useState, useMemo } from 'react';
import { getVendorInventory, deleteProduct, getCategories, addProduct } from '../../services/api';
import {
  Edit3, Trash2, Plus, Package, Search,
  BarChart3, TrendingUp, AlertCircle, X, Star, RefreshCw, Upload, Loader
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

const C = { dark:'#0f2a29', gold:'#c4a456', light:'#f8fafb', border:'#e8ede9', muted:'#7a8c7e' };
const COLORS = ['#0f2a29','#c4a456','#1a3d30','#e5c77e','#6366f1','#10b981'];

export default function VendorInventory() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData,    setFormData]    = useState({ name:'', description:'', price:'', stock:'', category:'', image:null });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [msg,         setMsg]         = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [inv, cats] = await Promise.all([getVendorInventory(), getCategories()]);
      setProducts(inv.data?.data || inv.data?.products || inv.data || []);
      setCategories(cats.data?.data || cats.data || []);
    } catch { showMsg('error','Failed to load inventory'); }
    finally { setLoading(false); }
  };

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3500); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMsg('error', 'Image must be less than 5MB');
        return;
      }
      setFormData(p => ({...p, image: file}));
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let submitData = formData;
      
      // Use FormData if image is a File object
      if (formData.image instanceof File) {
        const fd = new FormData();
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('price', formData.price);
        fd.append('stock', formData.stock);
        fd.append('category', formData.category);
        fd.append('image', formData.image);
        submitData = fd;
      }
      
      const res = await addProduct(submitData);
      const newP = res.data?.data || res.data;
      setProducts(prev => [newP, ...prev]);
      setIsModalOpen(false);
      setFormData({ name:'', description:'', price:'', stock:'', category:'', image:null });
      setImagePreview('');
      showMsg('success','Product published!');
    } catch (err) { 
      showMsg('error', err.response?.data?.message || 'Failed to add product'); 
    }
    finally { setUploading(false); }
  };

  const stats = useMemo(() => {
    const totalValue = products.reduce((a,p)=>a+(Number(p.price)*Number(p.stock)),0);
    const lowStock   = products.filter(p=>p.stock<=5).length;
    const barData    = products.slice(0,8).map(p=>({ name:p.name.substring(0,10), stock:p.stock }));
    const catCounts  = products.reduce((acc,p)=>{
      const n = p.category?.name||'General'; acc[n]=(acc[n]||0)+1; return acc;
    },{});
    const pieData = Object.keys(catCounts).map(k=>({ name:k, value:catCounts[k] }));
    return { totalValue, lowStock, barData, pieData };
  }, [products]);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p=>p._id!==id));
      showMsg('success','Product deleted');
    } catch { showMsg('error','Failed to delete'); }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen" style={{ background: C.light }}>

      {/* Toast */}
      {msg && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300
          ${msg.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: C.dark }}>Store Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium">Real-time inventory analytics and management</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17}/>
            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#c4a456] shadow-sm transition-all"/>
          </div>
          <button onClick={fetchAll}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-[#c4a456] transition-all shadow-sm">
            <RefreshCw size={17} className="text-slate-400"/>
          </button>
          <button onClick={()=>{setIsModalOpen(true); setImagePreview('');}}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all hover:opacity-90"
            style={{ background:C.dark, color:C.gold }}>
            <Plus size={18}/> Add Product
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} style={{ color:C.gold }}/>
            <h3 className="font-black uppercase text-[10px] tracking-widest" style={{ color:C.dark }}>Live Stock Levels</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:10, fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10 }}/>
                <Tooltip contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}/>
                <Bar dataKey="stock" fill={C.dark} radius={[6,6,0,0]} barSize={32}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Value + low stock + pie */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[2rem] p-6 text-white relative overflow-hidden"
            style={{ background:`linear-gradient(135deg, ${C.dark}, #1a3d30)` }}>
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10" style={{ background:C.gold }}/>
            <TrendingUp size={20} style={{ color:C.gold }} className="mb-3"/>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Store Value</p>
            <p className="text-3xl font-black" style={{ color:C.gold }}>
              ${stats.totalValue.toLocaleString()}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] opacity-40 font-black uppercase">Low Stock</p>
                <p className={`text-lg font-black ${stats.lowStock>0?'text-red-400':'text-emerald-400'}`}>
                  {stats.lowStock} items
                </p>
              </div>
            </div>
          </div>

          {/* Category pie */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color:C.muted }}>
              Category Mix
            </p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={30} outerRadius={45} paddingAngle={4} dataKey="value">
                    {stats.pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:10, border:'none' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.pieData.slice(0,4).map((d,i)=>(
                <span key={d.name} className="text-[9px] font-black uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background:COLORS[i%COLORS.length] }}/>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background:`${C.gold}18` }}>
              <Package size={18} style={{ color:C.gold }}/>
            </div>
            <h3 className="font-black" style={{ color:C.dark }}>
              Products ({filtered.length})
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/40">
                {['Product','Category','Stock','Price','Rating','Actions'].map(h=>(
                  <th key={h} className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="6" className="p-16 text-center font-black text-slate-300 animate-pulse text-xs">
                  Syncing inventory…
                </td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan="6" className="p-16 text-center">
                  <Package size={40} className="mx-auto mb-3 text-slate-200"/>
                  <p className="font-bold text-slate-300 text-sm">No products found</p>
                </td></tr>
              ) : filtered.map(p=>(
                <tr key={p._id} className="hover:bg-slate-50/60 transition-all group">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.image
                          ? <img src={p.image} alt="" className="w-full h-full object-cover"/>
                          : <Package size={18} className="text-slate-300"/>}
                      </div>
                      <div>
                        <p className="font-black text-sm" style={{ color:C.dark }}>{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                          {p.description || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase">
                      {p.category?.name || 'General'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${p.stock<=5?'text-red-500':''}`}
                        style={{ color: p.stock>5 ? C.dark : undefined }}>
                        {p.stock}
                      </span>
                      {p.stock<=5 && <AlertCircle size={14} className="text-red-400 animate-pulse"/>}
                    </div>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width:`${Math.min(p.stock*3,100)}%`,
                          background: p.stock<=5?'#ef4444':C.gold }}/>
                    </div>
                  </td>
                  <td className="p-5 font-black text-sm" style={{ color:C.dark }}>
                    ${Number(p.price).toFixed(2)}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5">
                      <Star size={13} fill={C.gold} style={{ color:C.gold }}/>
                      <span className="font-black text-sm" style={{ color:C.dark }}>
                        {(p.averageRating||0).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400">({p.totalReviews||0})</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2.5 rounded-xl border border-slate-100 text-blue-400 hover:bg-blue-50 transition-all">
                        <Edit3 size={15}/>
                      </button>
                      <button onClick={()=>handleDelete(p._id)}
                        className="p-2.5 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black" style={{ color:C.dark }}>New Product</h2>
              <button onClick={()=>{setIsModalOpen(false); setImagePreview('');}} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={18} className="text-slate-400"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name:'name',        placeholder:'Product name',   type:'text'   },
                { name:'price',       placeholder:'Price (ETB)',    type:'number' },
                { name:'stock',       placeholder:'Stock quantity', type:'number' },
              ].map(f=>(
                <input key={f.name} name={f.name} type={f.type} placeholder={f.placeholder} required={f.name!=='image'}
                  value={formData[f.name]} onChange={e=>setFormData(p=>({...p,[f.name]:e.target.value}))}
                  className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] focus:bg-white outline-none text-sm font-medium transition-all"/>
              ))}
              <textarea name="description" placeholder="Description (optional)" rows={2}
                value={formData.description} onChange={e=>setFormData(p=>({...p,description:e.target.value}))}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] focus:bg-white outline-none text-sm font-medium transition-all resize-none"/>
              <select name="category" required value={formData.category}
                onChange={e=>setFormData(p=>({...p,category:e.target.value}))}
                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-[#c4a456] outline-none text-sm font-medium cursor-pointer">
                <option value="">Select Category</option>
                {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Product Image
                </label>
                <div className="flex gap-3">
                  <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading}
                    className="hidden" id="imageInput"/>
                  <label htmlFor="imageInput"
                    className="flex-1 px-4 py-3.5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 hover:border-[#c4a456] cursor-pointer transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-[#c4a456]">
                    <Upload size={16}/>
                    <span className="text-sm font-medium">{formData.image ? 'Change Image' : 'Upload Image'}</span>
                  </label>
                  {imagePreview && (
                    <button type="button" onClick={() => {setFormData(p=>({...p,image:null})); setImagePreview('');}}
                      className="px-4 py-3.5 bg-slate-50 rounded-2xl border border-transparent hover:bg-red-50 hover:border-red-200 text-red-400 transition-all">
                      <X size={16}/>
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl"/>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {formData.image?.name || 'Selected image'}
                    </p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={uploading}
                className="w-full py-4 rounded-2xl font-black text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                style={{ background:C.dark, color:C.gold }}>
                {uploading ? (
                  <>
                    <Loader size={16} className="animate-spin"/>
                    Uploading…
                  </>
                ) : (
                  'Publish Product'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
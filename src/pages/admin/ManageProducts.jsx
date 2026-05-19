import React, { useEffect, useState } from 'react';
import { 
  Package, Trash2, Edit, AlertCircle, 
  Plus, Search, Filter, ExternalLink, MoreVertical 
} from 'lucide-react';
import { getAdminProducts, deleteProduct } from '../../services/api';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      const { data } = await getAdminProducts();
      setProducts(data.products); 
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product from NextCart?")) {
      try {
        await deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert("Action failed.");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vendor?.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center font-black text-[#0f2a29] animate-pulse">Scanning Inventory...</div>;

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500">Monitor stock levels and manage product listings across all vendors.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#c4a456] text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-[#c4a456]/20 transition-all">
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products or vendors..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#c4a456]/20"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
          <Filter size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <th className="px-8 py-5">Product Info</th>
              <th className="px-8 py-5">Vendor</th>
              <th className="px-8 py-5">Price</th>
              <th className="px-8 py-5">Stock Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= (product.lowStockThreshold || 5);
              return (
                <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-slate-300" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[10px] text-[#c4a456] font-black uppercase tracking-tighter">
                          {product.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-600">
                    {product.vendor?.businessName || 'NextCart Official'}
                  </td>
                  <td className="px-8 py-5 font-bold text-[#0f2a29]">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-8 py-5">
                    {isLowStock ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                          <AlertCircle size={12} /> Low Stock
                        </span>
                        <p className="text-[10px] text-red-400 px-1 italic">Only {product.stock} left</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                         Healthy ({product.stock})
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-[#0f2a29] hover:bg-slate-100 rounded-lg">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-20 text-center text-slate-400 italic">No products found matching your search.</div>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;
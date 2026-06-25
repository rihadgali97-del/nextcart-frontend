import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import ProductCard from '../components/ui/ProductCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import { searchProducts, getCategories } from '../services/api'; 

const Home = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ _id: 'All', name: 'All' }]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState({ _id: 'All', name: 'All' });

  // Fetch dynamic categories once on component mount
  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getCategories();
        const data = response.data || response;
        
        if (Array.isArray(data)) {
          const parsedCategories = data.map(cat => 
            cat && typeof cat === 'object' ? { _id: cat._id, name: cat.name } : { _id: cat, name: cat }
          );
          setCategories([{ _id: 'All', name: 'All' }, ...parsedCategories]);
        }
      } catch (err) {
        console.error("Error pulling live categories taxonomy:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchDynamicCategories();
  }, []);

  // Fetch real product data when active category selection switches
  useEffect(() => {
    const fetchRealProducts = async () => {
      try {
        setLoadingProducts(true);
        setError(null);
        
        // 🛠️ BULLETPROOF PAYLOAD ARCHITECTURE:
        // Explicitly declare both q and category so backend parameters clear out properly.
        const params = { 
          page: 1, 
          limit: 12,
          q: '', 
          category: '' 
        };
        
        if (activeCategory._id === 'All') {
          params.q = '';         // Pull everything clean
          params.category = '';
        } else {
          params.q = '';         // Keep text query empty so backend relies purely on category filter
          params.category = activeCategory._id; // Send database ObjectId reference
        }

        const response = await searchProducts(params);
        
        let productsArray = [];
        if (response && response.data) {
          if (response.data.data) {
            productsArray = response.data.data;
          } else if (Array.isArray(response.data)) {
            productsArray = response.data;
          } else if (Array.isArray(response.data.products)) {
            productsArray = response.data.products;
          }
        } else if (Array.isArray(response)) {
          productsArray = response;
        }

        setProducts(Array.isArray(productsArray) ? productsArray : []);
      } catch (err) {
        console.error("Error pulling marketplace data:", err);
        setError("Failed to load trending items. Please check back shortly.");
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchRealProducts();
  }, [activeCategory]);

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      {/* Massive Bold Hero Section */}
      <section className="relative bg-[#0f2a29] text-white pt-36 pb-28 px-6 rounded-b-[5rem] overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,164,86,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-[#c4a456] font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Next-Gen Multi-Vendor Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
              Your Premium <br/>Marketplace Hub
            </h1>
            <p className="text-white/60 max-w-lg text-sm md:text-base leading-relaxed font-medium">
              Discover verified vendors, track structural multi-vendor analytics, and buy directly from premium commercial hubs with digital ecosystem trust.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => navigate('/search')} 
                className="px-8 py-4 bg-[#c4a456] hover:bg-[#b3934b] text-[#0f2a29] font-black text-sm rounded-2xl transition-all flex items-center gap-2 group shadow-lg shadow-[#c4a456]/20"
              >
                Explore Products 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/register')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm rounded-2xl transition-all">
                Become a Vendor
              </button>
            </div>
          </div>

          {/* Premium High-Fidelity Mock Visual Element */}
          <div className="hidden lg:block relative">
            <div className="relative w-full h-[450px] bg-gradient-to-tr from-[#c4a456]/10 to-white/5 rounded-[4rem] border border-white/10 overflow-hidden backdrop-blur-sm flex items-center justify-center">
              <div className="absolute top-12 left-12 bg-white/10 border border-white/20 p-4 rounded-3xl backdrop-blur-md shadow-xl animate-bounce duration-[4000ms] w-64">
                <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80" className="rounded-2xl h-32 w-full object-cover mb-2" alt="premium preview" />
                <p className="text-xs font-black text-white">MacBook Pro 16" M3 Max</p>
                <p className="text-[11px] text-[#c4a456] font-bold">145,000 ETB</p>
              </div>
              <div className="absolute bottom-12 right-12 bg-white/10 border border-white/20 p-4 rounded-3xl backdrop-blur-md shadow-xl animate-pulse w-56">
                <img src="https://images.unsplash.com/photo-1617788138017-80ad40651399?w=300&auto=format&fit=crop&q=80" className="rounded-2xl h-24 w-full object-cover mb-2" alt="luxury vehicle" />
                <p className="text-xs font-black text-white">Tesla Model S Plaid</p>
                <p className="text-[11px] text-emerald-400 font-bold">Premium Import</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Grid Sections */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <SectionHeader 
            tag="Curated Collections" 
            title="Trending Items Marketplace" 
            subtitle="Get instant access to authentic items uploaded directly by registered store administrators."
          />
          
          {/* Dynamic Categories Filtering Buttons */}
          <div className="flex flex-wrap gap-2 pb-6 md:pb-0">
            {!loadingCategories && categories.map((cat, i) => (
              <button 
                key={i} 
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  activeCategory._id === cat._id 
                    ? 'bg-[#0f2a29] text-white border-[#0f2a29]' 
                    : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#c4a456] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-semibold tracking-wide">Syncing Marketplace Inventory...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/5 rounded-2xl border border-red-500/10 p-6">
            <p className="text-red-500 font-medium text-sm">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-slate-100 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium text-sm">No items matching this collection category currently found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
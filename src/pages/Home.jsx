import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import ProductCard from '../components/ui/ProductCard';
import { ShoppingBag, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  // Dummy data representing state pulling from MERN backend
  const [products] = useState([
    { _id: '1', name: 'Premium Leather Boots', price: '3,400', category: 'Footwear', isVerified: true, vendorName: 'Zara Shoes Habesha' },
    { _id: '2', name: 'Minimalist Chrono Watch', price: '4,200', category: 'Accessories', isVerified: true, vendorName: 'TriNova Imports' },
    { _id: '3', name: 'Waterproof Active Backpack', price: '2,800', category: 'Bags', isVerified: false, vendorName: 'Addis Goods' },
    { _id: '4', name: 'Wireless Noise-Canceling Buds', price: '5,500', category: 'Electronics', isVerified: true, vendorName: 'Alphi Electronics' },
  ]);


  const categories = ['All', 'Electronics', 'Footwear', 'Clothing', 'Accessories', 'Bags'];

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
              <button className="px-8 py-4 bg-[#c4a456] hover:bg-[#b3934b] text-[#0f2a29] font-black text-sm rounded-2xl transition-all flex items-center gap-2 group shadow-lg shadow-[#c4a456]/20">
                Explore Products 
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate('/register')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-sm rounded-2xl transition-all">
                Become a Vendor
              </button>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="w-full h-[450px] bg-gradient-to-tr from-[#c4a456]/20 to-white/5 rounded-[4rem] border border-white/10 overflow-hidden flex items-center justify-center backdrop-blur-sm">
              <ShoppingBag size={120} className="text-[#c4a456]/40 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Filter Layout Component */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <SectionHeader 
            tag="Curated Collections" 
            title="Trending Items Marketplace" 
            subtitle="Get instant access to authentic items uploaded directly by registered store administrators."
          />
          <div className="flex flex-wrap gap-2 pb-6 md:pb-0">
            {categories.map((cat, i) => (
              <button 
                key={i} 
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  i === 0 ? 'bg-[#0f2a29] text-white border-[#0f2a29]' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
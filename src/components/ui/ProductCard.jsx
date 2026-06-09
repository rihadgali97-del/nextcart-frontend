import React from 'react';
import { Star, ShieldCheck, ArrowUpRight, ShoppingBag } from 'lucide-react';

const ProductCard = ({ product }) => {
  const { name, price, category, averageRating, isVerified, image, vendorName } = product;

  return (
    <div className="group bg-white rounded-[2.5rem] border border-slate-100 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-100 hover:-translate-y-1.5 flex flex-col h-full">
      {/* Product Image Area */}
      <div className="relative w-full h-56 bg-slate-50 rounded-[1.8rem] overflow-hidden mb-5">
        <img 
          src={image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60"} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {isVerified && (
          <div className="absolute top-4 left-4 bg-[#0f2a29] text-[#c4a456] text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md uppercase">
            <ShieldCheck size={13} />
            <span>Verified Vendor</span>
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium px-1">
        <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-600 font-semibold">{category}</span>
        <div className="flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" />
          <span className="text-slate-700 font-bold">{averageRating || "4.8"}</span>
        </div>
      </div>

      {/* Title & Vendor Name */}
      <div className="mb-4 px-1">
        <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-[#0f2a29] transition-colors">
          {name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">by {vendorName || "Elite Storefront"}</p>
      </div>

      {/* Pricing & Call-To-Action Footer */}
      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Price</p>
          <p className="text-xl font-black text-[#0f2a29]">{price} <span className="text-xs font-bold text-[#c4a456]">ETB</span></p>
        </div>
        <button className="w-11 h-11 bg-slate-50 text-[#0f2a29] rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:bg-[#c4a456] group-hover:text-white shadow-sm group-hover:shadow-[#c4a456]/30">
          <ArrowUpRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
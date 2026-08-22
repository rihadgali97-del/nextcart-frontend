// src/components/common/Logo.jsx
import React from 'react';
import nextCartLogo from '../../assets/nextcart-logo.png'; 

const Logo = ({ className = "h-10", showText = true, lightText = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      
      {/* Container that crops the image to ONLY show the upper cart/arrow graphic */}
      <div className="w-10 h-10 overflow-hidden flex items-start justify-center rounded-full bg-white/5 p-0.5">
        <img 
          src={nextCartLogo} 
          alt="NextCart Icon" 
          className="w-14 max-w-none scale-[1.5] -translate-y-1.5 object-contain transition-transform duration-300 group-hover:scale-[1.6]" 
        />
      </div>

      {/* Dynamic typography that handles layout adjustments and light/dark modes */}
      {showText && (
        <span className={`font-sans text-xl font-black tracking-tight transition-colors ${
          lightText ? 'text-white' : 'text-slate-900'
        }`}>
          Gebeya<span className="text-[#c4a456]">Plus</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
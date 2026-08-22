// src/components/common/Logo.jsx
import React from 'react';
import nextCartLogo from '../../assets/nextcart-logo.png'; 
import '../../styles/common/logo.css';

const Logo = ({ className = "h-10", showText = true, lightText = false }) => {
  return (
    <div className={`brand-logo ${className}`}>
      
      {/* Container that crops the image to ONLY show the upper cart/arrow graphic */}
      <div className="brand-logo__mark">
        <img 
          src={nextCartLogo} 
          alt="NextCart Icon" 
          className="brand-logo__image" 
        />
      </div>

      {/* Dynamic typography that handles layout adjustments and light/dark modes */}
      {showText && (
        <span className={`brand-logo__text ${lightText ? 'brand-logo__text--light' : ''}`}>
          Gebeya<span className="brand-logo__accent">Plus</span>
        </span>
      )}
    </div>
  );
};

export default Logo;

import React from 'react';
import gebeyaLogo from '../../assets/gebeya-logo.png'; 
import '../../styles/common/logo.css';

const Logo = ({ className = "h-10", showText = true, lightText = false }) => {
  return (
    <div className={`brand-logo ${className}`}>
      
      {/* Icon Graphic Container */}
      <div className="brand-logo__mark">
        <img 
          src={gebeyaLogo} 
          alt="Gebeya+ Icon" 
          className="brand-logo__image" 
        />
      </div>

      {/* Dynamic typography rendering Gebeya+ */}
      {showText && (
        <span className={`brand-logo__text ${lightText ? 'brand-logo__text--light' : ''}`}>
          Gebeya<span className="brand-logo__accent">Pus</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
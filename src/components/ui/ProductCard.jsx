import React, { useState } from 'react';
import { Star, ShieldCheck, ArrowUpRight } from 'lucide-react';
import '../../styles/components/product-card.css';

const ProductCard = ({ product }) => {
  const { name, price, category, averageRating, isVerified, image, images, colors, vendorName, vendor } = product;
  
  // Track which color image variation is actively displayed
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const categoryLabel = category && typeof category === 'object' ? category.name || category._id : category;
  const vendorLabel = vendorName && typeof vendorName === 'string'
    ? vendorName
    : vendor?.name || vendorName?.name || vendorName?.businessName || 'Elite Storefront';

  return (
    <div className="product-card">
      {/* Product Image Area */}
      <div className="product-card__media">
        <img 
          // Prioritize our newly seeded slide images, then fall back to single image property
          src={(images && images.length > 0) ? images[activeImgIndex] : (image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60")} 
          alt={name}
          className="product-card__image"
        />
        {isVerified && (
          <div className="product-card__verified">
            <ShieldCheck size={13} />
            <span>Verified Vendor</span>
          </div>
        )}
        {(product.distanceInKm !== undefined || product.distance !== undefined) && (
          <div className="product-card__distance">
            {product.distanceInKm !== undefined ? `${parseFloat(product.distanceInKm).toFixed(1)} km` : `${(product.distance / 1000).toFixed(1)} km`}
          </div>
        )}
      </div>

      {/* Meta Information */}
      <div className="product-card__meta">
        <span className="product-card__category">{categoryLabel}</span>
        <div className="product-card__rating">
          <Star size={13} className="product-card__star" />
          <span className="product-card__rating-value">{averageRating || "4.8"}</span>
        </div>
      </div>

      {/* Title & Vendor Name */}
      <div className="product-card__details">
        <h3 className="product-card__name">
          {name}
        </h3>
        <p className="product-card__vendor">by {vendorLabel}</p>
      </div>

      {/* Dynamic Interactive Color Variant Nodes */}
      {colors && colors.length > 0 && (
        <div className="product-card__colors">
          <span className="product-card__colors-label">Colors:</span>
          {colors.map((color, idx) => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation(); // Stop navigation triggering if card has click actions
                setActiveImgIndex(idx);
              }}
              className={`product-card__color ${activeImgIndex === idx ? 'product-card__color--active' : ''}`}
            >
              {color}
            </button>
          ))}
        </div>
      )}

      {/* Pricing & Call-To-Action Footer */}
      <div className="product-card__footer">
        <div>
          <p className="product-card__price-label">Price</p>
          <p className="product-card__price">{price?.toLocaleString()} <span className="product-card__currency">ETB</span></p>
        </div>
        <button className="product-card__action">
          <ArrowUpRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

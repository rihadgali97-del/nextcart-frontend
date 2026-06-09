import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { executeTrustWeightedSearch } from '../services/api';
import ProductCard from './ui/ProductCard';
import { Search, MapPin, Navigation, Layers } from 'lucide-react';

const ProximitySearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Precise Local States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [coords, setCoords] = useState({
    lng: searchParams.get('lng') || null,
    lat: searchParams.get('lat') || null
  });

  const categories = ['Electronics', 'Footwear', 'Clothing', 'Accessories', 'Bags'];

  // Geolocation trigger
  const toggleLocation = () => {
    if (coords.lat) {
      // Turn off proximity filter cleanly
      const newCoords = { lng: null, lat: null };
      setCoords(newCoords);
      updateUrlParams(newCoords);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lng: position.coords.longitude.toString(),
            lat: position.coords.latitude.toString()
          };
          setCoords(newCoords);
          updateUrlParams(newCoords);
        },
        () => alert("Location access denied. Using standard search fallback.")
      );
    }
  };

  const updateUrlParams = (updatedFields = {}) => {
    const currentParams = Object.fromEntries([...searchParams]);
    const cleanParams = {
      ...currentParams,
      q: searchQuery,
      category,
      ...coords,
      ...updatedFields
    };

    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === null || cleanParams[key] === '') delete cleanParams[key];
    });

    setSearchParams(cleanParams);
  };

  const handleFetchSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(searchParams.get('q') && { q: searchParams.get('q') }),
        ...(searchParams.get('category') && { category: searchParams.get('category') }),
        ...(searchParams.get('lng') && { lng: searchParams.get('lng') }),
        ...(searchParams.get('lat') && { lat: searchParams.get('lat') }),
        maxDistanceKm: '50' // Consolidated clean default
      };

      const response = await executeTrustWeightedSearch(params);
      if (response.data?.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error("Search fetch failure", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    handleFetchSearch();
  }, [handleFetchSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUrlParams();
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Compact Form Wrapper */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSubmit} className="relative flex items-center bg-white border-2 border-[#c4a456] rounded-2xl p-1.5 shadow-sm transition-all focus-within:shadow-md">
            
            {/* Search Input */}
            <div className="flex-grow flex items-center gap-2 pl-3">
              <Search className="text-slate-400 shrink-0" size={16} />
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-medium text-xs py-1.5"
              />
            </div>

            {/* Inline Micro Controls */}
            <div className="flex items-center gap-1.5 border-l border-slate-100 pl-2 pr-1">
              
              {/* Category Picker */}
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); updateUrlParams({ category: e.target.value }); }}
                className="bg-transparent text-slate-500 text-xs font-semibold outline-none cursor-pointer hover:text-slate-800 max-w-[100px] pr-2"
              >
                <option value="">All</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Precise Location Node */}
              <button
                type="button"
                onClick={toggleLocation}
                className={`p-2 rounded-xl transition-all ${
                  coords.lat ? 'bg-[#c4a456]/10 text-[#0f2a29]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
                title={coords.lat ? "Proximity enabled (50km)" : "Enable proximity search"}
              >
                <MapPin size={15} className={coords.lat ? "fill-[#c4a456]/20" : ""} />
              </button>

              {/* Action Submit */}
              <button
                type="submit"
                className="px-4 py-2 bg-[#0f2a29] hover:bg-[#153b3a] text-white font-bold text-xs rounded-xl transition-all"
              >
                Find
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Workspace Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-6 h-6 border-2 border-[#c4a456] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Querying matrix...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {products.map((product) => (
              <div key={product._id} className="relative">
                {product.distanceInKm !== undefined && (
                  <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-600 font-bold text-[9px] tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Navigation size={8} className="fill-[#0f2a29] text-[#0f2a29]" />
                    <span>{parseFloat(product.distanceInKm).toFixed(1)} km</span>
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 max-w-sm mx-auto">
            <Layers size={32} className="text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 mb-0.5">No products found</h4>
            <p className="text-xs text-slate-400">Try broad searches or switch categories.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProximitySearch;
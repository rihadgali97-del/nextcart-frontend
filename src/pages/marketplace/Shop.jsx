import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, AlertCircle, Loader } from 'lucide-react';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('initializing'); // 'initializing', 'active', 'denied'
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  // 1. Capture customer location automatically when opening the shop layout
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomerLocation({
          lng: position.coords.longitude,
          lat: position.coords.latitude
        });
        setLocationStatus('active');
      },
      (error) => {
        console.warn("Location permission rejected or timed out:", error.message);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 2. Fetch products through your query controller pipeline
  const handleFetchMarketplaceItems = async (pageNumber = 1, searchKeyword = searchQuery) => {
    setLoading(true);
    try {
      // Build search query params dynamically based on whether location is available
      let queryParams = new URLSearchParams({
        page: pageNumber,
        limit: pagination.limit
      });

      if (searchKeyword) {
        queryParams.append('keyword', searchKeyword);
      }

      // If location is active, pass coordinates to activate nearest-vendor calculations
      if (customerLocation) {
        queryParams.append('lng', customerLocation.lng);
        queryParams.append('lat', customerLocation.lat);
      }

      // Hits your executeTrustSearch / getProducts pipeline
      const response = await axios.get(`/api/products/search?${queryParams.toString()}`);
      
      if (response.data?.success) {
        setProducts(response.data.data || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Error loading marketplace products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search execution when coordinates are obtained or if tracking is denied
  useEffect(() => {
    if (locationStatus !== 'initializing') {
      handleFetchMarketplaceItems(1);
    }
  }, [customerLocation, locationStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFetchMarketplaceItems(1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Marketplace Banner Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0f2a29] md:text-4xl">
              Next<span className="text-[#c4a456]">Cart</span> Marketplace
            </h1>
            <p className="text-sm text-slate-500 mt-1">Discover premium items dispatched from fulfillment centers nearest to you.</p>
          </div>

          {/* Location Status Badge indicators */}
          <div className="flex items-center">
            {locationStatus === 'active' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm animate-in fade-in duration-300">
                <MapPin size={14} className="text-emerald-500" /> Nearby Matching Enabled
              </span>
            )}
            {locationStatus === 'denied' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
                <AlertCircle size={14} className="text-amber-500" /> Showing Standard Listings
              </span>
            )}
            {locationStatus === 'initializing' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">
                <Loader size={14} className="animate-spin text-slate-400" /> Pinpoint Location...
              </span>
            )}
          </div>
        </div>

        {/* Complete Inline Search Bar Assembly */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mb-10 group">
          <div className="relative flex items-center bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm transition-all focus-within:border-[#c4a456] focus-within:shadow-md focus-within:shadow-[#c4a456]/5">
            <Search className="absolute left-5 text-slate-300 group-focus-within:text-[#c4a456] transition-colors" size={20} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for items, categories, or brands..."
              className="w-full bg-transparent pl-12 pr-4 py-3 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400"
            />
            <button 
              type="submit"
              className="bg-[#0f2a29] hover:bg-[#c4a456] text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              Search
            </button>
          </div>
        </form>

        {/* Dynamic Catalog Render Frame Container */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader className="animate-spin text-[#c4a456]" size={36} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimizing nearest route grids...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-lg text-slate-700">No matching items found</h3>
            <p className="text-sm text-slate-400 mt-1">We couldn't track items matching that request nearby. Try searching alternative keywords.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div 
                  key={product._id} 
                  className="group bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300 flex flex-col relative overflow-hidden"
                >
                  {/* Aspect Ratio Cropped Image Frame */}
                  <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-4 relative">
                    <img 
                      src={product.image || '/placeholder-product.png'} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Core Information Details Block */}
                  <div className="flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 tracking-wide text-base group-hover:text-[#c4a456] transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                      {product.description}
                    </p>

                    {/* Bottom Row Layout: Price and Location Badge */}
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-300">Price</span>
                        <span className="font-black text-[#0f2a29] text-base">{product.price} <span className="text-xs font-medium">ETB</span></span>
                      </div>
                      
                      {locationStatus === 'active' && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-xl border border-emerald-100/40">
                          📍 Nearby Shop
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls Layer Footer */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => handleFetchMarketplaceItems(pagination.page - 1)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-400 px-3">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handleFetchMarketplaceItems(pagination.page + 1)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-xl bg-white text-slate-600 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;
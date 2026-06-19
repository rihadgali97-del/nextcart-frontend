import React, { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { searchProducts } from '../services/api';

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Grab user coordinates instantly on page load
  const { location, error: geoError } = useGeolocation();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await searchProducts({
        q: searchQuery,
        lat: location.lat,
        lng: location.lng,
      });
      
      // ✅ Ensure the response data is always an array
      let productsArray = [];
      if (Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If backend returns { products: [...] } or similar, adapt here
        if (Array.isArray(response.data.products)) {
          productsArray = response.data.products;
        } else if (Array.isArray(response.data.data)) {
          productsArray = response.data.data;
        } else {
          console.warn('Unexpected API response format:', response.data);
          setError('Received invalid data from server.');
        }
      } else {
        setError('No products found or server error.');
      }
      
      setProducts(productsArray);
    } catch (err) {
      console.error("Error fetching proximity search results:", err);
      setError(err.response?.data?.message || 'Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
        <input
          type="text"
          placeholder="Search products near you..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#c4a456]"
        />
        <button type="submit" className="bg-[#0f2a29] text-white px-4 py-2 rounded hover:bg-[#1a403e] transition">
          Search
        </button>
      </form>

      {geoError && <p className="text-amber-600 text-sm mb-4">⚠️ Location access denied. Distance sorting not available.</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading matching products...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length === 0 && !error && (
            <p className="text-slate-400 col-span-full text-center py-10">No products found. Try a different search term.</p>
          )}
          {products.map((product) => (
            <div key={product._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
              <p className="text-[#0f2a29] font-bold mt-1">ETB {product.price}</p>
              {product.distance !== undefined && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block mt-2">
                  {(product.distance / 1000).toFixed(1)} km away
                </span>
              )}
              {product.vendorName && (
                <p className="text-xs text-slate-400 mt-2">by {product.vendorName}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;

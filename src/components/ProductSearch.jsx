import React, { useState } from 'react';
import axios from 'axios';
import { useGeolocation } from '../hooks/useGeolocation';

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Grab user coordinates instantly on page load
  const { location, error: geoError } = useGeolocation();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build the URL with query parameters dynamically
      let url = `http://localhost:5000/api/products/search?q=${searchQuery}`;
      
      // If geolocation coordinates exist, append them to the request
      if (location.lat && location.lng) {
        url += `&lat=${location.lat}&lng=${location.lng}`;
      }

      const response = await axios.get(url);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching proximity search results:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
        <input
          type="text"
          placeholder="Search products near you..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </form>

      {/* Render Results */}
      {loading ? <p>Loading matching products...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product._id} className="border p-4 rounded shadow">
              <h3 className="font-bold text-lg">{product.name}</h3>
              <p className="text-gray-600">${product.price}</p>
              {/* If your backend computes distance, render it dynamically */}
              {product.distance !== undefined && (
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded inline-block mt-2">
                  {(product.distance / 1000).toFixed(1)} km away
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
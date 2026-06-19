import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../services/api';
import ProductCard from './ui/ProductCard';
import { Search, MapPin, Layers } from 'lucide-react';

const SkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-40 bg-slate-100 rounded mb-3" />
        <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    ))}
  </div>
);

const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded-md bg-white border text-sm"
      >Prev</button>

      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          className={`px-3 py-1 rounded-md text-sm ${page === i + 1 ? 'bg-[#0f2a29] text-white' : 'bg-white border'}`}
        >{i + 1}</button>
      ))}

      <button
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="px-3 py-1 rounded-md bg-white border text-sm"
      >Next</button>
    </div>
  );
};

const SearchComponent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'product');
  const [query, setQuery] = useState(searchParams.get('type') === 'category' ? searchParams.get('category') || '' : searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lng: null });

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState(12);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (opts = {}) => {
    const { q = query, category: c = category, lat = coords.lat, lng = coords.lng, page: p = page, limit: l = limit, sort: s = sort } = opts;
    const searchKey = searchType === 'category' ? c : q;

    if (!searchKey || !searchKey.trim()) {
      setProducts([]);
      setError('');
      setPages(1);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const resp = await searchProducts({ q: searchType === 'category' ? '' : q, category: searchType === 'category' ? c : '', lat, lng, page: p, limit: l, sort: s });
      const data = resp.data?.data || resp.data || [];
      setProducts(Array.isArray(data) ? data : []);

      const pagination = resp.data?.pagination;
      if (pagination) {
        setPages(pagination.pages || 1);
        setTotal(pagination.total || 0);
      }
    } catch (err) {
      console.error('Search failed', err);
      setError(err.response?.data?.message || 'Search failed.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, coords, page, limit, sort]);

  useEffect(() => {
    const type = searchParams.get('type') || 'product';
    const q = type === 'category' ? searchParams.get('category') || '' : searchParams.get('q') || '';
    const p = parseInt(searchParams.get('page') || '1', 10);
    const s = searchParams.get('sort') || 'relevance';
    setSearchType(type);
    setQuery(q);
    setCategory(searchParams.get('category') || '');
    setPage(p);
    setSort(s);
  }, [searchParams]);

  // Debounced query/filters watcher
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch({ q: query, lat: coords.lat, lng: coords.lng, page, limit, sort });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, coords, page, sort, doSearch, limit]);

  const handleToggleLocation = () => {
    if (useLocation) {
      setUseLocation(false);
      setCoords({ lat: null, lng: null });
      setPage(1);
      return;
    }

    if (!navigator?.geolocation) {
      alert('Geolocation not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude.toString(), lng: pos.coords.longitude.toString() });
        setUseLocation(true);
        setPage(1);
      },
      (err) => {
        console.warn('Geolocation denied or failed', err);
        alert('Unable to access location. You can still search without proximity.');
      },
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPage(1);

    const params = {
      page: '1',
      sort,
      type: searchType,
      ...(searchType === 'category' ? { category: query } : { q: query })
    };

    if (coords.lat && coords.lng) {
      params.lat = coords.lat;
      params.lng = coords.lng;
    }

    setSearchParams(params);

    doSearch({
      q: searchType === 'category' ? '' : query,
      category: searchType === 'category' ? query : '',
      lat: coords.lat,
      lng: coords.lng,
      page: 1,
      limit,
      sort
    });
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-4 relative flex items-center bg-white border border-slate-100 rounded-2xl p-2 shadow-sm">
          <div className="flex items-center gap-3 pl-3 flex-grow">
            <Search className="text-slate-400" size={16} />
            <input
              aria-label="Search products"
              className="w-full bg-transparent outline-none placeholder-slate-400 text-slate-800"
              placeholder={searchType === 'category' ? 'Search categories...' : 'Search products, vendors or categories...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pr-2">
            <select
              aria-label="Search type"
              value={searchType}
              onChange={(e) => {
                const nextType = e.target.value;
                setSearchType(nextType);
                setPage(1);
                setSearchParams({
                  q: nextType === 'category' ? '' : query,
                  category: nextType === 'category' ? query : '',
                  page: '1',
                  sort,
                  type: nextType,
                });
              }}
              className="text-xs bg-transparent outline-none mr-2"
            >
              <option value="product">Product</option>
              <option value="category">Category</option>
              <option value="proximity">Proximity</option>
            </select>

            <button type="button" onClick={handleToggleLocation} title="Toggle proximity search" className={`p-2 rounded-xl transition ${useLocation ? 'bg-[#c4a456]/10 text-[#0f2a29]' : 'text-slate-500 hover:bg-slate-50'}`}>
              <MapPin size={16} />
            </button>

            <button type="submit" className="px-4 py-2 bg-[#0f2a29] text-white rounded-xl text-sm font-bold">Find</button>
          </div>
        </form>

        {useLocation && coords.lat && (
          <div className="text-xs text-slate-500 max-w-2xl mx-auto mb-4">Proximity enabled — showing nearby results.</div>
        )}

        {error && <div className="text-red-600 text-sm max-w-2xl mx-auto mb-4">{error}</div>}

        {loading ? (
          <SkeletonGrid />
        ) : products.length === 0 ? (
          <div className="text-center py-16 max-w-sm mx-auto">
            <Layers size={32} className="text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 mb-0.5">No products found</h4>
            <p className="text-xs text-slate-400">Try broader terms or disable proximity.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>

            <Pagination page={page} pages={pages} onChange={(p) => {
              setPage(p);
              setSearchParams({ q: query, page: String(p), sort });
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }} />
          </>
        )}
      </div>
    </div>
  );
};

export default SearchComponent;

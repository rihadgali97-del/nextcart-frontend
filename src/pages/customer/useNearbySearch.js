import { useState, useEffect, useCallback, useRef } from "react";
import API from "../../services/api";

const NEARBY_LIMIT = 12;

export default function useNearbySearch(section) {
  const [nearbyQuery,      setNearbyQuery]      = useState("");
  const [nearbyCategory,   setNearbyCategory]   = useState("");
  const [nearbyMinPrice,   setNearbyMinPrice]   = useState("");
  const [nearbyMaxPrice,   setNearbyMaxPrice]   = useState("");
  const [nearbyRadius,     setNearbyRadius]     = useState(50);
  const [nearbyPage,       setNearbyPage]       = useState(1);
  const [nearbyProducts,   setNearbyProducts]   = useState([]);
  const [nearbyPagination, setNearbyPagination] = useState({ total:0, pages:1 });
  const [nearbyLoading,    setNearbyLoading]    = useState(false);
  const [nearbyError,      setNearbyError]      = useState("");
  const [nearbyLocation,   setNearbyLocation]   = useState(null);
  const [nearbyLocStatus,  setNearbyLocStatus]  = useState("idle");
  const [nearbyProxInfo,   setNearbyProxInfo]   = useState(null);
  const [nearbyRankMap,    setNearbyRankMap]    = useState({});

  const nearbySearchRef   = useRef(null);
  const nearbyLocationRef = useRef(null);
  const nearbyQueryRef    = useRef("");
  const nearbyCategoryRef = useRef("");
  const nearbyMinPriceRef = useRef("");
  const nearbyMaxPriceRef = useRef("");
  const nearbyRadiusRef   = useRef(50);
  const nearbyPageRef     = useRef(1);

  useEffect(() => { nearbyLocationRef.current  = nearbyLocation;  }, [nearbyLocation]);
  useEffect(() => { nearbyQueryRef.current     = nearbyQuery;     }, [nearbyQuery]);
  useEffect(() => { nearbyCategoryRef.current  = nearbyCategory;  }, [nearbyCategory]);
  useEffect(() => { nearbyMinPriceRef.current  = nearbyMinPrice;  }, [nearbyMinPrice]);
  useEffect(() => { nearbyMaxPriceRef.current  = nearbyMaxPrice;  }, [nearbyMaxPrice]);
  useEffect(() => { nearbyRadiusRef.current    = nearbyRadius;    }, [nearbyRadius]);
  useEffect(() => { nearbyPageRef.current      = nearbyPage;      }, [nearbyPage]);

  // Stable search function — reads from refs, never re-created
  const runNearbySearch = useCallback(async () => {
    const loc = nearbyLocationRef.current;
    if (!loc?.lng || !loc?.lat) return;
    setNearbyLoading(true);
    setNearbyError("");
    try {
      const params = {
        q:        nearbyQueryRef.current    || undefined,
        category: nearbyCategoryRef.current || undefined,
        minPrice: nearbyMinPriceRef.current || undefined,
        maxPrice: nearbyMaxPriceRef.current || undefined,
        radius:   nearbyRadiusRef.current,
        page:     nearbyPageRef.current,
        limit:    NEARBY_LIMIT,
        lng:      loc.lng,
        lat:      loc.lat,
        _t:       Date.now(),
      };
      Object.keys(params).forEach(k => {
        if (params[k]===""||params[k]===null||params[k]===undefined) delete params[k];
      });
      const { data } = await API.get("/search", {
        params,
        headers: { "Cache-Control":"no-cache" },
      });
      const products   = data?.data || data?.products || (Array.isArray(data)?data:[]);
      const pagination = data?.pagination || { total:products.length, pages:1 };
      setNearbyProducts(products);
      setNearbyPagination(pagination);
      setNearbyProxInfo(data?.proximity || null);
      if (products.length > 0) {
        const map={};
        products.forEach((p,i)=>{ map[p._id]=i; });
        setNearbyRankMap(map);
      } else setNearbyRankMap({});
    } catch(err) {
      setNearbyError(err.response?.data?.message || "Search failed");
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  // Auto-search on filter/location change
  useEffect(() => {
    if (section !== "nearby") return;
    if (!nearbyLocation) return;
    clearTimeout(nearbySearchRef.current);
    nearbySearchRef.current = setTimeout(() => runNearbySearch(), 400);
    return () => clearTimeout(nearbySearchRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyQuery, nearbyCategory, nearbyMinPrice, nearbyMaxPrice, nearbyRadius, nearbyPage, nearbyLocation, section]);

  const requestNearbyLocation = () => {
    if (!navigator.geolocation) { setNearbyLocStatus("denied"); return; }
    setNearbyLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lng:pos.coords.longitude, lat:pos.coords.latitude };
        nearbyLocationRef.current = coords;
        nearbyPageRef.current = 1;
        setNearbyLocStatus("granted");
        setNearbyLocation(coords);
        try { await API.put("/search/location", coords); } catch {}
      },
      () => setNearbyLocStatus("denied")
    );
  };

  const clearNearbyLocation = () => {
    setNearbyLocation(null);
    setNearbyLocStatus("idle");
    setNearbyProducts([]);
  };

  return {
    // State
    nearbyQuery, setNearbyQuery,
    nearbyCategory, setNearbyCategory,
    nearbyMinPrice, setNearbyMinPrice,
    nearbyMaxPrice, setNearbyMaxPrice,
    nearbyRadius, setNearbyRadius,
    nearbyPage, setNearbyPage,
    nearbyProducts, nearbyPagination,
    nearbyLoading, nearbyError,
    nearbyLocation, nearbyLocStatus,
    nearbyProxInfo, nearbyRankMap,
    NEARBY_LIMIT,
    // Actions
    runNearbySearch, requestNearbyLocation, clearNearbyLocation,
  };
}
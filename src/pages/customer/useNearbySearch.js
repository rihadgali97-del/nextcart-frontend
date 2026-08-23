import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import API from "../../services/api";
import { NEARBY_LIMIT } from "./constants";

export default function useNearbySearch(section) {
	const [nearbyQuery, setNearbyQuery] = useState("");
	const [nearbyCategory, setNearbyCategory] = useState("");
	const [nearbyMinPrice, setNearbyMinPrice] = useState("");
	const [nearbyMaxPrice, setNearbyMaxPrice] = useState("");
	const [nearbyRadius, setNearbyRadius] = useState(50);
	const [nearbyPage, setNearbyPage] = useState(1);
	const [nearbyProducts, setNearbyProducts] = useState([]);
	const [nearbyPagination, setNearbyPagination] = useState({ total:0,pages:1 });
	const [nearbyLoading, setNearbyLoading] = useState(false);
	const [nearbyError, setNearbyError] = useState("");
	const [nearbyLocation, setNearbyLocation] = useState(null);
	const [nearbyLocStatus, setNearbyLocStatus] = useState("idle");
	const [nearbyProxInfo, setNearbyProxInfo] = useState(null);
	const [nearbyRankMap, setNearbyRankMap] = useState({});
	const nearbySearchRef = useRef(null);
	const nearbyLocationRef = useRef(null);
	const nearbyQueryRef = useRef("");
	const nearbyCategoryRef = useRef("");
	const nearbyMinPriceRef = useRef("");
	const nearbyMaxPriceRef = useRef("");
	const nearbyRadiusRef = useRef(50);
	const nearbyPageRef = useRef(1);

	useEffect(() => { nearbyLocationRef.current = nearbyLocation; }, [nearbyLocation]);
	useEffect(() => { nearbyQueryRef.current = nearbyQuery; }, [nearbyQuery]);
	useEffect(() => { nearbyCategoryRef.current = nearbyCategory; }, [nearbyCategory]);
	useEffect(() => { nearbyMinPriceRef.current = nearbyMinPrice; }, [nearbyMinPrice]);
	useEffect(() => { nearbyMaxPriceRef.current = nearbyMaxPrice; }, [nearbyMaxPrice]);
	useEffect(() => { nearbyRadiusRef.current = nearbyRadius; }, [nearbyRadius]);
	useEffect(() => { nearbyPageRef.current = nearbyPage; }, [nearbyPage]);

	const runNearbySearch = useCallback(async () => {
		const location = nearbyLocationRef.current;
		if (!location?.lng || !location?.lat) return;
		setNearbyLoading(true);
		setNearbyError("");
		try {
			const params = { q:nearbyQueryRef.current||undefined, category:nearbyCategoryRef.current||undefined, minPrice:nearbyMinPriceRef.current||undefined, maxPrice:nearbyMaxPriceRef.current||undefined, radius:nearbyRadiusRef.current, page:nearbyPageRef.current, limit:NEARBY_LIMIT, lng:location.lng, lat:location.lat, _t:Date.now() };
			Object.keys(params).forEach(key => { if (params[key] === "" || params[key] === null || params[key] === undefined) delete params[key]; });
			const { data } = await API.get("/search", { params, headers:{ "Cache-Control":"no-cache", Pragma:"no-cache" } });
			const products = data?.data || data?.products || (Array.isArray(data) ? data : []);
			setNearbyProducts(products);
			setNearbyPagination(data?.pagination || { total:products.length, pages:1 });
			setNearbyProxInfo(data?.proximity || null);
			const rankMap = {};
			products.forEach((product, index) => { rankMap[product._id] = index; });
			setNearbyRankMap(rankMap);
		} catch (error) {
			setNearbyError(error.response?.data?.message || "Search failed");
		} finally {
			setNearbyLoading(false);
		}
	}, []);

	useEffect(() => {
		if (section !== "nearby" || !nearbyLocation) return;
		clearTimeout(nearbySearchRef.current);
		nearbySearchRef.current = setTimeout(runNearbySearch, 400);
		return () => clearTimeout(nearbySearchRef.current);
	}, [nearbyQuery, nearbyCategory, nearbyMinPrice, nearbyMaxPrice, nearbyRadius, nearbyPage, nearbyLocation, section, runNearbySearch]);

	const requestNearbyLocation = () => {
		if (!navigator.geolocation) { setNearbyLocStatus("denied"); return; }
		setNearbyLocStatus("requesting");
		navigator.geolocation.getCurrentPosition(
			async position => {
				const coordinates = { lng:position.coords.longitude, lat:position.coords.latitude };
				nearbyLocationRef.current = coordinates;
				nearbyPageRef.current = 1;
				setNearbyLocStatus("granted");
				setNearbyLocation(coordinates);
				try { await API.put("/search/location", coordinates); } catch {}
			},
			() => setNearbyLocStatus("denied")
		);
	};

	return { nearbyQuery, setNearbyQuery, nearbyCategory, setNearbyCategory, nearbyMinPrice, setNearbyMinPrice, nearbyMaxPrice, setNearbyMaxPrice, nearbyRadius, setNearbyRadius, nearbyPage, setNearbyPage, nearbyProducts, nearbyPagination, nearbyLoading, nearbyError, nearbyLocation, setNearbyLocation, nearbyLocStatus, setNearbyLocStatus, nearbyProxInfo, nearbyRankMap, nearbySearchRef, requestNearbyLocation };
}

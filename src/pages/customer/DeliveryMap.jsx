import React from "react";
import { useEffect, useRef, useState } from "react";
import API from "../../services/api";

// ─── Leaflet CSS (injected once) ───────────────────────────────────────────────
const injectLeafletCSS = () => {
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id   = "leaflet-css";
  link.rel  = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
};

// ─── Design tokens (matches dashboard) ────────────────────────────────────────
const C = {
  sidebar: "#0E2A23", gold: "#C6A84B", green: "#1D9E75",
  red: "#D85A30", blue: "#185FA5", muted: "#7a8c7e",
  border: "#e8ede9", card: "#fff", text: "#1a2b1f",
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_INFO = {
  pending:    { color:"#854F0B", bg:"#faeeda", icon:"⏳", label:"Order Pending"    },
  processing: { color:"#185FA5", bg:"#e6f1fb", icon:"⚙️", label:"Being Prepared"   },
  shipped:    { color:"#0c5a9e", bg:"#edf6ff", icon:"🚚", label:"Out for Delivery" },
  delivered:  { color:"#3B6D11", bg:"#eaf3de", icon:"✅", label:"Delivered"         },
  cancelled:  { color:"#A32D2D", bg:"#fcebeb", icon:"✕",  label:"Cancelled"         },
};

// ─── Geocode city name → lat/lng via Nominatim (free, no key) ─────────────────
const geocode = async (query) => {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function DeliveryMap({ order, onClose }) {
  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markersRef   = useRef([]);
  const routeRef     = useRef(null);
  const driverRef    = useRef(null);
  const intervalRef  = useRef(null);

  const [status,       setStatus]       = useState("loading"); // loading|ready|error
  const [vendorCoords, setVendorCoords] = useState(null);
  const [customerCoords,setCustomerCoords]=useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  const [eta,          setEta]          = useState(null);
  const [distance,     setDistance]     = useState(null);
  const [lastUpdate,   setLastUpdate]   = useState(null);

  const orderStatus = order?.status?.toLowerCase() || "pending";
  const si          = STATUS_INFO[orderStatus] || STATUS_INFO.pending;

  // ── Step 1: inject CSS + load Leaflet ────────────────────────────────────────
  useEffect(() => {
    injectLeafletCSS();
    init();
    return () => {
      clearInterval(intervalRef.current);
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, [order?._id]);

  // ── Step 2: resolve coordinates then build map ────────────────────────────────
  const init = async () => {
    setStatus("loading");
    try {
      // Vendor coords from Vendor.location (already seeded)
      let vCoords = null;
      if (order?.vendor?.location?.coordinates) {
        const [lng, lat] = order.vendor.location.coordinates;
        if (lng !== 0 && lat !== 0) vCoords = { lat, lng };
      }
      // Fallback: geocode vendor city
      if (!vCoords && order?.vendor?.city) vCoords = await geocode(order.vendor.city + ", Ethiopia");
      if (!vCoords) vCoords = await geocode("Jimma, Ethiopia"); // last resort

      // Customer coords from User.location or geocode shippingAddress
      let cCoords = null;
      if (order?.userLocation?.coordinates) {
        const [lng, lat] = order.userLocation.coordinates;
        if (lng !== 0 && lat !== 0) cCoords = { lat, lng };
      }
      if (!cCoords && order?.shippingAddress?.city) {
        cCoords = await geocode(
          `${order.shippingAddress.address || ""} ${order.shippingAddress.city}, Ethiopia`
        );
      }
      if (!cCoords && vCoords) {
        // Fallback: put customer ~5km from vendor
        cCoords = { lat: vCoords.lat + 0.04, lng: vCoords.lng + 0.03 };
      }

      setVendorCoords(vCoords);
      setCustomerCoords(cCoords);

      // Driver starts at vendor for "shipped" orders
      const dCoords = orderStatus === "shipped" || orderStatus === "processing"
        ? { lat: vCoords.lat + 0.005, lng: vCoords.lng + 0.005 }
        : null;
      setDriverCoords(dCoords);

      // Calculate straight-line distance
      if (vCoords && cCoords) {
        const R    = 6371;
        const dLat = (cCoords.lat - vCoords.lat) * Math.PI / 180;
        const dLng = (cCoords.lng - vCoords.lng) * Math.PI / 180;
        const a    = Math.sin(dLat/2)**2 +
                     Math.cos(vCoords.lat*Math.PI/180) *
                     Math.cos(cCoords.lat*Math.PI/180) *
                     Math.sin(dLng/2)**2;
        const km   = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        setDistance(km.toFixed(1));
        setEta(Math.round(km / 40 * 60)); // assume 40km/h avg
      }

      setStatus("ready");
      buildMap(vCoords, cCoords, dCoords);

      // Simulate live driver movement for shipped orders
      if (orderStatus === "shipped" && dCoords && cCoords) {
        simulateDriver(dCoords, cCoords);
      }

      // Poll real driver position from backend every 15s
      if (orderStatus === "shipped") {
        intervalRef.current = setInterval(() => pollDriverLocation(), 15000);
      }

    } catch (err) {
      console.error("Map init error:", err);
      setStatus("error");
    }
  };

  // ── Step 3: build Leaflet map ─────────────────────────────────────────────────
  const buildMap = async (vCoords, cCoords, dCoords) => {
    if (!mapRef.current || !vCoords) return;

    // Dynamically import Leaflet
    const L = await import("leaflet");

    // Fix default marker icon (Leaflet + bundlers issue)
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Center map between vendor and customer
    const center = cCoords
      ? { lat:(vCoords.lat+cCoords.lat)/2, lng:(vCoords.lng+cCoords.lng)/2 }
      : vCoords;

    // Init map
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapInstance.current = map;

    // Tile layer (OpenStreetMap — free, no API key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon factory
    const makeIcon = (emoji, bg) => L.divIcon({
      html: `<div style="background:${bg};width:36px;height:36px;border-radius:50%;
             display:flex;align-items:center;justify-content:center;font-size:18px;
             border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);">${emoji}</div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 18],
      className:  "",
    });

    // Vendor pin 🏪
    const vendorMarker = L.marker([vCoords.lat, vCoords.lng], { icon: makeIcon("🏪", C.sidebar) })
      .addTo(map)
      .bindPopup(`<b>📦 Vendor / Pickup Point</b><br/>${order?.vendor?.businessName || "Vendor"}`);
    markersRef.current.push(vendorMarker);

    // Customer pin 📍
    if (cCoords) {
      const customerMarker = L.marker([cCoords.lat, cCoords.lng], { icon: makeIcon("🏠", C.green) })
        .addTo(map)
        .bindPopup(`<b>🏠 Delivery Address</b><br/>
          ${order?.shippingAddress?.address || ""}<br/>
          ${order?.shippingAddress?.city || ""}`);
      markersRef.current.push(customerMarker);

      // Route line
      const route = L.polyline(
        [[vCoords.lat, vCoords.lng], [cCoords.lat, cCoords.lng]],
        { color: C.gold, weight: 3, dashArray: "8 6", opacity: 0.8 }
      ).addTo(map);
      routeRef.current = route;

      // Fit map to show both pins
      map.fitBounds([[vCoords.lat, vCoords.lng], [cCoords.lat, cCoords.lng]], { padding: [40, 40] });
    } else {
      map.setView([vCoords.lat, vCoords.lng], 13);
    }

    // Driver pin 🚚 (only for shipped)
    if (dCoords && (orderStatus === "shipped" || orderStatus === "processing")) {
      const driver = L.marker([dCoords.lat, dCoords.lng], { icon: makeIcon("🚚", C.blue) })
        .addTo(map)
        .bindPopup("<b>🚚 Driver</b><br/>On the way to you!");
      driverRef.current = driver;
      markersRef.current.push(driver);
    }
  };

  // ── Simulate driver moving toward customer ────────────────────────────────────
  const simulateDriver = (start, end) => {
    let step = 0;
    const steps = 20;
    const latStep = (end.lat - start.lat) / steps;
    const lngStep = (end.lng - start.lng) / steps;

    const move = setInterval(async () => {
      step++;
      if (step >= steps || !driverRef.current) { clearInterval(move); return; }
      const newLat = start.lat + latStep * step;
      const newLng = start.lng + lngStep * step;
      driverRef.current.setLatLng([newLat, newLng]);
      setLastUpdate(new Date().toLocaleTimeString());

      // Update ETA as driver gets closer
      const remaining = steps - step;
      setEta(Math.round((remaining / steps) * (distance / 40 * 60)));
    }, 3000); // move every 3 seconds

    // Clean up on unmount
    intervalRef.current = move;
  };

  // ── Poll real driver location from backend ─────────────────────────────────
  const pollDriverLocation = async () => {
    try {
      const { data } = await API.get(`/orders/${order._id}/driver-location`);
      if (data?.lat && data?.lng && driverRef.current) {
        driverRef.current.setLatLng([data.lat, data.lng]);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch { /* silent — simulation handles fallback */ }
  };

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0,
      background:C.card, borderRadius:14, overflow:"hidden",
      border:`1px solid ${C.border}`, boxShadow:"0 4px 24px rgba(0,0,0,.08)" }}>

      {/* Header */}
      <div style={{ background:C.sidebar, padding:"16px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:22 }}>{si.icon}</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff" }}>
              Live Delivery Tracking
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>
              Order #{order?._id?.toString().slice(-8).toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ background:si.bg, color:si.color, padding:"4px 12px",
            borderRadius:20, fontSize:11, fontWeight:700 }}>
            {si.label}
          </span>
          {onClose && (
            <button onClick={onClose}
              style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff",
                width:28, height:28, borderRadius:"50%", cursor:"pointer",
                fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {status === "ready" && (
        <div style={{ display:"flex", alignItems:"center", gap:0,
          borderBottom:`1px solid ${C.border}`, background:"#f9fafb" }}>
          {[
            { icon:"📍", label:"Distance",    value: distance ? `${distance} km` : "—" },
            { icon:"⏱",  label:"Est. Arrival",value: eta ? `~${eta} min` : "—" },
            { icon:"🚚", label:"Status",       value: si.label },
            { icon:"🕐", label:"Last Update",  value: lastUpdate || "Just now" },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, padding:"10px 16px",
              borderRight: i < 3 ? `1px solid ${C.border}` : "none",
              textAlign:"center" }}>
              <div style={{ fontSize:16, marginBottom:2 }}>{s.icon}</div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:500,
                textTransform:"uppercase", letterSpacing:".06em" }}>{s.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text,
                marginTop:2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Map container */}
      <div style={{ position:"relative" }}>
        {status === "loading" && (
          <div style={{ position:"absolute", inset:0, display:"flex",
            flexDirection:"column", alignItems:"center", justifyContent:"center",
            background:"#f3f5f1", zIndex:10, gap:12 }}>
            <div style={{ width:36, height:36, border:`3px solid ${C.border}`,
              borderTopColor:C.green, borderRadius:"50%",
              animation:"spin .8s linear infinite" }}/>
            <div style={{ fontSize:13, color:C.muted }}>Loading map…</div>
          </div>
        )}
        {status === "error" && (
          <div style={{ height:300, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:10,
            background:"#fafbfa" }}>
            <div style={{ fontSize:40 }}>🗺️</div>
            <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Map unavailable</div>
            <div style={{ fontSize:12, color:C.muted }}>Check your internet connection</div>
          </div>
        )}
        <div ref={mapRef} style={{ height:380, width:"100%",
          visibility: status === "ready" ? "visible" : "hidden" }}/>
      </div>

      {/* Delivery steps */}
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted,
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
          Delivery Progress
        </div>
        <div style={{ display:"flex", alignItems:"center" }}>
          {["pending","processing","shipped","delivered"].map((s,i,arr) => {
            const done    = ["pending","processing","shipped","delivered"]
              .indexOf(orderStatus) >= i;
            const current = orderStatus === s;
            const icons   = ["⏳","⚙️","🚚","✅"];
            return (
              <div key={s} style={{ display:"flex", alignItems:"center",
                flex: i < arr.length-1 ? 1 : "none" }}>
                <div style={{ display:"flex", flexDirection:"column",
                  alignItems:"center", gap:4 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%",
                    background: done ? C.green : "#e8ede9",
                    color: done ? "#fff" : "#aaa",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:14, fontWeight:700, border:`2px solid ${done?C.green:"#e8ede9"}`,
                    transition:"all .3s",
                    boxShadow: current ? `0 0 0 4px ${C.green}30` : "none" }}>
                    {icons[i]}
                  </div>
                  <span style={{ fontSize:9, color: done ? C.green : C.muted,
                    textTransform:"capitalize", fontWeight: current ? 700 : 400,
                    whiteSpace:"nowrap" }}>{s}</span>
                </div>
                {i < arr.length-1 && (
                  <div style={{ flex:1, height:2, margin:"0 4px", marginBottom:16,
                    background: done ? C.green : "#e8ede9",
                    transition:"background .3s" }}/>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery address */}
      {order?.shippingAddress && (
        <div style={{ padding:"12px 20px 16px", borderTop:`1px solid ${C.border}`,
          background:"#f9fafb", display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div style={{ fontSize:12, color:C.muted }}>
            <span style={{ fontWeight:600, color:C.text }}>📦 Delivering to: </span>
            {order.shippingAddress.address}, {order.shippingAddress.city},
            {" "}{order.shippingAddress.country}
          </div>
          {orderStatus === "shipped" && (
            <div style={{ display:"flex", alignItems:"center", gap:6,
              fontSize:11, color:C.green, fontWeight:700 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background:C.green, animation:"pulse 2s infinite" }}/>
              LIVE
            </div>
          )}
        </div>
      )}
    </div>
  );
}
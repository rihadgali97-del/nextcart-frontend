// ─── VendorDeliveryMap.jsx ────────────────────────────────────────────────────
// Shows vendor → customer route from the VENDOR's perspective
// Vendor sees: their shop pin, customer's exact delivery address pin, route line
// Usage: <VendorDeliveryMap order={selectedOrder} onClose={()=>...} />
import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, X, Clock, Package } from "lucide-react";

const C = { dark:"#0f2a29", gold:"#c4a456", light:"#f8fafb", border:"#e8ede9", muted:"#7a8c7e" };

const STATUS_STYLE = {
  pending:    { bg:"#fef3c7", color:"#92400e" },
  processing: { bg:"#dbeafe", color:"#1e40af" },
  shipped:    { bg:"#d1fae5", color:"#065f46" },
  delivered:  { bg:"#dcfce7", color:"#14532d" },
  cancelled:  { bg:"#fee2e2", color:"#991b1b" },
};

// ─── Inject Leaflet CSS once ───────────────────────────────────────────────────
const injectCSS = () => {
  if (document.getElementById("leaflet-css")) return;
  const l = document.createElement("link");
  l.id = "leaflet-css"; l.rel = "stylesheet";
  l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(l);
};

// ─── Geocode via Nominatim (free) ─────────────────────────────────────────────
const geocode = async (q) => {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers:{ "Accept-Language":"en" } }
    );
    const d = await r.json();
    if (d.length) return { lat:parseFloat(d[0].lat), lng:parseFloat(d[0].lon) };
  } catch {}
  return null;
};

// ─── Haversine distance ────────────────────────────────────────────────────────
const haversine = (a, b) => {
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))).toFixed(1);
};

export default function VendorDeliveryMap({ order, vendorLocation, onClose }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const [status,    setStatus]   = useState("loading");
  const [distance,  setDistance] = useState(null);
  const [eta,       setEta]      = useState(null);
  const [coords,    setCoords]   = useState({ vendor:null, customer:null });

  const ss = STATUS_STYLE[order?.status?.toLowerCase()] || STATUS_STYLE.pending;

  useEffect(() => {
    injectCSS();
    initMap();
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [order?._id]);

  const initMap = async () => {
    setStatus("loading");
    try {
      // ── Resolve VENDOR coordinates ───────────────────────────────────────────
      let vCoords = null;
      // 1. From vendorLocation prop (passed from parent)
      if (vendorLocation?.coordinates) {
        const [lng, lat] = vendorLocation.coordinates;
        if (lng !== 0 && lat !== 0) vCoords = { lat, lng };
      }
      // 2. Geocode vendor city from order items
      if (!vCoords && order?.orderItems?.[0]?.vendor?.city)
        vCoords = await geocode(order.orderItems[0].vendor.city + ", Ethiopia");
      // 3. Fallback to Jimma
      if (!vCoords) vCoords = await geocode("Jimma, Ethiopia");

      // ── Resolve CUSTOMER coordinates ─────────────────────────────────────────
      let cCoords = null;
      // 1. From order.userLocation (saved GPS)
      if (order?.userLocation?.coordinates) {
        const [lng, lat] = order.userLocation.coordinates;
        if (lng !== 0 && lat !== 0) cCoords = { lat, lng };
      }
      // 2. Geocode from shipping address
      if (!cCoords && order?.shippingAddress?.city)
        cCoords = await geocode(
          `${order.shippingAddress.address || ""} ${order.shippingAddress.city} Ethiopia`
        );
      // 3. Offset from vendor as last resort
      if (!cCoords && vCoords)
        cCoords = { lat: vCoords.lat + 0.035, lng: vCoords.lng + 0.028 };

      setCoords({ vendor:vCoords, customer:cCoords });

      if (vCoords && cCoords) {
        const d = haversine(vCoords, cCoords);
        setDistance(d);
        setEta(Math.round(d / 35 * 60)); // 35km/h average delivery speed
      }

      setStatus("ready");
      buildLeafletMap(vCoords, cCoords);
    } catch {
      setStatus("error");
    }
  };

  const buildLeafletMap = async (vCoords, cCoords) => {
    if (!mapRef.current || !vCoords) return;
    const L = await import("leaflet");

    // Fix icon URLs
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const center = cCoords
      ? { lat:(vCoords.lat+cCoords.lat)/2, lng:(vCoords.lng+cCoords.lng)/2 }
      : vCoords;

    const map = L.map(mapRef.current, { zoomControl:true, scrollWheelZoom:true });
    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:"© OpenStreetMap contributors", maxZoom:19,
    }).addTo(map);

    // Custom emoji marker
    const emojiIcon = (emoji, bg) => L.divIcon({
      html:`<div style="background:${bg};width:40px;height:40px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;font-size:20px;
            border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.25);">${emoji}</div>`,
      iconSize:[40,40], iconAnchor:[20,20], className:"",
    });

    // 🏪 Vendor pin (YOUR location)
    L.marker([vCoords.lat, vCoords.lng], { icon:emojiIcon("🏪", C.dark) })
      .addTo(map)
      .bindPopup(`<b>🏪 Your Shop</b><br/>Starting point`)
      .openPopup();

    // 🏠 Customer pin (DELIVERY destination)
    if (cCoords) {
      L.marker([cCoords.lat, cCoords.lng], { icon:emojiIcon("🏠","#1D9E75") })
        .addTo(map)
        .bindPopup(`
          <b>📦 Deliver Here</b><br/>
          <b>${order?.user?.name || "Customer"}</b><br/>
          ${order?.shippingAddress?.address || ""}<br/>
          ${order?.shippingAddress?.city || ""}
        `);

      // Dashed route line
      L.polyline(
        [[vCoords.lat,vCoords.lng],[cCoords.lat,cCoords.lng]],
        { color:C.gold, weight:4, dashArray:"10 8", opacity:.9 }
      ).addTo(map);

      // Direction arrow midpoint
      const mid = { lat:(vCoords.lat+cCoords.lat)/2, lng:(vCoords.lng+cCoords.lng)/2 };
      L.marker([mid.lat, mid.lng], { icon: L.divIcon({
        html:`<div style="background:#fff;border:2px solid ${C.gold};border-radius:50%;
              width:28px;height:28px;display:flex;align-items:center;
              justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.15);">➤</div>`,
        iconSize:[28,28], iconAnchor:[14,14], className:"",
      })}).addTo(map);

      map.fitBounds([[vCoords.lat,vCoords.lng],[cCoords.lat,cCoords.lng]],{ padding:[50,50] });
    } else {
      map.setView([vCoords.lat,vCoords.lng], 13);
    }
  };

  // Open in Google Maps / OSM navigation
  const openNavigation = () => {
    const { customer } = coords;
    if (!customer) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[2rem] shadow-2xl bg-white flex flex-col"
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100"
          style={{ background:C.dark }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background:"rgba(255,255,255,.1)" }}>
              <Navigation size={20} style={{ color:C.gold }}/>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Customer Delivery Location</h2>
              <p className="text-xs mt-0.5" style={{ color:"rgba(255,255,255,.45)" }}>
                Order #{order?._id?.slice(-8).toUpperCase()} ·{" "}
                <span style={{ background:ss.bg, color:ss.color }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                  {order?.status}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <X size={20}/>
          </button>
        </div>

        {/* Stats bar */}
        {status === "ready" && (
          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/50">
            {[
              { icon:<MapPin size={15}/>,    label:"Distance",    value: distance ? `${distance} km`  : "—" },
              { icon:<Clock size={15}/>,     label:"Est. Drive",  value: eta      ? `~${eta} min`     : "—" },
              { icon:<Package size={15}/>,   label:"Customer",    value: order?.user?.name || "—" },
              { icon:<Navigation size={15}/>,label:"Address",     value: order?.shippingAddress?.city || "—" },
            ].map((s,i)=>(
              <div key={i} className={`p-4 text-center ${i<3?"border-r border-slate-100":""}`}>
                <div className="flex justify-center mb-1" style={{ color:C.gold }}>{s.icon}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</div>
                <div className="text-xs font-black truncate" style={{ color:C.dark }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        <div className="relative flex-1" style={{ minHeight:340 }}>
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 z-10">
              <div className="w-9 h-9 border-4 rounded-full animate-spin"
                style={{ borderColor:`${C.gold}30`, borderTopColor:C.gold }}/>
              <p className="text-sm font-bold text-slate-400">Locating customer…</p>
            </div>
          )}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50">
              <div className="text-4xl">🗺️</div>
              <p className="text-sm font-bold text-slate-500">Map unavailable</p>
              <p className="text-xs text-slate-400">Check your internet connection</p>
            </div>
          )}
          <div ref={mapRef} style={{ height:"100%", width:"100%", minHeight:340,
            visibility: status==="ready" ? "visible" : "hidden" }}/>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex items-center gap-3">
          {/* Delivery address summary */}
          <div className="flex-1 flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <MapPin size={16} style={{ color:C.gold, flexShrink:0, marginTop:2 }}/>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deliver to</p>
              <p className="text-sm font-bold" style={{ color:C.dark }}>
                {order?.shippingAddress?.address || "—"},{" "}
                {order?.shippingAddress?.city || "—"},{" "}
                {order?.shippingAddress?.country || "Ethiopia"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{order?.user?.name}</p>
            </div>
          </div>

          {/* Navigate button */}
          <button onClick={openNavigation} disabled={!coords.customer}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-40"
            style={{ background:C.dark, color:C.gold }}>
            <Navigation size={16}/>
            Navigate
          </button>
        </div>
      </div>
    </div>
  );
}
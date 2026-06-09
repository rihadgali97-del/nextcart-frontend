import React, { useEffect, useState } from 'react';
import { getAllReviews, reportReview } from '../../services/api';
import { Star, MessageSquare, AlertTriangle, User, Loader2, Search, ThumbsUp, Flag, RefreshCw } from 'lucide-react';

const C = { dark:'#0f2a29', gold:'#c4a456', light:'#f8fafb', border:'#e8ede9', muted:'#7a8c7e' };

const StarRow = ({ rating, size=14 }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i=>(
      <Star key={i} size={size} style={{ color:C.gold }}
        fill={i<=rating ? C.gold : 'none'} strokeWidth={i<=rating ? 0 : 1.5}/>
    ))}
  </div>
);

export default function VendorReviews() {
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [ratingFilter,setRatingFilter]= useState(0);
  const [msg,         setMsg]         = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getAllReviews();
      setReviews(res.data?.data || res.data || []);
    } catch { showMsg('error','Failed to load reviews'); }
    finally { setLoading(false); }
  };

  const showMsg = (type,text) => { setMsg({type,text}); setTimeout(()=>setMsg(null),3500); };

  const handleReport = async (id) => {
    if (!window.confirm('Report this review for moderation?')) return;
    try {
      await reportReview(id, 'Potential spam or fake review');
      setReviews(prev => prev.map(r => r._id===id ? {...r,reported:true} : r));
      showMsg('success','Review reported to admin');
    } catch { showMsg('error','Failed to report review'); }
  };

  const filtered = reviews.filter(r => {
    const ms = !searchTerm ||
      r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const mf = ratingFilter===0 || r.rating===ratingFilter;
    return ms && mf;
  });

  // Stats
  const avgRating = reviews.length
    ? (reviews.reduce((a,r)=>a+(r.rating||0),0)/reviews.length).toFixed(1) : '0.0';
  const dist = [5,4,3,2,1].map(s=>({
    star:s,
    count: reviews.filter(r=>r.rating===s).length,
    pct:   reviews.length ? Math.round((reviews.filter(r=>r.rating===s).length/reviews.length)*100) : 0
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:C.light }}>
      <div className="w-10 h-10 border-4 border-[#c4a456] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen" style={{ background:C.light }}>

      {/* Toast */}
      {msg && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300
          ${msg.type==='success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color:C.dark }}>Customer Feedback</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-xs">Reputation Management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
            <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              placeholder="Search reviews…"
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-[#c4a456] shadow-sm w-52 transition-all"/>
          </div>
          <button onClick={fetchReviews}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:border-[#c4a456] transition-all shadow-sm">
            <RefreshCw size={16} className="text-slate-400"/>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Average rating */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-7 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Rating</p>
          <p className="text-6xl font-black mb-2" style={{ color:C.dark }}>{avgRating}</p>
          <StarRow rating={Math.round(Number(avgRating))} size={18}/>
          <p className="text-xs text-slate-400 font-medium mt-2">{reviews.length} total reviews</p>
        </div>

        {/* Rating distribution */}
        <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-7">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Rating Distribution</p>
          <div className="space-y-3">
            {dist.map(d=>(
              <button key={d.star} onClick={()=>setRatingFilter(ratingFilter===d.star?0:d.star)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${ratingFilter===d.star?'bg-amber-50':''}`}>
                <div className="flex items-center gap-1 w-14">
                  <span className="text-sm font-black" style={{ color:C.dark }}>{d.star}</span>
                  <Star size={13} fill={C.gold} style={{ color:C.gold }}/>
                </div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width:`${d.pct}%`, background:d.star>=4?'#22c55e':d.star===3?C.gold:'#ef4444' }}/>
                </div>
                <span className="text-xs font-black w-8 text-right" style={{ color:C.muted }}>{d.count}</span>
              </button>
            ))}
          </div>
          {ratingFilter>0 && (
            <button onClick={()=>setRatingFilter(0)}
              className="mt-3 text-xs font-black text-slate-400 hover:text-[#c4a456] transition-all">
              × Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Review cards */}
      {filtered.length===0 ? (
        <div className="py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-300">
          <MessageSquare size={40} className="mx-auto mb-4 text-slate-200"/>
          <h3 className="text-lg font-bold mb-1" style={{ color:C.dark }}>No reviews found</h3>
          <p className="text-slate-400 text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(review=>(
            <div key={review._id}
              className="bg-white border border-slate-200 rounded-[1.75rem] p-6 shadow-sm hover:shadow-md hover:border-[#c4a456]/40 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-4"
                style={{ background:C.gold, transform:'translate(30%,-30%)' }}/>

              {/* Header */}
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background:`${C.dark}08`, color:C.dark }}>
                    <User size={20}/>
                  </div>
                  <div>
                    <h3 className="font-black text-sm" style={{ color:C.dark }}>
                      {review.user?.name || 'Customer'}
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      {review.product?.name || 'Unknown Product'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarRow rating={review.rating}/>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(review.createdAt).toLocaleDateString('en-US',
                      { month:'short', day:'numeric', year:'numeric' })}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="relative pl-4 mb-5">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background:`${C.gold}50` }}/>
                <p className="text-sm leading-relaxed italic" style={{ color:'#374151' }}>
                  "{review.comment}"
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                  ${review.reported ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {review.reported ? '⚠ Under Review' : '✓ Verified Purchase'}
                </span>
                <button onClick={()=>handleReport(review._id)} disabled={review.reported}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-300
                    hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed">
                  <Flag size={12}/> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
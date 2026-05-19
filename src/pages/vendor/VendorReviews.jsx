import React, { useEffect, useState } from 'react';
import { getAllReviews, reportReview } from '../../services/api';
import { Star, MessageSquare, AlertTriangle, User, Loader2, Search } from 'lucide-react';

const VendorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await getAllReviews();
        setReviews(res.data.data);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleReport = async (id) => {
    if (window.confirm("Report this review for moderation?")) {
      try {
        await reportReview(id, "Potential spam or fake review");
        alert("Review reported to Admin.");
      } catch (err) {
        alert("Failed to report.");
      }
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-[#0f2a29]" size={40} />
    </div>
  );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen text-[#0f2a29]">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f2a29]">Customer Feedback</h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold">Reputation Management</p>
        </div>
        
        {/* Clean Search Bar */}
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 focus-within:border-[#c4a456] transition-colors">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search reviews..." 
            className="bg-transparent border-none outline-none text-sm w-48 text-[#0f2a29]" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.length > 0 ? reviews.map((review) => (
          <div key={review._id} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-md hover:border-[#c4a456]/50 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                {/* Profile Icon with Sidebar-matching Color */}
                <div className="w-12 h-12 bg-[#0f2a29]/5 rounded-xl flex items-center justify-center text-[#0f2a29]">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f2a29]">{review.user?.name || "Customer"}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Product: <span className="text-[#c4a456]">{review.product?.name || "Unknown Item"}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex gap-0.5 text-[#c4a456]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < review.rating ? "#c4a456" : "none"} strokeWidth={i < review.rating ? 0 : 2} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="relative">
              <MessageSquare className="absolute -top-2 -left-2 text-slate-100" size={40} />
              <p className="text-slate-600 leading-relaxed relative z-10 pl-4 text-sm italic">
                "{review.comment}"
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${review.reported ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {review.reported ? 'Under Review' : 'Verified Purchase'}
                </div>
              </div>
              <button 
                onClick={() => handleReport(review._id)}
                className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 hover:text-red-500"
              >
                <AlertTriangle size={14} /> Report Review
              </button>
            </div>
          </div>
        )) : (
          /* Empty State - Cleaned Up */
          <div className="col-span-full py-24 text-center bg-white rounded-[32px] border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={32} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-bold text-[#0f2a29] mb-2">No feedback yet</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto font-medium">When customers review your products, they will appear here for you to manage.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorReviews;
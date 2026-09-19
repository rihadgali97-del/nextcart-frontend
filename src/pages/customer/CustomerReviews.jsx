import React, { useState } from "react";
import API from "../../services/api";
import { C, ITEMS_PER_PAGE } from "./constants";
import { ago } from "./helpers";
import { Panel, Input, Btn, Stars, Empty, Spinner, Pagination } from "./UI";

export default function CustomerReviews({ myReviews, loading, loadMyReviews }) {
  const [reviewForm,   setReviewForm]   = useState({ productId:"", rating:5, comment:"" });
  const [submitting,   setSubmitting]   = useState(false);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewsPage,  setReviewsPage]  = useState(1);

  const handleSubmit = async () => {
    if (!reviewForm.productId) { alert("Enter a product ID"); return; }
    if (!reviewForm.comment.trim()) { alert("Write a comment"); return; }
    setSubmitting(true);
    try {
      await API.post("/reviews", reviewForm);
      setReviewForm({ productId:"", rating:5, comment:"" });
      loadMyReviews();
    } catch(err) { alert(err.response?.data?.message||"Failed to submit"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try { await API.delete(`/reviews/${id}`); loadMyReviews(); }
    catch { alert("Failed to delete review"); }
  };

  const filtered = myReviews.filter(r =>
    !reviewSearch ||
    r.product?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.comment?.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
        {/* Write review */}
        <Panel title="Write a Review" subtitle="Share your experience with a product">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Input label="Product ID" value={reviewForm.productId}
              onChange={v=>setReviewForm(p=>({...p,productId:v}))}
              placeholder="Paste the product ID from your order"/>
            <div>
              <div style={{fontSize:12,fontWeight:500,color:C.text,marginBottom:6}}>Rating</div>
              <Stars rating={reviewForm.rating} size={26} interactive
                onChange={v=>setReviewForm(p=>({...p,rating:v}))}/>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>
                {["","Terrible","Bad","Okay","Good","Excellent"][reviewForm.rating]}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,fontWeight:500,color:C.text}}>Comment</label>
              <textarea value={reviewForm.comment}
                onChange={e=>setReviewForm(p=>({...p,comment:e.target.value}))}
                placeholder="Describe your experience…" rows={4}
                style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,
                  fontSize:13,color:C.text,outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
            </div>
            <Btn onClick={handleSubmit} disabled={submitting}>
              {submitting?"Submitting…":"Submit Review"}
            </Btn>
          </div>
        </Panel>

        {/* Stats */}
        <Panel title="Your Review Stats">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:700,color:C.green}}>{myReviews.length}</div>
              <div style={{fontSize:11,color:C.muted}}>Total Reviews</div>
            </div>
            <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:700,color:C.gold}}>
                {myReviews.length>0?(myReviews.reduce((a,r)=>a+(r.rating||0),0)/myReviews.length).toFixed(1):"—"}
              </div>
              <div style={{fontSize:11,color:C.muted}}>Avg Rating Given</div>
            </div>
          </div>
          {[5,4,3,2,1].map(star=>{
            const count=myReviews.filter(r=>r.rating===star).length;
            const pct=myReviews.length?(count/myReviews.length)*100:0;
            return (
              <div key={star} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:11,color:C.muted,width:12}}>{star}</span>
                <span style={{fontSize:11,color:C.gold}}>★</span>
                <div style={{flex:1,height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:C.gold,borderRadius:3,transition:"width .4s ease"}}/>
                </div>
                <span style={{fontSize:11,color:C.muted,width:16,textAlign:"right"}}>{count}</span>
              </div>
            );
          })}
        </Panel>
      </div>

      {/* My reviews list */}
      <Panel title={`My Reviews (${filtered.length})`}>
        <div style={{position:"relative",marginBottom:14}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13}}>🔍</span>
          <input value={reviewSearch} onChange={e=>{ setReviewSearch(e.target.value); setReviewsPage(1); }}
            placeholder="Search reviews…"
            style={{width:"100%",padding:"8px 10px 8px 30px",border:`1px solid ${C.border}`,
              borderRadius:8,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {loading.reviews
          ?<div style={{textAlign:"center",padding:30}}><Spinner size={22}/></div>
          :filtered.length===0
          ?<Empty icon="⭐" text="No reviews yet"/>
          :(()=>{
            const pi=filtered.slice((reviewsPage-1)*ITEMS_PER_PAGE,reviewsPage*ITEMS_PER_PAGE);
            return (<>
              {pi.map((r,i)=>(
                <div key={r._id} style={{padding:"14px 0",borderBottom:i<pi.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:13}}>{r.product?.name||"Product"}</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0"}}>
                        <Stars rating={r.rating} size={13}/>
                        <span style={{fontSize:11,color:C.muted}}>{ago(r.createdAt)}</span>
                      </div>
                      <p style={{fontSize:12.5,color:C.text,margin:0,lineHeight:1.6}}>{r.comment}</p>
                    </div>
                    <button onClick={()=>handleDelete(r._id)}
                      style={{background:`${C.red}08`,border:`1px solid ${C.red}30`,color:C.red,
                        cursor:"pointer",fontSize:11,fontWeight:600,padding:"4px 8px",borderRadius:6}}>Delete</button>
                  </div>
                </div>
              ))}
              <Pagination page={reviewsPage} totalItems={filtered.length}
                onChange={p=>{ setReviewsPage(p); window.scrollTo(0,0); }}/>
            </>);
          })()
        }
      </Panel>
    </div>
  );
}
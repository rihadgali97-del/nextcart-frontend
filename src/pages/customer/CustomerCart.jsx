import React, { useState } from "react";
import { C } from "./constants";
import { fmt } from "./helpers";
import { Card, Panel, Input, Btn, Spinner } from "./UI";
import CouponInput from "./CouponInput";

export default function CustomerCart({
  cart, cartCount, cartTotal,
  updateCartQty, removeFromCart, clearCartFn,
  handleCheckout, checkingOut,
  setSection,
}) {
  const [shippingForm,    setShippingForm]   = useState({ address:"",city:"",postalCode:"",country:"",paymentMethod:"cash" });
  const [shippingErrors,  setShippingErrors] = useState({});
  const [appliedCoupon,   setAppliedCoupon]  = useState(null);
  const discountedTotal = appliedCoupon ? appliedCoupon.finalAmount : cartTotal;

  const validateShipping = () => {
    const e={};
    if(!shippingForm.address) e.address="Required";
    if(!shippingForm.city)    e.city="Required";
    if(!shippingForm.country) e.country="Required";
    setShippingErrors(e);
    return Object.keys(e).length===0;
  };

  const onCheckout = () => {
    if (!validateShipping()) return;
    handleCheckout(shippingForm, discountedTotal, appliedCoupon);
  };

  if (cart.length===0) return (
    <Card style={{textAlign:"center",padding:"60px 20px"}}>
      <div style={{fontSize:56,marginBottom:12}}>🛒</div>
      <div style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:8}}>Your cart is empty</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Discover products you'll love</div>
      <Btn onClick={()=>setSection("shop")}>Browse Products</Btn>
    </Card>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,alignItems:"start"}}>
        {/* Cart items */}
        <Panel title={`Cart (${cartCount} item${cartCount!==1?"s":""})`} action="Clear all" onAction={clearCartFn}>
          {cart.map((item,i)=>(
            <div key={item.product?._id||i} style={{display:"flex",gap:14,padding:"12px 0",
              borderBottom:i<cart.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{width:60,height:60,borderRadius:10,background:"#e8ede9",overflow:"hidden",
                flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                {item.image||item.product?.image
                  ?<img src={item.image||item.product?.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :"📦"}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:13}}>{item.name||item.product?.name}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>${Number(item.price||0).toFixed(2)} each</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                  <button onClick={()=>updateCartQty(item.product?._id||item.productId,item.quantity-1)}
                    style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>−</button>
                  <span style={{fontSize:13,fontWeight:600,minWidth:24,textAlign:"center"}}>{item.quantity}</span>
                  <button onClick={()=>updateCartQty(item.product?._id||item.productId,item.quantity+1)}
                    style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontWeight:700,fontSize:14}}>+</button>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,color:C.green}}>${(Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</div>
                <button onClick={()=>removeFromCart(item.product?._id||item.productId)}
                  style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,marginTop:6}}>Remove</button>
              </div>
            </div>
          ))}
        </Panel>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Order summary + coupon */}
          <Panel title="Order Summary">
            <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:13}}>
              {cart.map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",color:C.muted}}>
                  <span>{item.name||item.product?.name} ×{item.quantity}</span>
                  <span>${(Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</span>
                </div>
              ))}
              <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:10,
                display:"flex",justifyContent:"space-between",fontWeight:600,fontSize:13}}>
                <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
              </div>
              {appliedCoupon&&(
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#3B6D11",fontWeight:600}}>
                  <span>🏷️ {appliedCoupon.code}</span>
                  <span>−${appliedCoupon.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,
                display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}>
                <span>Total</span><span style={{color:C.green}}>{fmt(discountedTotal)}</span>
              </div>
            </div>
            <div style={{marginTop:14}}>
              <CouponInput
                orderAmount={cartTotal}
                onApply={(coupon,discount,finalAmount)=>setAppliedCoupon({code:coupon.code,discount,finalAmount})}
                onRemove={()=>setAppliedCoupon(null)}
              />
            </div>
          </Panel>

          {/* Shipping + checkout */}
          <Panel title="Shipping Details">
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Input label="Street Address" value={shippingForm.address}
                onChange={v=>setShippingForm(p=>({...p,address:v}))}
                placeholder="123 Main St" error={shippingErrors.address}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Input label="City" value={shippingForm.city}
                  onChange={v=>setShippingForm(p=>({...p,city:v}))}
                  placeholder="Addis Ababa" error={shippingErrors.city}/>
                <Input label="Postal Code" value={shippingForm.postalCode}
                  onChange={v=>setShippingForm(p=>({...p,postalCode:v}))} placeholder="1000"/>
              </div>
              <Input label="Country" value={shippingForm.country}
                onChange={v=>setShippingForm(p=>({...p,country:v}))}
                placeholder="Ethiopia" error={shippingErrors.country}/>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:12,fontWeight:500,color:C.text}}>Payment Method</label>
                <select value={shippingForm.paymentMethod}
                  onChange={e=>setShippingForm(p=>({...p,paymentMethod:e.target.value}))}
                  style={{padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,background:"#fff",color:C.text}}>
                  <option value="cash">Cash on Delivery</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe">CBE Birr</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <Btn onClick={onCheckout} disabled={checkingOut} style={{marginTop:6}}>
                {checkingOut?"Placing Order…":`Place Order · ${fmt(discountedTotal)}`}
              </Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
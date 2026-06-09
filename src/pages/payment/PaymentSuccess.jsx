import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../services/api";

// ─── Design tokens (match the dashboard) ─────────────────────────────────────
const C = {
  sidebar: "#0E2A23",
  gold:    "#C6A84B",
  green:   "#1D9E75",
  red:     "#D85A30",
  bg:      "#F3F5F1",
  card:    "#fff",
  border:  "#e8ede9",
  text:    "#1a2b1f",
  muted:   "#7a8c7e",
};

export default function PaymentSuccess() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [status, setStatus]   = useState("verifying"); // verifying | success | failed
  const [order,  setOrder]    = useState(null);
  const [message,setMessage]  = useState("");

  const orderId = params.get("orderId") || localStorage.getItem("pending_order_id");
  const isMock  = params.get("mock") === "true";
  const method  = localStorage.getItem("pending_payment_method") || "telebirr";

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setMessage("No order ID found. Please check your orders.");
      return;
    }
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    setStatus("verifying");
    try {
      if (isMock) {
        // ── Sandbox / DNS-blocked simulation ────────────────────────────────
        // Mark order as paid via your verify endpoint
        const { data } = await API.put(`/payment/verify/${orderId}`, {
          isPaid: true,
          paidAt: new Date().toISOString(),
          paymentMethod: method,
        });
        setOrder(data.order || data.data || { _id: orderId });
        setStatus("success");
        setMessage("Payment simulation successful! Your order is confirmed.");
      } else {
        // ── Real Telebirr callback — verify with backend ─────────────────────
        // Telebirr sends back outTradeNo (orderId) in the callback
        const { data } = await API.put(`/payment/verify/${orderId}`);
        if (data.success || data.isPaid) {
          setOrder(data.order || data.data || { _id: orderId });
          setStatus("success");
          setMessage("Payment verified! Your order is confirmed.");
        } else {
          setStatus("failed");
          setMessage(data.message || "Payment could not be verified.");
        }
      }
    } catch (err) {
      // If verify endpoint fails, still show success for mock
      if (isMock) {
        setOrder({ _id: orderId });
        setStatus("success");
        setMessage("Order placed! Payment confirmation pending.");
      } else {
        setStatus("failed");
        setMessage(err.response?.data?.message || "Verification failed. Please contact support.");
      }
    } finally {
      // Clean up localStorage
      localStorage.removeItem("pending_order_id");
      localStorage.removeItem("pending_payment_method");
    }
  };

  const goToOrders  = () => navigate("/customer");
  const goToHome    = () => navigate("/customer");
  const tryAgain    = () => navigate("/customer");

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`,
        padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>

        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.sidebar,
            letterSpacing: "-.2px" }}>
            Next<span style={{ color: C.gold }}>Cart</span>
          </div>
        </div>

        {/* Status icon */}
        {status === "verifying" && (
          <>
            <div style={{ width: 72, height: 72, borderRadius: "50%",
              border: `4px solid ${C.border}`, borderTopColor: C.gold,
              margin: "0 auto 24px",
              animation: "spin .8s linear infinite" }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Verifying Payment…
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              Please wait while we confirm your payment with Telebirr.
            </div>
          </>
        )}

        {status === "success" && (
          <>
            {/* Animated checkmark */}
            <div style={{ width: 80, height: 80, borderRadius: "50%",
              background: `${C.green}15`, border: `3px solid ${C.green}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 36,
              animation: "popIn .4s cubic-bezier(.175,.885,.32,1.275)" }}>
              ✅
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              Payment Successful!
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              {message}
            </div>

            {/* Order details card */}
            <div style={{ background: "#f9fafb", borderRadius: 12,
              border: `1px solid ${C.border}`, padding: "16px 20px",
              marginBottom: 28, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
                letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>
                Order Details
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>Order ID</span>
                <span style={{ fontWeight: 600, fontFamily: "monospace", color: C.text }}>
                  #{(order?._id || orderId)?.slice(-8).toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>Payment Method</span>
                <span style={{ fontWeight: 600, color: C.text, textTransform: "capitalize" }}>
                  {method}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>Status</span>
                <span style={{ fontWeight: 700, color: C.green }}>✓ Paid</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.muted }}>Date</span>
                <span style={{ fontWeight: 500, color: C.text }}>
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={goToOrders}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10,
                  background: C.sidebar, color: C.gold, border: "none",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                  letterSpacing: ".03em" }}>
                📦 View My Orders
              </button>
              <button onClick={goToHome}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10,
                  background: "#f3f5f1", color: C.text,
                  border: `1px solid ${C.border}`,
                  fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                🛍 Continue Shopping
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div style={{ width: 80, height: 80, borderRadius: "50%",
              background: `${C.red}12`, border: `3px solid ${C.red}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 36 }}>
              ❌
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              Payment Failed
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              {message}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={tryAgain}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10,
                  background: C.red, color: "#fff", border: "none",
                  fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Try Again
              </button>
              <button onClick={goToOrders}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10,
                  background: "#f3f5f1", color: C.text,
                  border: `1px solid ${C.border}`,
                  fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                View Orders
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
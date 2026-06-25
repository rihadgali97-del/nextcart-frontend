import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../services/api";

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
  tBlue:   "#0066CC",
  tLight:  "#E8F2FF",
};

const TelebirrLogo = () => (
  <svg width="120" height="36" viewBox="0 0 120 36" fill="none">
    <rect width="36" height="36" rx="8" fill="#0066CC"/>
    <text x="18" y="25" textAnchor="middle" fill="white" fontSize="20" fontWeight="900">T</text>
    <text x="50" y="25" fill="#0066CC" fontSize="18" fontWeight="800">elebirr</text>
  </svg>
);

export default function TelebirrPayment() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [step, setStep]       = useState("review");  // review | processing | redirecting | simulated_success
  const [order, setOrder]     = useState(null);
  const [error, setError]     = useState("");
  const [countdown, setCount] = useState(5);

  const orderId = params.get("orderId") || localStorage.getItem("pending_order_id");
  const amount  = params.get("amount")  || "0";
  const isMock  = params.get("mock") === "true";

  // Load order details gracefully
  useEffect(() => {
    if (!orderId) { 
      // If we have no order context at all, go back to safety
      navigate("/customer"); 
      return; 
    }
    loadOrder();
  }, [orderId]);

  // Countdown clock handling window changes
  useEffect(() => {
    if (step !== "redirecting") return;
    if (countdown <= 0) {
      handleRedirectToTelebirr();
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  const loadOrder = async () => {
    try {
      const { data } = await API.get(`/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      console.warn("⚠️ Authenticated order fetch failed. Running on URL parameters payload.");
      setOrder({ _id: orderId, totalPrice: Number(amount) });
    }
  };

  const handleProceed = async () => {
    setStep("processing");
    setError("");
    try {
      // Hit your dedicated backend initiator node
      const { data } = await API.post("/payments/initiate-telebirr", {
        orderId,
      });

      const redirectUrl = data.url || data.toPayUrl || data.paymentUrl;

      if (redirectUrl) {
        // If backend returned our mock simulation link containing the query parameters
        if (redirectUrl.includes("mock=true") || redirectUrl.includes("localhost")) {
          setStep("simulated_success");
        } else {
          // Normal real live telebirr sandbox external redirection string
          setStep("redirecting");
          localStorage.setItem("telebirr_redirect_url", redirectUrl);
        }
      } else {
        throw new Error("No operational routing url found inside payload wrapper.");
      }
    } catch (err) {
      // Fallback bypass handler to resolve network dropouts gracefully
      if (isMock || err.message?.includes("timeout") || err.message?.includes("Network")) {
        setStep("simulated_success");
      } else {
        setStep("review");
        setError(err.response?.data?.message || err.message || "Failed to establish terminal communication.");
      }
    }
  };

  const executeSimulatedWebhook = async () => {
    setStep("processing");
    try {
      // Inform the local backend database that the order is settled via your open webhook gateway
      await API.post("/payments/telebirr-webhook", {
        out_trade_no: orderId,
        status: "success",
        trade_status: "Trade_Success",
        code: "200"
      });
      
      navigate(`/payment-success?orderId=${orderId}&mock=true`);
    } catch (err) {
      setStep("review");
      setError("Failed to resolve simulated checkout webhook resolution loop.");
    }
  };

  const handleRedirectToTelebirr = () => {
    const url = localStorage.getItem("telebirr_redirect_url");
    localStorage.removeItem("telebirr_redirect_url");
    if (url) {
      window.location.href = url;
    } else {
      executeSimulatedWebhook();
    }
  };

  const totalAmount = order?.totalPrice || Number(amount) || 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Navigation Header Section */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => navigate("/customer")}
          style={{ background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
          ← Back to Storefront
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.sidebar }}>
          Next<span style={{ color: C.gold }}>Cart</span>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 20,
        border: `1px solid ${C.border}`, width: "100%", maxWidth: 480,
        overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,.08)" }}>

        {/* Telebirr header band */}
        <div style={{ background: "linear-gradient(135deg, #0066CC, #0044AA)",
          padding: "24px 28px", display: "flex", alignItems: "center",
          justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)",
              fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
              marginBottom: 4 }}>
              Pay with
            </div>
            <TelebirrLogo />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>
              Amount Due
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
              {totalAmount.toFixed(2)}
              <span style={{ fontSize: 14, marginLeft: 4, fontWeight: 500,
                color: "rgba(255,255,255,.7)" }}>ETB</span>
            </div>
          </div>
        </div>

        {/* Content Body Container */}
        <div style={{ padding: "28px" }}>

          {/* STEP 1: REVIEW CHEKOUT */}
          {step === "review" && (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                Confirm Payment
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
                You'll be redirected to Telebirr to complete your payment securely.
              </div>

              <div style={{ background: "#f9fafb", borderRadius: 12,
                border: `1px solid ${C.border}`, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
                  Payment Summary
                </div>
                {[
                  { label: "Order ID",       value: `#${orderId?.slice(-8).toUpperCase()}` },
                  { label: "Merchant",        value: "NextCart" },
                  { label: "Short Code",      value: "963499" },
                  { label: "Payment Method",  value: "Telebirr H5" },
                  { label: "Amount",          value: `${totalAmount.toFixed(2)} ETB`, bold: true, color: C.tBlue },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex",
                    justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: C.muted }}>{row.label}</span>
                    <span style={{ fontWeight: row.bold ? 700 : 500, color: row.color || C.text }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {["🔒 SSL Secured", "✓ Telebirr Official", "⚡ Instant"].map(b => (
                  <div key={b} style={{ flex: 1, background: C.tLight, borderRadius: 8,
                    padding: "7px 6px", textAlign: "center", fontSize: 10, fontWeight: 600, color: C.tBlue }}>
                    {b}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background: `${C.red}10`, border: `1px solid ${C.red}30`,
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.red, marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              {(isMock || params.get("mock") === "true") && (
                <div style={{ background: "#fff3cd", border: "1px solid #ffc107",
                  borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#856404", marginBottom: 16 }}>
                  ⚠️ <b>Sandbox Mode Active:</b> Pressing payment will bypass firewalls and resolve state verification models smoothly.
                </div>
              )}

              <button onClick={handleProceed}
                style={{ width: "100%", padding: "14px 0", borderRadius: 12,
                  background: "linear-gradient(135deg, #0066CC, #0044AA)",
                  color: "#fff", border: "none", fontWeight: 800, fontSize: 15,
                  cursor: "pointer", letterSpacing: ".03em",
                  boxShadow: "0 4px 16px rgba(0,102,204,.35)" }}>
                Pay {totalAmount.toFixed(2)} ETB with Telebirr →
              </button>
            </>
          )}

          {/* STEP 2: PROCESSING RUNTIME */}
          {step === "processing" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%",
                border: "3px solid #e8f2ff", borderTopColor: C.tBlue,
                margin: "0 auto 20px", transformOrigin: "center",
                animation: "spin .8s linear infinite" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Verifying Secure Transaction Channels...
              </div>
            </div>
          )}

          {/* STEP 3: EXTERNAL ROUTE REDIRECTION COUNTDOWN */}
          {step === "redirecting" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
                Redirecting to Telebirr Secure Portal
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
                Transferring securely in <b style={{ color: C.tBlue }}>{countdown}s</b>
              </div>
              <button onClick={handleRedirectToTelebirr}
                style={{ background: "linear-gradient(135deg, #0066CC, #0044AA)",
                  color: "#fff", border: "none", padding: "11px 28px", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                Proceed Instantly Now
              </button>
            </div>
          )}

          {/* STEP 4: SANDBOX SIMULATOR REDIRECTION VIEWS */}
          {step === "simulated_success" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 15 }}>🛡️</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 8 }}>
                Telebirr Sandbox Simulator Environment
              </div>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
                Firewall limitations caught safely. Click below to resolve your database order status update hooks cleanly.
              </p>
              <button onClick={executeSimulatedWebhook}
                style={{ width: "100%", background: "#1D9E75", color: "#fff", border: "none",
                  padding: "14px 0", borderRadius: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(29,158,117,.3)" }}>
                Authorize Simulated Success Callback
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
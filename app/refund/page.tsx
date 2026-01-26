export default function RefundPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#070b12", padding: "48px 20px" }}>
      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "32px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.7,
        }}
      >
        <h1 style={{ color: "#fff", fontSize: 36, marginBottom: 16 }}>
          Refund Policy
        </h1>
        <p style={{ color: "#fff", fontWeight: 600 }}>
          7-day refund for first-time purchases.
        </p>
        <p>
          Refunds are available only for first-time purchases requested within 7 days.
        </p>
        <p>
          To request a refund, email admin@fuyouai.com with your account email and
          purchase details.
        </p>
        <p>
          Refunds are processed to the original payment method and may take time
          depending on the provider.
        </p>
        <p>
          After the 7-day window, refunds are not provided because this is a digital
          service.
        </p>

        <div style={{ marginTop: 28, fontSize: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            Legal links
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/pricing" style={{ color: "#fff" }}>
              Pricing
            </a>
            <a href="/privacy" style={{ color: "#fff" }}>
              Privacy
            </a>
            <a href="/terms" style={{ color: "#fff" }}>
              Terms
            </a>
            <a href="/refund" style={{ color: "#fff" }}>
              Refund
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

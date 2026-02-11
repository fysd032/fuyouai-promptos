export default function AboutPage() {
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
        <h1 style={{ color: "#fff", fontSize: 36, marginBottom: 16 }}>About</h1>
        <p>
          FuyouAI turns ambiguous requirements into stable, automated workflows. We
          focus on task understanding, structured breakdown, and execution-ready
          outputs.
        </p>
        <p>
          Our goal is to help teams ship consistent results faster, with reusable
          task templates and reliable execution paths.
        </p>
        <p>Contact: admin@fuyouai.com</p>

        <div style={{ marginTop: 28, fontSize: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            Links
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

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p>
          The service is operated by FuyouAI (&quot;Fuyouai&quot;). By using this
          service, you agree to these Terms of Service.
        </p>
        <p>
          Subscription access is required for paid features, and access remains active
          only while your subscription is in good standing.
        </p>
        <p>
          Acceptable use: you agree not to misuse the service, attempt unauthorized
          access, or disrupt other users.
        </p>
        <p>
          Limitation of liability: the service is provided on an &quot;as is&quot;
          basis and we are not liable for indirect, incidental, or consequential
          damages to the maximum extent permitted by law.
        </p>
        <p>
          Termination or suspension: we may suspend or terminate access for violations
          of these terms or for legal or operational reasons.
        </p>
        <p>Contact: admin@fuyouai.com</p>

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

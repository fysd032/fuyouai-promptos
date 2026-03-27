import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("About");

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
        <h1 style={{ color: "#fff", fontSize: 36, marginBottom: 16 }}>{t("title")}</h1>
        <p>{t("paragraph1")}</p>
        <p>{t("paragraph2")}</p>
        <p>{t("contact")}</p>

        <div style={{ marginTop: 28, fontSize: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
            {t("links")}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/pricing" style={{ color: "#fff" }}>
              {t("pricing")}
            </a>
            <a href="/privacy" style={{ color: "#fff" }}>
              {t("privacy")}
            </a>
            <a href="/terms" style={{ color: "#fff" }}>
              {t("terms")}
            </a>
            <a href="/refund" style={{ color: "#fff" }}>
              {t("refund")}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

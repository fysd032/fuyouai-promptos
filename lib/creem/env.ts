type CreemEnv = {
  isTest: boolean;
  baseUrl: string;
  apiKey: string;
  maskedKey?: string;
};

function maskKey(apiKey: string) {
  if (apiKey.length <= 8) return "****";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

export function resolveCreemEnv(
  options?: { logMaskedKey?: boolean }
): CreemEnv {
  /**
   * ---------------------------------------------------------
   * 1️⃣ Read API key (required)
   * ---------------------------------------------------------
   */
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing CREEM_API_KEY");
  }

  /**
   * ---------------------------------------------------------
   * 2️⃣ Determine environment
   *
   * Priority order:
   * 1. CREEM_ENV=test (manual override)
   * 2. API key prefix (creem_te / creem_li)
   * 3. Fallback to production
   * ---------------------------------------------------------
   */
  const creemEnv = process.env.CREEM_ENV;

  let isTest = false;

  // Highest priority: explicit env
  if (creemEnv === "test") {
    isTest = true;
  } else if (creemEnv === "live") {
    isTest = false;
  } else {
    // Auto-detect by API key prefix
    if (apiKey.startsWith("creem_te")) {
      isTest = true;
    } else if (apiKey.startsWith("creem_li")) {
      isTest = false;
    } else {
      // Safe default: test
      isTest = true;
    }
  }

  /**
   * ---------------------------------------------------------
   * 3️⃣ Select API base URL
   * ---------------------------------------------------------
   */
  const baseUrl = isTest
    ? "https://test-api.creem.io"
    : "https://api.creem.io";

  /**
   * ---------------------------------------------------------
   * 4️⃣ Optional masked logging
   * ---------------------------------------------------------
   */
  const maskedKey = maskKey(apiKey);

  if (options?.logMaskedKey) {
    console.log(
      `[Creem] Environment=${isTest ? "TEST" : "LIVE"} | Key=${maskedKey}`
    );
  }

  /**
   * ---------------------------------------------------------
   * 5️⃣ Final output
   * ---------------------------------------------------------
   */
  return {
    isTest,
    baseUrl,
    apiKey,
    maskedKey,
  };
}

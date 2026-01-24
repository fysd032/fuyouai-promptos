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

export function resolveCreemEnv(options?: { logMaskedKey?: boolean }): CreemEnv {
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV;
  const isTest = appEnv !== "production";

  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) throw new Error("Missing CREEM_API_KEY");

  const baseUrl = isTest ? "https://test-api.creem.io" : "https://api.creem.io";
  const maskedKey = maskKey(apiKey);

  if (options?.logMaskedKey) {
    console.log(
      `[Creem] Using ${isTest ? "test" : "live"} API key: ${maskedKey}`
    );
  }

  return { isTest, baseUrl, apiKey, maskedKey };
}

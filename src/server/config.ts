export interface ApiConfig {
  endpoint: string;
  key: string;
}

export function getApiConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): ApiConfig {
  const key = env.API_KEY?.trim();
  const endpoint = env.API_ENDPOINT?.trim();
  if (!key || !endpoint) throw new Error("API configuration missing");
  const url = new URL(endpoint);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("API configuration invalid");
  }
  return { key, endpoint: url.toString().replace(/\/+$/, "") };
}

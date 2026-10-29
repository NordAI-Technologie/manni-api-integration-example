/** Server environment only. No API credential is public or sent to the browser. */
export interface Env {
  API_ENDPOINT: string;
  API_KEY: string;
  DEMO_ACCESS_PASSWORD?: string;
  DEMO_ACCESS_USERNAME?: string;
}

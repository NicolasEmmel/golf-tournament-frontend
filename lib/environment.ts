const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";
const signalRHubUrl =
  process.env.NEXT_PUBLIC_SIGNALR_HUB_URL ??
  "http://localhost:5080/hubs/tournament";

export const environment = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
  signalRHubUrl,
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

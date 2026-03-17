import type { ConnectionState, CoverageReason, MetricKey } from "@/src/domain/models";

export const formatTimestamp = (iso: string): string =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

export const formatMetricValue = (value: number | string): string =>
  typeof value === "number" ? value.toLocaleString("en-US") : value;

export const formatMetricLabel = (key: MetricKey | string): string => {
  switch (key) {
    case "workouts":
      return "Workouts";
    case "steps":
      return "Steps";
    case "sleep-duration":
      return "Sleep";
    case "active-energy":
      return "Active energy";
    case "resting-heart-rate":
      return "Resting heart";
    case "mindfulness-minutes":
      return "Mindfulness";
    default:
      return key
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
};

export const formatConnectionState = (state: ConnectionState): string =>
  state
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatCoverageReason = (reason?: CoverageReason): string => {
  switch (reason) {
    case "no_samples":
      return "No recent samples";
    case "permission_missing":
      return "Permission missing";
    case "provider_unavailable":
      return "Unavailable on this device";
    case "provider_disconnected":
      return "Not connected";
    case "platform_unsupported":
      return "Unsupported platform";
    case "not_requested":
      return "Not requested yet";
    case "permission_unknown":
      return "Permission unknown";
    case "not_supported":
      return "Not supported";
    default:
      return "Available when samples exist";
  }
};

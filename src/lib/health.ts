import type { ProviderSnapshot } from "@/src/domain/models";

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isProviderSnapshotFresh(
  snapshot: ProviderSnapshot | null,
  options?: { maxAgeMinutes?: number },
) {
  if (!snapshot?.metrics.length) {
    return false;
  }

  const maxAgeMinutes = options?.maxAgeMinutes ?? 120;
  const now = new Date();
  const capturedAt = new Date(snapshot.capturedAt);
  const fallbackWindowEnd =
    snapshot.metrics[0]?.window.endAt ?? snapshot.metrics[0]?.observedAt ?? snapshot.capturedAt;
  const windowEnd = new Date(fallbackWindowEnd);

  if (!Number.isFinite(capturedAt.getTime()) || !Number.isFinite(windowEnd.getTime())) {
    return false;
  }

  const ageMinutes = (now.getTime() - capturedAt.getTime()) / (1000 * 60);
  return isSameLocalDay(windowEnd, now) && ageMinutes <= maxAgeMinutes;
}

export const isHealthSnapshotFresh = isProviderSnapshotFresh;

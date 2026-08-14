/** §58 #3 — popup_ends_at → 홈 카드 D-day 뱃지 (읽기 전용) */

export type PopupPeriodTone = 'none' | 'normal' | 'urgent' | 'today' | 'ended';

export interface PopupPeriodBadge {
  tone: PopupPeriodTone;
  label: string;
  daysLeft: number | null;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function getPopupPeriodBadge(
  popupEndsAt: string | null | undefined,
  labels: { ended: string; today: string; dDay: (n: number) => string },
  now = new Date(),
): PopupPeriodBadge {
  if (!popupEndsAt) {
    return { tone: 'none', label: '', daysLeft: null };
  }

  const end = new Date(popupEndsAt);
  if (Number.isNaN(end.getTime())) {
    return { tone: 'none', label: '', daysLeft: null };
  }

  const daysLeft = Math.round((startOfLocalDay(end) - startOfLocalDay(now)) / 86400000);

  if (daysLeft < 0) {
    return { tone: 'ended', label: labels.ended, daysLeft };
  }
  if (daysLeft === 0) {
    return { tone: 'today', label: labels.today, daysLeft: 0 };
  }
  if (daysLeft <= 3) {
    return { tone: 'urgent', label: labels.dDay(daysLeft), daysLeft };
  }
  return { tone: 'normal', label: labels.dDay(daysLeft), daysLeft };
}

export function sortStoresByPopupEnd<T extends { name: string; popup_ends_at?: string | null }>(
  stores: T[],
  now = new Date(),
): T[] {
  const today = startOfLocalDay(now);
  const rank = (endsAt: string | null | undefined): number => {
    if (!endsAt) return Number.MAX_SAFE_INTEGER;
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) return Number.MAX_SAFE_INTEGER;
    const left = Math.round((startOfLocalDay(end) - today) / 86400000);
    if (left < 0) return Number.MAX_SAFE_INTEGER - 1;
    return left;
  };

  return [...stores].sort((a, b) => {
    const diff = rank(a.popup_ends_at) - rank(b.popup_ends_at);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, 'ko');
  });
}

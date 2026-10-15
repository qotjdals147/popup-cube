import type { ReactNode } from 'react';
import { ownerColors as oc, ownerHelpText } from '../styles/ownerAdminTheme';

/** 점주 업로드 — 권장 픽셀 안내 (눈에 띄게) */
export function OwnerImageSizeCallout({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        ...ownerHelpText,
        margin: '0 0 12px',
        padding: '10px 12px',
        background: oc.surfaceMuted,
        borderRadius: 8,
        borderLeft: `3px solid ${oc.primary}`,
        color: oc.textSecondary,
      }}
    >
      {children}
    </p>
  );
}

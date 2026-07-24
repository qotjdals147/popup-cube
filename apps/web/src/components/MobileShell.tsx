import type { ReactNode } from 'react';
import { useViewMode } from '../context/ViewModeContext';
import { useNativeViewport } from '../hooks/useNativeViewport';

type MobileShellProps = {
  children: ReactNode;
};

/**
 * PC에서 「모바일 버전」: 폰 프레임 미리보기.
 * 실제 스마트폰(좁은 뷰포트): 베zel 없이 풀스크린 — 이중 테두리 방지.
 */
export function MobileShell({ children }: MobileShellProps) {
  const { isMobile } = useViewMode();
  const isNativeViewport = useNativeViewport();

  if (!isMobile) {
    return <>{children}</>;
  }

  if (isNativeViewport) {
    return <div className="mobile-shell-native">{children}</div>;
  }

  return (
    <div className="mobile-shell-outer">
      <div className="mobile-shell-frame">
        <div className="mobile-shell-notch" aria-hidden />
        <div className="mobile-shell-content">{children}</div>
      </div>
    </div>
  );
}

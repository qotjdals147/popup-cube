import type { ReactNode } from 'react';
import { useViewMode } from '../context/ViewModeContext';

type MobileShellProps = {
  children: ReactNode;
};

/** PC 모드: 그대로. 모바일 모드: 시안(m01~m10)처럼 폰 폭·다크 톤으로 감싼다. */
export function MobileShell({ children }: MobileShellProps) {
  const { isMobile } = useViewMode();

  if (!isMobile) {
    return <>{children}</>;
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

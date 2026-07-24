import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ViewMode = 'pc' | 'mobile';

const STORAGE_KEY = 'popup-cube-view-mode';

type ViewModeContextValue = {
  viewMode: ViewMode;
  isMobile: boolean;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

function readStoredMode(): ViewMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mobile' || saved === 'pc') return saved;
  } catch {
    /* ignore */
  }
  return 'pc';
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => readStoredMode());

  useEffect(() => {
    document.documentElement.dataset.viewMode = viewMode;
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const value = useMemo<ViewModeContextValue>(
    () => ({
      viewMode,
      isMobile: viewMode === 'mobile',
      setViewMode: setViewModeState,
      toggleViewMode: () => setViewModeState((m) => (m === 'pc' ? 'mobile' : 'pc')),
    }),
    [viewMode]
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode(): ViewModeContextValue {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    throw new Error('useViewMode must be used within ViewModeProvider');
  }
  return ctx;
}

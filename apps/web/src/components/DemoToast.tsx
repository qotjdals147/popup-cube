import { useEffect } from 'react';

import { ownerColors as oc, ownerFont } from '../styles/ownerAdminTheme';

interface DemoToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function DemoToast({ message, onDismiss }: DemoToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 2400);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div style={styles.toast} role="status">
      {message}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toast: {
    position: 'fixed',
    bottom: 96,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2000,
    background: oc.text,
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 14,
    boxShadow: oc.shadowMd,
    maxWidth: 'min(92vw, 420px)',
    textAlign: 'center',
    fontFamily: ownerFont,
    pointerEvents: 'none',
  },
};

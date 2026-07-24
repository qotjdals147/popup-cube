import { useEffect } from 'react';

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
    background: 'rgba(15, 52, 96, 0.96)',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 14,
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
    border: '1px solid #2c4270',
    maxWidth: 'min(92vw, 420px)',
    textAlign: 'center',
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    pointerEvents: 'none',
  },
};

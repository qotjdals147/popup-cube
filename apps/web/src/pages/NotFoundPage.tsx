import { t } from '../i18n';

/** SPA — 매칭 라우트 없을 때 (배포·URL 불일치 시 빈 화면 방지) */
export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0a0e1a',
        color: '#f5f5f5',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 15, lineHeight: 1.6, color: '#94a3b8', maxWidth: 320 }}>
        {t('notFound.body')}
      </p>
    </div>
  );
}

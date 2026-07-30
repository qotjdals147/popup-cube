import { useEffect, useRef } from 'react';
import type { GameChatMessage } from '@popup-cube/game-core';
import { t } from '../i18n';

type PlayWorldChatPanelProps = {
  open: boolean;
  messages: GameChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

function formatChatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** 앱 /play 월드용 모바일 채팅 오버레이 (StorePage mobile과 동일 UX) */
export function PlayWorldChatPanel({
  open,
  messages,
  input,
  onInputChange,
  onSend,
}: PlayWorldChatPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  return (
    <section
      className={`chat-panel-mobile play-world-chat${open ? ' chat-open-mobile' : ''}`}
      aria-hidden={!open}
    >
      {open && (
        <div className="chat-input-mobile">
          <div className="chat-mobile-title">{t('store.chat.title')}</div>
          {messages.length > 0 && (
            <div className="play-world-chat-log">
              {messages.slice(-6).map((message, idx) => (
                <div key={`${message.userId}-${message.timestamp}-${idx}`} className="play-world-chat-line">
                  <span className="play-world-chat-time">
                    [{formatChatTime(message.timestamp)}]
                  </span>{' '}
                  <strong>{message.username}</strong>: {message.message}
                </div>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={t('store.chat.placeholder')}
            className="chat-input-field-mobile"
            maxLength={500}
          />
          <button type="button" className="chat-send-mobile" onClick={onSend}>
            {t('store.chat.send')}
          </button>
        </div>
      )}
    </section>
  );
}

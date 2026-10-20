import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOverlayScrollLock } from '../hooks/useOverlayScrollLock';
import { t } from '../i18n';
import { listOwnerSellerGuideSections } from '../lib/ownerSellerCenterGuideManifest';
import { isWorldEnabled } from '../lib/featureFlags';
import { OwnerSellerGuideFigure } from './ownerSellerCenterGuideFigures';
import '../styles/owner-seller-center-guide.css';

interface OwnerSellerCenterGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function OwnerSellerCenterGuideModal({ open, onClose }: OwnerSellerCenterGuideModalProps) {
  useOverlayScrollLock(open);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>('intro');

  const worldEnabled = isWorldEnabled();
  const sections = useMemo(() => listOwnerSellerGuideSections(worldEnabled), [worldEnabled]);

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(`owner-sc-guide-sec-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveId(sections[0]?.id ?? 'intro');
  }, [open, sections]);

  useEffect(() => {
    if (!open) return;
    const root = contentRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (visible?.target?.id) {
          const id = visible.target.id.replace('owner-sc-guide-sec-', '');
          setActiveId(id);
        }
      },
      { root, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.2, 0.5] }
    );

    for (const sec of sections) {
      const el = document.getElementById(`owner-sc-guide-sec-${sec.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [open, sections]);

  if (!open) return null;

  return createPortal(
    <div className="owner-sc-guide-backdrop" role="presentation">
      <div
        className="owner-sc-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-sc-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="owner-sc-guide__head">
          <div>
            <h2 id="owner-sc-guide-title">{t('ownerSellerGuide.title')}</h2>
            <p className="owner-sc-guide__lead">{t('ownerSellerGuide.lead')}</p>
          </div>
          <button
            type="button"
            className="owner-sc-guide__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </header>

        <div className="owner-sc-guide__body">
          <nav className="owner-sc-guide__toc" aria-label={t('ownerSellerGuide.tocTitle')}>
            <p className="owner-sc-guide__toc-title">{t('ownerSellerGuide.tocTitle')}</p>
            <ul className="owner-sc-guide__toc-list">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <button
                    type="button"
                    className={
                      activeId === sec.id
                        ? 'owner-sc-guide__toc-link owner-sc-guide__toc-link--active'
                        : 'owner-sc-guide__toc-link'
                    }
                    onClick={() => scrollToSection(sec.id)}
                  >
                    {t(sec.titleKey)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="owner-sc-guide__content" ref={contentRef}>
            {sections.map((sec) => (
              <section
                key={sec.id}
                id={`owner-sc-guide-sec-${sec.id}`}
                className="owner-sc-guide__section"
              >
                <h3>{t(sec.titleKey)}</h3>
                <p className="owner-sc-guide__section-intro">{t(sec.introKey)}</p>
                <div className="owner-sc-guide__logic">
                  <h4 className="owner-sc-guide__subhead">{t('ownerSellerGuide.logicHeading')}</h4>
                  <ul className="owner-sc-guide__logic-list">
                    {sec.logicKeys.map((key) => (
                      <li key={key}>{t(key)}</li>
                    ))}
                  </ul>
                </div>
                <p className="owner-sc-guide__figure-caption">{t('ownerSellerGuide.figureCaption')}</p>
                <OwnerSellerGuideFigure id={sec.figure} />
                <h4 className="owner-sc-guide__subhead">{t('ownerSellerGuide.stepsHeading')}</h4>
                <ol className="owner-sc-guide__steps">
                  {sec.stepKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>

        <footer className="owner-sc-guide__foot">{t('ownerSellerGuide.footerNote')}</footer>
      </div>
    </div>,
    document.body
  );
}

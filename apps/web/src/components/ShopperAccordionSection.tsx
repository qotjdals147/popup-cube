import { useState, type ReactNode } from 'react';

interface ShopperAccordionSectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** 에이블리형 접이식 섹션 — 접었을 때 summary 한 줄 */
export function ShopperAccordionSection({
  title,
  summary,
  defaultOpen = false,
  children,
}: ShopperAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`oh-acc${open ? ' oh-acc--open' : ''}`}>
      <button type="button" className="oh-acc-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="oh-acc-title">{title}</span>
        {!open && summary ? <span className="oh-acc-summary">{summary}</span> : null}
        <span className="oh-acc-chevron" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? <div className="oh-acc-body">{children}</div> : null}
    </div>
  );
}

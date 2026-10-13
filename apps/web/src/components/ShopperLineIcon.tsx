export type ShopperLineIconName = 'bag' | 'storefront';

interface ShopperLineIconProps {
  name: ShopperLineIconName;
  size?: number;
  className?: string;
}

/** 손님 WebView/shop — 라인 아이콘 (§0 · §7.112 · mobile `ShopperLineIcon`과 동일 톤) */
export function ShopperLineIcon({ name, size = 22, className }: ShopperLineIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  if (name === 'bag') {
    return (
      <svg {...common}>
        <path d="M8 7V5.5a4 4 0 118 0V7" />
        <path d="M6 7h12l-1.1 12.5H7.1L6 7z" />
        <path d="M9 11h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 10V20h16V10" />
      <path d="M8 20V10" />
      <path d="M16 20V10" />
      <path d="M4 10l2-6h12l2 6" />
      <path d="M12 4V2" />
    </svg>
  );
}

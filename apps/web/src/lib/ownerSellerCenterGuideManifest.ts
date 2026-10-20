/**
 * 판매자센터 통합 가이드 — 섹션·동기화 원본 (User 2026-10-20)
 *
 * 점주 PC(`StoreEditPage` 탭·`Owner*` 패널·`HomePage` 대시) 기능을 바꿀 때:
 * 1) 이 manifest · `ownerSellerCenterGuideFigures.tsx` · `ko.ts` `ownerSellerGuide.*`
 * 2) `OwnerSellerCenterGuideModal.tsx`
 * → HANDOFF §7.121 「가이드 필수 검수」
 */

export type OwnerSellerGuideFigureId =
  | 'intro'
  | 'dashboard'
  | 'shell'
  | 'overview'
  | 'stats'
  | 'products'
  | 'productsBulk'
  | 'reviews'
  | 'ordersPipeline'
  | 'returns'
  | 'promotions'
  | 'policy'
  | 'layout';

export interface OwnerSellerGuideSection {
  id: string;
  figure: OwnerSellerGuideFigureId;
  titleKey: string;
  introKey: string;
  /** 「왜 이렇게 동작하나요」 — 탭·기능 로직 (User 2026-10-20) */
  logicKeys: readonly string[];
  /** 화면에서 따라 할 일 */
  stepKeys: readonly string[];
  /** world 플래그 켜졌을 때만 노출 */
  requiresWorld?: boolean;
}

export const OWNER_SELLER_GUIDE_SECTIONS: readonly OwnerSellerGuideSection[] = [
  {
    id: 'intro',
    figure: 'intro',
    titleKey: 'ownerSellerGuide.sec_intro_title',
    introKey: 'ownerSellerGuide.sec_intro_intro',
    logicKeys: [
      'ownerSellerGuide.sec_intro_logic1',
      'ownerSellerGuide.sec_intro_logic2',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_intro_step1',
      'ownerSellerGuide.sec_intro_step2',
      'ownerSellerGuide.sec_intro_step3',
    ],
  },
  {
    id: 'dashboard',
    figure: 'dashboard',
    titleKey: 'ownerSellerGuide.sec_dashboard_title',
    introKey: 'ownerSellerGuide.sec_dashboard_intro',
    logicKeys: [
      'ownerSellerGuide.sec_dashboard_logic1',
      'ownerSellerGuide.sec_dashboard_logic2',
      'ownerSellerGuide.sec_dashboard_logic3',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_dashboard_step1',
      'ownerSellerGuide.sec_dashboard_step2',
      'ownerSellerGuide.sec_dashboard_step3',
      'ownerSellerGuide.sec_dashboard_step4',
    ],
  },
  {
    id: 'shell',
    figure: 'shell',
    titleKey: 'ownerSellerGuide.sec_shell_title',
    introKey: 'ownerSellerGuide.sec_shell_intro',
    logicKeys: [
      'ownerSellerGuide.sec_shell_logic1',
      'ownerSellerGuide.sec_shell_logic2',
      'ownerSellerGuide.sec_shell_logic3',
      'ownerSellerGuide.sec_shell_logic4',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_shell_step1',
      'ownerSellerGuide.sec_shell_step2',
      'ownerSellerGuide.sec_shell_step3',
    ],
  },
  {
    id: 'overview',
    figure: 'overview',
    titleKey: 'ownerSellerGuide.sec_overview_title',
    introKey: 'ownerSellerGuide.sec_overview_intro',
    logicKeys: [
      'ownerSellerGuide.sec_overview_logic1',
      'ownerSellerGuide.sec_overview_logic2',
      'ownerSellerGuide.sec_overview_logic3',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_overview_step1',
      'ownerSellerGuide.sec_overview_step2',
      'ownerSellerGuide.sec_overview_step3',
      'ownerSellerGuide.sec_overview_step4',
      'ownerSellerGuide.sec_overview_step5',
    ],
  },
  {
    id: 'stats',
    figure: 'stats',
    titleKey: 'ownerSellerGuide.sec_stats_title',
    introKey: 'ownerSellerGuide.sec_stats_intro',
    logicKeys: ['ownerSellerGuide.sec_stats_logic1', 'ownerSellerGuide.sec_stats_logic2'],
    stepKeys: [
      'ownerSellerGuide.sec_stats_step1',
      'ownerSellerGuide.sec_stats_step2',
    ],
  },
  {
    id: 'products',
    figure: 'products',
    titleKey: 'ownerSellerGuide.sec_products_title',
    introKey: 'ownerSellerGuide.sec_products_intro',
    logicKeys: [
      'ownerSellerGuide.sec_products_logic1',
      'ownerSellerGuide.sec_products_logic2',
      'ownerSellerGuide.sec_products_logic3',
      'ownerSellerGuide.sec_products_logic4',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_products_step1',
      'ownerSellerGuide.sec_products_step2',
      'ownerSellerGuide.sec_products_step3',
      'ownerSellerGuide.sec_products_step4',
      'ownerSellerGuide.sec_products_step5',
      'ownerSellerGuide.sec_products_step6',
    ],
  },
  {
    id: 'productsBulk',
    figure: 'productsBulk',
    titleKey: 'ownerSellerGuide.sec_productsBulk_title',
    introKey: 'ownerSellerGuide.sec_productsBulk_intro',
    logicKeys: [
      'ownerSellerGuide.sec_productsBulk_logic1',
      'ownerSellerGuide.sec_productsBulk_logic2',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_productsBulk_step1',
      'ownerSellerGuide.sec_productsBulk_step2',
      'ownerSellerGuide.sec_productsBulk_step3',
    ],
  },
  {
    id: 'reviews',
    figure: 'reviews',
    titleKey: 'ownerSellerGuide.sec_reviews_title',
    introKey: 'ownerSellerGuide.sec_reviews_intro',
    logicKeys: ['ownerSellerGuide.sec_reviews_logic1', 'ownerSellerGuide.sec_reviews_logic2'],
    stepKeys: [
      'ownerSellerGuide.sec_reviews_step1',
      'ownerSellerGuide.sec_reviews_step2',
    ],
  },
  {
    id: 'ordersPipeline',
    figure: 'ordersPipeline',
    titleKey: 'ownerSellerGuide.sec_ordersPipeline_title',
    introKey: 'ownerSellerGuide.sec_ordersPipeline_intro',
    logicKeys: [
      'ownerSellerGuide.sec_ordersPipeline_logic1',
      'ownerSellerGuide.sec_ordersPipeline_logic2',
      'ownerSellerGuide.sec_ordersPipeline_logic3',
      'ownerSellerGuide.sec_ordersPipeline_logic4',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_ordersPipeline_step1',
      'ownerSellerGuide.sec_ordersPipeline_step2',
      'ownerSellerGuide.sec_ordersPipeline_step3',
      'ownerSellerGuide.sec_ordersPipeline_step4',
      'ownerSellerGuide.sec_ordersPipeline_step5',
    ],
  },
  {
    id: 'returns',
    figure: 'returns',
    titleKey: 'ownerSellerGuide.sec_returns_title',
    introKey: 'ownerSellerGuide.sec_returns_intro',
    logicKeys: [
      'ownerSellerGuide.sec_returns_logic1',
      'ownerSellerGuide.sec_returns_logic2',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_returns_step1',
      'ownerSellerGuide.sec_returns_step2',
      'ownerSellerGuide.sec_returns_step3',
    ],
  },
  {
    id: 'promotions',
    figure: 'promotions',
    titleKey: 'ownerSellerGuide.sec_promotions_title',
    introKey: 'ownerSellerGuide.sec_promotions_intro',
    logicKeys: [
      'ownerSellerGuide.sec_promotions_logic1',
      'ownerSellerGuide.sec_promotions_logic2',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_promotions_step1',
      'ownerSellerGuide.sec_promotions_step2',
    ],
  },
  {
    id: 'policy',
    figure: 'policy',
    titleKey: 'ownerSellerGuide.sec_policy_title',
    introKey: 'ownerSellerGuide.sec_policy_intro',
    logicKeys: [
      'ownerSellerGuide.sec_policy_logic1',
      'ownerSellerGuide.sec_policy_logic2',
      'ownerSellerGuide.sec_policy_logic3',
    ],
    stepKeys: [
      'ownerSellerGuide.sec_policy_step1',
      'ownerSellerGuide.sec_policy_step2',
      'ownerSellerGuide.sec_policy_step3',
      'ownerSellerGuide.sec_policy_step4',
    ],
  },
  {
    id: 'layout',
    figure: 'layout',
    titleKey: 'ownerSellerGuide.sec_layout_title',
    introKey: 'ownerSellerGuide.sec_layout_intro',
    logicKeys: ['ownerSellerGuide.sec_layout_logic1', 'ownerSellerGuide.sec_layout_logic2'],
    stepKeys: [
      'ownerSellerGuide.sec_layout_step1',
      'ownerSellerGuide.sec_layout_step2',
    ],
    requiresWorld: true,
  },
] as const;

/** 에이전트 가이드 검수 시 대조할 대표 파일 */
export const OWNER_SELLER_GUIDE_SYNC_PATHS = [
  'apps/web/src/pages/StoreEditPage.tsx',
  'apps/web/src/pages/HomePage.tsx',
  'apps/web/src/components/OwnerProductPanel.tsx',
  'apps/web/src/components/OwnerOrdersPanel.tsx',
  'apps/web/src/components/OwnerReturnsTab.tsx',
  'apps/web/src/components/OwnerStorePolicyPanel.tsx',
  'apps/web/src/components/OwnerPromotionPanel.tsx',
  'apps/web/src/components/OwnerReviewsPanel.tsx',
  'apps/web/src/components/OwnerStoreStatsPanel.tsx',
  'apps/web/src/components/OwnerDisplayPanel.tsx',
  'apps/web/src/lib/ownerSellerCenterGuideManifest.ts',
  'apps/web/src/components/ownerSellerCenterGuideFigures.tsx',
  'apps/web/src/i18n/ko.ts (ownerSellerGuide)',
] as const;

export function listOwnerSellerGuideSections(worldEnabled: boolean): OwnerSellerGuideSection[] {
  return OWNER_SELLER_GUIDE_SECTIONS.filter((s) => !s.requiresWorld || worldEnabled);
}

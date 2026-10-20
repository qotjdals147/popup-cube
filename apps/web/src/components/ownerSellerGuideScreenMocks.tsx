import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '../i18n';
import { isWorldEnabled } from '../lib/featureFlags';
import type { OwnerSellerGuideFigureId } from '../lib/ownerSellerCenterGuideManifest';
import { ownerColors as oc, ownerFont } from '../styles/ownerAdminTheme';
import '../styles/owner-product-edit.css';
import '../styles/owner-promo-gacha.css';

type GuideTabId =
  | 'overview'
  | 'stats'
  | 'products'
  | 'reviews'
  | 'orders'
  | 'hold'
  | 'fulfillment'
  | 'returns'
  | 'promotions'
  | 'policy'
  | 'layout';

const GUIDE_TABS: { id: GuideTabId; labelKey: string }[] = [
  { id: 'overview', labelKey: 'ownerEdit.tabOverview' },
  { id: 'stats', labelKey: 'ownerEdit.tabStats' },
  { id: 'products', labelKey: 'ownerEdit.tabProducts' },
  { id: 'reviews', labelKey: 'ownerEdit.tabReviews' },
  { id: 'orders', labelKey: 'ownerEdit.tabOrders' },
  { id: 'hold', labelKey: 'ownerEdit.tabHold' },
  { id: 'fulfillment', labelKey: 'ownerEdit.tabFulfillment' },
  { id: 'returns', labelKey: 'ownerEdit.tabReturns' },
  { id: 'promotions', labelKey: 'ownerEdit.tabPromotions' },
  { id: 'policy', labelKey: 'ownerEdit.tabPolicy' },
  { id: 'layout', labelKey: 'ownerEdit.tabLayout' },
];

function formatBadge(n: number): string {
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
}

function GuideSellerChrome({
  activeTab,
  badges = {},
  ariaLabel,
  children,
}: {
  activeTab: GuideTabId;
  badges?: Partial<Record<GuideTabId, number>>;
  ariaLabel: string;
  children: ReactNode;
}) {
  const tabs = GUIDE_TABS.filter((tab) => tab.id !== 'layout' || isWorldEnabled());
  const activeLabel = t(GUIDE_TABS.find((x) => x.id === activeTab)?.labelKey ?? 'ownerEdit.tabProducts');
  const activeNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="owner-sc-guide-mock" role="img" aria-label={ariaLabel}>
      <div className="owner-sc-guide-mock__shell" style={{ fontFamily: ownerFont }}>
        <aside className="owner-sc-guide-mock__sidebar" style={{ background: oc.sidebarBg }}>
          <div className="owner-sc-guide-mock__brand">
            <p className="owner-sc-guide-mock__kicker">{t('ownerEdit.kicker')}</p>
            <p className="owner-sc-guide-mock__store-name">GUCCI</p>
            <span className="owner-sc-guide-mock__status-pill">{t('ownerEdit.statusPublished')}</span>
          </div>
          <nav className="owner-sc-guide-mock__nav" aria-hidden="true">
            {tabs.map((tab) => {
              const badge = formatBadge(badges[tab.id] ?? 0);
              const active = tab.id === activeTab;
              return (
                <div
                  key={tab.id}
                  ref={active ? activeNavRef : undefined}
                  className={
                    active
                      ? 'owner-sc-guide-mock__nav-item owner-sc-guide-mock__nav-item--active'
                      : 'owner-sc-guide-mock__nav-item'
                  }
                >
                  <span>{t(tab.labelKey)}</span>
                  {badge ? <span className="owner-sc-guide-mock__nav-badge">{badge}</span> : null}
                </div>
              );
            })}
          </nav>
          <div className="owner-sc-guide-mock__sidebar-foot">
            <span className="owner-sc-guide-mock__foot-btn">{t('ownerEdit.backDashboard')}</span>
            <span className="owner-sc-guide-mock__foot-btn owner-sc-guide-mock__foot-btn--guide">
              {t('ownerSellerGuide.button')}
            </span>
            <span className="owner-sc-guide-mock__foot-btn">{t('common.logout')}</span>
          </div>
        </aside>
        <div className="owner-sc-guide-mock__main">
          <header className="owner-sc-guide-mock__topbar">
            <h4 className="owner-sc-guide-mock__topbar-title">{activeLabel}</h4>
            <div className="owner-sc-guide-mock__topbar-actions">
              <span className="owner-sc-guide-mock__top-btn">{t('ownerEdit.backDashboard')}</span>
              <span className="owner-sc-guide-mock__top-btn owner-sc-guide-mock__top-btn--guide">
                {t('ownerSellerGuide.button')}
              </span>
              <span className="owner-sc-guide-mock__top-btn">{t('common.logout')}</span>
            </div>
          </header>
          <div className="owner-sc-guide-mock__content">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MockCallout({ step, children }: { step: number; children: ReactNode }) {
  return (
    <p className="owner-sc-guide-mock__callout">
      <strong>{step}.</strong> {children}
    </p>
  );
}

function MockIntroFigure() {
  return (
    <div className="owner-sc-guide-mock owner-sc-guide-mock--plain" role="img" aria-label="PC와 앱 역할">
      <div className="owner-sc-guide-mock__split-cards">
        <div className="owner-sc-guide-mock__card">
          <h5>PC · {t('landing.ownerButton')}</h5>
          <p>{t('landing.tagline')}</p>
        </div>
        <div className="owner-sc-guide-mock__card">
          <h5>{t('landing.appNote')}</h5>
          <p>{t('ownerDashboard.shopperAppLink')}</p>
        </div>
      </div>
    </div>
  );
}

function MockDashboardFigure() {
  return (
    <div className="owner-sc-guide-mock owner-sc-guide-mock--plain" role="img" aria-label="대시보드">
      <div className="owner-sc-guide-mock__dash-header">
        <div>
          <h5>{t('ownerDashboard.title')}</h5>
          <p>{t('ownerDashboard.tagline')}</p>
        </div>
        <span className="owner-sc-guide-mock__top-btn owner-sc-guide-mock__top-btn--guide">
          {t('ownerSellerGuide.button')}
        </span>
      </div>
      <div className="owner-sc-guide-mock__store-card">
        <div className="owner-sc-guide-mock__store-card-head">
          <strong>GUCCI</strong>
          <span className="owner-sc-guide-mock__status-pill">{t('ownerEdit.statusPublished')}</span>
        </div>
        <p className="owner-sc-guide-mock__kpi-hint">오늘 주문 · 매출 요약 (Realtime 갱신)</p>
        <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerDashboard.manageStore')}</span>
      </div>
      <MockCallout step={1}>{t('ownerDashboard.manageStore')} → 왼쪽 메뉴가 있는 매장 관리로 들어갑니다.</MockCallout>
    </div>
  );
}

function MockShellFigure() {
  return (
    <GuideSellerChrome activeTab="products" badges={{ orders: 3 }} ariaLabel="판매자센터 레이아웃">
      <div className="owner-sc-guide-mock__panel">
        <p className="owner-sc-guide-mock__muted" style={{ marginTop: 0 }}>
          {t('ownerProducts.title')} — {t('ownerProducts.empty').split('「')[0].trim()}
        </p>
        <div className="owner-sc-guide-mock__toolbar">
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerProducts.addProductToggle')}</span>
          <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerProducts.bulkMenuLabel')}</span>
        </div>
        <div className="owner-sc-guide-mock__product-row">
          <div>
            <strong>{t('ownerProducts.namePlaceholder').replace('예: ', '')}</strong>
            <p className="owner-sc-guide-mock__muted">{t('ownerProducts.productCodeLabel')}: SCARF-01</p>
          </div>
          <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerProducts.edit')}</span>
        </div>
        <MockCallout step={1}>빨간 숫자(예: 주문 3) = 그 메뉴에서 처리할 건수입니다.</MockCallout>
        <MockCallout step={2}>본문만 바뀌고, 왼쪽·위 버튼 위치는 모든 탭에서 같습니다.</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockOverviewFigure() {
  return (
    <GuideSellerChrome activeTab="overview" ariaLabel="매장 개요">
      <div className="owner-sc-guide-mock__panel">
        <h5 className="owner-sc-guide-mock__panel-title">{t('ownerEdit.overviewTitle')}</h5>
        <p className="owner-sc-guide-mock__field-label">{t('ownerEdit.thumbnailLabel')}</p>
        <div className="owner-sc-guide-mock__thumb-placeholder">{t('ownerEdit.thumbnailSelect')}</div>
        <p className="owner-sc-guide-mock__field-label">{t('ownerEdit.storeCodeLabel')}</p>
        <div className="owner-sc-guide-mock__input-row">
          <span className="owner-sc-guide-mock__fake-input">GUCCI</span>
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerEdit.storeCodeSave')}</span>
        </div>
        <p className="owner-sc-guide-mock__hint">{t('ownerEdit.storeCodePreview', { code: 'GUCCI', number: '1042' })}</p>
        <div className="owner-sc-guide-mock__actions-row">
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerEdit.storeOff')}</span>
          <a className="owner-sc-guide-mock__link">{t('ownerEdit.shopPreviewLink')}</a>
        </div>
        <MockCallout step={1}>{t('ownerEdit.publishedNote')}</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockStatsFigure() {
  return (
    <GuideSellerChrome activeTab="stats" ariaLabel="통계">
      <div className="owner-sc-guide-mock__panel">
        <p className="owner-sc-guide-mock__muted">{t('ownerStats.lead')}</p>
        <h5>{t('ownerStats.chartSectionTitle')}</h5>
        <p className="owner-sc-guide-mock__muted">{t('ownerStats.chartSectionIntro')}</p>
        <div className="owner-sc-guide-mock__chart-placeholder" />
        <MockCallout step={1}>여기서는 숫자만 봅니다. 주문 상태 변경은 「주문」「발주·배송」 탭에서 합니다.</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockProductsFigure() {
  return (
    <GuideSellerChrome activeTab="products" ariaLabel="상품 수정">
      <div className="owner-sc-guide-mock__panel owner-product-panel--embedded">
        <p className="owner-sc-guide-mock__field-label">{t('ownerProducts.productCodeLabel')}</p>
        <span className="owner-sc-guide-mock__fake-input owner-sc-guide-mock__fake-input--wide">SCARF-01</span>
        <p className="owner-sc-guide-mock__field-label">{t('ownerProducts.autoAcceptLabel')}</p>
        <p className="owner-sc-guide-mock__help">{t('ownerProducts.autoAcceptIntro')}</p>
        <label className="owner-sc-guide-mock__check">
          <input type="checkbox" checked readOnly disabled /> {t('ownerProducts.autoAcceptOnBadge')}
        </label>
        <p className="owner-sc-guide-mock__field-label">{t('ownerProducts.skusTitle')}</p>
        <div className="owner-sc-guide-mock__sku-row">
          <span>블랙 / M</span>
          <span>{t('ownerProducts.skusColStock')}: 12</span>
        </div>
        <p className="owner-sc-guide-mock__field-label">{t('ownerProducts.linkedRecommendLabel')}</p>
        <p className="owner-sc-guide-mock__help">{t('ownerProducts.linkedRecommendHint', { max: 6 })}</p>
        <div className="owner-sc-guide-mock__save-dock">
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerProducts.save')}</span>
        </div>
        <MockCallout step={1}>{t('ownerProducts.autoAcceptVsStockHelp')}</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockProductsBulkFigure() {
  return (
    <GuideSellerChrome activeTab="products" ariaLabel="엑셀 일괄">
      <div className="owner-sc-guide-mock__panel">
        <div className="owner-sc-guide-mock__toolbar">
          <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerProducts.bulkGuideBtn')}</span>
          <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerProducts.bulkDownloadTemplate')}</span>
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerProducts.bulkUpload')}</span>
        </div>
        <MockCallout step={1}>{t('ownerProducts.bulkGuideLead')}</MockCallout>
        <MockCallout step={2}>「{t('ownerProducts.bulkGuideBtn')}」→ 옵션 행 규칙 팝업 (별도 창)</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockReviewsFigure() {
  return (
    <GuideSellerChrome activeTab="reviews" badges={{ reviews: 2 }} ariaLabel="리뷰">
      <div className="owner-sc-guide-mock__panel">
        <div className="owner-sc-guide-mock__review-row">
          <span>{t('ownerReviews.badgePending')}</span>
          <strong>★★★★☆</strong>
          <p>배송이 빨라요.</p>
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerReviews.submitReply')}</span>
        </div>
        <MockCallout step={1}>{t('ownerReviews.badgePending')} 리뷰부터 답글을 달면 왼쪽 숫자가 줄어듭니다.</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockOrdersFigure() {
  return (
    <GuideSellerChrome activeTab="orders" badges={{ orders: 1 }} ariaLabel="주문">
      <div className="owner-sc-guide-mock__panel">
        <input className="owner-sc-guide-mock__fake-input owner-sc-guide-mock__fake-input--wide" readOnly value={t('ownerOrders.filterSearchPlaceholder')} />
        <div className="owner-sc-guide-mock__order-card">
          <p>
            <strong>{t('ownerOrders.orderRef')}: GUCCI-1042</strong>
          </p>
          <p className="owner-sc-guide-mock__muted">{t('ownerOrders.itemsCount', { count: 1 })}</p>
          <div className="owner-sc-guide-mock__toolbar">
            <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerOrders.accept')}</span>
            <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerOrders.reject')}</span>
            <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerOrders.requestHold')}</span>
          </div>
        </div>
        <MockCallout step={1}>{t('ownerOrders.autoAcceptedElsewhere', { count: 2 })}</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockReturnsFigure() {
  return (
    <GuideSellerChrome activeTab="returns" badges={{ returns: 1 }} ariaLabel="반품">
      <div className="owner-sc-guide-mock__panel">
        <div className="owner-sc-guide-mock__subnav">
          <span className="owner-sc-guide-mock__subnav-active">{t('ownerReturns.tabRequests')}</span>
          <span>{t('ownerReturns.tabClaims')}</span>
        </div>
        <div className="owner-sc-guide-mock__toolbar">
          <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerReturns.approve')}</span>
          <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerReturns.reject')}</span>
        </div>
        <MockCallout step={1}>{t('ownerReturns.listFilterActive')} / {t('ownerReturns.listFilterHistory')} 로 목록을 바꿉니다.</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockPromotionsFigure() {
  return (
    <GuideSellerChrome activeTab="promotions" ariaLabel="프로모션·가챠">
      <div className="owner-promo-page owner-sc-guide-mock__promo-wrap">
        <p className="owner-promo-page__intro">{t('ownerPromo.intro')}</p>
        <article className="owner-promo-card">
          <div className="owner-promo-card__top">
            <h2 className="owner-promo-card__title">{t('ownerPromo.storeDefaultTitle')}</h2>
            <label className="owner-promo-toggle">
              <input type="checkbox" checked readOnly disabled />
              {t('ownerPromo.storeActive')}
            </label>
          </div>
          <p className="owner-promo-field__label">{t('ownerPromo.defaultModeLabel')}</p>
          <div className="owner-promo-mode-grid">
            <label className="owner-promo-mode-option">
              <input type="radio" readOnly disabled /> {t('ownerPromo.modeChoice')}
            </label>
            <label className="owner-promo-mode-option">
              <input type="radio" readOnly disabled /> {t('ownerPromo.modeDiscountOnly')}
            </label>
          </div>
          <div className="owner-section-actions">
            <span className="owner-btn-primary owner-sc-guide-mock__demo-btn">{t('ownerPromo.saveDefault')}</span>
          </div>
        </article>
        <article className="owner-promo-card">
          <h2 className="owner-promo-card__title">{t('ownerPromo.gachaTitle')}</h2>
          <p className="owner-promo-card__lead">{t('ownerPromo.gachaHelp')}</p>
          <label className="owner-promo-toggle">
            <input type="checkbox" readOnly disabled />
            {t('ownerPromo.gachaActive')}
          </label>
        </article>
        <MockCallout step={1}>손님 결제 화면에 「할인 vs 가챠」가 뜨는 조건 = 여기 매장·상품 설정과 연결됩니다.</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockPolicyFigure() {
  return (
    <GuideSellerChrome activeTab="policy" ariaLabel="운영·배송">
      <div className="owner-sc-guide-mock__panel">
        <p className="owner-sc-guide-mock__field-label">{t('ownerPolicy.shippingFeeAmountLabel')}</p>
        <span className="owner-sc-guide-mock__fake-input owner-sc-guide-mock__fake-input--wide">3,000</span>
        <p className="owner-sc-guide-mock__field-label">{t('ownerPolicy.shippingGuideLabel')}</p>
        <div className="owner-sc-guide-mock__textarea-placeholder">{t('ownerPolicy.shippingGuidePlaceholder')}</div>
        <p className="owner-sc-guide-mock__field-label">{t('ownerStoreNews.sectionTitle')}</p>
        <span className="owner-btn-ghost owner-sc-guide-mock__demo-btn">{t('ownerStoreNews.addMedia')}</span>
        <MockCallout step={1}>{t('ownerPolicy.intro')}</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

function MockLayoutFigure() {
  return (
    <GuideSellerChrome activeTab="layout" ariaLabel="매장 꾸미기">
      <div className="owner-sc-guide-mock__panel">
        <p>{t('ownerEdit.layoutHint')}</p>
        <MockCallout step={1}>{t('ownerSellerGuide.sec_layout_logic2')}</MockCallout>
      </div>
    </GuideSellerChrome>
  );
}

const MOCK_MAP: Record<OwnerSellerGuideFigureId, () => React.ReactElement> = {
  intro: MockIntroFigure,
  dashboard: MockDashboardFigure,
  shell: MockShellFigure,
  overview: MockOverviewFigure,
  stats: MockStatsFigure,
  products: MockProductsFigure,
  productsBulk: MockProductsBulkFigure,
  reviews: MockReviewsFigure,
  ordersPipeline: MockOrdersFigure,
  returns: MockReturnsFigure,
  promotions: MockPromotionsFigure,
  policy: MockPolicyFigure,
  layout: MockLayoutFigure,
};

export function OwnerSellerGuideScreenMock({ id }: { id: OwnerSellerGuideFigureId }) {
  const Comp = MOCK_MAP[id];
  return <Comp />;
}

import { AccountWebViewScreen } from '../../src/components/AccountWebViewScreen';

/** 퀵메뉴 · 전체보기 — 구매 내역 + 탭 전환 */
export default function MeOrdersScreen() {
  return <AccountWebViewScreen tab="orders" embed="page" />;
}

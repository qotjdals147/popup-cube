import { AccountWebViewScreen } from '../../src/components/AccountWebViewScreen';

/** 마이 > 주문내역 — 구매 내역만 (배송지 탭 없음 · §60 4-B IA) */
export default function MeOrdersScreen() {
  return <AccountWebViewScreen tab="orders" embed="panel" />;
}

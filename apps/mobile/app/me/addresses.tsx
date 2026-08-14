import { AccountWebViewScreen } from '../../src/components/AccountWebViewScreen';

/** 마이 > 배송지 — 배송지 관리만 (주문 탭 없음 · §60 4-B IA) */
export default function MeAddressesScreen() {
  return <AccountWebViewScreen tab="addresses" embed="panel" />;
}

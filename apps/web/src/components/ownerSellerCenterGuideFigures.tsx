import type React from 'react';
import type { ReactNode } from 'react';
import type { OwnerSellerGuideFigureId } from '../lib/ownerSellerCenterGuideManifest';

const C = {
  page: '#f4f5f7',
  sidebar: '#2b3340',
  sidebarText: '#b8c0cc',
  sidebarActive: '#3d4f63',
  white: '#ffffff',
  border: '#e5e8eb',
  text: '#191f28',
  muted: '#4e5968',
  primary: '#3182f6',
  badge: '#f04452',
  success: '#087f5b',
  warn: '#e67700',
};

function Wrap({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="owner-sc-guide__figure" aria-label={label}>
      {children}
    </figure>
  );
}

function GuideIntroFigure() {
  return (
    <Wrap label="PC 로그인과 앱 역할">
      <svg viewBox="0 0 720 160" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="160" fill={C.page} rx="8" />
        <rect x="24" y="28" width="300" height="104" fill={C.white} stroke={C.border} rx="10" />
        <text x="44" y="56" fontSize="13" fontWeight="700" fill={C.text}>
          PC 웹 · 스토어 관리자
        </text>
        <text x="44" y="78" fontSize="11" fill={C.muted}>
          매장·상품·주문·배송
        </text>
        <rect x="44" y="92" width="120" height="28" fill={C.primary} rx="6" />
        <text x="104" y="110" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">
          로그인
        </text>
        <rect x="396" y="28" width="300" height="104" fill={C.white} stroke={C.border} rx="10" />
        <text x="416" y="56" fontSize="13" fontWeight="700" fill={C.text}>
          손님 · 모바일 앱
        </text>
        <text x="416" y="78" fontSize="11" fill={C.muted}>
          쇼핑·결제·주문 조회
        </text>
        <text x="416" y="102" fontSize="11" fill={C.warn}>
          PC에서 관리자 로그인 ❌
        </text>
        <path d="M334 80h52" stroke={C.muted} strokeWidth="2" strokeDasharray="4 3" />
        <text x="360" y="72" textAnchor="middle" fontSize="10" fill={C.muted}>
          역할 분리
        </text>
      </svg>
    </Wrap>
  );
}

function GuideDashboardFigure() {
  return (
    <Wrap label="대시보드 매장 목록">
      <svg viewBox="0 0 720 220" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="220" fill={C.page} rx="8" />
        <rect x="0" y="0" width="720" height="48" fill={C.white} stroke={C.border} />
        <text x="24" y="30" fontSize="14" fontWeight="700" fill={C.text}>
          POP-UP CUBE · 스토어 관리
        </text>
        <rect x="580" y="12" width="116" height="28" fill={C.white} stroke={C.borderStrong} rx="6" />
        <text x="638" y="30" textAnchor="middle" fontSize="10" fill={C.muted}>
          가이드 · 로그아웃
        </text>
        <rect x="24" y="64" width="672" height="72" fill={C.white} stroke={C.border} rx="10" />
        <text x="40" y="88" fontSize="13" fontWeight="700" fill={C.text}>
          GUCCI
        </text>
        <rect x="40" y="98" width="56" height="20" fill="#ebfbee" stroke="#b2f2bb" rx="999" />
        <text x="68" y="112" textAnchor="middle" fontSize="9" fill={C.success}>
          출시됨
        </text>
        <text x="120" y="112" fontSize="10" fill={C.muted}>
          오늘 주문 · 매출 요약(KPI)
        </text>
        <rect x="520" y="92" width="160" height="32" fill={C.primary} rx="8" />
        <text x="600" y="112" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">
          매장 관리 열기
        </text>
        <rect x="24" y="148" width="672" height="56" fill={C.white} stroke={C.border} rx="10" strokeDasharray="6 4" />
        <text x="40" y="180" fontSize="11" fill={C.muted}>
          + 매장 만들기 (새 브랜드)
        </text>
      </svg>
    </Wrap>
  );
}

const C_borderStrong = '#d1d6db';

function GuideShellFigure() {
  const tabs = ['매장 개요', '통계', '상품', '주문', '발주·배송', '반품·교환'];
  return (
    <Wrap label="왼쪽 메뉴와 본문">
      <svg viewBox="0 0 720 240" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="240" fill={C.page} rx="8" />
        <rect x="16" y="16" width="168" height="208" fill={C.sidebar} rx="10" />
        <text x="28" y="40" fontSize="10" fill={C.sidebarText}>
          스토어 관리
        </text>
        <text x="28" y="58" fontSize="13" fontWeight="700" fill="#fff">
          매장 이름
        </text>
        {tabs.map((label, i) => (
          <g key={label}>
            <rect
              x="24"
              y={72 + i * 22}
              width="152"
              height="20"
              fill={i === 2 ? C.sidebarActive : 'transparent'}
              rx="4"
            />
            <text x="32" y={86 + i * 22} fontSize="10" fill={i === 2 ? '#fff' : C.sidebarText}>
              {label}
            </text>
            {i === 3 && (
              <circle cx="162" cy={76 + i * 22} r="8" fill={C.badge} />
            )}
          </g>
        ))}
        <rect x="24" y="188" width="152" height="22" fill="rgba(255,255,255,0.08)" rx="4" />
        <text x="32" y="203" fontSize="9" fill={C.sidebarText}>
          대시보드 · 가이드 · 로그아웃
        </text>
        <rect x="196" y="16" width="508" height="208" fill={C.white} stroke={C.border} rx="10" />
        <rect x="196" y="16" width="508" height="36" fill={C.white} stroke={C.border} />
        <text x="212" y="38" fontSize="13" fontWeight="700" fill={C.text}>
          상품
        </text>
        <text x="212" y="72" fontSize="11" fill={C.muted}>
          선택한 메뉴 내용이 오른쪽에 표시됩니다.
        </text>
      </svg>
    </Wrap>
  );
}

function GuideOverviewFigure() {
  return (
    <Wrap label="매장 개요">
      <svg viewBox="0 0 720 260" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="260" fill={C.page} rx="8" />
        <text x="24" y="32" fontSize="14" fontWeight="700" fill={C.text}>
          매장 개요
        </text>
        <rect x="24" y="44" width="200" height="120" fill={C.white} stroke={C.border} rx="8" />
        <text x="36" y="64" fontSize="10" fontWeight="600" fill={C.text}>
          대표 사진 (4:3)
        </text>
        <rect x="36" y="72" width="168" height="80" fill="#eef4ff" stroke={C.border} rx="6" />
        <rect x="240" y="44" width="456" height="56" fill={C.white} stroke={C.border} rx="8" />
        <text x="252" y="66" fontSize="10" fill={C.muted}>
          주문 코드 · 팝업 종료일(D-day)
        </text>
        <text x="252" y="84" fontSize="10" fontFamily="ui-monospace" fill={C.primary}>
          GUCCI-1042
        </text>
        <rect x="240" y="108" width="140" height="36" fill={C.primary} rx="8" />
        <text x="310" y="130" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">
          매장 OPEN
        </text>
        <rect x="388" y="108" width="140" height="36" fill={C.white} stroke={C.borderStrong} rx="8" />
        <text x="458" y="130" textAnchor="middle" fontSize="11" fill={C.muted}>
          매장 OFF
        </text>
        <rect x="24" y="180" width="672" height="56" fill="#fff9db" stroke="#ffe066" rx="8" />
        <text x="36" y="204" fontSize="11" fill={C.text}>
          임시저장 → 상품 준비 후 OPEN · 출시 후 손님 앱 홈에 노출
        </text>
        <text x="36" y="222" fontSize="11" fill={C.muted}>
          쇼핑 미리보기 링크 · 삭제(주문 없을 때)
        </text>
      </svg>
    </Wrap>
  );
}

function GuideStatsFigure() {
  return (
    <Wrap label="통계 탭">
      <svg viewBox="0 0 720 180" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="180" fill={C.page} rx="8" />
        <text x="24" y="32" fontSize="14" fontWeight="700" fill={C.text}>
          통계
        </text>
        <text x="24" y="52" fontSize="11" fill={C.muted}>
          최근 7일 매출 · 주문 · 인기 상품
        </text>
        <rect x="24" y="64" width="320" height="96" fill={C.white} stroke={C.border} rx="8" />
        <polyline
          points="44,140 80,120 120,130 160,90 200,100 240,70 280,85 320,60"
          fill="none"
          stroke={C.primary}
          strokeWidth="2"
        />
        <rect x="360" y="64" width="336" height="96" fill={C.white} stroke={C.border} rx="8" />
        <text x="376" y="88" fontSize="10" fontWeight="600" fill={C.text}>
          판매 많은 순
        </text>
        {[0, 1, 2].map((i) => (
          <rect key={i} x="376" y={96 + i * 22} width={280 - i * 40} height="14" fill="#eef4ff" rx="3" />
        ))}
      </svg>
    </Wrap>
  );
}

function GuideProductsFigure() {
  return (
    <Wrap label="상품 탭">
      <svg viewBox="0 0 720 320" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="320" fill={C.page} rx="8" />
        <rect x="24" y="20" width="672" height="40" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="44" fontSize="11" fill={C.text}>
          상품 목록 · + 새 상품 · 손님 미리보기
        </text>
        <rect x="24" y="72" width="320" height="228" fill={C.white} stroke={C.border} rx="8" />
        <text x="36" y="94" fontSize="11" fontWeight="700" fill={C.text}>
          상품 수정 (한 화면)
        </text>
        {['판매자 상품코드', '옵션·재고', '상품 태그', '함께 추천', '상세 블록'].map((l, i) => (
          <g key={l}>
            <rect x="36" y={104 + i * 36} width="288" height="28" fill={C.page} stroke={C.border} rx="4" />
            <text x="44" y={122 + i * 36} fontSize="10" fill={C.muted}>
              {l}
            </text>
          </g>
        ))}
        <rect x="360" y="72" width="336" height="48" fill={C.primary} rx="8" />
        <text x="528" y="100" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="700">
          저장 (하단 고정)
        </text>
        <rect x="360" y="132" width="336" height="168" fill={C.white} stroke={C.border} rx="8" />
        <text x="376" y="154" fontSize="10" fill={C.muted}>
          자동 수락 · 발주·배송 탭 이동 설정
        </text>
        <text x="376" y="174" fontSize="10" fill={C.muted}>
          권장 이미지 크기 안내
        </text>
      </svg>
    </Wrap>
  );
}

function GuideProductsBulkFigure() {
  return (
    <Wrap label="엑셀 일괄 등록">
      <svg viewBox="0 0 720 140" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="140" fill={C.page} rx="8" />
        <rect x="24" y="36" width="200" height="68" fill={C.white} stroke={C.primary} rx="8" />
        <text x="124" y="64" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.primary}>
          엑셀 일괄 등록
        </text>
        <text x="124" y="84" textAnchor="middle" fontSize="10" fill={C.muted}>
          상품 메뉴 안
        </text>
        <path d="M234 70h48" stroke={C.muted} strokeWidth="2" />
        <rect x="292" y="36" width="180" height="68" fill={C.white} stroke={C.border} rx="8" />
        <text x="382" y="64" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.text}>
          작성 매뉴얼
        </text>
        <text x="382" y="84" textAnchor="middle" fontSize="10" fill={C.muted}>
          별도 팝업 (옵션 행)
        </text>
        <path d="M482 70h48" stroke={C.muted} strokeWidth="2" />
        <rect x="540" y="36" width="156" height="68" fill={C.primary} rx="8" />
        <text x="618" y="78" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="600">
          양식·업로드
        </text>
      </svg>
    </Wrap>
  );
}

function GuideReviewsFigure() {
  return (
    <Wrap label="리뷰 탭">
      <svg viewBox="0 0 720 160" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="160" fill={C.page} rx="8" />
        <rect x="24" y="32" width="672" height="56" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="56" fontSize="11" fontWeight="600" fill={C.text}>
          ★★★★☆ 손님 리뷰
        </text>
        <rect x="40" y="64" width="72" height="18" fill="#fff5f5" stroke="#ffc9c9" rx="999" />
        <text x="76" y="77" textAnchor="middle" fontSize="9" fill="#c92a2a">
          답글 필요
        </text>
        <rect x="520" y="52" width="160" height="28" fill={C.primary} rx="6" />
        <text x="600" y="70" textAnchor="middle" fontSize="10" fill="#fff">
          답글 등록
        </text>
        <text x="24" y="120" fontSize="11" fill={C.muted}>
          왼쪽 메뉴 빨간 숫자 = 답글 안 단 리뷰 수
        </text>
      </svg>
    </Wrap>
  );
}

function GuideOrdersPipelineFigure() {
  return (
    <Wrap label="주문 흐름">
      <svg viewBox="0 0 720 200" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="200" fill={C.page} rx="8" />
        {[
          { x: 24, t: '주문', s: '수락 대기' },
          { x: 196, t: '수정 대기', s: '손님 보완' },
          { x: 368, t: '발주·배송', s: '송장·발송' },
        ].map((b, i) => (
          <g key={b.t}>
            <rect x={b.x} y="48" width="160" height="88" fill={C.white} stroke={i === 0 ? C.primary : C.border} rx="8" />
            <text x={b.x + 80} y="76" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.text}>
              {b.t}
            </text>
            <text x={b.x + 80} y="96" textAnchor="middle" fontSize="10" fill={C.muted}>
              {b.s}
            </text>
            {i < 2 && (
              <>
                <path d={`M${b.x + 168} 92h20`} stroke={C.muted} strokeWidth="2" />
                <polygon points={`${b.x + 188},92 ${b.x + 180},88 ${b.x + 180},96`} fill={C.muted} />
              </>
            )}
          </g>
        ))}
        <rect x="540" y="48" width="156" height="88" fill="#ebfbee" stroke="#b2f2bb" rx="8" />
        <text x="618" y="76" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.success}>
          자동 수락 ON
        </text>
        <text x="618" y="96" textAnchor="middle" fontSize="9" fill={C.muted}>
          주문 탭 건너뛰고
        </text>
        <text x="618" y="112" textAnchor="middle" fontSize="9" fill={C.muted}>
          발주·배송으로
        </text>
        <text x="24" y="168" fontSize="11" fill={C.muted}>
          결제 후 목록·빨간 숫자는 새로고침 없이 갱신 (PC 화면 켜 둔 상태)
        </text>
      </svg>
    </Wrap>
  );
}

function GuideReturnsFigure() {
  return (
    <Wrap label="반품·교환·문의">
      <svg viewBox="0 0 720 180" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="180" fill={C.page} rx="8" />
        <rect x="24" y="28" width="160" height="32" fill={C.sidebarActive} rx="6" />
        <text x="104" y="48" textAnchor="middle" fontSize="11" fill="#fff">
          반품·교환 신청
        </text>
        <rect x="192" y="28" width="120" height="32" fill={C.white} stroke={C.border} rx="6" />
        <text x="252" y="48" textAnchor="middle" fontSize="11" fill={C.muted}>
          손님 문의
        </text>
        <rect x="24" y="72" width="672" height="88" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="96" fontSize="11" fill={C.text}>
          처리 대기 / 거절·완료 이력 전환
        </text>
        <rect x="40" y="108" width="64" height="24" fill={C.primary} rx="4" />
        <text x="72" y="124" textAnchor="middle" fontSize="10" fill="#fff">
          승인
        </text>
        <rect x="112" y="108" width="64" height="24" fill={C.white} stroke={C.borderStrong} rx="4" />
        <text x="144" y="124" textAnchor="middle" fontSize="10" fill={C.muted}>
          거절
        </text>
      </svg>
    </Wrap>
  );
}

function GuidePromotionsFigure() {
  return (
    <Wrap label="프로모션·가챠">
      <svg viewBox="0 0 720 140" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="140" fill={C.page} rx="8" />
        <rect x="24" y="32" width="320" height="80" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="56" fontSize="11" fontWeight="700" fill={C.text}>
          프로모션
        </text>
        <text x="40" y="76" fontSize="10" fill={C.muted}>
          쿠폰·할인 (매장 설정)
        </text>
        <rect x="360" y="32" width="336" height="80" fill={C.white} stroke={C.border} rx="8" />
        <text x="376" y="56" fontSize="11" fontWeight="700" fill={C.text}>
          가챠
        </text>
        <text x="376" y="76" fontSize="10" fill={C.muted}>
          당첨·반납 상태 (반품 탭과 연동)
        </text>
      </svg>
    </Wrap>
  );
}

function GuidePolicyFigure() {
  return (
    <Wrap label="운영·배송 안내">
      <svg viewBox="0 0 720 220" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="220" fill={C.page} rx="8" />
        <rect x="24" y="24" width="672" height="56" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="48" fontSize="11" fontWeight="600" fill={C.text}>
          배송비 · 교환·반품 안내 문구
        </text>
        <text x="40" y="66" fontSize="10" fill={C.muted}>
          손님 상품·결제 화면에 노출
        </text>
        <rect x="24" y="92" width="320" height="104" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="116" fontSize="11" fontWeight="600" fill={C.text}>
          반품 수거지 주소
        </text>
        <rect x="360" y="92" width="336" height="104" fill={C.white} stroke={C.border} rx="8" />
        <text x="376" y="116" fontSize="11" fontWeight="600" fill={C.text}>
          매장 새 소식
        </text>
        <text x="376" y="136" fontSize="10" fill={C.muted}>
          사진 · 상품 연결 · 손님 상세 캐러셀
        </text>
        <rect x="376" y="148" width="80" height="36" fill="#eef4ff" stroke={C.border} rx="4" />
      </svg>
    </Wrap>
  );
}

function GuideLayoutFigure() {
  return (
    <Wrap label="매장 꾸미기">
      <svg viewBox="0 0 720 160" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="160" fill={C.page} rx="8" />
        <text x="24" y="32" fontSize="12" fill={C.warn}>
          ※ 「매장 꾸미기」메뉴는 월드(3D) 기능 켜진 매장만 보입니다.
        </text>
        <rect x="24" y="48" width="400" height="96" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="72" fontSize="11" fill={C.text}>
          진열·슬롯에 상품 연결
        </text>
        <rect x="440" y="48" width="256" height="96" fill="#eef4ff" stroke={C.border} rx="8" />
        <text x="456" y="72" fontSize="10" fill={C.muted}>
          손님 월드 입장용 (쇼핑은 앱·웹샵)
        </text>
      </svg>
    </Wrap>
  );
}

const FIGURE_MAP: Record<OwnerSellerGuideFigureId, () => React.ReactElement> = {
  intro: GuideIntroFigure,
  dashboard: GuideDashboardFigure,
  shell: GuideShellFigure,
  overview: GuideOverviewFigure,
  stats: GuideStatsFigure,
  products: GuideProductsFigure,
  productsBulk: GuideProductsBulkFigure,
  reviews: GuideReviewsFigure,
  ordersPipeline: GuideOrdersPipelineFigure,
  returns: GuideReturnsFigure,
  promotions: GuidePromotionsFigure,
  policy: GuidePolicyFigure,
  layout: GuideLayoutFigure,
};

export function OwnerSellerGuideFigure({ id }: { id: OwnerSellerGuideFigureId }) {
  const Comp = FIGURE_MAP[id];
  return <Comp />;
}

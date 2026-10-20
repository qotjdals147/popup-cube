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

/** 점주 PC — 왼쪽 사이드 + 상단 바 (StoreEditPage와 동일 구조) */
function SidebarNavMock({
  activeIndex,
  badgeIndex,
}: {
  activeIndex: number;
  badgeIndex?: number;
}) {
  const tabs = [
    '매장 개요',
    '통계',
    '상품',
    '리뷰',
    '주문',
    '수정 대기',
    '발주·배송',
    '반품·교환·문의',
  ];
  return (
    <>
      <text x="28" y="36" fontSize="9" fill={C.sidebarText}>
        스토어 관리
      </text>
      <text x="28" y="54" fontSize="12" fontWeight="700" fill="#fff">
        GUCCI
      </text>
      <rect x="28" y="60" width="52" height="18" fill="#fff9db" stroke="#ffe066" rx="999" />
      <text x="54" y="73" textAnchor="middle" fontSize="8" fill={C.warn}>
        출시됨
      </text>
      {tabs.map((label, i) => (
        <g key={label}>
          <rect
            x="20"
            y={82 + i * 24}
            width="160"
            height="22"
            fill={i === activeIndex ? C.sidebarActive : 'transparent'}
            rx="6"
          />
          <text
            x="30"
            y={97 + i * 24}
            fontSize="9.5"
            fill={i === activeIndex ? '#fff' : C.sidebarText}
          >
            {label.length > 9 ? `${label.slice(0, 9)}…` : label}
          </text>
          {badgeIndex === i && (
            <>
              <circle cx="168" cy={88 + i * 24} r="9" fill={C.badge} />
              <text x="168" y={91 + i * 24} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">
                3
              </text>
            </>
          )}
        </g>
      ))}
      <line x1="20" y1="278" x2="180" y2="278" stroke="#3d4654" />
      {[
        { y: 286, label: '대시보드로 이동', hi: false },
        { y: 312, label: '판매자센터 가이드', hi: true },
        { y: 338, label: '로그아웃', hi: false },
      ].map((b) => (
        <g key={b.label}>
          <rect
            x="20"
            y={b.y}
            width="160"
            height="22"
            fill={b.hi ? C.sidebarActive : 'rgba(255,255,255,0.06)'}
            stroke={b.hi ? '#60a5fa' : '#3d4654'}
            rx="6"
          />
          <text x="30" y={b.y + 15} fontSize="9" fill={b.hi ? '#fff' : C.sidebarText}>
            {b.label}
          </text>
        </g>
      ))}
    </>
  );
}

function TopBarMock({ title }: { title: string }) {
  return (
    <>
      <text x="208" y="38" fontSize="14" fontWeight="700" fill={C.text}>
        {title}
      </text>
      <rect x="418" y="22" width="88" height="26" fill={C.white} stroke={C_borderStrong} rx="6" />
      <text x="462" y="39" textAnchor="middle" fontSize="8" fill={C.muted}>
        대시보드로 이동
      </text>
      <rect x="512" y="22" width="96" height="26" fill="#eef4ff" stroke={C.primary} rx="6" />
      <text x="560" y="39" textAnchor="middle" fontSize="8" fill="#2563eb" fontWeight="600">
        판매자센터 가이드
      </text>
      <rect x="614" y="22" width="56" height="26" fill={C.white} stroke={C_borderStrong} rx="6" />
      <text x="642" y="39" textAnchor="middle" fontSize="8" fill={C.muted}>
        로그아웃
      </text>
    </>
  );
}

function GuideShellFigure() {
  return (
    <Wrap label="판매자센터 레이아웃">
      <svg viewBox="0 0 720 368" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="368" fill={C.page} rx="8" />
        <rect x="8" y="8" width="184" height="352" fill={C.sidebar} rx="10" />
        <SidebarNavMock activeIndex={2} badgeIndex={4} />
        <rect x="200" y="8" width="512" height="352" fill={C.page} rx="10" />
        <rect x="200" y="8" width="512" height="52" fill={C.white} stroke={C.border} />
        <TopBarMock title="상품" />
        <rect x="212" y="72" width="488" height="276" fill={C.white} stroke={C.border} rx="8" />
        <text x="224" y="96" fontSize="11" fontWeight="600" fill={C.text}>
          상품 목록 · + 새 상품 · 엑셀 일괄 등록
        </text>
        <rect x="224" y="108" width="464" height="48" fill="#f9fafb" stroke={C.border} rx="6" />
        <text x="236" y="128" fontSize="10" fill={C.text}>
          스카프 · 29,000원
        </text>
        <text x="236" y="144" fontSize="9" fill={C.muted}>
          판매자 상품코드 SCARF-01 · 자동수락 2/5
        </text>
        <rect x="580" y="118" width="96" height="28" fill={C.primary} rx="6" />
        <text x="628" y="136" textAnchor="middle" fontSize="9" fill="#fff">
          수정
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
  const fields = [
    '상품명',
    '판매자 상품코드',
    '판매가 · 재고',
    '자동으로 주문 수락 (ON)',
    '판매 옵션 (컬러 / M,L)',
    '상품 태그 · 함께 추천',
  ];
  return (
    <Wrap label="상품 수정 화면">
      <svg viewBox="0 0 720 340" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="340" fill={C.page} rx="8" />
        <rect x="16" y="16" width="688" height="44" fill={C.white} stroke={C.border} rx="8" />
        <text x="28" y="42" fontSize="11" fill={C.text}>
          ← 목록 · 손님 미리보기
        </text>
        {fields.map((l, i) => (
          <g key={l}>
            <text x="28" y={78 + i * 38} fontSize="10" fontWeight="600" fill={C.text}>
              {l}
            </text>
            <rect x="28" y={84 + i * 38} width="664" height="26" fill={C.white} stroke={C.borderStrong} rx="6" />
          </g>
        ))}
        <rect x="16" y="298" width="688" height="28" fill={C.primary} rx="8" />
        <text x="360" y="316" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">
          저장
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
    <Wrap label="주문 탭 — 실제 버튼">
      <svg viewBox="0 0 720 280" className="owner-sc-guide__svg" role="img">
        <rect width="720" height="280" fill={C.page} rx="8" />
        <text x="24" y="28" fontSize="12" fontWeight="700" fill={C.text}>
          주문 (수락·거절) 탭
        </text>
        <rect x="24" y="40" width="672" height="120" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="64" fontSize="10" fontWeight="600" fill={C.text}>
          GUCCI-1042 · demo@shopper.com
        </text>
        <text x="40" y="82" fontSize="9" fill={C.muted}>
          스카프 · 블랙 / M · 29,000원
        </text>
        <rect x="40" y="92" width="72" height="24" fill={C.primary} rx="5" />
        <text x="76" y="108" textAnchor="middle" fontSize="9" fill="#fff">
          주문 수락
        </text>
        <rect x="120" y="92" width="96" height="24" fill={C.white} stroke={C_borderStrong} rx="5" />
        <text x="168" y="108" textAnchor="middle" fontSize="8" fill={C.muted}>
          주문 취소(거절)
        </text>
        <rect x="224" y="92" width="104" height="24" fill="#fff9db" stroke="#ffe066" rx="5" />
        <text x="276" y="108" textAnchor="middle" fontSize="8" fill={C.warn}>
          손님에게 수정 요청
        </text>
        <rect x="24" y="172" width="672" height="96" fill={C.white} stroke={C.border} rx="8" />
        <text x="40" y="196" fontSize="10" fontWeight="600" fill={C.text}>
          발주·배송 탭 (수락 후)
        </text>
        <rect x="40" y="208" width="200" height="22" fill="#f9fafb" stroke={C.border} rx="4" />
        <text x="48" y="223" fontSize="8" fill={C.muted}>
          송장 번호 (선택)
        </text>
        <rect x="248" y="204" width="72" height="26" fill={C.primary} rx="5" />
        <text x="284" y="221" textAnchor="middle" fontSize="9" fill="#fff">
          배송 시작
        </text>
        <rect x="328" y="204" width="72" height="26" fill={C.white} stroke={C_borderStrong} rx="5" />
        <text x="364" y="221" textAnchor="middle" fontSize="9" fill={C.muted}>
          배송 완료
        </text>
        <text x="40" y="252" fontSize="9" fill={C.success}>
          ⚡ 자동 수락된 주문은 이 탭에 바로 올 수 있음
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

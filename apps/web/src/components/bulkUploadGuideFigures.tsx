import type { ReactNode } from 'react';

/** 엑셀 일괄등록 매뉴얼 — 인라인 SVG (배포 경로·인코딩 이슈 방지) */

function FigureWrap({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="owner-bulk-guide__figure-wrap" aria-label={label}>
      {children}
    </figure>
  );
}

export function BulkGuideFigureSteps() {
  return (
    <FigureWrap label="양식 다운로드, 작성, 업로드 순서">
      <svg viewBox="0 0 720 120" className="owner-bulk-guide__svg" role="img">
        <rect width="720" height="120" fill="#f9fafb" rx="8" />
        <rect x="24" y="36" width="200" height="64" fill="#fff" stroke="#3182f6" rx="8" />
        <text x="124" y="58" textAnchor="middle" fontSize="12" fontWeight="700" fill="#3182f6">
          1. 양식 다운로드
        </text>
        <text x="124" y="78" textAnchor="middle" fontSize="10" fill="#4e5968">
          6행부터 입력
        </text>
        <path d="M234 68h40" stroke="#8b95a1" strokeWidth="2" />
        <polygon points="274,68 266,64 266,72" fill="#8b95a1" />
        <rect x="284" y="36" width="200" height="64" fill="#fff" stroke="#3182f6" rx="8" />
        <text x="384" y="58" textAnchor="middle" fontSize="12" fontWeight="700" fill="#3182f6">
          2. 엑셀 작성
        </text>
        <text x="384" y="78" textAnchor="middle" fontSize="10" fill="#4e5968">
          그림예시 시트 참고
        </text>
        <path d="M494 68h40" stroke="#8b95a1" strokeWidth="2" />
        <polygon points="534,68 526,64 526,72" fill="#8b95a1" />
        <rect x="544" y="36" width="152" height="64" fill="#3182f6" rx="8" />
        <text x="620" y="58" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
          3. 엑셀 업로드
        </text>
        <text x="620" y="78" textAnchor="middle" fontSize="10" fill="#e3f2fd">
          오류 시 행 번호 표시
        </text>
      </svg>
    </FigureWrap>
  );
}

export function BulkGuideFigureOneRow() {
  return (
    <FigureWrap label="한 줄당 옵션 조합 하나">
      <svg viewBox="0 0 720 200" className="owner-bulk-guide__svg" role="img">
        <rect width="720" height="200" fill="#f9fafb" rx="8" />
        <text x="24" y="32" fontSize="16" fontWeight="700" fill="#191f28">
          한 행 = 옵션 조합 1개
        </text>
        <text x="24" y="52" fontSize="12" fill="#4e5968">
          상품 1개 · 조합 3개 → 같은 코드로 행 3개
        </text>
        <rect x="24" y="68" width="672" height="28" fill="#37474f" />
        <text x="32" y="87" fontSize="11" fill="#fff">
          상품코드
        </text>
        <text x="120" y="87" fontSize="11" fill="#fff">
          옵션명
        </text>
        <text x="240" y="87" fontSize="11" fill="#fff">
          옵션값
        </text>
        <text x="400" y="87" fontSize="11" fill="#fff">
          손님 화면
        </text>
        <rect x="24" y="96" width="672" height="26" fill="#fff" stroke="#e5e8eb" />
        <text x="32" y="113" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          SCARF-01
        </text>
        <text x="120" y="113" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          컬러|사이즈
        </text>
        <text x="240" y="113" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          블랙|M
        </text>
        <text x="400" y="113" fontSize="11" fill="#1565c0">
          블랙 / M
        </text>
        <rect x="24" y="122" width="672" height="26" fill="#f1f8e9" stroke="#e5e8eb" />
        <text x="32" y="139" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          SCARF-01
        </text>
        <text x="120" y="139" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          컬러|사이즈
        </text>
        <text x="240" y="139" fontSize="11" fill="#191f28" fontFamily="ui-monospace, monospace">
          화이트|L
        </text>
        <text x="400" y="139" fontSize="11" fill="#1565c0">
          화이트 / L
        </text>
      </svg>
    </FigureWrap>
  );
}

export function BulkGuideFigureOptions() {
  return (
    <FigureWrap label="옵션 입력 올바른 예와 잘못된 예">
      <svg viewBox="0 0 720 280" className="owner-bulk-guide__svg" role="img">
        <rect width="720" height="280" fill="#f9fafb" rx="8" />
        <text x="24" y="28" fontSize="16" fontWeight="700" fill="#191f28">
          옵션 2개(컬러·사이즈)
        </text>
        <rect x="24" y="44" width="328" height="220" fill="#fff5f5" stroke="#ffcdd2" rx="6" />
        <text x="36" y="68" fontSize="13" fontWeight="700" fill="#c62828">
          X 행마다 옵션 종류만 나누기
        </text>
        <text x="36" y="92" fontSize="11" fill="#4e5968">
          1행: 컬러 / 블랙
        </text>
        <text x="36" y="108" fontSize="11" fill="#4e5968">
          2행: 사이즈 / M
        </text>
        <rect x="368" y="44" width="328" height="220" fill="#f1f8e9" stroke="#c5e1a5" rx="6" />
        <text x="380" y="68" fontSize="13" fontWeight="700" fill="#2e7d32">
          O 한 칸에 | 로 묶기
        </text>
        <text x="380" y="92" fontSize="11" fill="#4e5968">
          옵션명: 컬러|사이즈
        </text>
        <text x="380" y="108" fontSize="11" fill="#4e5968">
          옵션값: 블랙|M
        </text>
        <text x="380" y="132" fontSize="11" fill="#2e7d32">
          손님 화면: 블랙 / M
        </text>
        <rect x="380" y="148" width="300" height="22" fill="#fff" stroke="#a5d6a7" />
        <text x="388" y="163" fontSize="10" fontFamily="ui-monospace, monospace" fill="#333">
          블랙|M
        </text>
        <rect x="380" y="174" width="300" height="22" fill="#fff" stroke="#a5d6a7" />
        <text x="388" y="189" fontSize="10" fontFamily="ui-monospace, monospace" fill="#333">
          화이트|L
        </text>
      </svg>
    </FigureWrap>
  );
}

export function BulkGuideFigureFillRow() {
  return (
    <FigureWrap label="같은 상품 여러 행 — 비우거나 매번 채우기">
      <svg viewBox="0 0 720 220" className="owner-bulk-guide__svg" role="img">
        <rect width="720" height="220" fill="#f9fafb" rx="8" />
        <text x="24" y="32" fontSize="16" fontWeight="700" fill="#191f28">
          같은 상품코드 — 행은 조합 개수만큼
        </text>
        <text x="24" y="50" fontSize="11" fill="#4e5968">
          상품 칸: 아래 행 비워도 됨 · 매 행 똑같이 채워도 됨
        </text>
        <rect x="24" y="58" width="672" height="24" fill="#37474f" />
        <text x="32" y="74" fontSize="10" fill="#fff">
          코드
        </text>
        <text x="100" y="74" fontSize="10" fill="#fff">
          상품명
        </text>
        <text x="200" y="74" fontSize="10" fill="#fff">
          판매가
        </text>
        <text x="280" y="74" fontSize="10" fill="#fff">
          대표이미지
        </text>
        <text x="480" y="74" fontSize="10" fill="#fff">
          옵션명
        </text>
        <text x="580" y="74" fontSize="10" fill="#fff">
          옵션값
        </text>
        <rect x="24" y="82" width="672" height="28" fill="#e3f2fd" stroke="#90caf9" />
        <text x="32" y="100" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          SB-03
        </text>
        <text x="100" y="100" fontSize="10" fill="#191f28">
          테스트
        </text>
        <text x="200" y="100" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          50000
        </text>
        <text x="280" y="100" fontSize="9" fill="#191f28" fontFamily="ui-monospace, monospace">
          https://…
        </text>
        <text x="480" y="100" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          컬러|사이즈
        </text>
        <text x="580" y="100" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          블랙|M
        </text>
        <rect x="24" y="110" width="672" height="28" fill="#fff" stroke="#e5e8eb" />
        <text x="32" y="128" fontSize="10" fill="#8b95a1">
          SB-03 · (상품 칸 비움)
        </text>
        <text x="480" y="128" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          컬러|사이즈
        </text>
        <text x="580" y="128" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          화이트|L
        </text>
        <rect x="24" y="138" width="672" height="28" fill="#f1f8e9" stroke="#c5e1a5" />
        <text x="32" y="156" fontSize="10" fill="#191f28">
          SB-03 · 테스트 · 50000 · https…
        </text>
        <text x="480" y="156" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          컬러|사이즈
        </text>
        <text x="580" y="156" fontSize="10" fill="#191f28" fontFamily="ui-monospace, monospace">
          블랙|L
        </text>
        <text x="400" y="156" fontSize="9" fill="#2e7d32">
          ↑ 매 행 채워도 OK
        </text>
        <text x="24" y="192" fontSize="12" fill="#4e5968">
          5행 회색 · #예시 — 업로드 제외
        </text>
      </svg>
    </FigureWrap>
  );
}

export const BULK_GUIDE_FIGURES = [
  BulkGuideFigureSteps,
  BulkGuideFigureOneRow,
  BulkGuideFigureOptions,
  BulkGuideFigureFillRow,
] as const;

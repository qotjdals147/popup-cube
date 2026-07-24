/**
 * Build Word-native styled 시안 DOCX (PDF HTML content parity).
 * Uses docx package — tables, shading, borders, headings work in Word/WPS.
 */
const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  AlignmentType,
  VerticalAlign,
  HeadingLevel,
  PageBreak,
  Header,
  Footer,
  PageNumber,
} = require('docx');

const ROOT = __dirname;
const ASSETS = path.join(ROOT, 'pdf-assets');
const OUT = path.join(ROOT, '온라인-팝업스토어-플랫폼-시안.docx');

// Design tokens (match PDF)
const C = {
  ink: '1A1A2E',
  navy: '0F3460',
  navyDeep: '16213E',
  navyMid: '163A66',
  rose: 'E94560',
  gold: 'C4A35A',
  paper: 'F7F5F0',
  paper2: 'EFEAE0',
  line: 'D4CFC4',
  muted: '5C6370',
  white: 'FFFFFF',
  rowAlt: 'F3F6FA',
  highlight: 'EAF0F7',
  liveBg: '1F6B4A',
  mockBg: '0F3460',
};

const FONT = 'Malgun Gothic'; // Word에서 안정적; 굴림 대체
const PAGE_W = 11906; // A4 twips
const PAGE_H = 16838;
const MARGIN = 720; // ~0.5"
const CONTENT_W = PAGE_W - MARGIN * 2; // ~10466 twips
const IMG_W_PX = 620; // ~6.5" at 96dpi-ish scaling in docx
const PHONE_W_PX = 420;

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};
const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'C5D0E0' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C5D0E0' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'C5D0E0' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'C5D0E0' },
};
const goldLeft = {
  top: { style: BorderStyle.SINGLE, size: 4, color: C.line },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line },
  left: { style: BorderStyle.SINGLE, size: 24, color: C.rose },
  right: { style: BorderStyle.SINGLE, size: 4, color: C.line },
};

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? 21, // 10.5pt
    bold: !!opts.bold,
    color: opts.color ?? C.ink,
    italics: !!opts.italics,
  });
}

function p(parts, opts = {}) {
  const children = Array.isArray(parts)
    ? parts.map((x) => (typeof x === 'string' ? run(x) : x))
    : [typeof parts === 'string' ? run(parts) : parts];
  return new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 320 },
    alignment: opts.align ?? AlignmentType.LEFT,
    children,
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 18, color: C.navy, space: 8 },
    },
    children: [run(text, { size: 28, bold: true, color: C.navy })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [run(text, { size: 24, bold: true, color: C.navyDeep })],
  });
}

/** Shaded callout / lead box */
function box(paragraphs, opts = {}) {
  const bg = opts.bg ?? C.paper2;
  const border = opts.roseLeft ? goldLeft : thinBorder;
  const inner = paragraphs.map((t, i) =>
    p(typeof t === 'string' ? [run(t, { size: 21 })] : t, {
      after: i === paragraphs.length - 1 ? 40 : 80,
    })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: border,
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: bg },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: inner,
          }),
        ],
      }),
    ],
  });
}

function cell(text, opts = {}) {
  const fill = opts.fill ?? C.white;
  const bold = !!opts.bold;
  const color = opts.color ?? C.ink;
  const align = opts.align ?? AlignmentType.CENTER;
  const width = opts.width ?? Math.floor(CONTENT_W / 2);
  return new TableCell({
    borders: thinBorder,
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { after: 0, line: 276 },
        children: [run(strip(text), { size: 18, bold, color })],
      }),
    ],
  });
}

function strip(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function makeTable(headers, rows, opts = {}) {
  const cols = headers.length;
  const colW = Math.floor(CONTENT_W / cols);
  const widths = headers.map(() => colW);
  // adjust last cells to fill
  widths[widths.length - 1] = CONTENT_W - colW * (cols - 1);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, {
        fill: i === cols - 1 && opts.highlightLast ? C.navyMid : C.navy,
        bold: true,
        color: C.white,
        width: widths[i],
      })
    ),
  });

  const body = rows.map((row, ri) => {
    const alt = ri % 2 === 1;
    return new TableRow({
      children: row.map((c, ci) => {
        let fill = alt ? C.rowAlt : C.white;
        let bold = false;
        let color = C.ink;
        if (opts.highlightLast && ci === cols - 1) {
          fill = C.highlight;
          bold = true;
          color = C.navyDeep;
        }
        if (opts.labelFirst && ci === 0) {
          fill = 'F7F8FB';
          bold = true;
          color = '3A4556';
        }
        return cell(c, { fill, bold, color, width: widths[ci] });
      }),
    });
  });

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...body],
  });
}

function loadImg(name) {
  const pth = path.join(ASSETS, name);
  if (!fs.existsSync(pth)) {
    console.warn('missing', name);
    return null;
  }
  return fs.readFileSync(pth);
}

function figure(file, caption, badge, opts = {}) {
  const data = loadImg(file);
  const blocks = [];
  if (!data) {
    blocks.push(p(`[이미지 없음: ${file}]`, { after: 80 }));
    return blocks;
  }
  const w = opts.phone ? PHONE_W_PX : IMG_W_PX;
  // approximate height preserving 16:9 for desktop, phones taller-ish — use ratio from options
  const ratio = opts.phone ? 1.15 : 0.56;
  const h = Math.round(w * ratio);

  blocks.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 8 },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 4 },
        left: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 8 },
        right: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 8 },
      },
      children: [
        new ImageRun({
          type: 'png',
          data,
          transformation: { width: w, height: h },
          altText: { title: caption, description: caption, name: file },
        }),
      ],
    })
  );

  const badgeColor = badge === '실제 화면' ? C.liveBg : C.mockBg;
  blocks.push(
    new Paragraph({
      spacing: { after: 200, before: 40 },
      children: [
        new TextRun({
          text: ` ${badge} `,
          font: FONT,
          size: 16,
          bold: true,
          color: C.white,
          highlight: undefined,
        }),
        // Word doesn't support bg on TextRun easily without shading via broken — use unicode mark + color
        run(`  ${caption}`, { size: 17, color: C.muted }),
      ],
    })
  );
  // Better badge: small table cell
  blocks.pop();
  blocks.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [1400, CONTENT_W - 1400],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: noBorder,
              width: { size: 1400, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: badgeColor },
              margins: { top: 40, bottom: 40, left: 60, right: 60 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run(badge, { size: 15, bold: true, color: C.white })],
                }),
              ],
            }),
            new TableCell({
              borders: noBorder,
              width: { size: CONTENT_W - 1400, type: WidthType.DXA },
              margins: { top: 40, bottom: 40, left: 100, right: 40 },
              children: [
                new Paragraph({
                  children: [run(caption, { size: 17, color: C.muted })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  blocks.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
  return blocks;
}

function bullet(items) {
  return items.map(
    (t) =>
      new Paragraph({
        spacing: { after: 80 },
        indent: { left: 200 },
        border: {
          left: { style: BorderStyle.SINGLE, size: 18, color: C.rose, space: 10 },
        },
        children: [
          run('  ', { size: 20 }),
          ...parseInline(t),
        ],
      })
  );
}

function parseInline(text) {
  // simple **bold** segments
  const parts = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(run(text.slice(last, m.index), { size: 20 }));
    parts.push(run(m[1], { size: 20, bold: true }));
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(run(text.slice(last), { size: 20 }));
  return parts.length ? parts : [run(text, { size: 20 })];
}

function paraRich(segments) {
  // segments: string | {t, bold}
  const children = segments.map((s) =>
    typeof s === 'string' ? run(s, { size: 21 }) : run(s.t, { size: 21, bold: !!s.bold })
  );
  return p(children, { after: 160 });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function briefingBox(items) {
  return box(
    [
      [run('구현 시 참고할 수 있는 방향', { size: 18, bold: true, color: C.muted })],
      ...items.map((t) => parseInline(t)),
    ],
    { bg: 'EAF0F7' }
  );
}

function cover() {
  const w = CONTENT_W;
  return new Table({
    width: { size: w, type: WidthType.DXA },
    columnWidths: [w],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 24, color: C.gold },
              bottom: { style: BorderStyle.SINGLE, size: 24, color: C.gold },
              left: { style: BorderStyle.SINGLE, size: 24, color: C.gold },
              right: { style: BorderStyle.SINGLE, size: 24, color: C.gold },
            },
            width: { size: w, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: C.navyDeep },
            margins: { top: 600, bottom: 600, left: 400, right: 400 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [run('BUSINESS DESIGN · SCREEN DECK', { size: 16, color: C.gold, bold: true })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [run('온라인 팝업스토어', { size: 44, bold: true, color: C.white })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 280 },
                children: [run('플랫폼 시안', { size: 44, bold: true, color: C.gold })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [run('오프라인 팝업처럼 「들어가서 구경하는」 느낌을', { size: 20, color: 'E8E6E0' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [run('온라인에 만들고,', { size: 20, color: 'E8E6E0' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [run('그 안에서 실물 상품을 주문·배송까지', { size: 20, color: 'E8E6E0' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 320 },
                children: [run('이어 주는 플랫폼입니다.', { size: 20, color: 'E8E6E0' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [run('2026년 7월', { size: 18, color: C.gold })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [run('※ 아래 그림 중 일부는 이미 동작하는 화면,', { size: 16, color: 'A8B0BC' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 360 },
                children: [run('일부는 완성 모습을 미리 그린 시안입니다.', { size: 16, color: 'A8B0BC' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [run('POP-UP CUBE', { size: 26, bold: true, color: C.white })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function main() {
  const children = [];

  // —— Cover ——
  children.push(cover());
  children.push(pageBreak());

  // —— Intro ——
  children.push(h2('이 문서에서 말하려는 것'));
  children.push(
    box(
      [
        [
          run('이 플랫폼은 ', { size: 21 }),
          run('온라인 팝업스토어를 열고 실물을 파는 쇼핑몰', { size: 21, bold: true }),
          run('입니다.', { size: 21 }),
        ],
        [run('일반 회원은 캐릭터로 매장에 들어가 돌아다니고, 테이블·옷걸이 앞에서 상품을 보고 삽니다.', { size: 21 })],
        [run('스토어 관리자는 팝업을 열고, 상품을 올리고, 주문을 처리합니다.', { size: 21 })],
      ],
      { bg: 'FFF8F0', roseLeft: true }
    )
  );
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  children.push(
    paraRich([
      '픽셀로 그린 매장, 채팅, 구매 후 작은 이벤트는 쇼핑을 더 재미있게 만드는 요소이고, 결국 중심은 ',
      { t: '실물 구매 · 배송 · 주문 · 스토어 관리', bold: true },
      '입니다.',
    ])
  );
  children.push(h3('일반 회원은 앱 · 스토어 관리는 PC 웹'));
  children.push(
    paraRich([
      { t: '매장·상품·주문 관리는 PC 웹(스토어 관리자 전용)', bold: true },
      '에서 하고, ',
      { t: '일반 회원의 쇼핑·팝업 입장은 모바일 앱', bold: true },
      '에서 합니다. 판매자용 관리 사이트와 회원용 앱을 나누는 일반 쇼핑몰과 비슷한 구조입니다.',
    ])
  );
  children.push(
    ...figure('web-app-split-sian.png', 'PC 웹 = 스토어 관리 · 모바일 앱 = 일반 회원 · 스토어 관리자', '완성 시안')
  );

  // —— 1 ——
  children.push(h2('1. 어떻게 들어오나 — 웹 / 앱 로그인'));
  children.push(
    paraRich([
      { t: 'PC 웹', bold: true },
      '은 스토어를 관리하는 사이트입니다. 로그인은 ',
      { t: '스토어 관리자 로그인', bold: true },
      '만 있습니다. ',
      { t: '모바일 앱', bold: true },
      '에서는 ',
      { t: '일반 회원 로그인', bold: true },
      '과 ',
      { t: '스토어 관리자 로그인', bold: true },
      '을 나눕니다. 일반 회원은 팝업에 들어가 사고, 스토어 관리자도 앱으로 자기 매장에 들어가면 닉네임에 왕관 등 표시가 납니다.',
    ])
  );
  children.push(
    ...figure('01-landing-web-owner.png', 'PC 웹 — 스토어 관리자 로그인만 (일반 회원 로그인 없음)', '완성 시안')
  );
  children.push(...figure('02-login-web-owner.png', 'PC 웹 — 스토어 관리자 로그인 (+ 자동 로그인)', '완성 시안'));
  children.push(
    ...figure('m01-landing-dual-roles.png', '앱 — 일반 회원 로그인 / 스토어 관리자 로그인', '모바일 시안', {
      phone: true,
    })
  );

  children.push(pageBreak());

  // —— 2 ——
  children.push(h2('2. 왜 이런 플랫폼이 필요한가'));
  children.push(
    p(
      '오프라인 팝업은 분위기가 좋지만, 기간과 장소가 짧고, 멀리 사는 사람은 오기 어렵습니다. 반대로 일반 쇼핑몰은 편하지만 「팝업에 와 본」 느낌이 약합니다.'
    )
  );
  children.push(
    makeTable(
      ['오프라인 팝업만으로 아쉬운 점', '플랫폼 방식'],
      [
        ['기간·장소가 한정됨', '링크로 언제든, 어디서든 입장'],
        ['줄 서기, 이동 부담', '집에서도 매장을 「들어가」 구경'],
        ['한 번 가본 사람 중심', '다시 들어오고, 다른 사람과 같이 볼 수 있음'],
        ['자사몰은 상품 목록 위주', '공간·진열·이벤트까지 있는 「팝업」 느낌'],
        ['가상세계만 있으면 실물 판매와 멀어짐', '구경한 뒤 실물 주문·배송까지 한곳에서'],
      ],
      { highlightLast: true }
    )
  );

  children.push(h2('3. 일반 쇼핑몰·게임형 서비스와 무엇이 다른가'));
  children.push(
    makeTable(
      ['', '일반 쇼핑몰', '게임형 가상세계', '플랫폼'],
      [
        ['핵심', '빨리 구매', '공간에서 놀기', '들어가 보고, 실물도 삼'],
        ['매장', '상품 목록', '맵 제작이 무거움', '스토어 관리자가 팝업 공간을 꾸밈'],
        ['이벤트', '쿠폰', '게임 패스', '구매 후 할인 또는 사은품(선택)'],
      ],
      { highlightLast: true, labelFirst: true }
    )
  );
  children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  children.push(
    box(
      [
        [
          run('「팝업에 온 기분」으로 실물을 사고, 산 뒤에도 공간·아바타에서 그 경험이 이어지는', {
            size: 21,
            bold: true,
          }),
          run(' 플랫폼입니다.', { size: 21 }),
        ],
      ],
      { bg: C.highlight, roseLeft: true }
    )
  );

  children.push(pageBreak());

  // —— 4 ——
  children.push(h2('4. 일반 회원은 이렇게 이용합니다 (모바일 앱)'));
  children.push(h3('4-1. 로그인 · 동네별 팝업 고르기'));
  children.push(
    paraRich([
      '일반 회원은 ',
      { t: '앱', bold: true },
      '에서 ',
      { t: '일반 회원 로그인', bold: true },
      '하면 ',
      { t: '지금 열려 있는 여러 팝업', bold: true },
      '이 보입니다. 같은 브랜드라도 ',
      { t: '동네(지역)마다 다른 팝업', bold: true },
      '을 열 수 있습니다. (예: 성수동 GUCCI, 청담 GUCCI — 별개 매장) 카드를 누르면 매장 정보를 보고, 「입장하기」로 그 팝업 안으로 들어갑니다.',
    ])
  );
  children.push(
    ...figure(
      'm02-login-autologin-mobile.png',
      '앱 — 일반 회원 로그인 (+ 자동 로그인)',
      '모바일 시안',
      { phone: true }
    )
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'm03-home-neighborhood-mobile.png',
      '앱 홈 — 동네 필터(성수동·청담·홍대…) + 구역별 열린 팝업 목록',
      '모바일 시안',
      { phone: true }
    )
  );
  children.push(pageBreak());
  children.push(
    ...figure('m04-enter-modal-mobile.png', '입장 확인 — 팝업 선택 후 매장 정보 확인, 입장', '모바일 시안', { phone: true })
  );

  children.push(h3('4-2. 매장 안을 걸어 다니며 본다'));
  children.push(
    paraRich([
      '들어가면 ',
      { t: '픽셀로 그린 팝업 매장', bold: true },
      '이 나옵니다. 옆방·옆 공간이 살짝 보이는 구조로 공간감을 줍니다. 캐릭터로 이동하고, 같은 매장의 다른 사람과 채팅할 수 있습니다. 화면 아래에는 자주 쓰는 버튼만 둡니다.',
    ])
  );
  children.push(
    ...bullet([
      '**상호작용** — 앞에 선 테이블·옷걸이에 올려둔 상품 보기',
      '**채팅** — 같은 매장 사람들과 대화',
      '**장바구니** — 담아 둔 상품·결제',
      '**전체 상품** — 이 매장 상품을 한눈에 보기',
    ])
  );
  children.push(
    ...figure('m05-world-mobile.png', '앱 — 팝업 매장 안 · 이동·채팅·쇼핑', '모바일 시안', {
      phone: true,
    })
  );

  children.push(h3('4-3. 진열된 상품을 고른다'));
  children.push(
    paraRich([
      '오프라인처럼 ',
      { t: '테이블이나 옷걸이 앞', bold: true },
      '에 서서 상호작용하면, 그 위에 올려둔 상품만 뜹니다. 상품을 고른 뒤 ',
      { t: '장바구니에 담고, 바로 구매하거나 착용해보기', bold: true },
      '를 선택할 수 있습니다. 착용해보기는 아바타에 입혀 미리 보는 기능입니다.',
    ])
  );
  children.push(
    ...figure(
      'm06-display-interact-mobile.png',
      '앱 — 테이블 앞에서 진열 상품 선택, 담기·구매·착용해보기',
      '모바일 시안',
      { phone: true }
    )
  );
  children.push(pageBreak());
  children.push(
    ...figure('m07-tryon-mobile.png', '앱 — 착용해보기 · 아바타에 입혀 본 모습', '모바일 시안', { phone: true })
  );

  children.push(h3('4-4. 상품 상세페이지'));
  children.push(
    paraRich([
      '진열 팝업의 「자세히 보기」나 전체 상품 목록에서 카드를 누르면 ',
      { t: '일반 쇼핑몰과 같은 상품 상세', bold: true },
      '로 이어집니다. 여기서는 월드용 픽셀 그림이 아니라 ',
      { t: '실제 상품 사진', bold: true },
      '으로 설명·옵션·가격을 보여 줍니다. 화면 아래에는 ',
      { t: '장바구니 담기', bold: true },
      '와 ',
      { t: '바로 구매', bold: true },
      '가 고정되고, 그 아래에 ',
      { t: '착용해보기', bold: true },
      '로 아바타 미리보기로 넘어갈 수 있습니다.',
    ])
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'm14-product-detail-mobile.png',
      '앱 — 상품 상세 · 실사 갤러리 · 하단 담기/구매/착용해보기',
      '모바일 시안',
      { phone: true }
    )
  );
  children.push(
    box(
      [
        [
          run('앞에서 본 홈·매장·쇼핑 흐름은 ', { size: 21 }),
          run('모두 모바일 앱', { size: 21, bold: true }),
          run(' 기준입니다. ', { size: 21 }),
          run('쇼핑은 실사, 팝업 월드는 픽셀', { size: 21, bold: true }),
          run(' — 같은 상품이라도 용도에 따라 이미지를 나눕니다.', { size: 21 }),
        ],
      ],
      { bg: C.highlight, roseLeft: true }
    )
  );

  children.push(pageBreak());

  // —— 5 ——
  children.push(h2('5. 사는 흐름 — 장바구니 · 배송 · 혜택 (모바일 앱)'));
  children.push(
    paraRich([
      '결제·배송은 일반 쇼핑몰과 같습니다. 상품을 담고, 배송지를 넣고, 주문이 남습니다.',
    ])
  );
  children.push(h3('5-1. 전체 상품 · 장바구니 · 결제'));
  children.push(
    paraRich([
      'HUD의 「전체 상품」이나 진열에서 고른 뒤 상세를 거치면 장바구니·결제로 이어집니다. 목록·썸네일도 ',
      { t: '실사 사진', bold: true },
      ' 기준입니다.',
    ])
  );
  children.push(...figure('m08-shop-panel-mobile.png', '앱 — 매장 전체 상품 목록', '모바일 시안', { phone: true }));
  children.push(pageBreak());
  children.push(
    ...figure('m09-checkout-mobile.png', '앱 — 장바구니, 배송지, 혜택 선택', '모바일 시안', { phone: true })
  );

  children.push(pageBreak());
  children.push(h3('5-2. 배송지'));
  children.push(
    ...figure('m10-mypage-mobile.png', '앱 — 마이페이지 · 배송지 등록·관리', '모바일 시안', { phone: true })
  );
  children.push(h3('5-3. 구매 후 혜택'));
  children.push(p('실물 결제가 끝난 뒤, 일반 회원은 혜택 형태만 고릅니다.'));
  children.push(
    ...bullet([
      '실물 상품 구매·결제',
      '그다음 — **할인**(확정) 또는 **사은품 뽑기**(추가 결제 없음) 중 선택',
    ])
  );
  children.push(
    box(
      [
        [run('사은품 뽑기는 결제가 끝난 뒤 선택하는 혜택입니다. 추가 결제 없이, 이미 산 주문에 붙는 사은품·할인에 가깝습니다.', { size: 21 })],
      ],
      { bg: C.highlight, roseLeft: true }
    )
  );

  children.push(pageBreak());

  // —— 6 ——
  children.push(h2('6. 스토어 관리자는 무엇을 하나 (관리 = PC 웹)'));
  children.push(
    paraRich([
      '스토어 관리자는 ',
      { t: 'PC 웹', bold: true },
      '에서 ',
      { t: '스토어 관리자 로그인', bold: true },
      ' 후 팝업을 열고, 상품을 올리고, 매장 안 ',
      { t: '진열 가구', bold: true },
      '(테이블·옷걸이 등)에 상품을 배치하며, 들어온 주문을 확인합니다. 앱에서도 ',
      { t: '스토어 관리자 로그인', bold: true },
      '으로 자기 매장에 들어가 볼 수 있고, 본인 매장에서는 닉네임에 왕관 등이 표시됩니다.',
    ])
  );
  children.push(
    ...bullet([
      '매장 만들기 — 이름, 대표 이미지, 설명, **팝업 지역(동네)** 지정',
      '상품 등록 — 기본정보, **상세 설명**, **실사 이미지**, **2D 월드용** 스프라이트, 앱 미리보기',
      '진열 배치 — 테이블·옷걸이에 상품을 올리고 순서 바꾸기',
      '주문 관리 — 누가, 어디로, 무엇을 샀는지 확인',
    ])
  );
  children.push(
    ...figure(
      'owner-store-region-sian.png',
      '스토어 관리 — 매장 개설 시 주소 검색으로 팝업 지역(동네) 지정',
      '완성 시안'
    )
  );

  children.push(h3('6-1. 상품 등록 · 상세 작성'));
  children.push(
    paraRich([
      '점주는 PC 웹에서 상품을 등록·수정할 때 ',
      { t: '탭으로 나눠', bold: true },
      ' 한곳에서 마칩니다. 아래 순서대로 작성하고, 각 탭마다 손님이 보게 될 화면과 연결됩니다.',
    ])
  );
  children.push(
    ...bullet([
      '**기본정보** — 이름·가격·판매 여부·카테고리',
      '**상세 설명** — 앱 상품 상세에 나올 본문',
      '**이미지(실사)** — 쇼핑·주문·목록용 사진',
      '**2D 월드용** — 팝업 안 진열·착용용 픽셀 스프라이트',
      '**미리보기** — 앱 상세(실사)와 2D 월드(픽셀)를 나란히 확인',
    ])
  );
  children.push(
    ...figure('owner-product-tab-basic-sian.png', '① 기본정보 — 상품명, 판매가, 판매 여부, 카테고리, 재고', '완성 시안')
  );
  children.push(pageBreak());
  children.push(
    ...figure('owner-product-tab-detail-sian.png', '② 상세 설명 — 앱 상세 본문 작성·미리보기', '완성 시안')
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'owner-product-tab-photo-sian.png',
      '③ 이미지(실사) — 쇼핑용 사진 업로드 · 오른쪽 앱 상세(실사) 확인',
      '완성 시안'
    )
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'owner-product-tab-pixel-sian.png',
      '④ 2D 월드용 — 실사에서 진열·착용용 픽셀 스프라이트 생성',
      '완성 시안'
    )
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'owner-product-tab-preview-sian.png',
      '⑤ 미리보기 — 왼쪽 앱 상세(실사) / 오른쪽 2D 월드(픽셀) 나란히 확인',
      '완성 시안'
    )
  );
  children.push(
    paraRich([
      '손님이 앱에서 보는 상세와 월드에서 보는 픽셀은 ',
      { t: '같은 상품 등록 화면에서 연결', bold: true },
      '합니다. 2D 변환·4방향 검수 등 자세한 흐름은 다음 절에서 이어집니다.',
    ])
  );

  children.push(h3('6-2. 2D 월드용 — 실사에서 픽셀 스프라이트 만들기'));
  children.push(
    paraRich([
      '「2D 월드용」탭에서는 대표 실사 사진을 바탕으로 ',
      { t: '팝업 안에 쓸 픽셀 스프라이트', bold: true },
      '를 만듭니다. 점주만 변환·승인할 수 있고, 손님은 완성된 월드·착용해보기에서만 봅니다. 의류·가방 등은 ',
      { t: '전·후·좌·우 네 방향', bold: true },
      ' 미리보기로 검수한 뒤 월드에 반영합니다. 테이블 위 진열용은 방향이 적은 단순 스프라이트로도 충분합니다.',
    ])
  );
  children.push(pageBreak());
  children.push(
    ...figure(
      'owner-product-pixel-convert-sian.png',
      '스토어 관리 — 2D 월드용 · 실사→픽셀 변환 · 4방향·진열 미리보기 · 승인',
      '완성 시안'
    )
  );
  children.push(
    ...figure('owner-display-slots-mockup.png', '스토어 관리 — 매장에 진열용 가구를 두고 상품을 끼워 넣기', '완성 시안')
  );
  children.push(pageBreak());
  children.push(...figure('owner-orders-mockup.png', '스토어 관리 — 주문·배송지 확인', '완성 시안'));

  children.push(pageBreak());

  children.push(
    box(
      [
        [
          run('매장·상품·진열·주문 관리는 ', { size: 21 }),
          run('PC 웹', { size: 21, bold: true }),
          run('에서 합니다. 앱의 스토어 관리자 로그인은 팝업에 들어가 쇼핑하는 용도이고, 본인 매장에서는 닉네임 왕관 등으로 구분됩니다.', {
            size: 21,
          }),
        ],
      ],
      { bg: C.highlight, roseLeft: true }
    )
  );

  children.push(pageBreak());

  // —— 7 ——
  children.push(h2('7. 구현 검토용 브리핑 (대표님·개발팀 논의용)'));
  children.push(
    paraRich([
      '아래는 확정 기술 스택이 아니라, ',
      { t: '이런 식으로 구현할 수 있는 방법', bold: true },
      '을 정리한 검토 자료입니다. 실제 도구·일정·비용은 개발팀과 상의해 결정하면 됩니다.',
    ])
  );

  children.push(h3('7-1. 실사와 픽셀 — 한 상품, 두 가지 이미지'));
  children.push(
    makeTable(
      ['용도', '이미지', '노출 위치'],
      [
        ['쇼핑·주문', '실사 사진', '앱 상세, 목록, 장바구니, 주문'],
        ['팝업 월드', '픽셀 스프라이트', '진열 슬롯, 착용해보기, 월드 속 캐릭터'],
      ],
      { highlightLast: false }
    )
  );
  children.push(
    briefingBox([
      '상품 데이터에 실사 URL과 픽셀 스프라이트 URL을 함께 두는 방식이 자연스럽습니다.',
      '변환 작업은 점주 전용으로 두고, 손님 앱은 저장된 결과만 불러오게 할 수 있습니다.',
      '같은 원본을 다시 변환할 때는 이미지 해시로 중복 작업을 줄이는 방법도 있습니다.',
    ])
  );

  children.push(h3('7-2. 점주 2D 변환 — 단계적 접근'));
  children.push(
    paraRich([
      '실사 한 장만으로는 뒤·옆 모습이 없으므로, ',
      { t: '단계를 나눠 도입', bold: true },
      '하는 방안을 검토할 수 있습니다.',
    ])
  );
  children.push(
    ...bullet([
      '**1단계** — 브라우저·서버에서 이미지를 줄이고 색 수를 맞추는 방식(결정론적 처리). 비용이 적고 결과가 일정합니다.',
      '**2단계** — 배경 제거·윤곽 보정 등이 필요할 때만 AI 보조를 쓰는 방식. 미리보기는 가볍게, 최종 승인만 고품질로 처리할 수 있습니다.',
      '**3단계** — 의류·가방은 카테고리별 템플릿이나 추가 각도 사진으로 네 방향 품질을 올리는 방식.',
    ])
  );

  children.push(h3('7-3. 착용 상품 — 방향별로 보이게 하는 방법'));
  children.push(
    paraRich([
      '캐릭터가 전·후·좌·우로 돌아갈 때 입은 상품도 같이 바뀌려면, ',
      { t: '몸 위에 부위별 레이어를 겹쳐 그리는 방식', bold: true },
      '(종이 인형 합성)이 일반적입니다.',
    ])
  );
  children.push(
    briefingBox([
      '이동 방향 4개(앞·뒤·왼·오)에 맞춘 **스프라이트 시트** 규격을 미리 정해 두는 방법이 있습니다.',
      '상의·하의·신발·가방 등 부위마다 고정 앵커·겹침 순서를 두면, 걸을 때 프레임만 바꿔 맞출 수 있습니다.',
      '등·망토류는 뒤를 볼 때만 보이게 켜고 끄는 식으로 처리할 수 있습니다.',
      '멀티플레이에서는 좌표·방향·장착 목록만 보내고, 각 기기에서 같은 규칙으로 그리게 할 수 있습니다.',
      '착용해보기 팝업과 월드 안 캐릭터가 **같은 시트·같은 규칙**을 쓰면 화면이 어긋나지 않습니다.',
    ])
  );

  children.push(h3('7-4. 구매와 장착 — 권한을 서버에서 확인'));
  children.push(
    paraRich([
      '손님이 코드를 복사하거나 임의 이미지를 붙여 넣지 못하게 하려면, ',
      { t: '구매·지급 이력을 서버가 확인한 뒤', bold: true },
      ' 장착을 허용하는 흐름을 검토할 수 있습니다. 구매가 확인되면 옷장에 자동으로 들어가고, 월드·착용해보기에서만 쓸 수 있게 하는 방식입니다.',
    ])
  );
  children.push(
    box(
      [
        [
          run('위 내용은 시안·기획 단계의 ', { size: 21 }),
          run('논의용 브리핑', { size: 21, bold: true }),
          run('입니다. 최종 기술 선택과 일정은 대표님 회사 개발팀과 맞춰 확정하면 됩니다.', { size: 21 }),
        ],
      ],
      { bg: C.highlight, roseLeft: true }
    )
  );

  children.push(pageBreak());

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: C.gold, space: 12 },
      },
      children: [
        run('POP-UP CUBE · 온라인 팝업스토어 플랫폼 시안 · 2026년 7월', {
          size: 16,
          color: C.muted,
        }),
      ],
    })
  );

  const doc = new Document({
    creator: 'POP-UP CUBE',
    title: '온라인 팝업스토어 플랫폼 시안',
    description: 'PDF 시안과 동일 내용 — Word 네이티브 서식',
    styles: {
      default: {
        document: {
          paragraph: {
            spacing: { line: 320 },
          },
          run: {
            font: FONT,
            size: 21,
            color: C.ink,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickStyle: true,
          run: { font: FONT, size: 28, bold: true, color: C.navy },
          paragraph: {
            spacing: { before: 280, after: 160 },
            outlineLevel: 0,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickStyle: true,
          run: { font: FONT, size: 24, bold: true, color: C.navyDeep },
          paragraph: {
            spacing: { before: 220, after: 120 },
            outlineLevel: 1,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [run('POP-UP CUBE 시안', { size: 14, color: C.gold })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  run('— ', { size: 14, color: C.muted }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: C.muted }),
                  run(' —', { size: 14, color: C.muted }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT, buffer);
  console.log('OK', OUT, (buffer.length / 1024 / 1024).toFixed(1) + 'MB');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

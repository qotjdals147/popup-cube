/**
 * docx ONLY — §7-2 본문 정리 + 한 줄 추가, image9 카드 배경 확장 + 상세 버튼
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { zipDir, unzipDocx } = require('./docx-zip.cjs');

const DOCX = path.join(__dirname, '온라인-팝업스토어-플랫폼-시안.docx');
const TMP = path.join(__dirname, '_docx_final');
const EX = path.join(TMP, 'extracted');
const XML = path.join(EX, 'word', 'document.xml');
const IMAGE = path.join(EX, 'word', 'media', 'image9.png');
const CLEAN = path.join(__dirname, '_docx_media_tmp/extracted/word/media/image9.png');

const BTN = '#E8A04A';
const BTN_STROKE = '#C4882E';
const LABEL = '상세페이지 보기';
const GAP_BELOW_RED = 8;
const DETAIL_BTN_H = 34;
const PAD_BELOW_BTN = 12;

async function unzip() {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(EX, { recursive: true });
  await unzipDocx(DOCX, EX);
}

async function zipBack() {
  const size = await zipDir(EX, DOCX);
  console.log('docx zipped', size);
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bodyPara(text) {
  const t = escXml(text);
  return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="000000DD"><w:pPr><w:spacing w:after="160" w:before="0" w:line="320" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/><w:i w:val="0"/><w:iCs w:val="0"/><w:color w:val="1a1a2e"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
}

function bulletPara(label, rest) {
  const l = escXml(label);
  const r = escXml(rest);
  return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="000000DE"><w:pPr><w:pBdr><w:left w:color="e94560" w:space="10" w:sz="18" w:val="single"/></w:pBdr><w:spacing w:after="80" w:lineRule="auto"/><w:ind w:left="200" w:firstLine="0"/><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/><w:i w:val="0"/><w:iCs w:val="0"/><w:color w:val="1a1a2e"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">  </w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/><w:b w:val="1"/><w:bCs w:val="1"/><w:i w:val="0"/><w:iCs w:val="0"/><w:color w:val="1a1a2e"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${l}</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/><w:i w:val="0"/><w:iCs w:val="0"/><w:color w:val="1a1a2e"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${r}</w:t></w:r></w:p>`;
}

function listPara73(text) {
  const t = escXml(text);
  return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="000000E4"><w:pPr><w:spacing w:after="80" w:before="0" w:line="320" w:lineRule="auto"/><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Batang" w:cs="Batang" w:eastAsia="Batang" w:hAnsi="Batang"/><w:i w:val="0"/><w:iCs w:val="0"/><w:color w:val="1a1a2e"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
}

function replaceParaContaining(xml, needle, newPara) {
  let from = 0;
  while (true) {
    const hit = xml.indexOf(needle, from);
    if (hit < 0) return xml;
    const pStart = xml.lastIndexOf('<w:p ', hit);
    const pEnd = xml.indexOf('</w:p>', hit);
    if (pStart < 0 || pEnd < 0) return xml;
    return xml.slice(0, pStart) + newPara + xml.slice(pEnd + 6);
  }
}

function patchSection72(xml) {
  const oneLiner =
    '입력: 점주 실사 1장 → 변환 API → 출력: 월드용 픽셀 스프라이트(시트) → 점주 승인 후 저장';
  const intro =
    '점주는 실사 사진만 등록하고, 플랫폼이 제공하는 픽셀 변환 툴(변환 API)이 월드용 스프라이트를 만들어 주는 흐름을 검토할 수 있습니다. 소비자는 변환 API를 쓰지 않고, 점주가 승인한 결과만 월드·착용해보기에서 봅니다.';

  const h2 = xml.indexOf('7-2. 점주 2D');
  const h3 = xml.indexOf('7-3. 착용 상품');
  if (h2 < 0 || h3 < 0) throw new Error('§7-2/7-3 markers not found');

  const headingEnd = xml.indexOf('</w:p>', h2) + 6;
  const h3ParaStart = xml.lastIndexOf('<w:p ', h3);

  const newBody =
    bodyPara(oneLiner) +
    bodyPara(intro) +
    bulletPara('업로드', ' — 상품 등록 중 대표 실사 사진을 올립니다.') +
    bulletPara('변환', ' — 「2D 월드용」탭에서 변환 툴/API가 진열·착용용 픽셀 스프라이트를 생성합니다.') +
    bulletPara('미리보기·승인', ' — 점주가 결과를 확인한 뒤 승인하면 상품과 연결·출시됩니다.') +
    bulletPara(
      '비용·악용 방지',
      ' — 변환 API는 점주 전용, 이미지 해시 캐시·호출량 제한 등으로 비용을 줄이는 방안이 있습니다.'
    );

  let out = xml.slice(0, headingEnd) + newBody + xml.slice(h3ParaStart);

  out = replaceParaContaining(
    out,
    '캐릭터가 전·후·좌·우로 돌아갈 때',
    bodyPara(
      '변환 API가 만든 스프라이트는 월드에서 캐릭터 방향(전·후·좌·우)에 맞게 보여야 합니다. 이를 위해 부위별 레이어를 겹쳐 그리는 방식(종이 인형 합성)과 방향별 스프라이트 시트 규격을 함께 검토할 수 있습니다.'
    )
  );
  out = replaceParaContaining(
    out,
    '이동 방향 4개',
    listPara73('변환 툴/API 결과를 표준 스프라이트 시트 형태로 저장하는 방법이 있습니다.')
  );
  out = replaceParaContaining(
    out,
    '착용해보기 팝업과 월드 안 캐릭터가',
    listPara73(
      '착용해보기 팝업과 월드 안 캐릭터가 같은 변환 결과·같은 규칙을 쓰면 화면이 어긋나지 않습니다.'
    )
  );

  return out;
}

function isCardBg(r, g, b) {
  return r >= 28 && r <= 75 && g >= 28 && g <= 75 && b >= 35 && b <= 95 && Math.abs(r - g) < 15;
}

function findRedButtons(data, w, h) {
  const regions = [];
  const visited = new Uint8Array(w * h);
  const idx = (x, y) => y * w + x;
  const isRed = (x, y) => {
    const i = idx(x, y) * 4;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    return r > 170 && g < 110 && b < 110 && r - g > 60;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (visited[idx(x, y)] || !isRed(x, y)) continue;
      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      const stack = [[x, y]];
      visited[idx(x, y)] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        for (const [nx, ny] of [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const k = idx(nx, ny);
          if (visited[k] || !isRed(nx, ny)) continue;
          visited[k] = 1;
          stack.push([nx, ny]);
        }
      }
      const rw = maxX - minX + 1;
      const rh = maxY - minY + 1;
      if (rw > 200 && rh > 28 && rh < 80) regions.push({ x: minX, y: minY, w: rw, h: rh });
    }
  }
  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}

function cardMeta(red) {
  const x = red.x - 10;
  const width = red.w + 20;
  const oldBottom = red.y + red.h + 4;
  const newBottom = red.y + red.h + GAP_BELOW_RED + DETAIL_BTN_H + PAD_BELOW_BTN;
  return { x, width, oldBottom, newBottom };
}

function sampleCardFill(data, w, meta) {
  const samples = [];
  const y = meta.oldBottom - 30;
  for (let dx = 20; dx < meta.width - 20; dx += 20) {
    const i = (y * w + (meta.x + dx)) * 4;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (isCardBg(r, g, b)) samples.push([r, g, b]);
  }
  if (!samples.length) return '#3f4248';
  const avg = samples.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0]).map((v) =>
    Math.round(v / samples.length)
  );
  return `#${avg.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function cardExtendSvg(red, fill, meta) {
  const { x, width, oldBottom, newBottom } = meta;
  if (newBottom <= oldBottom) return '';
  const extH = newBottom - oldBottom;
  return `<rect x="${x}" y="${oldBottom}" width="${width}" height="${extH}" fill="${fill}"/>`;
}

function detailBtnSvg(red) {
  const y = red.y + red.h + GAP_BELOW_RED;
  const x = red.x + 4;
  const w = red.w - 8;
  return `<rect x="${x}" y="${y}" width="${w}" height="${DETAIL_BTN_H}" rx="7" ry="7" fill="${BTN}" stroke="${BTN_STROKE}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + DETAIL_BTN_H / 2 + 5}" text-anchor="middle" font-family="Malgun Gothic, Gulim, sans-serif" font-size="15" font-weight="700" fill="#1a1a2e">${LABEL}</text>`;
}

async function patchImage() {
  const base = fs.existsSync(CLEAN) ? CLEAN : IMAGE;
  const { data, info } = await sharp(base).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const reds = findRedButtons(data, info.width, info.height);
  if (reds.length < 4) throw new Error('red buttons ' + reds.length);

  const parts = [];
  reds.forEach((r) => {
    const meta = cardMeta(r);
    const fill = sampleCardFill(data, info.width, meta);
    parts.push(cardExtendSvg(r, fill, meta));
    parts.push(detailBtnSvg(r));
  });

  const svg = Buffer.from(
    `<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
  );
  await sharp(base).composite([{ input: svg, top: 0, left: 0 }]).png().toFile(IMAGE);
  console.log('image9 patched, reds:', reds);
}

async function main() {
  await unzip();
  let xml = fs.readFileSync(XML, 'utf8');
  xml = patchSection72(xml);
  fs.writeFileSync(XML, xml);
  await patchImage();
  await zipBack();
  console.log('OK docx only');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

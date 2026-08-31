import type { StorePolicy } from '@popup-cube/shared';

/** 반품·교환 수령지 — 클립보드 복사용 한 줄 텍스트 */
export function formatReturnAddressText(policy: Pick<
  StorePolicy,
  | 'return_recipient_name'
  | 'return_phone'
  | 'return_postal_code'
  | 'return_address_line1'
  | 'return_address_line2'
>): string {
  const lines: string[] = [];
  const nameLine = [policy.return_recipient_name, policy.return_phone].filter(Boolean).join(' · ');
  if (nameLine) lines.push(nameLine);
  const addrParts = [
    policy.return_postal_code ? `(${policy.return_postal_code})` : '',
    policy.return_address_line1,
    policy.return_address_line2,
  ].filter(Boolean);
  if (addrParts.length) lines.push(addrParts.join(' '));
  return lines.join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

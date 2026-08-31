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
  return formatReturnAddressParts({
    recipient: policy.return_recipient_name,
    phone: policy.return_phone,
    postal: policy.return_postal_code,
    line1: policy.return_address_line1,
    line2: policy.return_address_line2,
  });
}

export interface ReturnAddressParts {
  recipient: string | null;
  phone: string | null;
  postal: string | null;
  line1: string | null;
  line2: string | null;
}

export function formatReturnAddressParts(parts: ReturnAddressParts): string {
  const lines: string[] = [];
  const nameLine = [parts.recipient, parts.phone].filter(Boolean).join(' · ');
  if (nameLine) lines.push(nameLine);
  const addrParts = [
    parts.postal ? `(${parts.postal})` : '',
    parts.line1,
    parts.line2,
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

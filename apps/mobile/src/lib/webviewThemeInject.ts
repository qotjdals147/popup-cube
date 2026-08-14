import type { ThemeMode } from '../context/ThemeContext';
import { shopperDark, shopperLight } from '../theme/shopperTheme';

/** WebView HTML 로드 전 body 배경 — 흰 플래시 방지 */
export function buildWebViewBackgroundInject(mode: ThemeMode): string {
  const bg = mode === 'dark' ? shopperDark.bg : shopperLight.bg;
  return `(function(){var d=document;d.documentElement.style.backgroundColor='${bg}';if(d.body){d.body.style.backgroundColor='${bg}';}else{d.addEventListener('DOMContentLoaded',function(){d.body.style.backgroundColor='${bg}';});}})();true;`;
}

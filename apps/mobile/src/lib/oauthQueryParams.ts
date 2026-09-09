/** OAuth callback URL query / hash 파싱 (expo-auth-session·ExpoCrypto 의존 제거) */
export function parseOAuthCallbackParams(url: string): {
  params: Record<string, string>;
  errorCode?: string;
} {
  const params: Record<string, string> = {};

  const addSegment = (segment: string | undefined) => {
    if (!segment) return;
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      const rawKey = eq >= 0 ? pair.slice(0, eq) : pair;
      const rawVal = eq >= 0 ? pair.slice(eq + 1) : '';
      if (!rawKey) continue;
      try {
        params[decodeURIComponent(rawKey)] = decodeURIComponent(rawVal.replace(/\+/g, ' '));
      } catch {
        params[rawKey] = rawVal;
      }
    }
  };

  const q = url.indexOf('?');
  const hash = url.indexOf('#');
  if (q >= 0) {
    const end = hash >= 0 ? hash : url.length;
    addSegment(url.slice(q + 1, end));
  }
  if (hash >= 0) {
    addSegment(url.slice(hash + 1));
  }

  const errorCode =
    params.error_description || params.error || params.error_code || undefined;

  return { params, errorCode };
}

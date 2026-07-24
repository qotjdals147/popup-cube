import { useEffect, useState } from 'react';

/** 실제 폰·좁은 뷰포트 — 데모용 가짜 폰 베zel 없이 풀스크린 */
export function useNativeViewport(): boolean {
  const [native, setNative] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 520px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 520px)');
    const update = () => setNative(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return native;
}

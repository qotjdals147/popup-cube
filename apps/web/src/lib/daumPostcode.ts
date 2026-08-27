/** Daum(카카오) 우편번호 embed — AD-076 AddressSearch */

const SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

export interface DaumPostcodeResult {
  postal_code: string;
  address_line1: string;
  address_line2?: string;
}

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J';
  buildingName: string;
  apartment: 'Y' | 'N';
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: (state: 'FORCE_CLOSE' | 'COMPLETE_CLOSE') => void;
      }) => { open: () => void };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Daum Postcode script load failed'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function mapDaumResult(data: DaumPostcodeData): DaumPostcodeResult {
  const road = data.roadAddress.trim();
  const jibun = data.jibunAddress.trim();
  const address_line1 = (data.userSelectedType === 'R' ? road : jibun) || road || jibun;

  let address_line2: string | undefined;
  if (data.userSelectedType === 'R' && data.buildingName && data.apartment === 'Y') {
    address_line2 = data.buildingName;
  }

  return {
    postal_code: data.zonecode,
    address_line1,
    address_line2,
  };
}

/** 우편번호 검색 팝업. 취소 시 `null`. */
export async function openDaumPostcodeSearch(): Promise<DaumPostcodeResult | null> {
  await loadDaumPostcodeScript();
  if (!window.daum?.Postcode) {
    throw new Error('Daum Postcode unavailable');
  }

  return new Promise((resolve) => {
    let completed = false;

    new window.daum.Postcode({
      oncomplete: (data) => {
        completed = true;
        resolve(mapDaumResult(data));
      },
      onclose: (state) => {
        if (!completed && state === 'FORCE_CLOSE') {
          resolve(null);
        }
      },
    }).open();
  });
}

/**
 * blog-tokens.ts
 * 보상스쿨 웹(MarkdownRenderer) & 네이버 스마트에디터(naver-formatter) 공통 디자인 토큰 및 톤 판별 엔진
 * 
 * [원칙: 표준, 범용, 콤팩트, 통합, 공유, 공통]
 * - 단일 진실 공급원(Single Source of Truth)
 * - 헌법 제1조(순수 텍스트 & W3C 벡터 표준) 및 제12조(보상스쿨 피드백 & 실무 인사이트 보라색 톤) 완벽 준수
 */

export type BlogTone = 'purple' | 'blue' | 'green' | 'red' | 'yellow';

export interface ToneColorToken {
  name: BlogTone;
  label: string;
  // 네이버 스마트에디터용 Hex 색상
  hex: {
    border: string;
    borderAccent: string;
    headerBg: string;
    headerText: string;
    headerBorderBottom: string;
    bodyBg: string;
    bodyText: string;
    badgeBg: string;
    badgeText: string;
    highlightBg: string;
    highlightText: string;
  };
  // 웹(Tailwind)용 클래스명
  tailwind: {
    border: string;
    hoverBorder: string;
    headerGradient: string;
    titleColor: string;
    highlightClass: string;
  };
}

export const BLOG_TONE_TOKENS: Record<BlogTone, ToneColorToken> = {
  // 1. Purple (Indigo): 보상스쿨 피드백 & 실무 인사이트, 최고 권위 의학/법률 전문성
  purple: {
    name: 'purple',
    label: '실무 인사이트',
    hex: {
      border: '#c7d2fe',
      borderAccent: '#4f46e5',
      headerBg: '#eef2ff',
      headerText: '#4338ca',
      headerBorderBottom: '#c7d2fe',
      bodyBg: '#ffffff',
      bodyText: '#374151',
      badgeBg: '#e0e7ff',
      badgeText: '#3730a3',
      highlightBg: '#e0e7ff',
      highlightText: '#3730a3',
    },
    tailwind: {
      border: 'border-indigo-200 dark:border-indigo-900/50',
      hoverBorder: 'hover:border-indigo-500 hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)]',
      headerGradient: 'from-indigo-50/90 to-transparent dark:from-indigo-900/25 dark:to-transparent border-b border-indigo-100 dark:border-indigo-900/40',
      titleColor: 'text-indigo-600 dark:text-indigo-400',
      highlightClass: 'text-[#4338ca] dark:text-[#a5b4fc] bg-indigo-50 dark:bg-indigo-900/20',
    },
  },
  // 2. Green / Emerald: 승소, 해결, 지급, 합의, 체크리스트, 맞춤 솔루션
  green: {
    name: 'green',
    label: '솔루션·해결',
    hex: {
      border: '#a7f3d0',
      borderAccent: '#059669',
      headerBg: '#ecfdf5',
      headerText: '#065f46',
      headerBorderBottom: '#a7f3d0',
      bodyBg: '#ffffff',
      bodyText: '#374151',
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
      highlightBg: '#d1fae5',
      highlightText: '#065f46',
    },
    tailwind: {
      border: 'border-green-200 dark:border-green-900/50',
      hoverBorder: 'hover:border-[var(--google-green)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.18)]',
      headerGradient: 'from-green-50/90 to-transparent dark:from-green-900/25 dark:to-transparent border-b border-green-100 dark:border-green-900/40',
      titleColor: 'text-[var(--google-green)] dark:text-green-400',
      highlightClass: 'text-[#137333] dark:text-[#81c995] bg-emerald-50 dark:bg-emerald-900/20',
    },
  },
  // 3. Yellow / Amber: 인라인 용어사전, 핵심 요약, 중요 주의사항
  yellow: {
    name: 'yellow',
    label: '핵심·용어사전',
    hex: {
      border: '#fde68a',
      borderAccent: '#d97706',
      headerBg: '#fffbeb',
      headerText: '#b45309',
      headerBorderBottom: '#fde68a',
      bodyBg: '#ffffff',
      bodyText: '#374151',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
      highlightBg: '#fef3c7',
      highlightText: '#92400e',
    },
    tailwind: {
      border: 'border-yellow-300 dark:border-yellow-900/50',
      hoverBorder: 'hover:border-yellow-500 hover:shadow-[0_12px_40px_rgba(234,179,8,0.18)]',
      headerGradient: 'from-yellow-50/90 to-transparent dark:from-yellow-900/25 dark:to-transparent border-b border-yellow-200 dark:border-yellow-900/40',
      titleColor: 'text-yellow-600 dark:text-yellow-400',
      highlightClass: 'text-[#e37400] dark:text-[#fde293] bg-amber-50 dark:bg-amber-900/20',
    },
  },
  // 4. Red: 위험, 거절, 면책, 부지급, 법적 리스크
  red: {
    name: 'red',
    label: '주의·면책위험',
    hex: {
      border: '#fecaca',
      borderAccent: '#dc2626',
      headerBg: '#fef2f2',
      headerText: '#b91c1c',
      headerBorderBottom: '#fecaca',
      bodyBg: '#ffffff',
      bodyText: '#374151',
      badgeBg: '#fee2e2',
      badgeText: '#991b1b',
      highlightBg: '#fee2e2',
      highlightText: '#991b1b',
    },
    tailwind: {
      border: 'border-red-200 dark:border-red-900/50',
      hoverBorder: 'hover:border-[var(--google-red)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.18)]',
      headerGradient: 'from-red-50/90 to-transparent dark:from-red-900/25 dark:to-transparent border-b border-red-100 dark:border-red-900/40',
      titleColor: 'text-[var(--google-red)] dark:text-red-400',
      highlightClass: 'text-[#d93025] dark:text-[#f28b82] bg-red-50 dark:bg-red-900/20',
    },
  },
  // 5. Blue: 기본 브랜드, 일반 가이드, 설명
  blue: {
    name: 'blue',
    label: '기본 가이드',
    hex: {
      border: '#bfdbfe',
      borderAccent: '#2563eb',
      headerBg: '#eff6ff',
      headerText: '#1d4ed8',
      headerBorderBottom: '#bfdbfe',
      bodyBg: '#ffffff',
      bodyText: '#374151',
      badgeBg: '#dbeafe',
      badgeText: '#1e40af',
      highlightBg: '#dbeafe',
      highlightText: '#1e40af',
    },
    tailwind: {
      border: 'border-blue-200 dark:border-blue-900/50',
      hoverBorder: 'hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)]',
      headerGradient: 'from-blue-50/90 to-transparent dark:from-blue-900/25 dark:to-transparent border-b border-blue-100 dark:border-blue-900/40',
      titleColor: 'text-[var(--google-blue)] dark:text-blue-400',
      highlightClass: 'text-[#1A73E8] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/20',
    },
  },
};

/**
 * 텍스트 내용 기반 톤(Tone) 자동 판별기 (웹 & 네이버 공통)
 */
export function getToneColor(text: string): BlogTone {
  const clean = (text || '').trim();

  // 1. [헌법 제12조] 보상스쿨 피드백 & 실무 인사이트 -> 보라색(Purple) 톤
  if (/보상스쿨|실무\s*인사이트|실무인사이트|피드백|인사이트/.test(clean)) {
    return 'purple';
  }

  // 2. [헌법 제11조] 핵심 요약 (Key Points) -> 보상스쿨 시그니처 레드(Red) 톤
  if (/(핵심\s*요약|핵심요약|3줄\s*요약|주요\s*포인트)/.test(clean)) {
    return 'red';
  }

  // 3. [헌법 제4조] 인라인 용어 사전 (> **용어명** : 설명) -> 노란색/앰버(Yellow) 톤
  if (/(?:^|\n)\s*(?:\*\*[^*]+\*\*|[^\n:]+)\s*[:：]/.test(clean) || /(?:용어\s*사전|단어\s*설명|용어\s*정의)/.test(clean)) {
    return 'yellow';
  }

  // 4. 위험/면책/부지급 키워드 -> 빨간색(Red) 톤
  if (/(주의|경고|위험|금지|부지급|면책|거절|삭감|과실|위반|분쟁|소송|패소|실패)/.test(clean)) {
    return 'red';
  }

  // 5. 승소/지급/해결 키워드 -> 초록색(Green) 톤
  if (/(해결|승소|지급|보상|합의|성공|전액|확보|부책|방어|수령|구제|유리)/.test(clean)) {
    return 'green';
  }

  // 6. 핵심/체크 키워드 -> 노란색(Yellow) 톤
  if (/(핵심|팁|포인트|체크|요약|기준|원칙)/.test(clean)) {
    return 'yellow';
  }

  return 'blue';
}

/**
 * 키워드 강조(**텍스트**)의 의미 기반 톤 판별기 (웹 & 네이버 공통)
 */
export function getKeywordTone(text: string): BlogTone {
  const t = (text || '').trim();

  if (/(거절|면책|부지급|삭감|주의|경고|위험|금지|불리|과실|기왕증|불가|제한|악용|분쟁|소송|실패|거부|위반|처벌|구상|압박|피해)/.test(t)) {
    return 'red';
  }
  if (/(지급|보상|합의|성공|가능|해결|유리|승소|안전|권리|인정|전액|확보|부책|방어|수령|구제|무죄)/.test(t)) {
    return 'green';
  }
  if (/(핵심|중요|필수|확인|점검|기준|원칙|주의사항|팁|노하우|명심|포인트|체크|절차|방법|동선)/.test(t)) {
    return 'yellow';
  }
  if (/(전문가|손해사정사|손해사정|의학|법률|판례|자문|소견|감정|진단|포렌식|맥브라이드|자배법)/.test(t)) {
    return 'purple';
  }

  return 'blue';
}

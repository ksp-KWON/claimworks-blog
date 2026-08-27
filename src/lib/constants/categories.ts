import type { AppIconName } from '@/components/ui/AppIcon';

export interface CategoryMeta {
  name: string;
  slug: string;
  iconName: AppIconName;
  themeColor: 'blue' | 'rose' | 'sky' | 'red' | 'emerald' | 'orange' | 'purple' | 'amber' | 'indigo' | 'teal';
  desc: string;
  keywords: string[];
}

export const STOP_WORDS = [
  '보상', '분쟁', '실손', '보험', '수술', '치료', '가이드', '비급여', 
  '진단비', '수술비', '청구', '손해사정', '보험금', '사고', '보상금'
];

export const COLUMN_CATEGORIES: CategoryMeta[] = [
  { 
    name: '판례·분쟁조정', 
    slug: '판례-분쟁조정', 
    iconName: 'scale', 
    themeColor: 'indigo', 
    desc: '대법원 판례 및 금융분쟁조정위원회 결정례 심층 분석',
    keywords: ['판례', '대법원', '분조위', '분쟁조정', '결정례', '소송', '금융감독원', '법률']
  },
  { 
    name: '사망·자살 보험금', 
    slug: '사망-자살-보험금', 
    iconName: 'rose', 
    themeColor: 'rose', 
    desc: '사망보험금 및 자살(심신상실) 입증 지급 사례',
    keywords: ['사망', '자살', '심신상실', '사인미상']
  },
  { 
    name: '질병진단·실손', 
    slug: '질병진단-실손', 
    iconName: 'heart', 
    themeColor: 'blue', 
    desc: '암, 뇌졸중, 급성심근경색 및 실손 분쟁 완전 정복',
    keywords: ['암', '뇌졸중', '심근경색', '질병']
  },
  { 
    name: '교통사고 보상', 
    slug: '교통사고-보상', 
    iconName: 'car', 
    themeColor: 'emerald', 
    desc: '자동차보험 대인배상 및 무보험차상해 정밀 산정',
    keywords: ['교통사고', '대인배상', '무보험차', '합의금']
  },
  { 
    name: '배상책임·의료', 
    slug: '배상책임-의료', 
    iconName: 'shield', 
    themeColor: 'teal', 
    desc: '일상생활배상책임 및 의료사고 과실 입증 솔루션',
    keywords: ['배상책임', '의료사고', '일배책', '영업배상', '낙상']
  },
  { 
    name: '근재·산재 사고', 
    slug: '근재-산재-사고', 
    iconName: 'hardhat', 
    themeColor: 'orange', 
    desc: '산업재해 및 근로자재해보장책임보험 초과손해',
    keywords: ['산재', '근재', '산업재해', '업무상', '초과손해']
  },
  { 
    name: '장해평가·면책', 
    slug: '장해평가-면책', 
    iconName: 'crutches', 
    themeColor: 'purple', 
    desc: 'AMA, 맥브라이드 후유장해 및 고지의무 위반 반박',
    keywords: ['후유장해', '맥브라이드', 'ama', '면책', '고지의무', '장해']
  },
  { 
    name: '보상가이드', 
    slug: '보상가이드', 
    iconName: 'lightbulb', 
    themeColor: 'amber', 
    desc: '손해사정 실무 및 보험금 청구 핵심 체크포인트',
    keywords: ['꿀팁', '실무', '가이드']
  }
];

export const SPECIALTIES: CategoryMeta[] = [
  { 
    name: '정형외과', 
    slug: '정형외과', 
    iconName: 'bone', 
    themeColor: 'indigo', 
    desc: '골절, 인대 파열, 척추 손상 및 관절 후유장해',
    keywords: ['골절', '인대', '척추', '디스크', '십자인대', '파열', '회전근개']
  },
  { 
    name: '신경외과', 
    slug: '신경외과', 
    iconName: 'brain', 
    themeColor: 'blue', 
    desc: '추간판탈출증(디스크), 뇌출혈, 척추관협착증 분쟁',
    keywords: ['추간판탈출증', '뇌출혈', '척추관협착증', '뇌경색']
  },
  { 
    name: '내과', 
    slug: '내과', 
    iconName: 'pill', 
    themeColor: 'emerald', 
    desc: '급성심근경색, 협심증, 내과적 기왕증 인과관계',
    keywords: ['심근경색', '협심증', '기왕증']
  },
  { 
    name: '외과', 
    slug: '외과', 
    iconName: 'scissors', 
    themeColor: 'rose', 
    desc: '수술 부작용, 소액암, 질병 수술비 지급 분쟁',
    keywords: ['소액암', '수술', '하지정맥류']
  },
  { 
    name: '산부인과', 
    slug: '산부인과', 
    iconName: 'heart', 
    themeColor: 'sky', 
    desc: '자궁근종 하이푸, 요실금 수술비 약관 해석',
    keywords: ['자궁근종', '하이푸', '요실금']
  },
  { 
    name: '안과', 
    slug: '안과', 
    iconName: 'eye', 
    themeColor: 'teal', 
    desc: '백내장 다초점 렌즈, 황반변성 주사 실손 보상',
    keywords: ['백내장', '황반변성', '녹내장']
  },
  { 
    name: '피부/성형외과', 
    slug: '피부-성형외과', 
    iconName: 'skin', 
    themeColor: 'orange', 
    desc: '창상봉합술, 흉터 레이저, 치료 목적 비급여',
    keywords: ['레이저', '흉터', '비급여', '미용']
  },
  { 
    name: '비뇨의학과', 
    slug: '비뇨의학과', 
    iconName: 'dna', 
    themeColor: 'blue', 
    desc: '전립선비대증 결찰술(유로리프트), 요로결석',
    keywords: ['전립선', '요로결석']
  },
  { 
    name: '치과', 
    slug: '치과', 
    iconName: 'tooth', 
    themeColor: 'amber', 
    desc: '치조골 이식술 골이식재 수술비, 크라운 보상',
    keywords: ['치조골', '임플란트', '크라운']
  },
  { 
    name: '한방의학과', 
    slug: '한방의학과', 
    iconName: 'leaf', 
    themeColor: 'emerald', 
    desc: '교통사고 한방 첩약, 약침, 추나요법 인정 기준',
    keywords: ['첩약', '추나']
  }
];

export const ALL_CATEGORIES = [...COLUMN_CATEGORIES, ...SPECIALTIES];

/**
 * getCategoryMeta
 * 카테고리명, 슬러그, 태그 등 어떤 문자열이 들어와도 18대 정규 카테고리 메타데이터를 정확히 매핑하는 단일 표준 함수
 */
export function getCategoryMeta(input: string): CategoryMeta {
  if (!input) return COLUMN_CATEGORIES[7]; // 기본 보상가이드
  const trimmed = input.trim();
  const decoded = decodeURIComponent(trimmed);

  // 1. 정확한 slug 매칭
  const bySlug = ALL_CATEGORIES.find(c => c.slug === decoded || (decoded === '판례-법률-해석' && c.slug === '판례-분쟁조정'));
  if (bySlug) return bySlug;

  // 2. 정확한 name 매칭
  const byName = ALL_CATEGORIES.find(c => c.name === decoded);
  if (byName) return byName;

  // 3. 8대 핵심 법리 퍼지 매칭
  if (decoded.includes('판례') || decoded.includes('분쟁조정') || decoded.includes('분조위') || decoded.includes('법률')) return COLUMN_CATEGORIES[0];
  if (decoded.includes('사망') || decoded.includes('자살')) return COLUMN_CATEGORIES[1];
  if (decoded.includes('질병진단') || decoded.includes('실손') || decoded.includes('의료비')) return COLUMN_CATEGORIES[2];
  if (decoded.includes('교통사고') || decoded.includes('대인배상') || decoded.includes('자동차')) return COLUMN_CATEGORIES[3];
  if (decoded.includes('배상책임') || decoded.includes('의료사고') || decoded.includes('일배책')) return COLUMN_CATEGORIES[4];
  if (decoded.includes('근재') || decoded.includes('산재') || decoded.includes('산업재해')) return COLUMN_CATEGORIES[5];
  if (decoded.includes('장해평가') || decoded.includes('후유장해') || decoded.includes('면책')) return COLUMN_CATEGORIES[6];

  // 4. 10대 진료과목 퍼지 매칭
  for (const specialty of SPECIALTIES) {
    if (decoded.includes(specialty.name) || specialty.keywords.some(k => decoded.includes(k))) {
      return specialty;
    }
  }

  // 5. 기본 fallback (보상가이드)
  return COLUMN_CATEGORIES[7];
}

export function isCategoryMatch(postCategory: string, targetCategoryName: string): boolean {
  if (!postCategory || !targetCategoryName) return false;
  const pCat = postCategory.trim();
  const tCat = targetCategoryName.trim();
  
  if (tCat === '판례·분쟁조정' || tCat === '판례·법률 해석') {
    if (pCat.includes('판례') || pCat.includes('분쟁조정') || pCat.includes('분조위') || pCat.includes('법률 해석') || pCat.includes('법률')) {
      return true;
    }
  }

  if (pCat === tCat) return true;
  return pCat.includes(tCat) || tCat.includes(pCat);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return getCategoryMeta(slug);
}

/**
 * CATEGORY_THEME_STYLES
 * Tailwind JIT에서 안전하게 컴파일되는 톤온톤 정적 스타일 레지스트리
 */
export const CATEGORY_THEME_STYLES = {
  indigo: {
    badgeColor: 'indigo' as const,
    border: 'border-indigo-200/80 dark:border-indigo-900/50',
    hoverBorder: 'hover:border-indigo-500 dark:hover:border-indigo-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)]',
    accentBar: 'bg-indigo-600',
    gradient: 'from-indigo-50/70 via-indigo-50/20 to-transparent dark:from-indigo-950/30 dark:via-indigo-950/10 dark:to-transparent',
    iconBg: 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-900/60',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    textHover: 'hover:text-indigo-600 dark:hover:text-indigo-400',
    textMain: 'text-indigo-600 dark:text-indigo-400'
  },
  rose: {
    badgeColor: 'rose' as const,
    border: 'border-rose-200/80 dark:border-rose-900/50',
    hoverBorder: 'hover:border-rose-500 dark:hover:border-rose-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)] dark:hover:shadow-[0_8px_24px_rgba(244,63,94,0.2)]',
    accentBar: 'bg-rose-600',
    gradient: 'from-rose-50/70 via-rose-50/20 to-transparent dark:from-rose-950/30 dark:via-rose-950/10 dark:to-transparent',
    iconBg: 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-900/60',
    iconText: 'text-rose-600 dark:text-rose-400',
    titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    textHover: 'hover:text-rose-600 dark:hover:text-rose-400',
    textMain: 'text-rose-600 dark:text-rose-400'
  },
  sky: {
    badgeColor: 'blue' as const,
    border: 'border-sky-200/80 dark:border-sky-900/50',
    hoverBorder: 'hover:border-sky-500 dark:hover:border-sky-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] dark:hover:shadow-[0_8px_24px_rgba(14,165,233,0.2)]',
    accentBar: 'bg-sky-600',
    gradient: 'from-sky-50/70 via-sky-50/20 to-transparent dark:from-sky-950/30 dark:via-sky-950/10 dark:to-transparent',
    iconBg: 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-200/80 dark:border-sky-900/60',
    iconText: 'text-sky-600 dark:text-sky-400',
    titleHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    textHover: 'hover:text-sky-600 dark:hover:text-sky-400',
    textMain: 'text-sky-600 dark:text-sky-400'
  },
  red: {
    badgeColor: 'red' as const,
    border: 'border-red-200/80 dark:border-red-900/50',
    hoverBorder: 'hover:border-red-500 dark:hover:border-red-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_8px_24px_rgba(239,68,68,0.2)]',
    accentBar: 'bg-red-600',
    gradient: 'from-red-50/70 via-red-50/20 to-transparent dark:from-red-950/30 dark:via-red-950/10 dark:to-transparent',
    iconBg: 'bg-red-50/80 dark:bg-red-950/50 border-red-200/80 dark:border-red-900/60',
    iconText: 'text-red-600 dark:text-red-400',
    titleHover: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    textHover: 'hover:text-red-600 dark:hover:text-red-400',
    textMain: 'text-red-600 dark:text-red-400'
  },
  emerald: {
    badgeColor: 'green' as const,
    border: 'border-emerald-200/80 dark:border-emerald-900/50',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)]',
    accentBar: 'bg-emerald-600',
    gradient: 'from-emerald-50/70 via-emerald-50/20 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent',
    iconBg: 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/60',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    textHover: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    textMain: 'text-emerald-600 dark:text-emerald-400'
  },
  orange: {
    badgeColor: 'yellow' as const,
    border: 'border-orange-200/80 dark:border-orange-900/50',
    hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(249,115,22,0.12)] dark:hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)]',
    accentBar: 'bg-orange-600',
    gradient: 'from-orange-50/70 via-orange-50/20 to-transparent dark:from-orange-950/30 dark:via-orange-950/10 dark:to-transparent',
    iconBg: 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-900/60',
    iconText: 'text-orange-600 dark:text-orange-400',
    titleHover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
    textHover: 'hover:text-orange-600 dark:hover:text-orange-400',
    textMain: 'text-orange-600 dark:text-orange-400'
  },
  purple: {
    badgeColor: 'purple' as const,
    border: 'border-purple-200/80 dark:border-purple-900/50',
    hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(168,85,247,0.12)] dark:hover:shadow-[0_8px_24px_rgba(168,85,247,0.2)]',
    accentBar: 'bg-purple-600',
    gradient: 'from-purple-50/70 via-purple-50/20 to-transparent dark:from-purple-950/30 dark:via-purple-950/10 dark:to-transparent',
    iconBg: 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/60',
    iconText: 'text-purple-600 dark:text-purple-400',
    titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    textHover: 'hover:text-purple-600 dark:hover:text-purple-400',
    textMain: 'text-purple-600 dark:text-purple-400'
  },
  amber: {
    badgeColor: 'yellow' as const,
    border: 'border-amber-200/80 dark:border-amber-900/50',
    hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)] dark:hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)]',
    accentBar: 'bg-amber-600',
    gradient: 'from-amber-50/70 via-amber-50/20 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent',
    iconBg: 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/60',
    iconText: 'text-amber-600 dark:text-amber-400',
    titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    textHover: 'hover:text-amber-600 dark:hover:text-amber-400',
    textMain: 'text-amber-600 dark:text-amber-400'
  },
  blue: {
    badgeColor: 'blue' as const,
    border: 'border-blue-200/80 dark:border-blue-900/50',
    hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)]',
    accentBar: 'bg-blue-600',
    gradient: 'from-blue-50/70 via-blue-50/20 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent',
    iconBg: 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/60',
    iconText: 'text-blue-600 dark:text-blue-400',
    titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    textHover: 'hover:text-blue-600 dark:hover:text-blue-400',
    textMain: 'text-blue-600 dark:text-blue-400'
  },
  teal: {
    badgeColor: 'teal' as const,
    border: 'border-teal-200/80 dark:border-teal-900/50',
    hoverBorder: 'hover:border-teal-500 dark:hover:border-teal-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)] dark:hover:shadow-[0_8px_24px_rgba(20,184,166,0.2)]',
    accentBar: 'bg-teal-600',
    gradient: 'from-teal-50/70 via-teal-50/20 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent',
    iconBg: 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-200/80 dark:border-teal-900/60',
    iconText: 'text-teal-600 dark:text-teal-400',
    titleHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    textHover: 'hover:text-teal-600 dark:hover:text-teal-400',
    textMain: 'text-teal-600 dark:text-teal-400'
  }
};

export function getCategoryThemeStyle(themeColor: string) {
  return CATEGORY_THEME_STYLES[themeColor as keyof typeof CATEGORY_THEME_STYLES] || CATEGORY_THEME_STYLES.indigo;
}

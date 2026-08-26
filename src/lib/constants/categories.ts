export interface CategoryMeta {
  name: string;
  slug: string;
  icon: string;
  color: string;
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
    icon: '⚖️', 
    color: 'bg-blue-600', 
    desc: '대법원 판례 및 금융분쟁조정위원회 결정례',
    keywords: ['판례', '대법원', '분조위', '분쟁조정', '결정례', '소송', '금융감독원', '법률']
  },
  { 
    name: '사망·자살 보험금', 
    slug: '사망-자살-보험금', 
    icon: '🥀', 
    color: 'bg-rose-500', 
    desc: '사망보험금 및 자살(심신상실) 인정 사례',
    keywords: ['사망', '자살', '심신상실', '사인미상']
  },
  { 
    name: '질병진단·실손', 
    slug: '질병진단-실손', 
    icon: '🏥', 
    color: 'bg-sky-500', 
    desc: '암, 뇌졸중, 급성심근경색 및 실손 분쟁',
    keywords: ['암', '뇌졸중', '심근경색', '질병']
  },
  { 
    name: '교통사고 보상', 
    slug: '교통사고-보상', 
    icon: '🚗', 
    color: 'bg-red-600', 
    desc: '자동차보험 대인배상 및 무보험차상해',
    keywords: ['교통사고', '대인배상', '무보험차', '합의금']
  },
  { 
    name: '배상책임·의료', 
    slug: '배상책임-의료', 
    icon: '🛡️', 
    color: 'bg-emerald-600', 
    desc: '일상생활배상책임 및 의료사고 과실',
    keywords: ['배상책임', '의료사고', '일배책', '영업배상', '낙상']
  },
  { 
    name: '근재·산재 사고', 
    slug: '근재-산재-사고', 
    icon: '👷', 
    color: 'bg-orange-500', 
    desc: '산업재해 및 근로자재해보장책임보험',
    keywords: ['산재', '근재', '산업재해', '업무상', '초과손해']
  },
  { 
    name: '장해평가·면책', 
    slug: '장해평가-면책', 
    icon: '♿', 
    color: 'bg-purple-600', 
    desc: 'AMA, 맥브라이드 장해 및 고지의무 위반',
    keywords: ['후유장해', '맥브라이드', 'ama', '면책', '고지의무', '장해']
  },
  { 
    name: '보상가이드', 
    slug: '보상가이드', 
    icon: '💡', 
    color: 'bg-amber-500', 
    desc: '손해사정 실무 및 보험금 청구 꿀팁',
    keywords: ['꿀팁', '실무', '가이드']
  }
];

export const SPECIALTIES: CategoryMeta[] = [
  { 
    name: '정형외과', 
    slug: '정형외과', 
    icon: '🦴', 
    color: 'bg-indigo-500', 
    desc: '골절, 인대 파열, 척추 손상 보상',
    keywords: ['골절', '인대', '척추', '디스크', '십자인대', '파열', '회전근개']
  },
  { 
    name: '신경외과', 
    slug: '신경외과', 
    icon: '🧠', 
    color: 'bg-blue-600', 
    desc: '추간판탈출증, 뇌출혈, 척추 질환',
    keywords: ['추간판탈출증', '뇌출혈', '척추관협착증', '뇌경색']
  },
  { 
    name: '내과', 
    slug: '내과', 
    icon: '💊', 
    color: 'bg-green-600', 
    desc: '심근경색, 협심증, 내과적 기왕증',
    keywords: ['심근경색', '협심증', '기왕증']
  },
  { 
    name: '외과', 
    slug: '외과', 
    icon: '✂️', 
    color: 'bg-rose-600', 
    desc: '수술 부작용, 소액암, 암 수술비 분쟁',
    keywords: ['소액암', '수술', '하지정맥류']
  },
  { 
    name: '산부인과', 
    slug: '산부인과', 
    icon: '🤰', 
    color: 'bg-pink-500', 
    desc: '자궁근종 하이푸, 요실금 수술 등',
    keywords: ['자궁근종', '하이푸', '요실금']
  },
  { 
    name: '안과', 
    slug: '안과', 
    icon: '👁️', 
    color: 'bg-teal-600', 
    desc: '백내장 다초점 렌즈, 황반변성 주사',
    keywords: ['백내장', '황반변성', '녹내장']
  },
  { 
    name: '피부/성형외과', 
    slug: '피부-성형외과', 
    icon: '🧴', 
    color: 'bg-orange-500', 
    desc: '흉터 레이저, 미용 목적 비급여 분쟁',
    keywords: ['레이저', '흉터', '비급여', '미용']
  },
  { 
    name: '비뇨의학과', 
    slug: '비뇨의학과', 
    icon: '🧬', 
    color: 'bg-cyan-600', 
    desc: '전립선비대증 결찰술, 요로결석',
    keywords: ['전립선', '요로결석']
  },
  { 
    name: '치과', 
    slug: '치과', 
    icon: '🦷', 
    color: 'bg-stone-500', 
    desc: '치조골 이식술, 크라운 보상 분쟁',
    keywords: ['치조골', '임플란트', '크라운']
  },
  { 
    name: '한방의학과', 
    slug: '한방의학과', 
    icon: '🌿', 
    color: 'bg-emerald-600', 
    desc: '교통사고 첩약, 추나요법 제한 분쟁',
    keywords: ['첩약', '추나']
  }
];

export const ALL_CATEGORIES = [...COLUMN_CATEGORIES, ...SPECIALTIES];

export function isCategoryMatch(postCategory: string, targetCategoryName: string): boolean {
  if (!postCategory || !targetCategoryName) return false;
  const pCat = postCategory.trim();
  const tCat = targetCategoryName.trim();
  
  // 판례·분쟁조정과 구 카테고리명(판례·법률 해석, 판례 등) 상호 호환 매칭
  if (tCat === '판례·분쟁조정' || tCat === '판례·법률 해석') {
    if (pCat.includes('판례') || pCat.includes('분쟁조정') || pCat.includes('분조위') || pCat.includes('법률 해석') || pCat.includes('법률')) {
      return true;
    }
  }

  if (pCat === tCat) return true;
  return pCat.includes(tCat) || tCat.includes(pCat);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  const decodedSlug = decodeURIComponent(slug);
  if (decodedSlug === '판례-법률-해석') {
    return ALL_CATEGORIES.find(c => c.slug === '판례-분쟁조정');
  }
  return ALL_CATEGORIES.find(c => c.slug === decodedSlug);
}

/**
 * slug-utils.ts
 * 구글 검색엔진 최적화(Google SEO) 및 RFC 3986 국제 웹 표준 100% 준수
 * 시맨틱 영문 슬러그(Semantic English Slug) 생성 엔진
 *
 * [표준 원칙]
 * 1. 영문 소문자(a-z), 숫자(0-9), 하이픈(-)만 허용 (No Unicode, No Underscore, No Caps)
 * 2. 의미 있는 핵심 키워드 보존 (의학·법률·손해사정·지역 공공 도메인 사전 매핑)
 * 3. 사전에 없는 단어는 국립국어원 로마자 표기법 기반 완전 자동 음차 변환
 * 4. 한국어 조사 및 불용어(Stopwords) 자동 제거로 콤팩트한 URL 보장
 */

// 1. 한국어 조사 및 불용어 (Stopwords)
const KOREAN_STOPWORDS = new Set([
  '의', '에', '를', '을', '과', '와', '및', '등', '란', '으로', '로',
  '에서', '대한', '통한', '위한', '대해', '관한', '따른', '있는', '없는',
  '하는', '되는', '받는', '핵심', '총정리', '완벽', '안내', '정보'
]);

// 2. 전문 도메인(보험·법률·의학·손해사정·공공) 시맨틱 매핑 사전
const DOMAIN_DICTIONARY: Record<string, string> = {
  // [의학/상해/질병]
  '추간판': 'herniated-disc', '디스크': 'disc', '탈출증': 'herniation',
  '외상기여도': 'trauma-contribution', '기왕증': 'pre-existing-condition',
  '후유장해': 'permanent-disability', '장해': 'disability', '장애': 'disability',
  '노동능력상실률': 'loss-of-working-ability', '맥브라이드': 'mcbride', '아마': 'ama',
  '암': 'cancer', '갑상선암': 'thyroid-cancer', '유방암': 'breast-cancer', '폐암': 'lung-cancer',
  '위암': 'stomach-cancer', '대장암': 'colon-cancer', '전립선암': 'prostate-cancer',
  '뇌출혈': 'brain-hemorrhage', '뇌졸중': 'stroke', '뇌경색': 'cerebral-infarction',
  '급성심근경색': 'myocardial-infarction', '심근경색': 'myocardial-infarction',
  '백내장': 'cataract', '도수치료': 'manual-therapy', '체외충격파': 'eswt',
  '맘모톰': 'mammotome', '로봇수술': 'robotic-surgery', '하이푸': 'hifu',
  '비밸브': 'nasal-valve', '다빈치': 'davinci', '전립선비대증': 'bph',
  '하지정맥류': 'varicose-veins', '압박골절': 'compression-fracture', '골절': 'fracture',
  '삼복사골절': 'trimalleolar-fracture', '삼복사': 'trimalleolar', '발목': 'ankle',
  '십자인대': 'cruciate-ligament', '회전근개': 'rotator-cuff', '치매': 'dementia',

  // [보험/보상/손해사정 법리]
  '합의금': 'settlement', '손해배상': 'compensation', '보상금': 'compensation',
  '실손보험': 'silbi-insurance', '실손': 'silbi', '보험금': 'insurance-claim',
  '휴업손해': 'loss-of-work', '일실수익': 'loss-of-income', '위자료': 'consolation-money',
  '비급여': 'non-reimbursable', '임의비급여': 'arbitrary-non-reimbursable',
  '부지급': 'denial', '면책': 'exemption', '지급거절': 'claim-denial',
  '고지의무': 'disclosure-duty', '통지의무': 'notice-duty', '설명의무': 'explanation-duty',
  '소멸시효': 'statute-of-limitations', '과실비율': 'fault-ratio', '과실상계': 'comparative-negligence',
  '직업급수': 'job-risk-grade', '상해': 'injury', '질병': 'disease', '재해': 'disaster',
  '사망': 'death', '자살': 'suicide', '심신상실': 'mental-incapacity', '사인미상': 'cause-unknown',
  '교통사고': 'car-accident', '대인배상': 'bodily-injury-liability', '대물배상': 'property-damage-liability',
  '무보험차': 'uninsured-motorist', '자손': 'own-injury', '자상': 'car-injury',
  '배상책임': 'liability', '일상생활배상책임': 'personal-liability', '일배책': 'personal-liability',
  '영업배상': 'commercial-liability', '의료사고': 'medical-malpractice', '의료과실': 'medical-negligence',
  '산재': 'industrial-accident', '근재': 'workers-compensation', '업무상재해': 'occupational-injury',

  // [판례/기관]
  '대법원': 'supreme-court', '판례': 'precedent', '판결': 'ruling',
  '분쟁조정': 'dispute-resolution', '결정례': 'fss-ruling', '금융감독원': 'fss',
  '손해사정사': 'claims-adjuster', '손해사정': 'claim-adjustment',

  // [지역/행정/복지]
  '의정부시': 'uijeongbu', '의정부': 'uijeongbu', '경기도': 'gyeonggi', '경기': 'gyeonggi',
  '서울': 'seoul', '지원금': 'grant', '지원': 'support', '장려금': 'grant', '수당': 'benefit',
  '청년': 'youth', '어르신': 'senior', '노인': 'senior', '임산부': 'pregnant', '영유아': 'infant',
  '소상공인': 'small-business', '자영업자': 'self-employed', '출산': 'birth',
  '축제': 'festival', '공연': 'performance', '콘서트': 'concert', '버스킹': 'busking',
  '문화': 'culture', '예술': 'arts', '교통': 'transport', '경전철': 'lrt', '지하철': 'metro',
  '건강검진': 'health-checkup', '병원': 'hospital', '약국': 'pharmacy', '달빛어린이병원': 'moonlight-children-hospital',
  '사랑카드': 'love-card', '지역화폐': 'local-currency', '이사비': 'moving-expense',
  '주거': 'housing', '월세': 'monthly-rent', '전세': 'jeonse', '보증금': 'deposit',
  '가이드': 'guide', '분석': 'analysis', '전략': 'strategy', '기준': 'criteria'
};

// 3. 한글 자모 분해 및 로마자 변환기 (국립국어원 표준)
const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONG = ['', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lg', 'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'];

function romanizeHangulWord(word: string): string {
  let res = '';
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i) - 44032;
    if (code >= 0 && code <= 11171) {
      const cho = Math.floor(code / 588);
      const jung = Math.floor((code % 588) / 28);
      const jong = code % 28;
      res += CHO[cho] + JUNG[jung] + JONG[jong];
    } else if (/[a-zA-Z0-9]/.test(word[i])) {
      res += word[i].toLowerCase();
    }
  }
  return res;
}

/**
 * Google SEO & RFC 3986 표준 영문 슬러그 생성 메인 함수
 *
 * @param title 포스트 제목
 * @param customSlug 사용자가 직접 입력한 커스텀 슬러그 (있을 경우 우선 정규화)
 * @returns 100% 영문 소문자 케밥케이스 슬러그
 */
export function generateSemanticSlug(title: string, customSlug?: string): string {
  // 1. 커스텀 슬러그가 명시적으로 제공된 경우 정규화
  if (customSlug && customSlug.trim()) {
    const normalized = customSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
    if (normalized) return normalized.slice(0, 70);
  }

  if (!title || !title.trim()) {
    return `post-${Date.now()}`;
  }

  let text = title.trim().toLowerCase();

  // 2. 특수문자 전처리 (콜론, 괄호, 슬래시 등을 공백으로 분리)
  text = text.replace(/[:()\[\]·,\/\?!\^~"']/g, ' ');

  // 3. 도메인 사전 최우선 매핑 (긴 단어부터 치환하여 부분 매칭 오류 방지)
  const sortedDictKeys = Object.keys(DOMAIN_DICTIONARY).sort((a, b) => b.length - a.length);
  for (const key of sortedDictKeys) {
    if (text.includes(key)) {
      const replacement = ` ${DOMAIN_DICTIONARY[key]} `;
      text = text.split(key).join(replacement);
    }
  }

  // 4. 단어 단위 토큰화 및 불용어 제거 & 미매핑 한글 로마자화
  const tokens = text.split(/\s+/).filter(Boolean);
  const slugParts: string[] = [];

  for (const token of tokens) {
    // 이미 영문/숫자로 변환된 토큰
    if (/^[a-z0-9-]+$/.test(token)) {
      const clean = token.replace(/^-|-$/g, '');
      if (clean && !slugParts.includes(clean)) {
        slugParts.push(clean);
      }
      continue;
    }

    // 불용어 조사 필터링
    if (KOREAN_STOPWORDS.has(token)) {
      continue;
    }

    // 미매핑 한글 단어 로마자화
    const romanized = romanizeHangulWord(token);
    if (romanized && romanized.length > 1 && !slugParts.includes(romanized)) {
      slugParts.push(romanized);
    }
  }

  // 5. 케밥 케이스 결합 및 정규화
  let finalSlug = slugParts.join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  // 6. 길이 제한 (구글 SEO 권장: 60자 이내)
  if (finalSlug.length > 65) {
    // 단어 중간이 잘리지 않도록 하이픈 기준으로 트림
    const trimmed = finalSlug.slice(0, 65);
    const lastHyphen = trimmed.lastIndexOf('-');
    finalSlug = lastHyphen > 30 ? trimmed.slice(0, lastHyphen) : trimmed;
  }

  return finalSlug || `claim-post-${Date.now()}`;
}

export default generateSemanticSlug;

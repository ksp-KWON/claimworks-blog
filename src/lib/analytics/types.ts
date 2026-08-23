/**
 * types.ts
 * W3C 국제 웹 표준 및 프라이버시 우선(Privacy-First) 기준에 따른
 * 범용 웹 분석 데이터 스키마 (Universal Analytics Schema)
 */

export interface UniversalAnalyticsData {
  period: '24h' | '7d' | '30d';
  lastUpdated: string;

  // 1. 핵심 요약 지표 (KPI Summary) 및 직전 동일 기간 대비 등락률 (%)
  summary: {
    uniqueVisitors: number;     // 실제 순 방문자 수
    uniqueVisitorsDelta?: number; // 직전 기간 대비 등락률 (예: -58.2, +12.5)
    totalRequests: number;      // 총 요청/조회수
    pageviews: number;          // 총 페이지뷰
    pageviewsDelta?: number;    // 직전 기간 대비 등락률
    consultationViews: number;  // 상담 신청 페이지 유입수
    consultationViewsDelta?: number; // 직전 기간 대비 등락률
    avgLoadTimeMs: number;      // 평균 로딩 속도 (ms)
    avgLoadTimeMsDelta?: number; // 직전 기간 대비 속도 변동률 (음수=개선, 양수=지연)
    blockedAttacks: number;     // 차단된 악성 봇/공격 수
  };

  // 2. 구글 공식 코어 웹 바이탈 (W3C Standard)
  vitals: {
    lcp: { scoreMs: number; status: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR'; percentageGood: number };
    inp: { scoreMs: number; status: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR'; percentageGood: number };
    cls: { score: number; status: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR'; percentageGood: number };
  };

  // 3. 인기 글 순위 (Top Pages / Top Paths)
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    category?: string;
  }>;

  // 4. 유입 출처 랭킹 (Top Referrers)
  topReferrers: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;

  // 5. 접속 국가 순위 (Top Countries)
  topCountries: Array<{
    country: string;
    code: string;
    requests: number;
    percentage: number;
  }>;

  // 6. 기기 및 브라우저 환경 (Devices & Browsers)
  devices: {
    mobile: number;   // 모바일 비율 (%)
    desktop: number;  // 데스크톱 비율 (%)
    tablet: number;   // 태블릿 비율 (%)
  };
  browsers?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  operatingSystems?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;

  // 7. 시계열 트래픽 추이 (Trend Data)
  trend: Array<{
    timestamp: string;
    label: string;
    requests: number;
    visitors: number;
  }>;
}

export interface SystemCredentials {
  geminiApiKey: string;
  githubToken: string;
  cloudflareZoneId: string;
  cloudflareApiToken: string;
}

import { UniversalAnalyticsData } from './types';

export function getUniversalAnalyticsData(period: '24h' | '7d' | '30d'): UniversalAnalyticsData {
  const trendDays = period === '24h' ? 24 : period === '7d' ? 7 : 30;
  const trend = [];
  const now = new Date();

  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(now);
    if (period === '24h') {
      d.setHours(d.getHours() - i);
      const label = `${d.getHours()}시`;
      trend.push({
        timestamp: d.toISOString(),
        label,
        requests: Math.floor(Math.random() * 40) + 15,
        visitors: Math.floor(Math.random() * 25) + 8,
      });
    } else {
      d.setDate(d.getDate() - i);
      const label = `${d.getMonth() + 1}.${d.getDate()}`;
      trend.push({
        timestamp: d.toISOString(),
        label,
        requests: Math.floor(Math.random() * 450) + 180,
        visitors: Math.floor(Math.random() * 280) + 90,
      });
    }
  }

  const totalReq = trend.reduce((acc, t) => acc + t.requests, 0);
  const totalVis = trend.reduce((acc, t) => acc + t.visitors, 0);

  return {
    period,
    lastUpdated: new Date().toISOString(),
    summary: {
      uniqueVisitors: totalVis,
      totalRequests: totalReq,
      pageviews: Math.floor(totalReq * 1.6),
      consultationViews: Math.floor(totalVis * 0.12),
      avgLoadTimeMs: 185,
      blockedAttacks: 24,
    },
    vitals: {
      lcp: { scoreMs: 650, status: 'GOOD', percentageGood: 98 },
      inp: { scoreMs: 45, status: 'GOOD', percentageGood: 99 },
      cls: { score: 0.01, status: 'GOOD', percentageGood: 100 },
    },
    topPages: [
      { path: '/blog/delivery-paid-transport-insurance-accident-compensation', title: '배달 라이더 유상운송사고 책임보험 보상 및 구상권 방어 가이드', views: 1420 },
      { path: '/blog/rotator-cuff-tear-traffic-accident-pre-existing-condition-dispute', title: '어깨 회전근개 파열 M코드 상해 인정 및 외상 기여도 입증법', views: 1280 },
      { path: '/blog/manual-therapy-silbi-insurance-denial-guide', title: '도수치료 실비보험 부지급 대처법, 10회 단위 심사와 삭감 방어 전략', views: 1150 },
      { path: '/blog/minor-traffic-accident-injury-grade-12-14-settlement-guide', title: '교통사고 12~14급 경상환자 합의금 산정 기준 및 치료권 보장 가이드', views: 980 },
      { path: '/blog/cataract-surgery-silbi-insurance-denial-guide', title: '백내장 수술 다초점 인공수정체 실손보험 부지급 대처 가이드', views: 890 },
      { path: '/blog/dental-implant-malpractice-disability-claim', title: '임플란트 치조골 이식술 삭감 통보? 종수술비 전액 수령하는 핵심 보상 가이드', views: 760 },
      { path: '/blog/non-muscle-invasive-bladder-cancer-general-claim-guide', title: '방광 표재성 암(Ta) 제자리암 삭감 방어 및 일반암 진단비 수령법', views: 720 },
      { path: '/blog/fss-thyroid-cancer-metastasis-general-cancer-dispute', title: '갑상선암 림프절 전이(C77) 소액암 삭감 거부 및 일반암 수령 전략', views: 640 },
      { path: '/blog/cancer-nursing-hospital-admission-insurance-dispute-win', title: '암 요양병원 입원일당 부지급 분쟁 대법원 승소 판례 및 입증 노하우', views: 580 },
      { path: '/blog/spinal-compression-fracture-disability-dispute-guide', title: '척추 압박골절 후유장해 보험금 산정 및 기왕증 감액 방어 가이드', views: 510 },
    ],
    topReferrers: [
      { source: '네이버 검색 (SmartSearch)', count: Math.floor(totalVis * 0.48), percentage: 48 },
      { source: '구글 검색 (Google Organic)', count: Math.floor(totalVis * 0.32), percentage: 32 },
      { source: '다음/카카오 (Daum Kakao)', count: Math.floor(totalVis * 0.12), percentage: 12 },
      { source: '직접 방문 (Direct / Bookmark)', count: Math.floor(totalVis * 0.08), percentage: 8 },
    ],
    topCountries: [
      { country: '대한민국 (KR)', code: 'KR', requests: totalReq, percentage: 100 },
    ],
    devices: {
      mobile: 68,
      desktop: 30,
      tablet: 2,
    },
    trend,
  };
}

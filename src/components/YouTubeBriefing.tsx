import YouTubeBriefingClient from './YouTubeBriefingClient';

export interface YouTubeVideo {
  id: string;
  title: string;
  published: string;
}

// 하드코딩 폴백 (API 실패 시 초기 렌더 용)
const FALLBACK_VIDEOS: YouTubeVideo[] = [
  {
    id: '9zmUJIeKGWo',
    title: '내과실 높은 교통사고 치료비 공제 문제 해결 : 자상 담보 선지급 처리 방법',
    published: '2026. 6. 12.'
  },
  {
    id: 'T04PI99YjNA',
    title: '병원에서 대장점막내암(D01)코드를 받았는데, 이거 일반암으로 받을 수 있나요?',
    published: '2026. 6. 4.'
  },
  {
    id: 'ur-2qcXQEKA',
    title: '보험사가 티눈 시술은 수술이 아니라고 지급을 거절할 때 객관적으로 대응하는 방법',
    published: '2026. 6. 1.'
  },
  {
    id: 'RiBX0eA_Dv8',
    title: '업무 중 교통사고 났을 때, 산재보험과 자동차보험 중 무엇을 먼저 처리해야 하나요?',
    published: '2026. 5. 29.'
  }
];

/**
 * 서버 컴포넌트: 빌드 시 폴백 영상을 SSR로 전달하고,
 * 실제 최신 데이터는 클라이언트에서 /api/youtube (Cloudflare Pages Function)를 통해 1시간 캐싱으로 조회합니다.
 * → RSS 직접 크롤링 없음, Rate Limit 차단 위험 없음
 */
export default function YouTubeBriefing() {
  return <YouTubeBriefingClient fallbackVideos={FALLBACK_VIDEOS} />;
}

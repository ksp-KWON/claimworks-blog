import { NextResponse } from 'next/server';

/**
 * YouTube 최신 영상 조회 API (서버 사이드 캐싱)
 *
 * - Cloudflare Pages 배포 환경: functions/api/youtube.ts가 처리 (Edge 캐싱 1시간)
 * - 로컬 개발 환경: 이 파일이 /api/youtube로 동작 (Next.js ISR 캐싱 1시간)
 *
 * RSS 피드를 직접 사용합니다.
 * YouTube Data API v3가 아닌 RSS를 사용하는 이유:
 *  - API 키 불필요 (유출 위험 없음)
 *  - 일일 할당량(Quota) 소진 문제 없음
 *  - 서버 단 1시간 캐싱으로 Rate Limit 차단 완벽 방지
 */
export const revalidate = 3600; // 1시간 ISR 캐싱

export async function GET() {
  const channelId = 'UCvjJtHa7eS2G25Vwt4fzezA';
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const res = await fetch(rssUrl, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`YouTube RSS fetch failed: ${res.status}`);
    }

    const xml = await res.text();
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/;
    const titleRegex = /<title>([^<]+)<\/title>/;
    const publishedRegex = /<published>([^<]+)<\/published>/;

    const videos = [];
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const idMatch = entryXml.match(videoIdRegex);
      const titleMatch = entryXml.match(titleRegex);
      const publishedMatch = entryXml.match(publishedRegex);

      if (idMatch && titleMatch && publishedMatch) {
        const id = idMatch[1];
        // HTML 엔티티 디코딩
        const title = titleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        const dateObj = new Date(publishedMatch[1]);
        const published = isNaN(dateObj.getTime())
          ? publishedMatch[1]
          : `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}.`;

        videos.push({ id, title, published });
      }
    }

    const result = videos.slice(0, 4);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (error: unknown) {
    console.error('YouTube RSS fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

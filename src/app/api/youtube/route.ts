import { NextResponse } from 'next/server';

export const revalidate = 3600; // 1시간 캐싱 (유튜브 Rate Limit 완벽 예방)

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
    const entries = xml.split('<entry>').slice(1);
    
    const videos = entries.map(entry => {
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      
      return {
        id: videoIdMatch ? videoIdMatch[1] : '',
        title: titleMatch ? titleMatch[1] : '',
        published: publishedMatch ? new Date(publishedMatch[1]).toLocaleDateString('ko-KR') : ''
      };
    }).filter(v => v.id).slice(0, 10);

    return NextResponse.json(videos, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('API YouTube RSS fetch error:', error);
    // 서버 에러 발생 시 500 상태 코드와 에러 메세지를 반환하여 클라이언트 단 백업 데이터가 작동하도록 유도합니다.
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

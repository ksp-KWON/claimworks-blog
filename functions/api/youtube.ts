// Cloudflare Pages Function: /api/youtube
export async function onRequest() {
  const CHANNEL_ID = 'UCvjJtHa7eS2G25Vwt4fzezA';
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube RSS fetch failed: ${response.status}`);
    }

    const xml = await response.text();
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/;
    const titleRegex = /<title>([^<]+)<\/title>/;
    const publishedRegex = /<published>([^<]+)<\/published>/;

    const videos = [];
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryHtml = match[1];
      const idMatch = entryHtml.match(videoIdRegex);
      const titleMatch = entryHtml.match(titleRegex);
      const publishedMatch = entryHtml.match(publishedRegex);

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

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        // Edge에서 5분(300초) 캐시, 브라우저에서 1분(60초) 캐시 적용
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

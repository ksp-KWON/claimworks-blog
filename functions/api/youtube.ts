// Cloudflare Pages Function: /api/youtube
export const onRequest = async () => {
  const channelUrl = 'https://www.youtube.com/@bosangschool/videos';

  try {
    const res = await fetch(channelUrl, {
      cf: {
        cacheTtl: 3600,
        cacheEverything: true
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    } as any);

    if (!res.ok) {
      throw new Error(`YouTube HTML fetch failed: ${res.status}`);
    }

    const html = await res.text();
    const jsonRegex = /var ytInitialData = (\{.*?\});<\/script>/;
    const match = html.match(jsonRegex);
    
    if (!match) {
      throw new Error('ytInitialData not found in HTML');
    }
    
    const data = JSON.parse(match[1]);
    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const videosTab = tabs?.find((t: any) => t.tabRenderer?.title === '동영상' || t.tabRenderer?.title === 'Videos');
    
    if (!videosTab) {
      throw new Error('Videos tab not found');
    }
    
    const items = videosTab.tabRenderer.content.richGridRenderer.contents;
    
    const videos = items
      .filter((item: any) => item.richItemRenderer?.content?.lockupViewModel)
      .map((item: any) => {
        const v = item.richItemRenderer.content.lockupViewModel;
        // Published text is usually in the metadata parts
        const metadataParts = v.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts;
        let published = '';
        if (metadataParts && metadataParts.length > 1) {
          published = metadataParts[1].text?.content || '';
        }

        return {
          id: v.contentId,
          title: v.metadata?.lockupMetadataViewModel?.title?.content || '',
          published: published
        };
      })
      .filter((v: any) => v.id)
      .slice(0, 10);

    return new Response(JSON.stringify(videos), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error: any) {
    console.error('API YouTube fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch videos', details: error.message }),
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

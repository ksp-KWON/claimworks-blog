import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

export async function GET() {
  const siteUrl = 'https://claim-works.com';
  const posts = getSortedPostsData();

  let rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>보상스쿨 블로그</title>
  <link>${siteUrl}</link>
  <description>손해사정, 보상금, 실손보험 청구, 병원비 보상 완벽 가이드</description>
  <language>ko-KR</language>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

  posts.slice(0, 50).forEach((post) => {
    let pubDate = new Date().toUTCString();
    if (post.date) {
      const d = new Date(post.date);
      if (!isNaN(d.getTime())) pubDate = d.toUTCString();
    }

    rssXml += `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${siteUrl}/blog/${post.slug}</link>
    <description><![CDATA[${post.summary}]]></description>
    <pubDate>${pubDate}</pubDate>
    <guid>${siteUrl}/blog/${post.slug}</guid>
  </item>\n`;
  });

  rssXml += `</channel>\n</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

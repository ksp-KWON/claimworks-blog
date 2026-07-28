import { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

// 사이트 론칭 날짜 (정적 페이지용 고정 lastmod)
const SITE_LAUNCH_DATE = '2026-01-01';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://claim-works.com';
  const posts = getSortedPostsData();

  // ── 블로그 포스팅: 실제 updatedAt(수정일) 또는 date(발행일) 사용 ───────
  const postsSitemap: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date,
  }));

  // ── 정적 페이지: 마지막 실질적 콘텐츠 변경일 고정 ─────────────────────
  // 주의: Google은 priority/changeFrequency를 공식적으로 무시함 (불필요 제거)
  // 주의: /search는 robots.txt에서 Disallow 처리 중 → 사이트맵에서 제외
  // 주의: /admin은 noindex → 사이트맵에서 제외
  const staticSitemap: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`,                              lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/blog`,                         lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/fss-news`,                     lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/precedent-search`,             lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/traffic-care`,                 lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/calculator`,                   lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/calculator/auto`,              lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/calculator/medical`,           lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/calculator/liability`,         lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/about`,                        lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/privacy`,                      lastModified: SITE_LAUNCH_DATE },
    { url: `${siteUrl}/terms`,                        lastModified: SITE_LAUNCH_DATE },
  ];

  return [...staticSitemap, ...postsSitemap];
}

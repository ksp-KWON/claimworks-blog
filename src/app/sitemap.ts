import { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import { ALL_CATEGORIES } from '@/lib/constants/categories';
import { REGIONS_DATA } from '@/lib/constants';

export const dynamic = 'force-static';

// 사이트 론칭 날짜 (정적 페이지용 고정 lastmod)
const SITE_LAUNCH_DATE = '2026-01-01';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://claim-works.com';
  const posts = getSortedPostsData(false);

  // ── 1. 블로그 포스팅 ───────────────────────────────────────────────
  const postsSitemap: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date || SITE_LAUNCH_DATE,
  }));

  // ── 2. 카테고리 페이지 ─────────────────────────────────────────────
  const categoriesSitemap: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    lastModified: SITE_LAUNCH_DATE,
  }));

  // ── 3. 지역별 페이지 (시도 및 구군) ──────────────────────────────────
  const regionsSitemap: MetadataRoute.Sitemap = [];
  regionsSitemap.push({ url: `${siteUrl}/regions`, lastModified: SITE_LAUNCH_DATE });

  for (const region of REGIONS_DATA) {
    const encodedSido = encodeURIComponent(region.name);
    regionsSitemap.push({
      url: `${siteUrl}/regions/${encodedSido}`,
      lastModified: SITE_LAUNCH_DATE,
    });
    for (const district of region.districts) {
      const encodedDistrict = encodeURIComponent(district);
      regionsSitemap.push({
        url: `${siteUrl}/regions/${encodedSido}/${encodedDistrict}`,
        lastModified: SITE_LAUNCH_DATE,
      });
    }
  }

  // ── 4. 주요 정적 페이지 ───────────────────────────────────────────
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

  return [...staticSitemap, ...categoriesSitemap, ...regionsSitemap, ...postsSitemap];
}

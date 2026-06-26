import { MetadataRoute } from 'next';
import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = 'https://claim-works.com';
  const posts = getSortedPostsData();

  const postsSitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.date || new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const routes: { path: string; freq: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
    { path: '',                   freq: 'daily',   priority: 1.0 },
    { path: '/blog',              freq: 'daily',   priority: 0.9 },
    { path: '/fss-news',          freq: 'daily',   priority: 0.8 },
    { path: '/precedent-search',  freq: 'weekly',  priority: 0.8 },
    { path: '/traffic-care',      freq: 'weekly',  priority: 0.8 },
    { path: '/search',            freq: 'weekly',  priority: 0.7 },
    { path: '/calculator',        freq: 'monthly', priority: 0.7 },
    { path: '/calculator/auto',   freq: 'monthly', priority: 0.7 },
    { path: '/calculator/medical',    freq: 'monthly', priority: 0.7 },
    { path: '/calculator/liability',  freq: 'monthly', priority: 0.7 },
    { path: '/about',             freq: 'monthly', priority: 0.7 },
    { path: '/privacy',           freq: 'monthly', priority: 0.4 },
    { path: '/terms',             freq: 'monthly', priority: 0.4 },
  ];

  const staticSitemap = routes.map(({ path, freq, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: freq,
    priority,
  }));

  return [...staticSitemap, ...postsSitemap];
}


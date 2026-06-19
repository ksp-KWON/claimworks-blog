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

  const routes = [
    '',
    '/about',
    '/blog',
    '/calculator',
    '/calculator/auto',
    '/calculator/medical',
    '/calculator/liability',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: (route === '' || route === '/blog' ? 'daily' : 'monthly') as 'daily' | 'monthly',
    priority: route === '' ? 1.0 : route === '/about' ? 0.5 : 0.7,
  }));

  return [...routes, ...postsSitemap];
}

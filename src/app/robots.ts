import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * robots.ts - Next.js App Router standard (replaces public/robots.txt)
 * Google official: https://developers.google.com/search/docs/crawling-indexing/robots/intro
 *
 * Disallow rules:
 *   /admin  - admin panel (also has noindex metadata)
 *   /search - search results (also has noindex metadata)
 *   /api/   - server endpoints, no crawl value
 *   /*opengraph-image* - prevent 404 indexing of raw og endpoints
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/search', '/api/', '/*opengraph-image*'],
    },
    sitemap: 'https://claim-works.com/sitemap.xml',
  };
}

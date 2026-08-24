interface EventContext {
  request: Request;
  next: () => Promise<Response>;
}

const REDIRECT_MAP: Record<string, string> = {
  '/blog/brain-hemorrhage-insurance-claim-guide-2': '/blog/brain-hemorrhage-insurance-claim-guide',
  '/blog/health-insurance-out-of-pocket-limit-ruling-2': '/blog/health-insurance-out-of-pocket-limit-ruling',
  '/blog/guide-spinal-compression-fracture': '/blog/spinal-compression-fracture-disability-dispute-guide',
  '/blog/debtor-bankruptcy-death-inheritance-ruling-2024gcu834': '/blog/debtor-bankruptcy-death-inheritance-ruling-2024geu834',
  '/blog/debtor-bankruptcy-death-inheritance-ruling-2024gcu834/opengraph-image': '/blog/debtor-bankruptcy-death-inheritance-ruling-2024geu834',
  '/blog/unlisted-stock-divorce-property-division-ruling/opengraph-image': '/blog/unlisted-stock-divorce-property-division-ruling',
  '/blog/medical-negligence-fss-injury-dispute/opengraph-image': '/blog/medical-negligence-fss-injury-dispute',
  '/blog/dental-loss-disability-insurance-claim-dispute/opengraph-image': '/blog/dental-loss-disability-insurance-claim-dispute',
  '/blog/insurance-claim-lawsuit-dispute-resolution/opengraph-image': '/blog/insurance-claim-lawsuit-dispute-resolution',
  '/blog/chemotherapy-cerebral-hemorrhage-insurance-dispute/opengraph-image': '/blog/chemotherapy-cerebral-hemorrhage-insurance-dispute',
};

export async function onRequest(context: EventContext): Promise<Response> {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/+$/, ''); // strip trailing slash

  // 1. Direct 301 match
  if (REDIRECT_MAP[pathname]) {
    url.pathname = REDIRECT_MAP[pathname];
    return Response.redirect(url.toString(), 301);
  }

  // 2. Wildcard match for legacy opengraph-image URLs (/blog/:slug/opengraph-image)
  const ogMatch = pathname.match(/^\/blog\/([^/]+)\/opengraph-image$/);
  if (ogMatch) {
    const slug = ogMatch[1];
    url.pathname = `/blog/${slug}`;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}

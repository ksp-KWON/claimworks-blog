import { NextRequest, NextResponse } from 'next/server';
import { fetchUniversalAnalytics } from '@/lib/analytics/cloudflare-adapter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as '24h' | '7d' | '30d') || '24h';

    // 클라이언트 헤더/쿠키 기반 자격증명 옵션 (선택적)
    const customZoneId = req.headers.get('x-cf-zone-id') || undefined;
    const customApiToken = req.headers.get('x-cf-api-token') || undefined;

    const data = await fetchUniversalAnalytics(
      period,
      customZoneId && customApiToken ? { zoneId: customZoneId, apiToken: customApiToken } : undefined
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('[API /api/admin/analytics Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || '통계 데이터를 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

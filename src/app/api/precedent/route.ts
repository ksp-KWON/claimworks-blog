import { NextResponse } from 'next/server';
import { searchAndFetchPrecedents } from '@/lib/precedent-service';

export const dynamic = 'force-static';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ success: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
    }

    const LAW_API_KEY = process.env.LAW_API_KEY || 'ksp78';

    // 공유 코어 서비스 모듈 호출
    const data = await searchAndFetchPrecedents(query, LAW_API_KEY);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Precedent API error:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

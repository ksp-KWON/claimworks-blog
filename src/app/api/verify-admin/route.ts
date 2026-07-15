import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    
    // 로컬 환경 및 Cloudflare Pages 배포 환경 모두 지원
    // Cloudflare에서는 functions/api/verify-admin.ts가 우선 작동하지만,
    // npm run dev 로컬 구동 시에는 이 파일이 작동합니다.
    const adminPassword = process.env.ADMIN_PASSWORD || '9913006';

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

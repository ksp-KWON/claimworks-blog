import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

// 정적 사이트 빌드 시 사전 생성 (Cloudflare Pages 호환)
export const dynamic = 'force-static';

export async function GET(request: Request) {
  try {
    let isAdmin = false;
    
    // [근본 원인 해결] Next.js 14+ 정적 빌드(Static Export) 시 
    // request.url을 참조하면 동적 렌더링으로 간주되어 빌드 에러(Bailout)가 발생하고, 
    // catch 블록으로 빠져 빈 배열([])이 정적 JSON으로 구워지는 문제가 있었습니다.
    // 로컬 개발(어드민) 환경에서만 request.url을 파싱하도록 Webpack dead-code elimination을 유도합니다.
    if (process.env.NODE_ENV === 'development') {
      const { searchParams } = new URL(request.url);
      isAdmin = searchParams.get('admin') === 'true';
    }
    
    // posts.ts의 getSortedPostsData를 재사용 (isAdmin이 true면 비공개 글도 포함)
    const posts = getSortedPostsData(isAdmin);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts: ', error);
    return NextResponse.json([]);
  }
}

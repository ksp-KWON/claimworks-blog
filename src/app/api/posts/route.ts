import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

// 정적 사이트 빌드 시 사전 생성 (Cloudflare Pages 호환)
export const dynamic = 'force-static';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    
    // posts.ts의 getSortedPostsData를 재사용 (isAdmin이 true면 비공개 글도 포함)
    const posts = getSortedPostsData(isAdmin);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts: ', error);
    return NextResponse.json([]);
  }
}

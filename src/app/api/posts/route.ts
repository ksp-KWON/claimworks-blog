import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

// 정적 사이트 빌드 시 사전 생성 (Cloudflare Pages 호환)
export const dynamic = 'force-static';

export async function GET() {
  try {
    // posts.ts의 getSortedPostsData를 재사용 — formatDate 등 중복 로직 완전 제거
    const posts = getSortedPostsData(false);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts: ', error);
    return NextResponse.json([]);
  }
}

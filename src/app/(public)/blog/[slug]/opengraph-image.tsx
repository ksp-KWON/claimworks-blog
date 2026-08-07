import { ImageResponse } from 'next/og';
import { getSortedPostsData, getPostData } from '@/lib/posts';
import SharedOGImage from '@/components/ui/SharedOGImage';

export function generateStaticParams() {
  const posts = getSortedPostsData(false);
  return posts.map((post) => ({ slug: post.slug }));
}

export const alt = '보상스쿨 블로그';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);
  const title = post?.title || '보상스쿨 전문 손해사정 그룹';

  return new ImageResponse(
    (
      <SharedOGImage
        title={title}
        label="보상스쿨 전문가 칼럼"
      />
    ),
    {
      ...size,
    }
  );
}

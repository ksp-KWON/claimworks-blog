import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';
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

  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading logo file for OG image:', error);
  }

  return new ImageResponse(
    (
      <SharedOGImage
        title={title}
        label="보상스쿨 전문가 칼럼"
        logoBase64={logoBase64}
        variant="post"
      />
    ),
    {
      ...size,
    }
  );
}

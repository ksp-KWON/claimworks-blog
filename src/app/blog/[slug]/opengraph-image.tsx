import { ImageResponse } from 'next/og';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import fs from 'fs';
import path from 'path';

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

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getPostData(params.slug);
  const title = post ? post.title : '보상스쿨 헬스케어 & 손해사정 보상가이드';

  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public/logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error reading logo file for blog OG image:', error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '800px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
            {logoBase64 ? (
              <img
                src={logoBase64}
                alt="보상스쿨"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '30px',
                }}
              />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            )}
            <span style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginLeft: 16 }}>보상스쿨</span>
          </div>
          
          <h1
            style={{
              fontSize: '54px',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.3,
              marginTop: 0,
              marginBottom: 0,
              wordBreak: 'keep-all',
            }}
          >
            {title}
          </h1>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

export const alt = '보상스쿨 공식 블로그';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a73e8',
          backgroundImage: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            width: '100%',
            height: '100%',
            borderRadius: '40px',
            padding: '60px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}
        >
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="보상스쿨"
              style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                flex: 1,
                objectFit: 'contain',
                objectPosition: 'center',
                marginBottom: '40px',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '64px',
                fontWeight: '900',
                color: '#1a73e8',
                marginBottom: '40px',
              }}
            >
              보상스쿨
            </div>
          )}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#111827',
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}
          >
            AI 판례검색 및 맞춤형 보상가이드
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


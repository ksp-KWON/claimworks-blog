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
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0 80px',
            textAlign: 'center',
          }}
        >
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="보상스쿨"
              style={{
                width: '240px',
                height: '240px',
                marginBottom: '40px',
                borderRadius: '120px',
              }}
            />
          ) : (
            <div
              style={{
                width: '240px',
                height: '240px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f1f5f9',
                borderRadius: '120px',
                marginBottom: '40px',
              }}
            >
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#d93025" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
          
          <h1
            style={{
              fontSize: '68px',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.2,
              marginTop: 0,
              marginBottom: '20px',
              wordBreak: 'keep-all',
            }}
          >
            보상스쿨 공식 블로그
          </h1>
          <p
            style={{
              fontSize: '30px',
              fontWeight: 600,
              color: '#64748b',
              margin: 0,
              wordBreak: 'keep-all',
            }}
          >
            교통사고 · 후유장해 · 실손의료비 · 보험금 청구 전문 가이드
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}


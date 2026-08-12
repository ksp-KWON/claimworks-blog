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
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        {logoBase64 ? (
          <img
            src={logoBase64}
            alt="보상스쿨"
            width={550}
            height={550}
            style={{
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: '80px',
              fontWeight: '900',
              color: '#111827',
            }}
          >
            보상스쿨
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  );
}

import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';
import SharedOGImage from '@/components/ui/SharedOGImage';

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
      <SharedOGImage
        title="전문 손해사정사의 확실한 보상 솔루션"
        label="보상스쿨 공식 블로그"
        logoBase64={logoBase64}
      />
    ),
    {
      ...size,
    }
  );
}


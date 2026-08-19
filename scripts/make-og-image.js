const sharp = require('sharp');
const path = require('path');

async function createOgImage() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/og-image.png');

  // 1. 원본 로고의 불필요한 투명 여백을 trim()으로 순수 그래픽만 추출
  const trimmedLogo = await sharp(logoPath)
    .trim()
    .toBuffer();

  // 2. 저자소개 박스(황금비율)와 동일하게 520px 폭으로 리사이즈 (가로세로 비율 100% 유지)
  const resizedLogo = await sharp(trimmedLogo)
    .resize(520, null, { fit: 'inside' })
    .toBuffer();

  const meta = await sharp(resizedLogo).metadata();
  console.log(`📐 리사이즈된 순수 로고 크기: ${meta.width}x${meta.height}`);

  // 3. 1200x630 순백색 캔버스 정중앙에 합성
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([
    {
      input: resizedLogo,
      gravity: 'center'
    }
  ])
  .png({ quality: 95 })
  .toFile(outputPath);

  console.log('✅ public/og-image.png (1200x630 황금비율) 생성 완료!');
}

createOgImage().catch(console.error);

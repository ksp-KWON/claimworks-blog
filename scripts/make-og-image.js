const sharp = require('sharp');
const path = require('path');

async function createOgImage() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const outputPath = path.join(__dirname, '../public/og-image.png');

  // 1. 로고를 380x380 정사각형으로 리사이즈
  const resizedLogo = await sharp(logoPath)
    .resize(380, 380, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  // 2. 1200x630 순백색 캔버스 생성 후 정중앙에 로고 합성
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

  console.log('✅ public/og-image.png (1200x630) 생성 완료!');
}

createOgImage().catch(console.error);

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');
const outputPath = path.join(process.cwd(), 'src/lib/posts-data.json');
// 클라이언트 fetch용 public 경로에도 동시 출력
const publicOutputPath = path.join(process.cwd(), 'public/data/posts-data.json');

function formatDate(dateVal) {
  if (!dateVal) return '';
  try {
    let d;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else {
      d = new Date(String(dateVal));
    }
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return String(dateVal);
}

function run() {
  console.log('Running prebuild: generating static posts database...');
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        date: formatDate(data.date),
        updatedAt: data.updatedAt ? formatDate(data.updatedAt) : undefined,
        summary: data.summary || '',
        category: data.category || '',
        caseNumber: data.caseNumber || '',
        regionCategory: data.regionCategory || '',
        specialtyCategory: data.specialtyCategory || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        published: data.published !== false,
        content: content,
      };
    });

  // 날짜 최신순 정렬 (내림차순)
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // src/lib 경로 (서버 import용)
  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`Successfully generated ${posts.length} posts to ${outputPath}`);

  // public/data 경로 (클라이언트 fetch용)
  const publicDir = path.dirname(publicOutputPath);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(publicOutputPath, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`Also copied to ${publicOutputPath}`);

  // RSS 피드 자동 생성 (public/rss.xml)
  const rssOutputPath = path.join(process.cwd(), 'public/rss.xml');
  const siteUrl = 'https://claim-works.com'; // 프로젝트 배포 주소
  let rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>보상스쿨 블로그</title>
  <link>${siteUrl}</link>
  <description>손해사정, 보상금, 실손보험 청구, 병원비 보상 완벽 가이드</description>
  <language>ko-KR</language>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

  posts.slice(0, 50).forEach(post => {
    // 본문 중 유효한 날짜만 파싱
    let pubDate = new Date().toUTCString();
    if (post.date) {
      const d = new Date(post.date);
      if (!isNaN(d.getTime())) pubDate = d.toUTCString();
    }
    
    rssXml += `  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${siteUrl}/blog/${post.slug}</link>
    <description><![CDATA[${post.summary}]]></description>
    <pubDate>${pubDate}</pubDate>
    <guid>${siteUrl}/blog/${post.slug}</guid>
  </item>\n`;
  });

  rssXml += `</channel>\n</rss>`;
  fs.writeFileSync(rssOutputPath, rssXml, 'utf8');
  console.log(`Successfully generated RSS feed to ${rssOutputPath}`);

  // Sitemap 자동 생성 (public/sitemap.xml)
  const sitemapOutputPath = path.join(process.cwd(), 'public/sitemap.xml');
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 메인 홈 -->
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- 소개 페이지 -->
  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <!-- 블로그 전체 목록 -->
  <url>
    <loc>${siteUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 계산기 메인 -->
  <url>
    <loc>${siteUrl}/calculator</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- 자동차보험 계산기 -->
  <url>
    <loc>${siteUrl}/calculator/auto</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 실손의료비 계산기 -->
  <url>
    <loc>${siteUrl}/calculator/medical</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- 개인정보처리방침 -->
  <url>
    <loc>${siteUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <!-- 이용약관 -->
  <url>
    <loc>${siteUrl}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

  posts.forEach(post => {
    const lastmod = post.date || new Date().toISOString().split('T')[0];
    sitemapXml += `  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  });

  sitemapXml += `</urlset>`;
  fs.writeFileSync(sitemapOutputPath, sitemapXml, 'utf8');
  console.log(`Successfully generated Sitemap to ${sitemapOutputPath}`);

  // HIRA 병원 정보 분할 생성 추가
  splitHiraData();

  // Cloudflare Pages Edge Redirects 파일 동적 생성 추가
  generateCloudflareRedirects();
}

function generateCloudflareRedirects() {
  console.log('Generating Cloudflare redirects file...');
  const lawApiKey = process.env.LAW_API_KEY || 'ksp78';
  const redirectsPath = path.join(process.cwd(), 'public/_redirects');
  
  // Cloudflare Pages 200 Proxy rules
  const redirectsContent = `# Cloudflare Pages Edge Redirects / Proxy rules
/api/precedent https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${lawApiKey}&search=2 200
/api/precedent-detail https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${lawApiKey} 200
`;

  fs.writeFileSync(redirectsPath, redirectsContent, 'utf8');
  console.log(`Successfully generated redirects file to ${redirectsPath}`);
}

function splitHiraData() {
  const hiraSourcePath = path.join(process.cwd(), 'src/content/hira-hospitals.json');
  const hospitalsOutputDir = path.join(process.cwd(), 'public/data/hospitals');

  if (fs.existsSync(hiraSourcePath)) {
    console.log('Splitting HIRA hospital database into district-level files...');
    const hiraData = JSON.parse(fs.readFileSync(hiraSourcePath, 'utf8'));
    
    if (!fs.existsSync(hospitalsOutputDir)) {
      fs.mkdirSync(hospitalsOutputDir, { recursive: true });
    } else {
      // 기존에 존재하던 JSON 분할 파편 파일 청소
      const files = fs.readdirSync(hospitalsOutputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(hospitalsOutputDir, file));
        }
      }
    }

    let splitCount = 0;
    if (hiraData && hiraData.regions) {
      for (const [sidoName, sidoData] of Object.entries(hiraData.regions)) {
        if (!sidoData || !sidoData.districts) continue;
        for (const [districtName, districtData] of Object.entries(sidoData.districts)) {
          const fileContent = {
            sido: sidoName,
            district: districtName,
            specialties: districtData.specialties || {}
          };
          const outputFileName = `${sidoName}-${districtName}.json`;
          fs.writeFileSync(
            path.join(hospitalsOutputDir, outputFileName),
            JSON.stringify(fileContent, null, 2),
            'utf8'
          );
          splitCount++;
        }
      }
    }
    console.log(`Successfully split HIRA database into ${splitCount} district files at ${hospitalsOutputDir}`);
  } else {
    console.warn(`HIRA source database not found at ${hiraSourcePath}. Skipping split process.`);
  }
}

run();


const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../src/content/posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

// 기존 슬러그별 새 카테고리(다중 카테고리는 쉼표로 구분) 매핑 테이블
const categoryMapping = {
  // 장해평가·면책 & 보상가이드
  'guide-permanent-disability-compensation': '장해평가·면책, 보상가이드',
  
  // 교통사고 보상 & 장해평가·면책
  'rotator-cuff-tear-traffic-accident-pre-existing-condition-dispute': '교통사고 보상, 장해평가·면책',
  
  // 교통사고 보상 & 근재·산재 사고
  'delivery-motorcycle-accident-industrial-denial-lost-wages': '교통사고 보상, 근재·산재 사고',
  
  // 배상책임·의료
  'filler-procedure-side-effect-vascular-occlusion-liability-insurance': '배상책임·의료',
  
  // 질병진단·실손 & 보상가이드
  'guide-diabetic-retinopathy-claim': '질병진단·실손, 보상가이드',
  'guide-spine-procedure-disclosure': '질병진단·실손, 보상가이드',
  'surgery-expense-insurance-claim': '질병진단·실손, 보상가이드',
  'silbi-insurance-claim-guide': '질병진단·실손, 보상가이드',
  'cancer-insurance-claim-guide': '질병진단·실손, 보상가이드',
  'cataract-surgery-private-health-insurance': '질병진단·실손, 보상가이드',
  
  // 보상가이드 단독
  'injury-insurance-claim-guide': '보상가이드',
  'loss-adjuster-appointment-guide': '보상가이드',
  'welcome': '보상가이드',
  
  // 배상책임·의료 & 보상가이드
  'medical-malpractice-compensation-guide': '배상책임·의료, 보상가이드',
  'guide-slip-fall-compensation': '배상책임·의료, 보상가이드',
  
  // 근재·산재 사고 & 보상가이드
  'industrial-accident-compensation-guide': '근재·산재 사고, 보상가이드',
  
  // 장해평가·면책 & 교통사고 보상
  'spinal-compression-fracture-disability-compensation': '장해평가·면책, 교통사고 보상',
  
  // 장해평가·면책 단독
  'cruciate-ligament-rupture-disability-compensation': '장해평가·면책',
  'herniated-disc-disability-compensation': '장해평가·면책',
  
  // 교통사고 보상 & 보상가이드
  'traffic-settlement-guide': '교통사고 보상, 보상가이드',
  'auto-accident-settlement-guide': '교통사고 보상, 보상가이드'
};

function runMigration() {
  console.log('Starting category migration for posts...');
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);
    const slug = file.replace(/\.md$/, '');
    
    const newCategories = categoryMapping[slug];
    if (newCategories) {
      parsed.data.category = newCategories;
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`[OK] Updated: ${file} -> "${newCategories}"`);
      updatedCount++;
    } else {
      console.log(`[SKIP] No mapping for: ${file} (Category: ${parsed.data.category || 'none'})`);
    }
  });

  console.log(`Migration finished. Total updated posts: ${updatedCount}/${files.length}`);
}

runMigration();

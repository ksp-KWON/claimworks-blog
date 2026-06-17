const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDir = path.join(__dirname, '../src/content/posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

// 기존 슬러그별 새 카테고리(다중 카테고리는 쉼표로 구분) 매핑 테이블
const categoryMapping = {
  'guide-permanent-disability-compensation': '장해평가·면책, 보상가이드',
  'rotator-cuff-tear-traffic-accident-pre-existing-condition-dispute': '교통사고 보상, 장해평가·면책',
  'delivery-motorcycle-accident-industrial-denial-lost-wages': '교통사고 보상, 근재·산재 사고',
  'filler-procedure-side-effect-vascular-occlusion-liability-insurance': '배상책임·의료',
  'guide-diabetic-retinopathy-claim': '질병진단·실손, 보상가이드',
  'guide-spine-procedure-disclosure': '질병진단·실손, 보상가이드',
  'surgery-expense-insurance-claim': '질병진단·실손, 보상가이드',
  'silbi-insurance-claim-guide': '질병진단·실손, 보상가이드',
  'cancer-insurance-claim-guide': '질병진단·실손, 보상가이드',
  'cataract-surgery-private-health-insurance': '질병진단·실손, 보상가이드',
  'injury-insurance-claim-guide': '보상가이드',
  'loss-adjuster-appointment-guide': '보상가이드',
  'welcome': '보상가이드',
  'medical-malpractice-compensation-guide': '배상책임·의료, 보상가이드',
  'guide-slip-fall-compensation': '배상책임·의료, 보상가이드',
  'industrial-accident-compensation-guide': '근재·산재 사고, 보상가이드',
  'spinal-compression-fracture-disability-compensation': '장해평가·면책, 교통사고 보상',
  'cruciate-ligament-rupture-disability-compensation': '장해평가·면책',
  'herniated-disc-disability-compensation': '장해평가·면책',
  'traffic-settlement-guide': '교통사고 보상, 보상가이드',
  'auto-accident-settlement-guide': '교통사고 보상, 보상가이드'
};

// 기존 슬러그별 진료과목(다중 진료과목은 쉼표로 구분) 매핑 테이블
const specialtyMapping = {
  'guide-permanent-disability-compensation': '정형외과, 신경외과, 재활의학과',
  'rotator-cuff-tear-traffic-accident-pre-existing-condition-dispute': '정형외과, 재활의학과',
  'delivery-motorcycle-accident-industrial-denial-lost-wages': '정형외과, 신경외과, 외과',
  'filler-procedure-side-effect-vascular-occlusion-liability-insurance': '피부과 / 성형외과',
  'guide-diabetic-retinopathy-claim': '안과, 내과',
  'guide-spine-procedure-disclosure': '정형외과, 신경외과',
  'surgery-expense-insurance-claim': '외과, 산부인과, 안과, 정형외과, 내과',
  'silbi-insurance-claim-guide': '내과, 정형외과',
  'cancer-insurance-claim-guide': '내과, 외과, 산부인과',
  'cataract-surgery-private-health-insurance': '안과',
  'injury-insurance-claim-guide': '정형외과, 외과',
  'loss-adjuster-appointment-guide': '정형외과, 신경외과, 내과, 외과',
  'welcome': '',
  'medical-malpractice-compensation-guide': '신경외과, 외과, 정형외과',
  'guide-slip-fall-compensation': '정형외과, 재활의학과',
  'industrial-accident-compensation-guide': '정형외과, 신경외과, 재활의학과, 외과',
  'spinal-compression-fracture-disability-compensation': '정형외과, 신경외과',
  'cruciate-ligament-rupture-disability-compensation': '정형외과, 재활의학과',
  'herniated-disc-disability-compensation': '정형외과, 신경외과, 재활의학과',
  'traffic-settlement-guide': '정형외과, 신경외과, 한방의학과',
  'auto-accident-settlement-guide': '정형외과, 신경외과, 한방의학과'
};

function runMigration() {
  console.log('Starting category and specialty category migration for posts...');
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(content);
    const slug = file.replace(/\.md$/, '');
    
    let isUpdated = false;
    
    const newCategories = categoryMapping[slug];
    if (newCategories) {
      parsed.data.category = newCategories;
      isUpdated = true;
    }
    
    // specialtyCategory도 함께 매핑하여 업데이트
    const newSpecialty = specialtyMapping[slug];
    if (newSpecialty !== undefined) {
      parsed.data.specialtyCategory = newSpecialty;
      isUpdated = true;
    }

    if (isUpdated) {
      const newContent = matter.stringify(parsed.content, parsed.data);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`[OK] Updated: ${file} -> Category: "${newCategories}", Specialty: "${newSpecialty}"`);
      updatedCount++;
    } else {
      console.log(`[SKIP] No changes for: ${file}`);
    }
  });

  console.log(`Migration finished. Total updated posts: ${updatedCount}/${files.length}`);
}

runMigration();

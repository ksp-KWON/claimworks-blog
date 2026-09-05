/**
 * scripts/check-duplicate-regions.js
 * 전국 250개 시·군·구 지역 페이지 중복 검증 게이트 CLI 래퍼
 * 
 * [헌법 표준]
 * - `node scripts/check-duplicate-regions.js` 실행 시 tsx를 통해 TypeScript 검증 엔진 구동
 */

const { spawnSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'check-duplicate-regions.ts');
const result = spawnSync('npx', ['tsx', scriptPath], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 0);

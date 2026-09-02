const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\kspcl\\Documents\\ksp-local-info';
const helperPath = path.join(targetDir, 'scripts/gemini-helper.js');
let code = fs.readFileSync(helperPath, 'utf8');

// maxTokensFallback 상향
code = code.replace(/maxTokensFallback:\s*32768/g, 'maxTokensFallback: 65536');
code = code.replace(/maxTokensFallback:\s*16384/g, 'maxTokensFallback: 32768');
code = code.replace(/maxTokens:\s*32768/g, 'maxTokens: 65536');
code = code.replace(/maxTokens:\s*16384/g, 'maxTokens: 32768');

// finishReason 검증 추가
if (!code.includes('finishReason !== \'STOP\'')) {
  code = code.replace(
    /const candidate\s*=\s*data\?\.candidates\?\.\[0\];/,
    `const candidate    = data?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      // Google 공식 표준: 정상 완료('STOP')가 아니면(예: 'MAX_TOKENS', 'SAFETY') 미완결로 판정하고 릴레이 전환
      if (finishReason && finishReason !== 'STOP') {
        lastError = \`[\${model}] 생성 미완결 (finishReason: \${finishReason})\`;
        console.warn(\`  [절단 감지] \${model} 비정상 종료 (\${finishReason}) — 차순위 최적 모델로 릴레이 전환합니다.\`);
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(1500); continue; }
        continue modelLoop;
      }`
  );
}

fs.writeFileSync(helperPath, code, 'utf8');
console.log('✅ ksp-local-info gemini-helper.js updated with Google standard finishReason check');

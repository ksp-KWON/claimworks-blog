/**
 * google-blog-prompt.js
 * 보상스쿨 구글 공식 웹사이트 & E-E-A-T 전용 마스터 프롬프트 (v5 최종 SSOT 연동판)
 * 
 * [헌법 원칙: 단일 진실의 원천 (SSOT)]
 * — 모든 공통 헌법 및 작성 규칙은 src/lib/prompt-rules.js에서 단일 관리됩니다.
 * — 이 모듈은 외부 참조 및 하위 호환성을 위해 조립된 구글 마스터 프롬프트 본문을 투명하게 제공합니다.
 */

'use strict';

const { assembleArticlePrompt } = require('./prompt-rules.js');

// 샘플 토픽으로 기본 완성된 구글 블로그 마스터 프롬프트 텍스트 렌더링
const googleBlogPrompt = assembleArticlePrompt({
  mode: 'trend',
  topic: {
    title: '[사안의 핵심 쟁점 및 키워드]',
    category: '질병보상',
    specialtyCategory: '신체손해사정',
    tags: ['손해사정', '보험금', '약관해석']
  }
});

module.exports = { googleBlogPrompt };

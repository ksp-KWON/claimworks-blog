/**
 * fetch-utils.js
 * Node.js (GitHub Actions 등) 환경에서 외부 API 호출 시 발생하는
 * 타임아웃, IPv6/IPv4 충돌, 봇 차단(403/404) 문제를 근본적으로 해결하는 표준 통신 유틸리티입니다.
 */

'use strict';

// [1] DNS 설정: Node.js 18 이상 버전이 최우선적으로 IPv6를 시도하다가
// 공공기관(금감원, 법제처 등) 서버에서 타임아웃(fetch failed) 나는 것을 방지합니다.
const dns = require('dns');
if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * 안전하고 강력한 fetch 래퍼 함수
 * @param {string} url - 호출할 외부 API URL
 * @param {object} options - 기존 fetch options (method, body 등)
 * @param {number} timeoutMs - 타임아웃 밀리초 (기본 15000ms = 15초)
 * @returns {Promise<Response>} Fetch Response 객체
 */
async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders = {
    // 봇 차단(YouTube, Naver 등) 우회를 위한 표준 브라우저 스푸핑 헤더
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  const finalOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {})
    },
    signal: controller.signal
  };

  try {
    const response = await fetch(url, finalOptions);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  safeFetch
};

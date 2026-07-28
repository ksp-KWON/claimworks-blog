/**
 * pipeline-utils.js
 * 자동글쓰기 파이프라인 공통 유틸리티
 * — sleep, .env.local 로드, POSTS_DIR 상수를 이 파일 하나로 통합 관리
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── .env.local 로드 (파이프라인 전역 1회만 실행) ─────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

// ── 공통 상수 ────────────────────────────────────────────────────────────────
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

// ── 공통 유틸 ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function safeFetch(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Fetch timeout after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

module.exports = { POSTS_DIR, sleep, safeFetch };

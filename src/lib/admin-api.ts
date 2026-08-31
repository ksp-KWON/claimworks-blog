import { buildManualPrompt, getRandomAngle } from '@/lib/prompt-rules';
import { callGeminiClient } from '@/lib/gemini-client';
import { parseMarkdown, stringifyMarkdown } from './markdown-utils';

const REPO_OWNER = 'ksp-KWON';
const REPO_NAME = 'claimworks-blog';
const POSTS_PATH = 'src/content/posts';



export async function fetchPostList(githubToken: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`, {
    headers: { 'Authorization': `Bearer ${githubToken}` }
  });
  if (!res.ok) throw new Error('목록을 불러오지 못했습니다.');
  const githubFiles = await res.json();
  const mdFiles = githubFiles.filter((f: any) => f.name.endsWith('.md'));

  const titlesMap: Record<string, {title: string, date: string, published: boolean}> = {};
  try {
    const dataRes = await fetch('/api/posts?admin=true');
    if (dataRes.ok) {
      const postsData = await dataRes.json();
      postsData.forEach((post: any) => {
        titlesMap[`${post.slug}.md`] = {title: post.title, date: post.date, published: post.published !== false};
      });
    }
  } catch {}

  let localCache: Record<string, any> = {};
  try {
    localCache = JSON.parse(localStorage.getItem('admin_recent_posts') || '{}');
  } catch {}

  const result = await Promise.all(mdFiles.map(async (file: any) => {
    let mapped = titlesMap[file.name] || localCache[file.name];

    // If not in API and not in local cache (newly saved on another device/browser),
    // fetch the file content directly from GitHub to parse its frontmatter.
    if (!mapped) {
      try {
        const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${file.name}`, {
          headers: { 'Authorization': `Bearer ${githubToken}` }
        });
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          const rawMarkdown = decodeURIComponent(escape(window.atob(fileData.content)));
          const { data: meta } = parseMarkdown(rawMarkdown);
          
          mapped = {
            title: meta.title || file.name.replace('.md', ''),
            date: meta.date || new Date().toISOString().split('T')[0],
            published: meta.published !== false
          };
          
          // Save to local cache for next time
          localCache[file.name] = mapped;
          localStorage.setItem('admin_recent_posts', JSON.stringify(localCache));
        }
      } catch {
        console.warn('Failed to fetch fallback metadata for', file.name);
      }
    }

    return {
      name: file.name,
      sha: file.sha,
      title: mapped?.title || file.name.replace('.md', ''),
      date: mapped?.date || '',
      published: mapped?.published !== false
    };
  }));

  return result;
}

export async function loadPost(githubToken: string, filename: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
    headers: { 'Authorization': `Bearer ${githubToken}` }
  });
  if (!res.ok) throw new Error('파일을 불러오지 못했습니다.');
  const data = await res.json();
  const rawMarkdown = decodeURIComponent(escape(window.atob(data.content)));
  
  const { content: rawContent, data: meta } = parseMarkdown(rawMarkdown);
  return {
    title: meta.title || '',
    summary: meta.summary || '',
    category: meta.category || '기타',
    date: meta.date || new Date().toISOString().split('T')[0],
    tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : (meta.tags || ''),
    specialtyCategory: meta.specialtyCategory || '',
    caseNumber: meta.caseNumber || '',
    published: meta.published !== false,
    content: rawContent,
    slug: filename.replace('.md', '')
  };
}

const SLUG_KEYWORD_MAP: Record<string, string> = {
  '추간판': 'herniated-disc', '디스크': 'disc', '탈출증': 'herniation',
  '외상기여도': 'trauma-contribution', '기왕증': 'pre-existing-condition',
  '합의금': 'settlement', '손해배상': 'compensation', '실손': 'silbi',
  '보험금': 'insurance-claim', '소득': 'income', '일실수익': 'loss-of-income',
  '휴업손해': 'loss-of-work', '맥브라이드': 'mcbride', '장해': 'disability',
  '후유장해': 'permanent-disability', '교통사고': 'car-accident', '판례': 'precedent',
  '대법원': 'supreme-court', '분쟁조정': 'dispute-resolution', '암': 'cancer',
  '뇌졸중': 'stroke', '뇌출혈': 'brain-hemorrhage', '심근경색': 'myocardial-infarction',
  '사망': 'death', '자살': 'suicide', '배상책임': 'liability', '산재': 'industrial-accident',
  '근재': 'workers-compensation', '백내장': 'cataract', '도수치료': 'manual-therapy',
  '비급여': 'non-reimbursable', '부지급': 'denial', '면책': 'exemption', '가이드': 'guide',
  '분석': 'analysis', '기준': 'standard', '판정': 'evaluation', '산정': 'calculation',
  '입원': 'inpatient', '통원': 'outpatient', '수술': 'surgery', '진단': 'diagnosis'
};

export function generateSemanticSlug(title: string, customSlug?: string): string {
  if (customSlug && customSlug.trim()) {
    return customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  let slug = (title || '').trim().toLowerCase();
  for (const [kr, en] of Object.entries(SLUG_KEYWORD_MAP)) {
    slug = slug.replace(new RegExp(kr, 'g'), `-${en}-`);
  }

  slug = slug
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  return slug || `claim-guide-${Date.now()}`;
}

export async function savePost(githubToken: string, data: any) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  let finalSlug = '';
  if (data.slug && data.slug.trim()) {
    finalSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  } else if (data.currentFilename) {
    finalSlug = data.currentFilename.replace('.md', '');
  } else {
    finalSlug = generateSemanticSlug(data.title, data.slug);
  }
  
  const compiledTags = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  
  const frontmatterData = {
    title: data.title,
    summary: data.summary || '',
    category: data.category || '기타',
    date: data.date || new Date().toISOString().split('T')[0],
    specialtyCategory: data.specialtyCategory || '',
    caseNumber: data.caseNumber || '',
    published: data.published !== false,
    tags: compiledTags
  };

  const compiledMarkdown = stringifyMarkdown(frontmatterData, data.content);

  const contentBase64 = window.btoa(unescape(encodeURIComponent(compiledMarkdown)));
  const filename = `${finalSlug}.md`;
  const path = `${POSTS_PATH}/${filename}`;
  
  const body: any = {
    message: data.currentSha ? `docs: 포스트 수정 (${filename})` : `docs: 새 포스트 발행 (${filename})`,
    content: contentBase64,
    branch: 'main'
  };
  if (data.currentSha) body.sha = data.currentSha;

  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());

  try {
    const cached = JSON.parse(localStorage.getItem('admin_recent_posts') || '{}');
    cached[filename] = {
      title: data.title,
      date: data.date || new Date().toISOString().split('T')[0],
      published: data.published !== false
    };
    localStorage.setItem('admin_recent_posts', JSON.stringify(cached));
  } catch {
    // Ignored
  }

  return true;
}

export async function deletePost(githubToken: string, filename: string, sha: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `docs: 포스트 삭제 (${filename})`,
      sha: sha,
      branch: 'main'
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}


export async function callGeminiAPI(geminiKey: string, aiInput: string, mode: string, schema?: any, tierLimit?: ('pro'|'flash'|'lite')[]) {
  if (!geminiKey) throw new Error('Gemini API 키가 없습니다.');
  
  const angle = getRandomAngle();
  
  let prompt = '';
  
  if (mode === 'auto-generate' || mode === 'keyword-extraction') {
    prompt = aiInput;
  } else {
    prompt = buildManualPrompt(mode, aiInput, angle, []);
  }

  // [핵심] gemini-client.ts 의 자동 탐색(Dynamic Discovery)으로 위임
  const rawText = await callGeminiClient(geminiKey, prompt, { schema, tierLimit });
  const resultText = typeof rawText === 'string' ? rawText : JSON.stringify(rawText);
  return resultText;
}

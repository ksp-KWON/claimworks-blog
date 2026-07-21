import { 
  STRICT_RULES, 
  getRandomAngle,
  getBlogRole, 
  getBlogLengthRulesManual, 
  getBlogLengthRulesSemiAuto, 
  getBlogFrontmatter, 
  getBlogSkeleton,
  calculateModelCapacity,
  cleanAnalysisBlock
} from '@/lib/prompt-rules';
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
      } catch (e) {
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
    content: rawContent
  };
}

export async function savePost(githubToken: string, data: any) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  const finalSlug = data.currentFilename ? data.currentFilename.replace('.md', '') : `post-${Date.now()}`;
  
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
  } catch(e) {}

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


export async function callGeminiAPI(geminiKey: string, aiInput: string, mode: string, schema?: any) {
  if (!geminiKey) throw new Error('Gemini API 키가 없습니다.');
  
  const existingPostsList = "- (없음)";
  const strictRulesPrompt = `${STRICT_RULES}\n\n# 기존 글 블로그 목록:\n${existingPostsList}`;
  const calcTag = '<calculator type="auto" />';
  const currentDate = new Date().toISOString().split('T')[0];
  const angle = getRandomAngle();

  let prompt = '';

  if (mode === 'manual-preserve') {
    prompt = `
${getBlogRole()}
# Objective
사용자가 입력한 대본이나 초안의 디테일과 의도를 100% 보존하며 가독성이 극대화된 블로그 포스트 형태로 예쁘게 포장하십시오. (예시 부풀리게 살을 붙여 분량을 늘리지 마세요)
${getBlogLengthRulesManual()}
# 🚨 STRICT WRITING RULES
${strictRulesPrompt}
제시된 원문:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
`;
  } else if (mode === 'manual-expand') {
    prompt = `
${getBlogRole()}
# Objective
사용자가 입력한 대본이나 뼈대를 바탕으로, 전문가의 지식을 대거 추가하여 아주 상세하고 방대한 분량의 초고음질 전문 칼럼으로 새롭게 창작하십시오.
${getBlogLengthRulesSemiAuto()}
# 🚨 STRICT WRITING RULES
${strictRulesPrompt}
제시된 원문/뼈대:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
`;
  } else if (mode === 'auto-generate' || mode === 'keyword-extraction') {
    prompt = aiInput;
  } else {
    prompt = `
${getBlogRole()}
# Objective
제시된 주제/참고링크/키워드를 바탕으로 깊이 있는 전문 칼럼을 새롭게 기획하고 창작하십시오.
${getBlogLengthRulesSemiAuto()}
# 🚨 STRICT WRITING RULES
${strictRulesPrompt}
${getBlogFrontmatter('매력적인 제목 생성', currentDate)}
제시된 참고자료:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
`;
  }

  // [핵심] gemini-client.ts 의 자동 탐색(Dynamic Discovery)으로 위임
  // — 모델명 하드코딩 완전 제거. 최신 Stable 모델 자동 선택 + Pro→Flash→Lite 자동 폴백
  const rawText = await callGeminiClient(geminiKey, prompt, { schema });
  // schema 있으면 callGeminiClient가 JSON 반환, 없으면 text 반환 → 문자열로 통일
  const resultText = typeof rawText === 'string' ? rawText : JSON.stringify(rawText);
  return cleanAnalysisBlock(resultText);
}

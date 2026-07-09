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

const REPO_OWNER = 'ksp-KWON';
const REPO_NAME = 'claimworks-blog';
const POSTS_PATH = 'src/content/posts';

function parseYamlFrontmatter(markdown: string) {
  const cleanMarkdown = markdown.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/, '').trim();
  const match = cleanMarkdown.match(/---\n([\s\S]*?)\n---/);
  if (!match) return { content: cleanMarkdown, data: {} as any };
  
  const yamlContent = match[1];
  const restContent = cleanMarkdown.substring(match.index! + match[0].length).trim();
  
  const data: any = {};
  const lines = yamlContent.split('\n');
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (key === 'tags' && value.startsWith('[')) {
        try { data[key] = JSON.parse(value); } catch { data[key] = []; }
      } else {
        data[key] = value;
      }
    }
  });
  return { content: restContent, data };
}

export async function fetchPostList(githubToken: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`, {
    headers: { 'Authorization': `Bearer ${githubToken}` }
  });
  if (!res.ok) throw new Error('목록을 불러오지 못했습니다.');
  const githubFiles = await res.json();
  const mdFiles = githubFiles.filter((f: any) => f.name.endsWith('.md'));

  const titlesMap: Record<string, {title: string, date: string}> = {};
  try {
    const dataRes = await fetch('/api/posts');
    if (dataRes.ok) {
      const postsData = await dataRes.json();
      postsData.forEach((post: any) => {
        titlesMap[`${post.slug}.md`] = {title: post.title, date: post.date};
      });
    }
  } catch {}

  return mdFiles.map((file: any) => ({
    name: file.name,
    sha: file.sha,
    title: titlesMap[file.name]?.title || file.name.replace('.md', ''),
    date: titlesMap[file.name]?.date || ''
  }));
}

export async function loadPost(githubToken: string, filename: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
    headers: { 'Authorization': `Bearer ${githubToken}` }
  });
  if (!res.ok) throw new Error('파일을 불러오지 못했습니다.');
  const data = await res.json();
  const rawMarkdown = decodeURIComponent(escape(window.atob(data.content)));
  
  const { content: rawContent, data: meta } = parseYamlFrontmatter(rawMarkdown);
  return {
    title: meta.title || '',
    summary: meta.summary || '',
    category: meta.category || '기타',
    date: meta.date || new Date().toISOString().split('T')[0],
    tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : '',
    content: rawContent
  };
}

export async function savePost(githubToken: string, data: any) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  const finalSlug = data.currentFilename ? data.currentFilename.replace('.md', '') : `post-${Date.now()}`;
  
  const compiledTags = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const compiledMarkdown = `---
title: "${data.title.replace(/"/g, '\\"')}"
summary: "${data.summary.replace(/"/g, '\\"')}"
category: "${data.category || '기타'}"
date: "${data.date || new Date().toISOString().split('T')[0]}"
tags: ${JSON.stringify(compiledTags)}
---

${data.content}
`;

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

export async function runAutoPublish(githubToken: string, type: string) {
  if (!githubToken) throw new Error('GitHub Token이 없습니다.');
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/auto-post.yml/dispatches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: 'main', inputs: { post_type: type } })
  });
  if (res.status !== 204) throw new Error(`HTTP ${res.status}`);
  return true;
}

export async function callGeminiAPI(geminiKey: string, aiInput: string, mode: string) {
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
${getBlogFrontmatter('알맞은 제목 생성', currentDate)}
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
${getBlogFrontmatter('알맞은 제목 생성', currentDate)}
제시된 원문/뼈대:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
`;
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

  const models = ['gemini-1.5-pro', 'gemini-1.5-flash'];
  let lastError = '';

  for (const model of models) {
    const maxTokens = 32768;
    const modelCapacityText = calculateModelCapacity(maxTokens);
    const finalizedPrompt = prompt.replace(/\{\{TARGET_MODEL_CAPACITY\}\}/g, modelCapacityText);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalizedPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
        })
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API 사용량 초과 (무료 버전은 1분에 2회까지만 가능합니다. 1분 뒤 다시 시도해주세요.)');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      
      let text = data.candidates[0].content.parts[0].text;
      return cleanAnalysisBlock(text);
    } catch (error: any) {
      lastError = error.message;
    }
  }
  
  throw new Error(`API 오류: ${lastError}`);
}

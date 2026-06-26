import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;         // 최종 수정일 (없으면 date와 동일하게 처리)
  summary: string;
  category: string;          // 기본 카테고리 (병원보상가이드 등)
  caseNumber?: string;       // 판례 번호 (신뢰도 향상용)
  regionCategory: string;    // 지역 카테고리 (서울강남구, 부산해운대구 등)
  specialtyCategory: string; // 진료과목 카테고리 (정형외과, 신경외과 등)
  tags: string[];
  content: string;
  published?: boolean;
}

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

// 안전하게 날짜를 문자열(YYYY-MM-DD)로 변환하는 함수 (api/posts/route.ts에서도 공유)
export function formatDate(dateVal: unknown): string {
  if (!dateVal) return '';
  try {
    let d: Date;
    if (dateVal instanceof Date) {
      d = dateVal;
    } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
      d = new Date(dateVal);
    } else {
      d = new Date(String(dateVal));
    }
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // 날짜 변환 실패 시 원본 문자열 반환
  }
  return String(dateVal);
}

// 전체 마크다운 파일들을 조회하여 파싱하는 내부 헬퍼 함수
function getAllPosts(): PostData[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
          slug,
          title: data.title || '',
          date: formatDate(data.date),
          updatedAt: data.updatedAt ? formatDate(data.updatedAt) : undefined,
          summary: data.summary || '',
          category: data.category || '',
          caseNumber: data.caseNumber || '',
          regionCategory: data.regionCategory || '',
          specialtyCategory: data.specialtyCategory || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          published: data.published !== false,
          content: content,
        };
      });
  } catch (error) {
    console.error('Error reading directory: ', error);
    return [];
  }
}

// 전체 블로그 목록을 날짜 최신순으로 가져오는 함수 (관리자용은 비공개 글 포함 가능)
export function getSortedPostsData(includeUnpublished = false): Omit<PostData, 'content'>[] {
  const allPosts = getAllPosts();
  const allPostsData = allPosts
    .map((post) => {
      return {
        slug: post.slug,
        title: post.title || '',
        date: post.date,
        updatedAt: post.updatedAt,
        summary: post.summary || '',
        category: post.category || '',
        caseNumber: post.caseNumber || '',
        regionCategory: post.regionCategory || '',
        specialtyCategory: post.specialtyCategory || '',
        tags: post.tags,
        published: post.published !== false,
      };
    })
    // 관리자가 아닐 때는 비공개(published: false) 글 필터링
    .filter((post) => includeUnpublished || post.published);

  // 날짜 최신순 정렬
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

// 특정 블로그 글 하나를 가져오는 함수 (비공개 글은 관리자 권한 없이 조회 불가)
export function getPostData(slug: string, includeUnpublished = false): PostData | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const published = data.published !== false;

    // 비공개 글이고 비공개 비포함 옵션일 때 차단
    if (!published && !includeUnpublished) {
      return null;
    }

    return {
      slug,
      title: data.title || '',
      date: formatDate(data.date),
      updatedAt: data.updatedAt ? formatDate(data.updatedAt) : undefined,
      summary: data.summary || '',
      category: data.category || '',
      caseNumber: data.caseNumber || '',
      regionCategory: data.regionCategory || '',
      specialtyCategory: data.specialtyCategory || '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      content: content || '',
      published,
    };
  } catch (error) {
    console.error(`Error loading post: ${slug}`, error);
    return null;
  }
}

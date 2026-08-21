import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  title: string;
  date: string;
  isoDate?: string;
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
      // 한국 시간(KST, UTC+9) 기준으로 정확한 '오늘 날짜' 계산
      const kstTime = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return kstTime.toISOString().split('T')[0];
    }
  } catch {
    // 날짜 변환 실패 시 원본 문자열 반환
  }
  return String(dateVal);
}

// 빌드 및 런타임 디스크 I/O 최적화를 위한 인메모리 캐시
let cachedPosts: PostData[] | null = null;

// 전체 마크다운 파일들을 조회하여 파싱하는 내부 헬퍼 함수
function getAllPosts(): PostData[] {
  if (cachedPosts) {
    return cachedPosts;
  }

  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    const result = fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // YAML frontmatter에서 category가 문자열 또는 배열로 올 수 있어 문자열로 정규화
        const normalizeToString = (val: unknown): string => {
          if (Array.isArray(val)) return val.filter(Boolean).join(', ');
          if (typeof val === 'string') return val;
          return val ? String(val) : '';
        };

        return {
          slug,
          title: data.title || '',
          date: formatDate(data.date),
          isoDate: data.date ? new Date(data.date).toISOString() : '',
          updatedAt: data.updatedAt ? formatDate(data.updatedAt) : undefined,
          summary: data.summary || '',
          category: normalizeToString(data.category),
          caseNumber: data.caseNumber || '',
          regionCategory: normalizeToString(data.regionCategory),
          specialtyCategory: normalizeToString(data.specialtyCategory),
          tags: Array.isArray(data.tags)
            ? data.tags.filter((t): t is string => typeof t === 'string')
            : [],
          published: data.published !== false,
          content: content,
        };
      });

    cachedPosts = result;
    return result;
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
        isoDate: post.isoDate,
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
    const timeA = a.isoDate || a.date;
    const timeB = b.isoDate || b.date;
    if (timeA < timeB) {
      return 1;
    } else if (timeA > timeB) {
      return -1;
    } else {
      return 0;
    }
  });
}

// 특정 블로그 글 하나를 가져오는 함수 (비공개 글은 관리자 권한 없이 조회 불가)
export function getPostData(slug: string, includeUnpublished = false): PostData | null {
  const allPosts = getAllPosts();
  const post = allPosts.find((p) => p.slug === slug);
  if (!post) {
    return null;
  }

  const published = post.published !== false;
  if (!published && !includeUnpublished) {
    return null;
  }

  return post;
}

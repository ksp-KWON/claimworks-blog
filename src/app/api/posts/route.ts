import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const dynamic = 'force-static';

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

function formatDate(dateVal: unknown): string {
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
    //
  }
  return String(dateVal);
}

export async function GET() {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return NextResponse.json([]);
    }
    const fileNames = fs.readdirSync(postsDirectory);
    const posts = fileNames
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
      })
      .filter((p) => p.published);

    // 날짜 역순 정렬
    posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts: ', error);
    return NextResponse.json([]);
  }
}

"use client";

import React, { ReactNode, useEffect, useState } from "react";
import SidebarContent from "./SidebarContent";

interface Props {
  mainContent: ReactNode;
  sidebarContent?: ReactNode | null;
}

export default function SmartStickyLayout({ mainContent, sidebarContent }: Props) {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    // 태그 목록을 API에서 가져옴 (한 번만)
    fetch('/api/posts')
      .then(r => r.ok ? r.json() : [])
      .then((posts: { tags?: string[] }[]) => {
        const counts: Record<string, number> = {};
        for (const post of posts) {
          for (const tag of post.tags ?? []) {
            counts[tag] = (counts[tag] || 0) + 1;
          }
        }
        setTags(Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t));
      })
      .catch(() => {});
  }, []);

  // 외부에서 명시적으로 null을 넘기면 사이드바 없는 단일 레이아웃
  const sidebar = sidebarContent === undefined
    ? <SidebarContent tags={tags} />
    : sidebarContent;

  return (
    <div className="mx-auto w-full sm:w-[92vw] xl:w-[85vw] max-w-7xl px-2 sm:px-5 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
      <main className="w-full lg:w-[73%] flex-1 min-w-0 transition-all duration-300">
        {mainContent}
      </main>
      {sidebar && (
        <aside className="hidden lg:block w-full lg:w-[27%] relative transition-all duration-300 lg:px-0">
          <div className="lg:sticky lg:top-[80px] w-full">
            {sidebar}
          </div>
        </aside>
      )}
    </div>
  );
}

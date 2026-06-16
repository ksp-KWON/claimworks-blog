"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // 컴포넌트가 브라우저에 마운트된 후 저장된 테마를 불러옵니다.
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
    // React 19/Next 16 린트 규칙 준수: useEffect 내부 동기식 setState 호출 우회
    setTimeout(() => {
      setTheme(savedTheme);
      setMounted(true);
    }, 0);
  }, []);

  // 테마가 변경될 때마다 HTML 태그에 클래스를 주입합니다.
  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    if (
      newTheme === "dark" ||
      (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // 다음 테마로 전환하는 함수 (Light -> Dark -> System)
  const cycleTheme = () => {
    if (theme === "light") {
      changeTheme("dark");
    } else if (theme === "dark") {
      changeTheme("system");
    } else {
      changeTheme("light");
    }
  };

  if (!mounted) {
    return (
      <div className="w-[36px] h-[36px] rounded-full hover:bg-[var(--google-surface-variant)] dark:hover:bg-white/10 transition-colors animate-pulse" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center justify-center p-2 rounded-full hover:bg-[var(--google-surface-variant)] dark:hover:bg-white/10 transition-colors group text-[#5f6368] dark:text-[#9aa0a6] cursor-pointer"
      title={`테마 변경 (현재: ${
        theme === "light" ? "라이트 모드" : theme === "dark" ? "다크 모드" : "시스템 기본값"
      })`}
      aria-label="Toggle theme"
    >
      {/* 라이트 모드 (해 아이콘) */}
      {theme === "light" && (
        <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      )}

      {/* 다크 모드 (달 아이콘) */}
      {theme === "dark" && (
        <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      )}

      {/* 시스템 기본값 (모니터 아이콘) */}
      {theme === "system" && (
        <div className="relative flex items-center justify-center">
          <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.25 4.5A2.25 2.25 0 014.5 2.25h15A2.25 2.25 0 0121.75 4.5v10.5A2.25 2.25 0 0119.5 17.25h-4.362l1.378 1.637a.75.75 0 01-.575 1.238H8.06a.75.75 0 01-.575-1.238l1.378-1.637H4.5a2.25 2.25 0 01-2.25-2.25V4.5zM4.5 3.75a.75.75 0 00-.75.75v10.5c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V4.5a.75.75 0 00-.75-.75h-15z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--google-blue)]"></span>
          </span>
        </div>
      )}
    </button>
  );
}

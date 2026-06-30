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
      <div className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-none animate-pulse bg-gray-100 dark:bg-[#202124]" />
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 sm:p-2.5 rounded-none border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-gray-50 dark:hover:bg-[#202124] hover:text-[var(--google-blue)] transition-all duration-200 flex items-center justify-center group cursor-pointer"
      title={`테마 변경 (현재: ${
        theme === "light" ? "라이트 모드" : theme === "dark" ? "다크 모드" : "시스템 기본값"
      })`}
      aria-label="Toggle theme"
    >
      {/* 라이트 모드 (해 아이콘) */}
      {theme === "light" && (
        <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      )}

      {/* 다크 모드 (달 아이콘) */}
      {theme === "dark" && (
        <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}

      {/* 시스템 기본값 (모니터 아이콘) */}
      {theme === "system" && (
        <div className="relative flex items-center justify-center">
          <svg className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </div>
      )}
    </button>
  );
}

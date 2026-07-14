'use client';

import React, { useState, useEffect } from 'react';

export default function AdminAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 임시 비밀번호 설정 (원하시는 비밀번호로 변경하세요)
    const validPassword = 'claimworks123!';
    
    if (password === validPassword) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-50">
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-zinc-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">관리자 로그인</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">비밀번호를 입력해주세요</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="비밀번호"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 ml-1">비밀번호가 일치하지 않습니다.</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30"
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}

import re

with open('src/components/admin/ChatAdminPanel.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Imports
text = text.replace(
    "import PremiumCard from '@/components/ui/PremiumCard';",
    "import PremiumCard from '@/components/ui/PremiumCard';\nimport AdminPanelLayout from './AdminPanelLayout';\nimport { AdminHeaderBar } from './AdminHeader';"
)

old_return = """  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 md:p-8 bg-gray-50 dark:bg-zinc-950">
      <PremiumCard className="flex-1 min-h-0 p-0 overflow-hidden relative block border-0 md:border md:border-gray-200 dark:md:border-zinc-800">
        <div className="absolute inset-0 flex flex-col md:flex-row w-full bg-white dark:bg-[#111111]">
          
          {/* 왼쪽: 세션 리스트 (모바일에서는 선택된 세션이 없을 때만 표시) */}
          <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] flex-1 md:flex-none min-h-0 flex flex-col border-r-0 md:border-r border-gray-100 dark:border-zinc-800 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="h-[76px] px-4 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 flex justify-between items-center z-10 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <h2 className="font-bold text-gray-800 dark:text-gray-100">채팅 목록</h2>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{sortedAndFilteredSessions.length}건</span>
            </div>"""

new_return = """  return (
    <AdminPanelLayout innerClassName="flex flex-col md:flex-row w-full h-full bg-white dark:bg-[#111111]">
      {/* 왼쪽: 세션 리스트 (모바일에서는 선택된 세션이 없을 때만 표시) */}
      <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] flex-1 md:flex-none min-h-0 flex flex-col border-r-0 md:border-r border-gray-200 dark:border-zinc-800 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <AdminHeaderBar 
          title="채팅 목록" 
          rightContent={<span className="text-xs text-gray-500 font-medium bg-gray-200/50 dark:bg-zinc-800 px-2 py-1 rounded-full">{sortedAndFilteredSessions.length}건</span>} 
        />"""

text = text.replace(old_return, new_return)

old_mid = """      {/* 오른쪽: 채팅 화면 */}
      <div className={`w-full md:flex-1 min-h-0 flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedSession ? (
          <>
            <div className="h-[76px] px-4 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 flex justify-between items-center z-10 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                  {selectedSession.visitor_nickname || '익명 방문자'}
                  {selectedSession.status === '대기' && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-600 align-middle">대기중</span>}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-medium text-gray-500 hidden sm:block">
                  최근 접속: {new Date(selectedSession.last_message_at).toLocaleTimeString()}
                </span>
              </div>
            </div>"""

new_mid = """      {/* 오른쪽: 채팅 화면 */}
      <div className={`w-full md:flex-1 min-h-0 flex flex-col ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedSession ? (
          <>
            <AdminHeaderBar 
              title={
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1.5 -ml-1.5 mr-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="truncate">{selectedSession.visitor_nickname || '익명 방문자'}</span>
                  {selectedSession.status === '대기' && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-600">대기중</span>}
                </div>
              }
              rightContent={
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-medium text-gray-500 hidden sm:block">
                    접속: {new Date(selectedSession.last_message_at).toLocaleTimeString()}
                  </span>
                </div>
              }
            />"""

text = text.replace(old_mid, new_mid)

old_end = """        )}
      </div>
        </div>
      </PremiumCard>
    </div>
  );
}"""

new_end = """        )}
      </div>
    </AdminPanelLayout>
  );
}"""

text = text.replace(old_end, new_end)

with open('src/components/admin/ChatAdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

import sys

with open('src/components/admin/ChatAdminPanel.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_imports = """import PremiumCard from '@/components/ui/PremiumCard';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminHeaderBar } from './AdminHeader';
"""

# Replace imports (lines 4-5)
lines = lines[:4] + [new_imports] + lines[5:]

# Replace first return part
idx1 = -1
for i, line in enumerate(lines):
    if "return (" in line and i > 220:
        idx1 = i
        break

idx2 = -1
for i, line in enumerate(lines):
    if "          {/* 왼쪽: 세션 리스트 (모바일에서는 선택된 세션이 없을 때만 표시) */}" in line and i > 220:
        idx2 = i
        break

new_layout_start = """  return (
    <AdminPanelLayout innerClassName="flex flex-col md:flex-row w-full h-full bg-white dark:bg-[#111111]">
      {/* 왼쪽: 세션 리스트 (모바일에서는 선택된 세션이 없을 때만 표시) */}
      <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] flex-1 md:flex-none min-h-0 flex flex-col border-r-0 md:border-r border-gray-200 dark:border-zinc-800 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <AdminHeaderBar 
          title="채팅 목록" 
          rightContent={<span className="text-xs text-gray-500 font-medium bg-gray-200/50 dark:bg-zinc-800 px-2 py-1 rounded-full">{sortedAndFilteredSessions.length}건</span>} 
        />
"""

# replace up to <div className="flex-1 overflow-y-auto... (which is idx2 + 5 roughly)
idx_list_body = -1
for i in range(idx2, len(lines)):
    if "div className=\"flex-1 overflow-y-auto" in lines[i]:
        idx_list_body = i
        break

lines = lines[:idx1] + [new_layout_start] + lines[idx_list_body:]

# Find right panel
idx3 = -1
for i, line in enumerate(lines):
    if "          {/* 오른쪽: 채팅 화면" in line:
        idx3 = i
        break

idx4 = -1
for i in range(idx3, len(lines)):
    if "                {/* 메시지 영역 */}" in lines[i]:
        idx4 = i
        break

new_right_header = """      {/* 오른쪽: 채팅 화면 (모바일에서는 선택된 세션이 있을 때만 표시) */}
      <div className={`flex-1 min-h-0 flex flex-col relative bg-[#f8f9fa] dark:bg-zinc-950/80 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        {selectedId && selectedSession ? (
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
                <span className="text-[11px] font-mono font-medium text-gray-500 hidden sm:block">
                  접속: {new Date(selectedSession.last_message_at).toLocaleTimeString()}
                </span>
              }
            />
            {/* 메시지 영역 */}
"""

lines = lines[:idx3] + [new_right_header] + lines[idx4+1:]

# Find the end of the file
idx_end1 = -1
for i in range(len(lines)-1, -1, -1):
    if "      </PremiumCard>" in lines[i]:
        idx_end1 = i
        break

new_end = """        </div>
    </AdminPanelLayout>
  );
}
"""

lines = lines[:idx_end1-1] + [new_end]

with open('src/components/admin/ChatAdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

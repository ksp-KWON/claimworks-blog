import re

with open('src/components/admin/ConsultationAdminPanel.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace Imports
text = text.replace(
    "import PremiumBadge from '@/components/ui/PremiumBadge';\nimport PremiumHeading from '@/components/ui/PremiumHeading';\nimport PremiumButton from '@/components/ui/PremiumButton';",
    "import PremiumBadge from '@/components/ui/PremiumBadge';\nimport PremiumHeading from '@/components/ui/PremiumHeading';\nimport PremiumButton from '@/components/ui/PremiumButton';\nimport AdminPanelLayout from './AdminPanelLayout';\nimport { AdminTableHeader } from './AdminHeader';"
)

# Replace Return Layout
old_return = """  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 md:p-8 bg-gray-50 dark:bg-zinc-950">
      <div className="flex-1 min-h-0 flex flex-col">
          {/* 데스크탑 버전 (Table) */}
          <PremiumCard className="hidden md:block p-0 sm:p-0 border-0 flex-1 min-h-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-zinc-800 shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">상태</th>
                  <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-36">접수시간</th>
                  <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-56">이름</th>
                  <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">문의내용</th>
                </tr>
              </thead>"""

new_return = """  const tableColumns = [
    { label: '상태', width: 'w-20' },
    { label: '접수시간', width: 'w-36' },
    { label: '이름', width: 'w-56' },
    { label: '문의내용', align: 'left' as const }
  ];

  return (
    <AdminPanelLayout innerClassName="flex flex-col w-full h-full bg-white dark:bg-[#111111]">
      <div className="flex-1 min-h-0 flex flex-col w-full">
        {/* 데스크탑 버전 (Table) */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
              <AdminTableHeader columns={tableColumns} />"""

text = text.replace(old_return, new_return)

old_end1 = """              </div>
            </div>
          </PremiumCard>

          {/* 모바일 뷰 */}
          <div className="md:hidden flex-1 overflow-y-auto space-y-3 mt-4 custom-scrollbar">"""

new_end1 = """            </div>
          </div>
        </div>

        {/* 모바일 뷰 */}
        <div className="md:hidden flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50/50 dark:bg-zinc-950/50 custom-scrollbar">"""

text = text.replace(old_end1, new_end1)

old_end2 = """            )}
          </div>
      </div>
    </div>
  );
}"""

new_end2 = """            )}
        </div>
      </div>
    </AdminPanelLayout>
  );
}"""

text = text.replace(old_end2, new_end2)

with open('src/components/admin/ConsultationAdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

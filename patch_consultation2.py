import sys

with open('src/components/admin/ConsultationAdminPanel.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_imports = """import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumButton from '@/components/ui/PremiumButton';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminTableHeader } from './AdminHeader';
"""

# replace imports (lines 6-8)
lines = lines[:5] + [new_imports] + lines[8:]

# find return (
idx = -1
for i, line in enumerate(lines):
    if "return (" in line and i > 200:
        idx = i
        break

if idx == -1:
    print("Could not find return (")
    sys.exit(1)

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
              <AdminTableHeader columns={tableColumns} />
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/50">
              {sortedAndFilteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                sortedAndFilteredConsultations.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      onClick={() => handleRowClick(item.id)}
                      className={`cursor-pointer transition-colors ${selectedId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <select
                          value={item.status === '상담완료' || item.status === '상담 완료' ? '완료' : item.status}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'delete') {
                              e.target.value = item.status; // revert visual selection temporarily
                              deleteConsultation(item.id);
                            } else {
                              updateStatus(item.id, val);
                            }
                          }}
                          className={`text-xs font-bold px-2.5 py-1 rounded outline-none border-0 cursor-pointer shadow-sm ${
                            item.status === '대기' ? 'bg-red-50 text-red-600' :
                            item.status === '상담' ? 'bg-blue-50 text-blue-600' :
                            (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'bg-green-50 text-green-600' :
                            item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-50 text-gray-600'
                          }`}
                        >
                          <option value="대기" className="text-gray-900 bg-white font-medium">대기</option>
                          <option value="상담" className="text-gray-900 bg-white font-medium">상담</option>
                          <option value="완료" className="text-gray-900 bg-white font-medium">완료</option>
                          <option value="보류" className="text-gray-900 bg-white font-medium">보류</option>
                          <option value="delete" className="text-red-600 bg-white font-bold">삭제</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-500 font-mono">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{item.name}</div>
                          <div className="text-[13px] text-gray-500 font-mono mt-0.5">{item.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-2">
                            <PremiumBadge color="blue" className="px-2 py-0.5 text-[11px] whitespace-nowrap">{item.accident_type}</PremiumBadge>
                            <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatAccidentDate(item.accident_date)}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-[13px] text-gray-600 dark:text-gray-400 truncate" title={item.accident_location || '미상'}>장소: {item.accident_location || '미상'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-400 text-xs font-medium whitespace-nowrap">진단명:</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium text-[13.5px] truncate max-w-[280px]" title={item.diagnosis}>{item.diagnosis}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {selectedId === item.id && (
                      <tr className="bg-blue-50/10 dark:bg-blue-900/5">
                        <td colSpan={4} className="p-0 border-b border-gray-100 dark:border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                          {renderAccordionDetail()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 모바일 뷰 */}
        <div className="md:hidden flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50/50 dark:bg-zinc-950/50 custom-scrollbar">
          {sortedAndFilteredConsultations.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
              {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
            </div>
          ) : (
            sortedAndFilteredConsultations.map((item) => (
              <PremiumCard 
                key={item.id}
                onClick={() => handleRowClick(item.id)}
                borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : item.status === '상담' ? 'blue' : (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'green' : 'default'}
                className={`flex flex-col gap-4 cursor-pointer overflow-hidden ${selectedId === item.id ? 'ring-2 ring-blue-500/50' : ''}`}
              >
                <div className="flex justify-between items-center pl-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status === '상담완료' || item.status === '상담 완료' ? '완료' : item.status}
                      onClick={e => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'delete') {
                          e.target.value = item.status; // revert visual selection temporarily
                          deleteConsultation(item.id);
                        } else {
                          updateStatus(item.id, val);
                        }
                      }}
                      className={`text-sm font-bold px-2.5 py-0.5 outline-none border-0 cursor-pointer shadow-sm ${
                        item.status === '대기' ? 'bg-red-50 text-red-600' :
                        item.status === '상담' ? 'bg-blue-50 text-blue-600' :
                        (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'bg-green-50 text-green-600' :
                        item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <option value="대기" className="text-gray-900 bg-white font-medium">대기</option>
                      <option value="상담" className="text-gray-900 bg-white font-medium">상담</option>
                      <option value="완료" className="text-gray-900 bg-white font-medium">완료</option>
                      <option value="보류" className="text-gray-900 bg-white font-medium">보류</option>
                      <option value="delete" className="text-red-600 bg-white font-bold">삭제</option>
                    </select>
                    <span className="text-xs font-medium text-gray-400 font-mono">{formatDateTime(item.created_at)}</span>
                  </div>
                </div>
                <div className="pl-2">
                  <div className="text-[17px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {item.name} <span className="text-[13px] font-medium text-blue-500">{item.phone}</span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-none text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <PremiumBadge color="blue" className="px-1.5">{item.accident_type}</PremiumBadge>
                    <span className="text-[11px]">일자 : {formatAccidentDate(item.accident_date)}</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="text-[11px] truncate max-w-[100px]" title={item.accident_location || '미상'}>장소 : {item.accident_location || '미상'}</span>
                  </div>
                  <div className="line-clamp-1">
                    <span className="text-gray-400 font-medium">진단병명 : </span>{item.diagnosis}
                  </div>
                </div>
                {selectedId === item.id && (
                  <div className="mt-2 w-full">
                    {renderAccordionDetail()}
                  </div>
                )}
              </PremiumCard>
            ))
          )}
        </div>
      </div>
    </AdminPanelLayout>
  );
}
"""

with open('src/components/admin/ConsultationAdminPanel.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines[:idx])
    f.write(new_return)

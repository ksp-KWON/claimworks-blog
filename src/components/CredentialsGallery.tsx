'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import AppIcon from '@/components/ui/AppIcon';
import PremiumBadge from '@/components/ui/PremiumBadge';

interface CredentialItem {
  id: string;
  title: string;
  subtitle: string;
  issuer: string;
  date: string;
  regNo: string;
  imageSrc: string;
  badgeColor: 'blue' | 'indigo' | 'green' | 'amber';
  description: string;
}

const CREDENTIALS: CredentialItem[] = [
  {
    id: 'loss-adjuster',
    title: '신체손해사정사 등록증',
    subtitle: '국가공인 전문 라이선스',
    issuer: '금융감독원 (FSS)',
    date: '2020년 등록',
    regNo: '손사 제 BD00002425 호',
    imageSrc: '/images/credentials/license-loss-adjuster.png',
    badgeColor: 'indigo',
    description: '보험업법에 의거하여 금융감독원에 정식 등록된 국가공인 신체손해사정사로서 공정하고 객관적인 피해보상액을 산출합니다.'
  },
  {
    id: 'cifi',
    title: '보험조사분석사 (CIFI)',
    subtitle: 'Insurance Fraud Investigator',
    issuer: '사단법인 보험연수원 (KII)',
    date: '2024년 취득',
    regNo: 'CIFI 2024-0007',
    imageSrc: '/images/credentials/license-cifi.jpg',
    badgeColor: 'blue',
    description: '보험사기 및 부당 삭감 명분을 과학적·의학적 증거에 입각하여 정밀 분석하고 방어하는 전문 역량을 공인받았습니다.'
  },
  {
    id: 'cklu',
    title: '생명보험심사역 (CKLU)',
    subtitle: 'Certificate of Korea Life Underwriter',
    issuer: '생명보험협회 (KLIA)',
    date: '2023년 취득',
    regNo: '제 CKLU20230297 호',
    imageSrc: '/images/credentials/license-cklu.png',
    badgeColor: 'green',
    description: '생명보험 및 질병·상해 언더라이팅(인수심사) 기준과 의학적 인과관계 심사 표준을 완벽히 꿰뚫고 있습니다.'
  },
  {
    id: 'apiu',
    title: '개인보험심사역 (APIU)',
    subtitle: 'Associate Personal Insurance Underwriter',
    issuer: '사단법인 보험연수원 (KII)',
    date: '2024년 취득',
    regNo: 'AP2024-0115',
    imageSrc: '/images/credentials/license-apiu.jpg',
    badgeColor: 'amber',
    description: '실손의료비, 암·뇌·심장 등 개인보험 전 종목에 걸친 지급 적정성 및 약관 해석을 정밀 심사합니다.'
  }
];

export default function CredentialsGallery() {
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);

  return (
    <div className="space-y-4">
      {/* 4대 공인 전문 라이선스 가로 1열 와이드 카드 리스트 */}
      <div className="space-y-3.5">
        {CREDENTIALS.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedCredential(item)}
            className="group relative bg-white dark:bg-[#202124] border border-gray-200/90 dark:border-zinc-800 rounded-none overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row items-center sm:items-stretch"
          >
            {/* 좌측 썸네일 프리뷰 */}
            <div className="relative w-full sm:w-44 md:w-52 aspect-[4/3] sm:aspect-auto min-h-[140px] sm:min-h-0 bg-gray-50 dark:bg-zinc-950 overflow-hidden border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-zinc-800/80 shrink-0 flex items-center justify-center p-3">
              <Image
                src={item.imageSrc}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, 220px"
                className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[11px] font-bold text-white bg-black/75 px-3 py-1.5 rounded-none backdrop-blur-xs flex items-center gap-1.5 border border-white/20 shadow-sm">
                  <AppIcon name="search" size={12} />
                  증서 원본 확대
                </span>
              </div>
            </div>

            {/* 우측 카드 정보 본문 */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 w-full">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PremiumBadge color={item.badgeColor === 'amber' ? 'yellow' : item.badgeColor}>
                      {item.date}
                    </PremiumBadge>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                      {item.issuer}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-600 dark:text-zinc-400 font-mono font-semibold bg-gray-100 dark:bg-zinc-800/90 px-2 py-0.5 border border-gray-200/80 dark:border-zinc-700/80">
                    등록번호 : {item.regNo}
                  </span>
                </div>

                <div>
                  <h4 className="text-base sm:text-[17px] font-extrabold text-[#202124] dark:text-[#e8eaed] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex flex-wrap items-baseline gap-2">
                    <span>{item.title}</span>
                    <span className="text-xs font-normal text-gray-400 dark:text-zinc-500 font-sans">
                      ({item.subtitle})
                    </span>
                  </h4>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium pt-2.5 border-t border-gray-100 dark:border-zinc-800/60">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 라이트박스 모달 (클릭 시 고화질 확대 뷰) */}
      {selectedCredential && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedCredential(null)}
        >
          <div
            className="relative bg-white dark:bg-[#1a1a1a] rounded-none max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200 dark:border-zinc-800"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/80 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <AppIcon name="award" size={20} className="text-amber-500 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    {selectedCredential.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {selectedCredential.issuer} · {selectedCredential.regNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCredential(null)}
                className="w-8 h-8 rounded-none bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors border border-gray-200 dark:border-zinc-700 cursor-pointer"
                aria-label="닫기"
              >
                <AppIcon name="close" size={16} />
              </button>
            </div>

            {/* 모달 본문 이미지 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-950 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[3/4] bg-white dark:bg-zinc-900 rounded-none overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800">
                <Image
                  src={selectedCredential.imageSrc}
                  alt={selectedCredential.title}
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div className="mt-4 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-none text-center max-w-md w-full">
                <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                  {selectedCredential.description}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                  ※ 개인정보 보호법에 의거하여 성명, 생년월일, 주민번호 및 개인주소는 안전하게 공인 마스킹 처리되었습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

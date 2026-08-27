import Link from 'next/link';
import type { Metadata } from 'next';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import SectionLayout from '@/components/ui/SectionLayout';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';
import { COLUMN_CATEGORIES, SPECIALTIES, CategoryMeta } from '@/lib/constants/categories';

export const metadata: Metadata = {
  title: '분야별 전문 보상가이드 | 보상스쿨 전문 손해사정 그룹',
  description: '사망·자살 보험금, 질병진단, 실손의료비, 교통사고, 배상책임 및 10대 진료과목별 의료분쟁까지! 보상스쿨 전문가 그룹의 핵심 실무 노하우를 한눈에 확인하세요.',
  alternates: {
    canonical: 'https://claim-works.com/categories',
  },
};

const THEME_STYLES: Record<string, {
  border: string;
  hoverBorder: string;
  hoverShadow: string;
  accentBar: string;
  gradient: string;
  iconBg: string;
  iconText: string;
  titleHover: string;
  badgeColor: 'blue' | 'rose' | 'red' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'gray';
}> = {
  indigo: {
    border: 'border-indigo-200/80 dark:border-indigo-900/50',
    hoverBorder: 'hover:border-indigo-500 dark:hover:border-indigo-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_8px_24px_rgba(99,102,241,0.2)]',
    accentBar: 'bg-indigo-600',
    gradient: 'from-indigo-50/70 via-indigo-50/20 to-transparent dark:from-indigo-950/30 dark:via-indigo-950/10 dark:to-transparent',
    iconBg: 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200/80 dark:border-indigo-900/60',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    badgeColor: 'indigo'
  },
  rose: {
    border: 'border-rose-200/80 dark:border-rose-900/50',
    hoverBorder: 'hover:border-rose-500 dark:hover:border-rose-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(244,63,94,0.12)] dark:hover:shadow-[0_8px_24px_rgba(244,63,94,0.2)]',
    accentBar: 'bg-rose-600',
    gradient: 'from-rose-50/70 via-rose-50/20 to-transparent dark:from-rose-950/30 dark:via-rose-950/10 dark:to-transparent',
    iconBg: 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-900/60',
    iconText: 'text-rose-600 dark:text-rose-400',
    titleHover: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
    badgeColor: 'rose'
  },
  sky: {
    border: 'border-sky-200/80 dark:border-sky-900/50',
    hoverBorder: 'hover:border-sky-500 dark:hover:border-sky-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] dark:hover:shadow-[0_8px_24px_rgba(14,165,233,0.2)]',
    accentBar: 'bg-sky-600',
    gradient: 'from-sky-50/70 via-sky-50/20 to-transparent dark:from-sky-950/30 dark:via-sky-950/10 dark:to-transparent',
    iconBg: 'bg-sky-50/80 dark:bg-sky-950/50 border-sky-200/80 dark:border-sky-900/60',
    iconText: 'text-sky-600 dark:text-sky-400',
    titleHover: 'group-hover:text-sky-600 dark:group-hover:text-sky-400',
    badgeColor: 'blue'
  },
  red: {
    border: 'border-red-200/80 dark:border-red-900/50',
    hoverBorder: 'hover:border-red-500 dark:hover:border-red-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_8px_24px_rgba(239,68,68,0.2)]',
    accentBar: 'bg-red-600',
    gradient: 'from-red-50/70 via-red-50/20 to-transparent dark:from-red-950/30 dark:via-red-950/10 dark:to-transparent',
    iconBg: 'bg-red-50/80 dark:bg-red-950/50 border-red-200/80 dark:border-red-900/60',
    iconText: 'text-red-600 dark:text-red-400',
    titleHover: 'group-hover:text-red-600 dark:group-hover:text-red-400',
    badgeColor: 'red'
  },
  emerald: {
    border: 'border-emerald-200/80 dark:border-emerald-900/50',
    hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] dark:hover:shadow-[0_8px_24px_rgba(16,185,129,0.2)]',
    accentBar: 'bg-emerald-600',
    gradient: 'from-emerald-50/70 via-emerald-50/20 to-transparent dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent',
    iconBg: 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900/60',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    badgeColor: 'green'
  },
  orange: {
    border: 'border-orange-200/80 dark:border-orange-900/50',
    hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(249,115,22,0.12)] dark:hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)]',
    accentBar: 'bg-orange-600',
    gradient: 'from-orange-50/70 via-orange-50/20 to-transparent dark:from-orange-950/30 dark:via-orange-950/10 dark:to-transparent',
    iconBg: 'bg-orange-50/80 dark:bg-orange-950/50 border-orange-200/80 dark:border-orange-900/60',
    iconText: 'text-orange-600 dark:text-orange-400',
    titleHover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
    badgeColor: 'yellow'
  },
  purple: {
    border: 'border-purple-200/80 dark:border-purple-900/50',
    hoverBorder: 'hover:border-purple-500 dark:hover:border-purple-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(168,85,247,0.12)] dark:hover:shadow-[0_8px_24px_rgba(168,85,247,0.2)]',
    accentBar: 'bg-purple-600',
    gradient: 'from-purple-50/70 via-purple-50/20 to-transparent dark:from-purple-950/30 dark:via-purple-950/10 dark:to-transparent',
    iconBg: 'bg-purple-50/80 dark:bg-purple-950/50 border-purple-200/80 dark:border-purple-900/60',
    iconText: 'text-purple-600 dark:text-purple-400',
    titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    badgeColor: 'purple'
  },
  amber: {
    border: 'border-amber-200/80 dark:border-amber-900/50',
    hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.12)] dark:hover:shadow-[0_8px_24px_rgba(245,158,11,0.2)]',
    accentBar: 'bg-amber-600',
    gradient: 'from-amber-50/70 via-amber-50/20 to-transparent dark:from-amber-950/30 dark:via-amber-950/10 dark:to-transparent',
    iconBg: 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-900/60',
    iconText: 'text-amber-600 dark:text-amber-400',
    titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
    badgeColor: 'yellow'
  },
  blue: {
    border: 'border-blue-200/80 dark:border-blue-900/50',
    hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_8px_24px_rgba(59,130,246,0.2)]',
    accentBar: 'bg-blue-600',
    gradient: 'from-blue-50/70 via-blue-50/20 to-transparent dark:from-blue-950/30 dark:via-blue-950/10 dark:to-transparent',
    iconBg: 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200/80 dark:border-blue-900/60',
    iconText: 'text-blue-600 dark:text-blue-400',
    titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    badgeColor: 'blue'
  },
  teal: {
    border: 'border-teal-200/80 dark:border-teal-900/50',
    hoverBorder: 'hover:border-teal-500 dark:hover:border-teal-500',
    hoverShadow: 'hover:shadow-[0_8px_24px_rgba(20,184,166,0.12)] dark:hover:shadow-[0_8px_24px_rgba(20,184,166,0.2)]',
    accentBar: 'bg-teal-600',
    gradient: 'from-teal-50/70 via-teal-50/20 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent',
    iconBg: 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-200/80 dark:border-teal-900/60',
    iconText: 'text-teal-600 dark:text-teal-400',
    titleHover: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    badgeColor: 'teal'
  }
};

/**
 * CategoryWideCard
 * 가로로 시원하고 높이는 슬림한 콤팩트 와이드 로우(Row) 카드
 * - [PC 2열 / 모바일 1열] 레이아웃에 최적화
 */
function CategoryWideCard({ item, index }: { item: CategoryMeta; index: number }) {
  const theme = THEME_STYLES[item.themeColor] || THEME_STYLES['indigo'];

  return (
    <Link
      href={`/categories/${encodeURIComponent(item.slug)}`}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 bg-white dark:bg-[#202124] border ${theme.border} shadow-[0_1px_4px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.15)] ${theme.hoverBorder} ${theme.hoverShadow} hover:scale-[1.004] transition-all duration-200 overflow-hidden outline-none`}
    >
      {/* 1. 좌측 컬러 포인트 액센트 바 (호버 시 점등) */}
      <div className={`absolute top-0 left-0 w-1 h-full ${theme.accentBar} opacity-0 group-hover:opacity-100 transition-opacity z-20`}></div>

      {/* 2. 배경 파스텔 앰비언트 그라데이션 */}
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0`}></div>

      {/* 3. 본문 콘텐츠 영역 (아이콘 + 제목 + 설명문) */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 pr-3">
        {/* 테마 아이콘 박스 (정사각형 W3C SVG 심볼) */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 aspect-square flex items-center justify-center ${theme.iconBg} ${theme.iconText} border shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-xs`}>
          <AppIcon name={item.iconName} size={20} />
        </div>

        {/* 텍스트 내용 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500">
              NO.{String(index + 1).padStart(2, '0')}
            </span>
            <h3 className={`text-xs sm:text-sm font-extrabold text-[#202124] dark:text-[#e8eaed] ${theme.titleHover} transition-colors truncate`}>
              {item.name}
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium truncate">
            {item.desc}
          </p>
        </div>
      </div>

      {/* 4. 우측 뱃지 및 이동 화살표 */}
      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <PremiumBadge color={theme.badgeColor} className="hidden sm:inline-flex text-[10px] py-0.5 px-2">
          분석
        </PremiumBadge>
        <div className={`w-6 h-6 flex items-center justify-center text-gray-400 ${theme.titleHover} transition-colors`}>
          <AppIcon name="chevron-right" size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesIndex() {
  return (
    <div className="w-full space-y-10 sm:space-y-12">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">분야별 전문 보상가이드</li>
        </ol>
      </nav>

      {/* 2. 메인 헤더 배너 (전역 표준 컴포넌트) */}
      <PremiumHeaderBanner
        theme="indigo"
        icon="book"
        title="분야별 전문 보상 가이드"
        badges={['보상스쿨 핵심 실무', { text: '8대 법리 칼럼 · 10대 의학 분과', color: 'gray' }]}
        description="대법원 판례와 금융분쟁조정위원회 결정례부터, 10대 진료과목별 의학 분쟁 쟁점까지 보상스쿨 손해사정사의 풍부한 실무 노하우를 엄선하여 제공합니다."
      />

      {/* 3. 섹션 1: 8대 핵심 법리 보상 칼럼 (메인 홈 SectionLayout 패밀리룩) */}
      <SectionLayout
        title="8대 핵심 법리 보상 칼럼"
        icon={<AppIcon name="scale" size={20} />}
        themeColor="indigo"
        description="대법원 판례 및 금융분쟁조정위원회 결정례를 바탕으로 보험사의 삭감·면책 주장을 방어하는 핵심 법리 가이드입니다."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {COLUMN_CATEGORIES.map((cat, idx) => (
            <CategoryWideCard key={cat.slug} item={cat} index={idx} />
          ))}
        </div>
      </SectionLayout>

      {/* 4. 섹션 2: 10대 진료과목별 의학 분쟁 가이드 (메인 홈 SectionLayout 패밀리룩) */}
      <SectionLayout
        title="10대 진료과목별 의학분쟁 가이드"
        icon={<AppIcon name="stethoscope" size={20} />}
        themeColor="green"
        description="10대 주요 진료과목별 상해·질병 분류코드와 병리 검사결과지 판독 및 의학 분쟁 쟁점을 체계적으로 분석합니다."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {SPECIALTIES.map((spec, idx) => (
            <CategoryWideCard key={spec.slug} item={spec} index={idx} />
          ))}
        </div>
      </SectionLayout>

      {/* 5. 하단 1:1 전문 상담 연계 배너 */}
      <PremiumCard 
        borderColor="blue" 
        hoverEffect={true} 
        watermarkIcon="shield" 
        className="!p-6 sm:!p-8 !bg-gradient-to-r !from-blue-50/90 !via-indigo-50/40 !to-transparent dark:!from-blue-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-blue-200/90 dark:border-blue-900/50 text-center sm:text-left"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <PremiumBadge color="blue">1:1 맞춤형 진단</PremiumBadge>
              <PremiumBadge color="gray">착수금 0원 무료 진단</PremiumBadge>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed]">
              내 사안에 맞는 정확한 보상 솔루션이 필요하신가요?
            </h3>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl font-medium">
              보험사의 까다로운 면책 논리나 후유장해 삭감에 고민하지 마시고, 공인 손해사정사의 정밀 검토를 받아보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/consultation"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <span>1:1 무료상담 신청</span>
              <AppIcon name="chevron-right" size={14} />
            </Link>
            <Link
              href="/precedent-search"
              className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#202124] dark:text-[#e8eaed] border border-gray-300 dark:border-zinc-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <AppIcon name="search" size={14} />
              <span>판례 검색센터</span>
            </Link>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}

import Image from 'next/image';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export default function AuthorBioCard() {
  return (
    <PremiumCard borderColor="indigo" hoverEffect watermarkIcon="user" className="mt-12 mb-10 group">
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <PremiumHeading 
            level={3} 
            gradient="indigo" 
            showLeftBorder={true} 
            icon={
              <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                <AppIcon name="user" size={16} />
              </span>
            } 
            className="!mb-0 !text-base"
          >
            저자 소개
          </PremiumHeading>
        </div>

        <div className="flex items-start gap-4">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-none bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-200 p-1">
            <Image
              src="/logo.png"
              alt="보상스쿨TV 로고"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[16px] font-extrabold text-gray-900 dark:text-white tracking-tight">보상스쿨 손해사정사</span>
              <PremiumBadge color="indigo">
                공인 손해사정사
              </PremiumBadge>
            </div>
            <p className="text-[13.5px] text-gray-600 dark:text-[#9aa0a6] leading-relaxed break-keep">
              교통사고·후유장해·실손의료비 보상 전문가로, 수백 건의 보험 분쟁을 직접 처리한 실무 경험을 바탕으로 소비자 권익 보호에 앞장서고 있습니다.
            </p>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-indigo-600 dark:text-indigo-400 font-bold">
              <a href="/about" className="hover:underline flex items-center gap-1 group/link">
                <AppIcon name="external-link" size={13} className="group-hover/link:-translate-y-0.5 transition-transform" />
                저자 소개 보기
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-400 dark:text-gray-500 font-medium">보상스쿨 공식 블로그</span>
            </div>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}

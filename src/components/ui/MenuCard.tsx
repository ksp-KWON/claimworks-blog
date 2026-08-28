import React from 'react';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import AppIcon from '@/components/ui/AppIcon';

export type MenuThemeColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'teal' | 'indigo' | 'rose';

export interface MenuCardProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  themeColor: MenuThemeColor;
  badgeText?: string;
  description: string;
  buttonText?: string;
}

const THEME_STYLES: Record<MenuThemeColor, { textIcon: string; badgeBg: string; buttonHoverBg: string; buttonHoverText: string }> = {
  blue: {
    textIcon: 'text-[var(--google-blue)]',
    badgeBg: 'bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] border-[#d2e3fc]/30 dark:border-[#174ea6]/30',
    buttonHoverBg: 'group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6]/20',
    buttonHoverText: 'group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]'
  },
  red: {
    textIcon: 'text-red-500',
    badgeBg: 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border-red-100/30 dark:border-red-950/30',
    buttonHoverBg: 'group-hover:bg-red-50 dark:group-hover:bg-red-950/20',
    buttonHoverText: 'group-hover:text-red-500 dark:group-hover:text-red-400'
  },
  green: {
    textIcon: 'text-[#137333]',
    badgeBg: 'bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] border-green-100/30 dark:border-green-950/30',
    buttonHoverBg: 'group-hover:bg-green-50 dark:group-hover:bg-green-950/20',
    buttonHoverText: 'group-hover:text-[#137333] dark:group-hover:text-[#81c995]'
  },
  teal: {
    textIcon: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100/30 dark:border-teal-950/30',
    buttonHoverBg: 'group-hover:bg-teal-50 dark:group-hover:bg-teal-950/20',
    buttonHoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400'
  },
  indigo: {
    textIcon: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/30 dark:border-indigo-950/30',
    buttonHoverBg: 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/20',
    buttonHoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
  },
  rose: {
    textIcon: 'text-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-100/30 dark:border-rose-950/30',
    buttonHoverBg: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20',
    buttonHoverText: 'group-hover:text-rose-500 dark:group-hover:text-rose-400'
  },
  yellow: {
    textIcon: 'text-[var(--google-yellow)]',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border-yellow-100/30 dark:border-yellow-900/30',
    buttonHoverBg: 'group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20',
    buttonHoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-500'
  },
  purple: {
    textIcon: 'text-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100/30 dark:border-purple-900/30',
    buttonHoverBg: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20',
    buttonHoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
  }
};

const bgGradients: Record<string, string> = {
  blue: 'bg-gradient-to-r from-blue-100/80 to-transparent dark:from-blue-900/30 dark:to-transparent',
  red: 'bg-gradient-to-r from-red-100/80 to-transparent dark:from-red-900/30 dark:to-transparent',
  green: 'bg-gradient-to-r from-green-100/80 to-transparent dark:from-green-900/30 dark:to-transparent',
  teal: 'bg-gradient-to-r from-teal-100/80 to-transparent dark:from-teal-900/30 dark:to-transparent',
  indigo: 'bg-gradient-to-r from-indigo-100/80 to-transparent dark:from-indigo-900/30 dark:to-transparent',
  rose: 'bg-gradient-to-r from-rose-100/80 to-transparent dark:from-rose-900/30 dark:to-transparent',
  yellow: 'bg-gradient-to-r from-yellow-100/80 to-transparent dark:from-yellow-900/30 dark:to-transparent',
  purple: 'bg-gradient-to-r from-purple-100/80 to-transparent dark:from-purple-900/30 dark:to-transparent',
};

export default function MenuCard({ href, onClick, icon, title, description, badgeText, themeColor, buttonText }: MenuCardProps) {
  const theme = THEME_STYLES[themeColor] || THEME_STYLES.blue;

  const content = (
    <PremiumCard borderColor={themeColor} hoverEffect className="!p-4 sm:!p-5 relative overflow-hidden group">
      <div className="relative z-10 space-y-2 flex flex-col min-w-0">
        <div className="flex items-center justify-between min-w-0 gap-2">
          <div className={`flex items-center gap-2 min-w-0 flex-1 pr-2 rounded-none ${bgGradients[themeColor]}`}>
            <span className={`${theme.textIcon} shrink-0 flex items-center justify-center`}>
              {icon}
            </span>
            <h3 className="text-sm font-extrabold text-[#202124] dark:text-white truncate">
              {title}
            </h3>
          </div>
          {badgeText && (
            <span className={`${theme.badgeBg} shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-none border`}>
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed truncate sm:whitespace-normal">
          {description}
        </p>
        {buttonText && (
          <div className={`mt-3 w-full text-xs sm:text-[12.5px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50/90 dark:bg-white/5 border border-gray-100 dark:border-zinc-800/80 ${theme.buttonHoverBg} ${theme.buttonHoverText}`}>
            <div className="flex items-center gap-2 truncate">
              {buttonText}
            </div>
            <AppIcon name="chevron-right" size={14} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </div>
        )}
      </div>
    </PremiumCard>
  );

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block group w-full text-left" onClick={onClick}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="block group w-full text-left" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="block group w-full text-left">
      {content}
    </button>
  );
}

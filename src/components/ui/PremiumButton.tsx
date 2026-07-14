import React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'youtube';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  icon?: React.ReactNode;
}

export default function PremiumButton({
  children,
  className = '',
  variant = 'primary',
  href,
  icon,
  ...props
}: PremiumButtonProps) {
  let baseClass = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 rounded-none relative overflow-hidden group/btn';
  
  if (variant === 'primary') {
    baseClass += ' bg-[var(--google-blue)] hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(26,115,232,0.39)]';
  } else if (variant === 'danger') {
    baseClass += ' bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(239,68,68,0.39)]';
  } else if (variant === 'youtube') {
    baseClass += ' bg-[#FF0000] hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:shadow-[0_4px_14px_0_rgba(255,0,0,0.39)]';
  } else if (variant === 'secondary') {
    baseClass += ' bg-white dark:bg-[#303134] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md';
  } else if (variant === 'ghost') {
    baseClass = 'inline-flex items-center text-sm font-medium text-gray-500 hover:text-[var(--google-blue)] transition-colors group/btn';
  }

  const content = (
    <>
      {icon && <span className={variant !== 'ghost' ? 'group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform' : 'mr-1.5'}>{icon}</span>}
      <span className={variant !== 'ghost' ? 'relative z-10' : ''}>{children}</span>
    </>
  );

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${baseClass} ${className}`}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={`${baseClass} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {content}
    </button>
  );
}

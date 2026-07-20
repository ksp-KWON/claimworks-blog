import React from 'react';

type BorderColor = 'red' | 'rose' | 'blue' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'default';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  borderColor?: BorderColor;
  hoverEffect?: boolean;
}

export default function PremiumCard({
  children,
  className = '',
  borderColor = 'default',
  hoverEffect = false,
  ...props
}: PremiumCardProps) {
  // Safe-listed gradient colors for Tailwind JIT
  const gradientMap: Record<BorderColor, string> = {
    red: 'from-red-50/80 to-transparent dark:from-red-950/30',
    rose: 'from-rose-50/80 to-transparent dark:from-rose-950/30',
    blue: 'from-blue-50/80 to-transparent dark:from-blue-950/30',
    green: 'from-green-50/80 to-transparent dark:from-green-950/30',
    teal: 'from-teal-50/80 to-transparent dark:from-teal-950/30',
    purple: 'from-purple-50/80 to-transparent dark:from-purple-950/30',
    indigo: 'from-indigo-50/80 to-transparent dark:from-indigo-950/30',
    yellow: 'from-yellow-50/80 to-transparent dark:from-yellow-950/30',
    default: 'from-blue-50/80 to-transparent dark:from-blue-900/20'
  };

  let baseClass = 'bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 relative overflow-hidden rounded-none';
  
  if (hoverEffect) {
    // Add vertical lift to make it pop visually
    baseClass += ' hover:-translate-y-1 group/card';
  }

  // Handle colored border on hover if specified
  if (borderColor !== 'default') {
    if (hoverEffect) {
      // Overwrite the generic hover border color with the specific theme color
      baseClass = baseClass.replace('hover:border-[var(--google-blue)]', `hover:border-${borderColor}-500`);
      
      // Update shadow color based on theme (using more saturated/contrasting colors for stronger pop)
      if (borderColor === 'red') baseClass += ' hover:shadow-[0_20px_60px_rgba(239,68,68,0.35)] dark:hover:shadow-[0_20px_60px_rgba(239,68,68,0.5)]';
      if (borderColor === 'green') baseClass += ' hover:shadow-[0_20px_60px_rgba(19,115,51,0.35)] dark:hover:shadow-[0_20px_60px_rgba(19,115,51,0.5)]';
      if (borderColor === 'teal') baseClass += ' hover:shadow-[0_20px_60px_rgba(20,184,166,0.35)] dark:hover:shadow-[0_20px_60px_rgba(20,184,166,0.5)]';
      if (borderColor === 'blue') baseClass += ' hover:shadow-[0_20px_60px_rgba(26,115,232,0.35)] dark:hover:shadow-[0_20px_60px_rgba(26,115,232,0.5)]';
    }
  } else {
    if (hoverEffect) {
      // Default blue hover shadow with strong contrast
      baseClass += ' hover:shadow-[0_20px_60px_rgba(26,115,232,0.35)] dark:hover:shadow-[0_20px_60px_rgba(26,115,232,0.5)] hover:border-[var(--google-blue)]';
    }
  }

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {hoverEffect && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientMap[borderColor]} opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none z-0`}></div>
      )}
      <div className={hoverEffect ? "relative z-10 h-full" : "h-full"}>
        {children}
      </div>
    </div>
  );
}

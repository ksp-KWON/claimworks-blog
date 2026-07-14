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
  let baseClass = 'bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 relative overflow-hidden rounded-none';
  
  if (hoverEffect) {
    baseClass += ' hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] group/card';
  }

  // Handle colored left border if specified
  if (borderColor !== 'default') {
    // We add a thicker left border
    baseClass = baseClass.replace('border border-gray-100', `border border-gray-100 border-l-4 border-l-${borderColor}-500`);
    baseClass = baseClass.replace('dark:border-white/5', `dark:border-white/5 border-l-4 border-l-${borderColor}-500`);
    
    if (hoverEffect) {
      // Overwrite the generic hover border color with the specific theme color for a more tailored look
      baseClass = baseClass.replace('hover:border-[var(--google-blue)]', `hover:border-${borderColor}-400`);
    }
  }

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

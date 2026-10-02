import React from 'react';
import { cn } from '../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export function Card({
  className,
  title,
  subtitle,
  children,
  footer,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-xl dark:border-slate-800 dark:bg-slate-900/50">
          {footer}
        </div>
      )}
    </div>
  );
}

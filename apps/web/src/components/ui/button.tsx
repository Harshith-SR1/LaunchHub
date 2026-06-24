import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: ComponentProps<typeof Link>['href'];
  variant?: 'primary' | 'secondary';
  children: ReactNode;
};

export function SiteButton({ href, variant = 'primary', className, children, ...props }: ButtonProps) {
  const styles = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40',
    variant === 'primary'
      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400'
      : 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-white',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}

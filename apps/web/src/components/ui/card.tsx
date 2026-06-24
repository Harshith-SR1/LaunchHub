import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

export function SiteCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-transparent', className)} {...props} />;
}

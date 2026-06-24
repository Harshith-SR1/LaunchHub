import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

export function SiteBadge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('w-fit', className)} {...props} />;
}

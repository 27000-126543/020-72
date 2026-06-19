import * as React from 'react';
import { cn } from '@/lib/utils';

export type MediaTendency =
  | 'sympathy'
  | 'accountability'
  | 'wait_and_see'
  | 'sceptical'
  | 'neutral';

export interface TendencyTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tendency: MediaTendency;
  size?: 'sm' | 'md';
}

const tendencyConfig: Record<
  MediaTendency,
  { label: string; color: string; dot: string }
> = {
  sympathy: {
    label: '同情',
    color: 'text-[#4a90d9] bg-[#4a90d9]/10 border-[#4a90d9]/20',
    dot: 'bg-[#4a90d9]',
  },
  accountability: {
    label: '追责',
    color: 'text-[#c94a4a] bg-[#c94a4a]/10 border-[#c94a4a]/20',
    dot: 'bg-[#c94a4a]',
  },
  wait_and_see: {
    label: '观望',
    color: 'text-[#8e7cc3] bg-[#8e7cc3]/10 border-[#8e7cc3]/20',
    dot: 'bg-[#8e7cc3]',
  },
  sceptical: {
    label: '引导质疑',
    color: 'text-[#d4a017] bg-[#d4a017]/10 border-[#d4a017]/20',
    dot: 'bg-[#d4a017]',
  },
  neutral: {
    label: '中立客观',
    color: 'text-[#3d8b5c] bg-[#3d8b5c]/10 border-[#3d8b5c]/20',
    dot: 'bg-[#3d8b5c]',
  },
};

const sizeStyles = {
  sm: 'h-6 px-2 text-xs rounded-md gap-1',
  md: 'h-8 px-3 text-sm rounded-lg gap-1.5',
};

const TendencyTag = React.forwardRef<HTMLSpanElement, TendencyTagProps>(
  ({ tendency, size = 'md', className, ...props }, ref) => {
    const config = tendencyConfig[tendency];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium border',
          'transition-all duration-200',
          sizeStyles[size],
          config.color,
          className,
        )}
        {...props}
      >
        <span className={cn('shrink-0 rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dot)} />
        <span className="truncate">{config.label}</span>
      </span>
    );
  },
);

TendencyTag.displayName = 'TendencyTag';

export default TendencyTag;

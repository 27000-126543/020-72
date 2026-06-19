import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressBarColor =
  | 'primary'
  | 'accent'
  | 'sympathy'
  | 'accountability'
  | 'wait_and_see'
  | 'sceptical'
  | 'neutral';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  color?: ProgressBarColor;
  showLabel?: boolean;
  animated?: boolean;
}

const colorMap: Record<ProgressBarColor, string> = {
  primary: '#1a4a5e',
  accent: '#e07b39',
  sympathy: '#4a90d9',
  accountability: '#c94a4a',
  wait_and_see: '#8e7cc3',
  sceptical: '#d4a017',
  neutral: '#3d8b5c',
};

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      color = 'primary',
      showLabel = false,
      animated = false,
      className,
      ...props
    },
    ref,
  ) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const barColor = colorMap[color];

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-primary-600/80">进度</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            'relative w-full h-2 rounded-full overflow-hidden',
            'bg-primary-100/60',
          )}
          role="progressbar"
          aria-valuenow={Math.round(clampedValue)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              animated && 'after:content-[""] after:absolute after:inset-0',
              animated && 'after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent',
              animated && 'after:animate-[shimmer_1.5s_infinite]',
            )}
            style={{
              width: `${clampedValue}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;

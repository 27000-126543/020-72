import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RingScoreProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number;
  size?: number;
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  animate?: boolean;
  labelClassName?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#3d8b5c';
  if (score >= 60) return '#4a90d9';
  if (score >= 40) return '#d4a017';
  if (score >= 20) return '#e07b39';
  return '#c94a4a';
}

const RingScore = React.forwardRef<HTMLDivElement, RingScoreProps>(
  (
    {
      score,
      size = 120,
      color,
      trackColor = '#e5e7eb',
      strokeWidth = 10,
      animate = true,
      className,
      labelClassName,
      ...props
    },
    ref,
  ) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const displayColor = color || getScoreColor(clampedScore);
    const animatedScore = useAnimatedScore(clampedScore, animate);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`得分 ${Math.round(clampedScore)}`}
          role="img"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={displayColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: animate
                ? 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease'
                : 'none',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-bold tabular-nums leading-none',
              size >= 120 ? 'text-3xl' : size >= 80 ? 'text-2xl' : 'text-lg',
              labelClassName,
            )}
            style={{ color: displayColor }}
          >
            {Math.round(animatedScore)}
          </span>
          <span
            className={cn(
              'font-medium mt-0.5',
              size >= 120 ? 'text-xs' : 'text-[10px]',
            )}
            style={{ color: displayColor, opacity: 0.7 }}
          >
            / 100
          </span>
        </div>
      </div>
    );
  },
);

function useAnimatedScore(targetScore: number, animate: boolean): number {
  const [score, setScore] = React.useState(animate ? 0 : targetScore);
  const prevTarget = React.useRef(targetScore);

  React.useEffect(() => {
    if (!animate) {
      setScore(targetScore);
      prevTarget.current = targetScore;
      return;
    }

    if (prevTarget.current === targetScore) return;

    const startScore = score;
    const endScore = targetScore;
    const startTime = performance.now();
    const duration = 800;

    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startScore + (endScore - startScore) * eased;
      setScore(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    prevTarget.current = targetScore;

    return () => cancelAnimationFrame(frame);
  }, [targetScore, animate]);

  return score;
}

RingScore.displayName = 'RingScore';

export default RingScore;

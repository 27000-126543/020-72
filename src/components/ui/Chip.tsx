import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChipVariant = 'default' | 'outline' | 'solid';
type ChipColor =
  | 'primary'
  | 'accent'
  | 'sympathy'
  | 'accountability'
  | 'wait_and_see'
  | 'sceptical'
  | 'neutral';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  color?: ChipColor;
  onDelete?: () => void;
}

const colorHex: Record<ChipColor, string> = {
  primary: '#1a4a5e',
  accent: '#e07b39',
  sympathy: '#4a90d9',
  accountability: '#c94a4a',
  wait_and_see: '#8e7cc3',
  sceptical: '#d4a017',
  neutral: '#3d8b5c',
};

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'default', color = 'primary', onDelete, children, ...props }, ref) => {
    const hex = colorHex[color];

    const variantStyles = {
      default: {
        backgroundColor: `${hex}14`,
        color: hex,
      },
      outline: {
        backgroundColor: 'transparent',
        color: hex,
        border: `1px solid ${hex}4D`,
      },
      solid: {
        backgroundColor: hex,
        color: '#ffffff',
      },
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium',
          'transition-all duration-200',
          className,
        )}
        style={variantStyles[variant]}
        {...props}
      >
        <span className="truncate">{children}</span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={cn(
              'inline-flex items-center justify-center w-4 h-4 rounded-full -mr-1',
              'hover:bg-black/10 transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1',
            )}
            style={{ color: 'inherit' }}
            aria-label="删除"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  },
);

Chip.displayName = 'Chip';

export default Chip;

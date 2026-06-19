import * as React from 'react';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadioCardOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
}

export interface RadioCardProps<T extends string = string> {
  options: RadioCardOption<T>[];
  selected: T | T[];
  onChange: (value: T | T[]) => void;
  multiple?: boolean;
  className?: string;
}

function RadioCard<T extends string = string>({
  options,
  selected,
  onChange,
  multiple = false,
  className,
}: RadioCardProps<T>) {
  const isSelected = (value: T): boolean => {
    if (multiple) {
      return Array.isArray(selected) && selected.includes(value);
    }
    return selected === value;
  };

  const handleClick = (value: T) => {
    if (multiple) {
      const arr = Array.isArray(selected) ? [...selected] : [];
      const idx = arr.indexOf(value);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(value);
      }
      onChange(arr as T[]);
    } else {
      onChange(value);
    }
  };

  const renderIcon = (icon: LucideIcon | React.ReactNode | undefined, active: boolean): React.ReactNode => {
    if (!icon) return null;
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return (
        <IconComponent
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            active ? 'text-primary-600' : 'text-primary-400',
          )}
        />
      );
    }
    return icon as React.ReactNode;
  };

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3', className)}
    >
      {options.map((option) => {
        const active = isSelected(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={active}
            onClick={() => handleClick(option.value)}
            className={cn(
              'group relative flex flex-col items-start text-left p-4 rounded-xl',
              'border transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
              active
                ? 'border-primary-400 bg-primary-50/60 shadow-soft'
                : 'border-primary-100 bg-white hover:border-primary-200 hover:bg-primary-50/30',
            )}
          >
            <div className="w-full flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {renderIcon(option.icon, active)}
                <span
                  className={cn(
                    'font-medium text-sm transition-colors duration-200 truncate',
                    active ? 'text-primary-700' : 'text-primary-600',
                  )}
                >
                  {option.label}
                </span>
              </div>
              <div
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  active
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-primary-200 bg-white group-hover:border-primary-300',
                )}
              >
                {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </div>
            {option.description && (
              <p
                className={cn(
                  'mt-2 text-xs leading-relaxed transition-colors duration-200',
                  active ? 'text-primary-600/80' : 'text-primary-500/70',
                )}
              >
                {option.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

RadioCard.displayName = 'RadioCard';

export default RadioCard;

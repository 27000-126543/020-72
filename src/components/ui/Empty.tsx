import * as React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button, { ButtonProps } from '@/components/ui/Button';

export interface EmptyAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  icon?: React.ReactNode;
}

export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon | React.ReactNode;
  title?: string;
  description?: string;
  action?: EmptyAction | EmptyAction[];
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  (
    {
      icon,
      title = '暂无数据',
      description,
      action,
      className,
      ...props
    },
    ref,
  ) => {
    const renderIcon = (): React.ReactNode => {
      if (!icon) {
        return <Inbox className="w-12 h-12 text-primary-300" strokeWidth={1.5} />;
      }
      if (typeof icon === 'function') {
        const IconComponent = icon as LucideIcon;
        return <IconComponent className="w-12 h-12 text-primary-300" strokeWidth={1.5} />;
      }
      return icon as React.ReactNode;
    };

    const actions = Array.isArray(action) ? action : action ? [action] : [];

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center',
          'py-12 px-6',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-50/80 mb-5">
          {renderIcon()}
        </div>
        {title && (
          <h3 className="text-base font-semibold text-primary-700 mb-1.5">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-primary-500/80 max-w-sm leading-relaxed mb-6">
            {description}
          </p>
        )}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {actions.map((act, idx) => (
              <Button
                key={idx}
                variant={act.variant || 'primary'}
                size="sm"
                onClick={act.onClick}
                leftIcon={act.icon}
              >
                {act.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

Empty.displayName = 'Empty';

export default Empty;

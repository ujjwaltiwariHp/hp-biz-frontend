import React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'page-title' | 'card-title' | 'label' | 'value' | 'body' | 'caption' | 'badge';

interface TypographyProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p' | 'span' | 'label';
}

const variantClasses: Record<Variant, string> = {
  'page-title': 'text-lg md:text-xl font-bold text-black dark:text-white',
  'card-title': 'text-sm font-semibold text-black dark:text-white',
  'label': 'text-xs font-medium text-gray-600 dark:text-gray-400',
  'value': 'text-sm font-semibold text-black dark:text-white',
  'body': 'text-xs text-gray-700 dark:text-gray-300',
  'caption': 'text-xs text-gray-500 dark:text-gray-400',
  'badge': 'text-xxs font-semibold uppercase tracking-wide',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  as: Component = 'span',
  className,
  children
}) => {
  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  );
};

// Specialized Components
export const PageTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="page-title" as="h2" {...props} />
);

export const CardTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="card-title" as="h3" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" as="label" {...props} />
);

export const Value: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="value" as="p" {...props} />
);
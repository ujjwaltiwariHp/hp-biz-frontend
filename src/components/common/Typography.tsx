import React from 'react';
import { cn } from '@/lib/utils';

type Variant =
  | 'page-title'
  | 'card-title'
  | 'label'
  | 'value'
  | 'body'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'badge';

interface TypographyProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  // FIXED: Added 'div' to the allowed 'as' types
  as?: 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  style?: React.CSSProperties;
}

const variantClasses: Record<Variant, string> = {
  'page-title': 'text-lg md:text-xl font-bold text-black dark:text-white',
  'card-title': 'text-sm font-semibold text-black dark:text-white',
  'label': 'text-xs font-medium text-gray-600 dark:text-gray-400',
  'value': 'text-sm font-semibold text-black dark:text-white',
  'body': 'text-xs text-gray-700 dark:text-gray-300',
  'body1': 'text-sm text-gray-700 dark:text-gray-300',
  'body2': 'text-xs text-gray-500 dark:text-gray-400',
  'caption': 'text-xs text-gray-500 dark:text-gray-400',
  'badge': 'text-xxs font-semibold uppercase tracking-wide',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  as: Component = 'span',
  className,
  children,
  style,
}) => {
  return (
    <Component className={cn(variantClasses[variant], className)} style={style}>
      {children}
    </Component>
  );
};

// Specialized exports
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
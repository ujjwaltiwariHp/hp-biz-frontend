import React from 'react';

type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoaderVariant = 'inline' | 'page' | 'modal' | 'overlay';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  fullScreen?: boolean; // Deprecated: use variant="overlay" instead
  className?: string;
  label?: string; // For accessibility
}

const sizeClasses: Record<LoaderSize, string> = {
  xs: 'h-4 w-4 border-[2px]',
  sm: 'h-6 w-6 border-[2px]',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-[4px]',
  xl: 'h-16 w-16 border-[4px]',
};

const variantContainerClasses: Record<LoaderVariant, string> = {
  inline: 'inline-flex items-center justify-center',
  page: 'flex h-screen w-full items-center justify-center bg-white dark:bg-boxdark z-50',
  modal: 'flex w-full items-center justify-center py-12',
  overlay: 'fixed inset-0 z-999999 flex items-center justify-center bg-black/50 backdrop-blur-sm',
};

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'inline',
  fullScreen = false,
  className = '',
  label = 'Loading...',
}) => {
  // Backwards compatibility for fullScreen prop
  const activeVariant = fullScreen ? 'overlay' : variant;

  // Check if className contains a border color override
  const borderColorMatch = className.match(/border-(?:primary|white|black|gray-\d+|danger|success|warning|info)/);
  const borderColor = borderColorMatch ? borderColorMatch[0] : 'border-primary';

  // Filter out border color classes from className for container
  const containerClassName = className.split(' ').filter(cls =>
    !cls.startsWith('border-') && cls !== 'border-t-transparent'
  ).join(' ');

  const spinnerClass = `${sizeClasses[size]} animate-spin rounded-full border-solid ${borderColor} border-t-transparent`;

  return (
    <div
      className={`${variantContainerClasses[activeVariant]} ${containerClassName}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={spinnerClass}>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
};

export default Loader;
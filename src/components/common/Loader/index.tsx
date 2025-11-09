import React from 'react';

type LoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type LoaderVariant = 'inline' | 'page' | 'modal' | 'overlay';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
  xs: 'h-4 w-4 border',
  sm: 'h-6 w-6 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

const variantContainerClasses: Record<LoaderVariant, string> = {
  inline: 'flex items-center justify-center',
  page: 'flex h-screen items-center justify-center bg-white dark:bg-boxdark',
  modal: 'flex items-center justify-center py-8',
  overlay: 'fixed inset-0 z-999999 flex items-center justify-center bg-black/50',
};

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'inline',
  fullScreen = false,
  className = '',
}) => {
  const spinnerClass = `${sizeClasses[size]} animate-spin rounded-full border-solid border-primary border-t-transparent`;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/50">
        <div className={spinnerClass}></div>
      </div>
    );
  }

  const containerClass = variantContainerClasses[variant];

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={spinnerClass}></div>
    </div>
  );
};

export default Loader;
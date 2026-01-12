import React, { ButtonHTMLAttributes } from 'react';
import Loader from '../Loader';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-opacity-90 border-transparent',
    secondary: 'bg-bodydark1 text-white hover:bg-opacity-90 border-transparent',
    danger: 'bg-danger text-white hover:bg-opacity-90 border-transparent',
    success: 'bg-success text-white hover:bg-opacity-90 border-transparent',
    warning: 'bg-warning text-white hover:bg-opacity-90 border-transparent',
    outline: 'bg-transparent border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'bg-transparent border-transparent text-primary hover:bg-gray-2 dark:hover:bg-meta-4',
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
};

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClass = variantClasses[variant];
    const sizeClass = sizeClasses[size];
    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <Loader size="xs" variant="inline" className={variant === 'outline' || variant === 'ghost' ? 'border-primary' : 'border-white'} />
            )}
            {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
};

export default Button;

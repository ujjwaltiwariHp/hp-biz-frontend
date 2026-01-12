import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    variant?: 'text' | 'rect' | 'circle' | 'square';
    width?: string | number;
    height?: string | number;
}

const Skeleton = ({
    className,
    variant = 'rect',
    width,
    height,
    style,
    ...props
}: SkeletonProps) => {
    const baseClasses = "animate-pulse bg-gray-200 dark:bg-meta-4";

    const variantClasses = {
        text: "rounded h-4 w-full",
        rect: "rounded-md",
        circle: "rounded-full",
        square: "rounded-md aspect-square",
    };

    const computedStyle: React.CSSProperties = {
        width: width,
        height: height,
        ...style,
    };

    return (
        <div
            className={cn(baseClasses, variantClasses[variant], className)}
            style={computedStyle}
            {...props}
        />
    );
};

export const SkeletonText = ({ lines = 1, className, ...props }: SkeletonProps & { lines?: number }) => {
    if (lines === 1) {
        return <Skeleton variant="text" className={className} {...props} />;
    }
    return (
        <div className="space-y-2 w-full">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className={cn(className, i === lines - 1 && lines > 1 ? "w-4/5" : "w-full")}
                    {...props}
                />
            ))}
        </div>
    );
};

export const SkeletonRect = (props: SkeletonProps) => <Skeleton variant="rect" {...props} />;
export const SkeletonCircle = (props: SkeletonProps) => <Skeleton variant="circle" {...props} />;
export const SkeletonSquare = (props: SkeletonProps) => <Skeleton variant="square" {...props} />;

export default Skeleton;

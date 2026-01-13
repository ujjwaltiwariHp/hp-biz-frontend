"use client";

import React from "react";
import Skeleton, { SkeletonText } from "@/components/common/Skeleton";

export type SkeletonType = "circle" | "square" | "text" | "table" | "rect";

interface SkeletonLoaderProps {
    type?: SkeletonType;
    height?: number | string;
    width?: number | string;
    count?: number;
    className?: string;
    rows?: number;
    columns?: number;
    columnWidths?: (number | string)[];
    rowHeights?: (number | string)[];
    style?: React.CSSProperties;
}

const SkeletonLoader = ({
    type = "text",
    height, // Default handled in component or usage
    width = "100%",
    count = 1,
    className = "",
    rows = 5,
    columns = 3,
    columnWidths,
    rowHeights,
    style,
}: SkeletonLoaderProps) => {

    /* Circle */
    if (type === "circle") {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="circle"
                        height={height}
                        width={width}
                        className={className}
                        style={style}
                    />
                ))}
            </>
        );
    }

    if (type === "square") {
        return (
            <>
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="square"
                        height={height}
                        width={width}
                        className={className}
                        style={style}
                    />
                ))}
            </>
        );
    }

    if (type === "text" || type === "rect") {
        // If count > 1, render multiple items
        return (
            <div className={`space-y-2 ${className}`} style={{ width: typeof width === 'number' ? `${width}px` : width }}>
                {Array.from({ length: count }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant={type === 'text' ? 'text' : 'rect'}
                        height={height || (type === 'text' ? '1rem' : undefined)}
                        width="100%"
                        style={style}
                    />
                ))}
            </div>
        );
    }

    /* TABLE */
    if (type === "table") {
        const gridTemplateColumns = columnWidths?.length
            ? columnWidths.map((w) => (typeof w === "number" ? `${w}px` : w)).join(" ")
            : `repeat(${columns}, 1fr)`;

        return (
            <div className={`space-y-3 ${className}`}>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid gap-4"
                        style={{ gridTemplateColumns }}
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={colIndex}
                                height={rowHeights?.[rowIndex] ?? height ?? 20}
                                width="100%"
                                variant="rect"
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

export default SkeletonLoader;

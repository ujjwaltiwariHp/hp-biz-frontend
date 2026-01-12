import React from 'react';
import { SkeletonRect, SkeletonText } from './Skeleton';
import { TableColumn } from '@/types/table';

interface TableSkeletonProps {
    rows?: number;
    // Accept either a count or the actual columns definition to replicate widths
    columns?: number | TableColumn<any>[];
    showHeader?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4, showHeader = true }) => {
    const columnCount = typeof columns === 'number' ? columns : columns.length;
    const columnDefs = typeof columns === 'number' ? null : columns;

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    {/* Header Skeleton - Matches visual style of DynamicTable header */}
                    {showHeader && (
                        <thead>
                            <tr className="bg-boxdark text-left dark:bg-boxdark-2">
                                {Array.from({ length: columnCount }).map((_, i) => (
                                    <th
                                        key={`header-${i}`}
                                        className={`py-4 px-4 font-semibold text-base text-white dark:text-white whitespace-nowrap ${columnDefs?.[i]?.headerClassName || ''}`}
                                    >
                                        {/* Use a Rect skeleton with light opacity to look good on dark bg */}
                                        <SkeletonRect className="h-5 w-24 bg-white/20 dark:bg-white/10" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}

                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr
                                key={`row-${rowIndex}`}
                                className="border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-50 dark:hover:bg-meta-4"
                            >
                                {Array.from({ length: columnCount }).map((_, colIndex) => {
                                    // Make skeletons look like real column data by varying width PER COLUMN
                                    // consistent for the whole column, but different between columns
                                    const widthClasses = [
                                        'w-1/2', 'w-3/4', 'w-2/3', 'w-full', 'w-1/3'
                                    ];
                                    const widthClass = widthClasses[colIndex % widthClasses.length];

                                    return (
                                        <td key={`cell-${rowIndex}-${colIndex}`} className={`py-5 px-4 ${columnDefs?.[colIndex]?.className || ''}`}>
                                            <SkeletonText className={`h-4 ${widthClass}`} />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSkeleton;

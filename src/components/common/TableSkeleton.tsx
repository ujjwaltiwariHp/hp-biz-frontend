import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-2 text-left dark:bg-meta-4">
                            {Array.from({ length: columns }).map((_, i) => (
                                <th
                                    key={`header-${i}`}
                                    className="py-4 px-4 font-medium text-black dark:text-white"
                                >
                                    <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr
                                key={`row-${rowIndex}`}
                                className="border-b border-stroke dark:border-strokedark last:border-0"
                            >
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={`cell-${rowIndex}-${colIndex}`} className="py-5 px-4">
                                        <div className="h-5 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSkeleton;

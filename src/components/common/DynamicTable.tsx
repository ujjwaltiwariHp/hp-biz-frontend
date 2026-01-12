import React from 'react';
import { DynamicTableProps } from '@/types/table';
import TableSkeleton from './TableSkeleton';
import { Typography } from '@/components/common/Typography';

const DynamicTable = <T extends Record<string, any>>({
  data,
  columns,
  caption,
  isLoading = false,
}: DynamicTableProps<T>) => {

  if (isLoading) {
    if (isLoading) {
      return <TableSkeleton columns={columns} />;
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6 text-center">
        <Typography variant="body1" className="text-gray-500">No data found.</Typography>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {caption && (
        <h4 className="mb-6 px-4 py-6 font-semibold text-xl text-black dark:text-white border-b border-stroke dark:border-strokedark">
          {caption}
        </h4>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            {/* The user-provided change: solid dark background for header */}
            <tr className="bg-boxdark text-left dark:bg-boxdark-2">
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`py-4 px-4 font-semibold text-base text-white dark:text-white whitespace-nowrap ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={`${column.header}-${rowIndex}`}
                    className={`py-5 px-4 text-sm font-medium text-black dark:text-white ${column.className || ''}`}
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key as keyof T] as React.ReactNode)
                    }
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

export default DynamicTable;
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DynamicTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  caption?: string;
  isLoading?: boolean;
  skeletonConfig?: {
    rows?: number;
    columnWidths?: (number | string)[];
    rowHeights?: (number | string)[];
    className?: string;
  };
}
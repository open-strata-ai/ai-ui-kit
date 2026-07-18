import React from 'react';
import { Table as AntTable, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';

export interface DataTableColumn<T> {
  key: keyof T & string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: keyof T & string;
  virtualized?: boolean;
  pagination?: false | { pageSize: number };
  density?: 'compact' | 'default' | 'comfortable';
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  const { data, columns, rowKey, pagination, density = 'default', onRowClick, empty, loading } = props;
  const size = density === 'compact' ? 'small' : density === 'comfortable' ? 'large' : 'middle';

  const antColumns: ColumnsType<T> = columns.map((c) => ({
    title: c.title,
    dataIndex: c.key as string,
    key: c.key as string,
    sorter: c.sortable || undefined,
    ellipsis: true,
    width: c.width,
    render: c.render as ColumnsType<T>[number]['render'],
  }));

  return (
    <AntTable<T>
      size={size}
      dataSource={data}
      columns={antColumns}
      rowKey={(row) => String(row[rowKey])}
      pagination={pagination === false ? false : pagination}
      loading={loading}
      onRow={(row) => ({
        onClick: () => onRowClick?.(row),
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
      locale={{ emptyText: empty ?? <Empty description="No data" /> }}
    />
  );
}

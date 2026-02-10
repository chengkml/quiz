import React from 'react';
import { Table, Button, Space, Tooltip, Empty } from '@arco-design/web-react';
import { IconEdit, IconDelete, IconEye } from '@arco-design/web-react/icon';
import '../styles/card.less';

interface TableListProps<T = any> {
  data: T[];
  loading?: boolean;
  columns?: any[];
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  scrollHeight?: number;
  rowKey?: string | ((record: T) => string | number);
  pagination?: false | any;
  onChange?: (pagination: any, filters?: any, sorter?: any, extra?: any) => void;
  tableProps?: any;
}

/**
 * 表格列表组件
 * 展示为传统表格形式
 */
const TableList = <T extends any>({
  data = [],
  loading = false,
  columns = [],
  onEdit,
  onDelete,
  onView,
  scrollHeight = 400,
  rowKey = 'id',
  pagination = false,
  onChange,
  tableProps,
}: TableListProps<T>) => {
  if (data.length === 0 && !loading) {
    return <Empty />;
  }

  // 添加操作列
  const actionColumn = {
    title: '操作',
    width: 160,
    align: 'center',
    fixed: 'right' as const,
    render: (text: any, record: T) => (
      <Space>
        {onView && (
          <Tooltip content="查看">
            <Button
              type="text"
              size="small"
              icon={<IconEye />}
              onClick={() => onView(record)}
            />
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip content="删除">
            <Button
              type="text"
              status="danger"
              size="small"
              icon={<IconDelete />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        )}
      </Space>
    ),
  };

  const tableColumns = [...columns];
  // 只在有操作时才添加操作列
  if (onEdit || onDelete || onView) {
    tableColumns.push(actionColumn);
  }

  // 适配 rowKey 类型，确保传递给 Table 的 rowKey 符合要求
  const adaptedRowKey =
    typeof rowKey === 'function'
      ? (record: T) => (rowKey as (record: T, index?: number) => string | number)(record)
      : rowKey;

  return (
    <Table
      className="data-table"
      columns={tableColumns}
      data={data}
      loading={loading}
      rowKey={adaptedRowKey}
      pagination={pagination}
      onChange={onChange}
      scroll={{
        y: scrollHeight,
        x: true,
      }}
      stripe
      {...tableProps}
    />
  );
};

export default TableList;

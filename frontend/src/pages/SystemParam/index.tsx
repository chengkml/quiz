import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Message, Modal, Tag } from '@arco-design/web-react';
import './style/index.less';
import { createParam, updateParam, deleteParam, searchParams } from './api';
import { SystemParamDto, ParamType, ParamStatus } from '@/types/systemParam';
import FilterForm from '@/components/FilterForm';
import { AddEditModal, DataManager } from '@/components/DataManager';
import type { FormFieldConfig, PaginationConfig } from '@/components/DataManager';

function SystemParamManager() {
  const filterFormRef = useRef(null);

  const [items, setItems] = useState<SystemParamDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SystemParamDto | null>(null);

  const [treeData, setTreeData] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['all']);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [tableScrollHeight, setTableScrollHeight] = useState(200);

  const fetchParams = useCallback(async (params?: any) => {
    setSearchLoading(true);
    try {
      const page = params?.page ?? pagination.current - 1;
      const size = params?.size ?? pagination.pageSize;
      const resp = await searchParams({ ...params, page, size });
      const data = (resp as any).data || resp;
      setItems(data.content || []);
      setPagination((prev) => ({ ...prev, total: data.totalElements || 0 }));
    } catch (e) {
      Message.error('获取参数数据失败');
    } finally {
      setSearchLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  const fetchAllForTree = useCallback(async () => {
    try {
      const resp = await searchParams({ page: 0, size: 1000 });
      const data = (resp as any).data || resp;
      const list: SystemParamDto[] = data.content || [];
      const map = new Map<string, number>();
      list.forEach((it) => {
        if (it.category) {
          map.set(it.category, (map.get(it.category) || 0) + 1);
        }
      });
      const nodes = Array.from(map.entries()).map(([cat, count]) => ({ key: cat, title: cat, count }));
      setTreeData([{ key: 'all', title: '全部分类', children: nodes }]);
      // 设置所有节点展开
      setExpandedKeys(['all', ...nodes.map(n => n.key)]);
    } catch {}
  }, []);

  useEffect(() => {
    fetchParams({ page: 0, size: pagination.pageSize });
    fetchAllForTree();
  }, []);

  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);

      setTableScrollHeight((prev) => {
        if (prev === newHeight) return prev;
        return newHeight;
      });
    };

    calculateTableHeight();
  }, []);

  const formConfig: FormFieldConfig[] = [
    { field: 'paramName', label: '参数名称', type: 'input', required: true },
    {
      field: 'paramType',
      label: '参数类型',
      type: 'select',
      required: true,
      options: [
        { label: '字符串', value: ParamType.STRING },
        { label: '数字', value: ParamType.NUMBER },
        { label: '布尔值', value: ParamType.BOOLEAN },
        { label: 'JSON', value: ParamType.JSON },
        { label: '列表', value: ParamType.LIST },
      ],
      initialValue: ParamType.STRING,
    },
    { field: 'paramValue', label: '参数值', type: 'textarea' },
    { field: 'defaultValue', label: '默认值', type: 'textarea' },
    { field: 'category', label: '分类', type: 'input' },
    { field: 'description', label: '描述', type: 'textarea' },
    { field: 'isEncrypted', label: '是否加密', type: 'checkbox', initialValue: false },
    { field: 'isReadonly', label: '是否只读', type: 'checkbox', initialValue: false },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '启用', value: ParamStatus.ACTIVE },
        { label: '禁用', value: ParamStatus.INACTIVE },
      ],
      initialValue: ParamStatus.ACTIVE,
    },
    { field: 'sortOrder', label: '排序号', type: 'number', initialValue: 0 },
  ];

  const tableColumns = [
    { title: '参数名称', dataIndex: 'paramName', width: 200 },
    {
      title: '参数值',
      dataIndex: 'paramValue',
      width: 250,
      render: (value: string, record: SystemParamDto) => (record.isEncrypted ? '******' : (value || '-')),
    },
    { title: '分类', dataIndex: 'category', width: 120 },
    { title: '描述', dataIndex: 'description', width: 250, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const map: any = { ACTIVE: '启用', INACTIVE: '禁用' };
        const color: any = { ACTIVE: 'green', INACTIVE: 'gray' };
        return <Tag color={color[status]} bordered>{map[status] || status}</Tag>;
      },
    },
  ];

  const searchFormFields: FormFieldConfig[] = [
    { field: 'paramName', label: '名称', type: 'input', placeholder: '输入名称', span: { xs: 24, sm: 12, md: 8, lg: 8 } },
    { field: 'category', label: '分类', type: 'input', placeholder: '输入分类', span: { xs: 24, sm: 12, md: 8, lg: 8 } },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      allowClear: true,
      options: [
        { label: '启用', value: ParamStatus.ACTIVE },
        { label: '禁用', value: ParamStatus.INACTIVE },
      ],
      span: { xs: 24, sm: 12, md: 8, lg: 8 },
    },
  ];

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={{ paramName: '', category: '', status: '' }}
      formFields={searchFormFields}
      onSearch={(values) => {
        const cleaned = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined));
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchParams({ ...cleaned, page: 0, size: pagination.pageSize });
      }}
      onReset={() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchParams({ page: 0, size: pagination.pageSize });
        Message.info('已重置筛选条件');
      }}
      min={3}
      labelWidth={80}
    />
  );

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setAddEditVisible(true);
  };

  const handleEdit = (record: SystemParamDto) => {
    if (record.isReadonly) {
      Message.warning('只读参数不可编辑');
      return;
    }
    setIsEdit(true);
    setCurrentRecord(record);
    setAddEditVisible(true);
  };

  const handleDelete = (record: SystemParamDto) => {
    if (record.isReadonly) {
      Message.warning('只读参数不可删除');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定删除参数"${record.paramName}"吗？`,
      onOk: async () => {
        await deleteParam(record.id);
        Message.success('删除成功');
        const values = (filterFormRef as any).current?.getFilterValues?.() || {};
        fetchParams({ ...values, page: pagination.current - 1, size: pagination.pageSize });
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (isEdit && currentRecord) {
        await updateParam({ ...values, id: currentRecord.id });
        Message.success('更新成功');
      } else {
        await createParam(values);
        Message.success('新增成功');
      }
      setAddEditVisible(false);
      const formValues = (filterFormRef as any).current?.getFilterValues?.() || {};
      fetchParams({ ...formValues, page: pagination.current - 1, size: pagination.pageSize });
    } finally {
      setLoading(false);
    }
  };

  // 渲染移动端卡片视图
  const renderShortCard = (item: SystemParamDto) => {
    const map: any = { ACTIVE: '启用', INACTIVE: '禁用' };
    const color: any = { ACTIVE: 'green', INACTIVE: 'gray' };
    const statusConfig = { color: color[item.status] || 'gray', text: map[item.status] || item.status };

    return (
      <div
        className="param-card"
        style={{
          border: '1px solid var(--color-border-2)',
          borderRadius: 4,
          padding: 12,
          marginBottom: 12,
          background: 'var(--color-bg-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 'bold', fontSize: 14 }}>{item.paramName}</span>
          <Tag color={statusConfig.color} size="small" bordered>{statusConfig.text}</Tag>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 4 }}>
          分类: {item.category || '-'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 4, wordBreak: 'break-all' }}>
          值: {item.isEncrypted ? '******' : (item.paramValue || '-')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 8 }}>
          描述: {item.description || '-'}
        </div>
        <div style={{ borderTop: '1px solid var(--color-border-2)', paddingTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button
            type="text"
            size="small"
            disabled={item.isReadonly}
            onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
            }}
          >编辑</Button>
          <Button
            type="text"
            size="small"
            status="danger"
            disabled={item.isReadonly}
            onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
            }}
          >删除</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="system-param-manager">
      <DataManager
            data={items}
            loading={searchLoading}
            pagination={pagination}
            onPaginationChange={(p) => {
              setPagination(p);
              const formValues = (filterFormRef as any).current?.getFilterValues?.() || {};
              fetchParams({ ...formValues, page: p.current - 1, size: p.pageSize });
            }}
            actions={{ onAdd: handleAdd, onEdit: handleEdit, onDelete: handleDelete }}
            config={{
              showModeToggle: true,
              displayMode: 'table',
              renderShortCard,
              filterContent,
              showTree: true,
              showTreeFilter: true,
              treeData,
              selectedTreeKeys: selectedKeys,
              expandedKeys,
              onTreeExpand: (keys) => setExpandedKeys(keys),
              onTreeSelect: (keys) => {
                setSelectedKeys(keys);
                const key = keys[0];
                const baseValues = (filterFormRef as any).current?.getFilterValues?.() || {};
                const next = { ...baseValues } as any;
                if (key === 'all') delete next.category; else next.category = key;
                setPagination((prev) => ({ ...prev, current: 1 }));
                fetchParams({ ...next, page: 0, size: pagination.pageSize });
              },
              tableColumns,
            }}
            tableScrollHeight={tableScrollHeight}
            cardColumns={3}
            cardGutter={16}
            cardSize="medium"
          />

          <AddEditModal
            visible={addEditVisible}
            isEdit={isEdit}
            record={currentRecord || undefined}
            loading={loading}
            title={isEdit ? '编辑参数' : '新增参数'}
            formConfig={formConfig}
            onOk={handleSubmit}
            onCancel={() => {
              setAddEditVisible(false);
              setIsEdit(false);
              setCurrentRecord(null);
            }}
          />
    </div>
  );
}

export default SystemParamManager;

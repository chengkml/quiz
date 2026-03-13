import React, { useEffect, useRef, useState } from 'react';
import { Button, Message, Popconfirm, Space, Tag, Tooltip } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import { DataManager, DetailModal } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { DetailFieldConfig, FormFieldConfig } from '@/components/types/types';
import UserAvatar from '@/components/UserAvatar';
import { deleteSysLog, getSysLogById, searchSysLog, SysLogDto } from './api';
import renderDate from '@/utils/timeUtil';
import './style/index.less';

function SysLogPage() {
  const [items, setItems] = useState<SysLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  const [currentRecord, setCurrentRecord] = useState<SysLogDto | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const filterFormRef = useRef<any>(null);

  const loadData = async (params?: any) => {
    setSearchLoading(true);
    try {
      const current = params?.current ?? pagination.current;
      const pageSize = params?.pageSize ?? pagination.pageSize;
      const formValues = filterFormRef.current?.getFieldsValue?.() || {};
      const targetParams = {
        requestUri: formValues.requestUri || undefined,
        success: formValues.success === '' ? undefined : formValues.success,
        pageNum: current - 1,
        pageSize,
        sortColumn: 'create_date',
        sortType: 'desc',
      };
      const res = await searchSysLog(targetParams);
      const page = res.data;
      setItems(page.content || []);
      setPagination((prev) => ({
        ...prev,
        current,
        pageSize,
        total: page.totalElements || 0,
      }));
    } catch (e) {
      Message.error('查询系统日志失败');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    await loadData({ current: 1, pageSize: pagination.pageSize });
  };

  const handleReset = async () => {
    filterFormRef.current?.resetFields?.();
    await handleSearch();
  };

  const handlePageChange = (current: number, pageSize: number) => {
    loadData({ current, pageSize });
  };

  const handleView = async (record: SysLogDto) => {
    try {
      const res = await getSysLogById(record.id);
      const data = res.data;
      setCurrentRecord(data);
      setDetailVisible(true);
    } catch (e) {
      Message.error('获取日志详情失败');
    }
  };

  const handleDelete = async (record: SysLogDto) => {
    try {
      await deleteSysLog(record.id);
      Message.success('删除成功');
      loadData();
    } catch (e) {
      Message.error('删除失败');
    }
  };

  const tableColumns = [
    { title: '模块', dataIndex: 'module', width: 140, ellipsis: true },
    { title: '操作', dataIndex: 'action', width: 180, ellipsis: true },
    { title: '请求URI', dataIndex: 'requestUri', width: 260, ellipsis: true },
    { title: '方法', dataIndex: 'requestMethod', width: 90 },
    {
      title: '成功',
      dataIndex: 'success',
      width: 90,
      render: (val: string) => {
        const success = val === '1';
        return (
          <Tag color={success ? 'green' : 'red'} bordered>
            {success ? '成功' : '失败'}
          </Tag>
        );
      },
    },
    { title: '耗时(ms)', dataIndex: 'costTime', width: 100 },
    {
      title: '创建人',
      dataIndex: 'createUserName',
      width: 140,
      render: (name: string, record: SysLogDto) => (
        <UserAvatar name={name || record?.createUser || ''} showName />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (v: string) => renderDate(v),
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_, record) => (
        <Popconfirm
          title="确认删除该日志记录？"
          onOk={() => handleDelete(record)}
        >
          <Tooltip title="删除">
            <Button
              type="text"
              status="danger"
              size="small"
              icon={<IconDelete />}
              onClick={(e) => e.stopPropagation()}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  const detailFields: DetailFieldConfig[] = [
    { key: 'module', label: '模块', dataIndex: 'module' },
    { key: 'action', label: '操作', dataIndex: 'action' },
    { key: 'requestUri', label: '请求URI', dataIndex: 'requestUri' },
    { key: 'requestMethod', label: '方法', dataIndex: 'requestMethod' },
    {
      key: 'success',
      label: '是否成功',
      dataIndex: 'success',
      render: (val: string) => {
        const success = val === '1';
        return (
          <Tag color={success ? 'green' : 'red'} bordered>
            {success ? '成功' : '失败'}
          </Tag>
        );
      },
    },
    { key: 'costTime', label: '耗时(毫秒)', dataIndex: 'costTime' },
    { key: 'ipAddress', label: 'IP地址', dataIndex: 'ipAddress' },
    { key: 'userAgent', label: 'User-Agent', dataIndex: 'userAgent' },
    { key: 'createUserName', label: '创建人', dataIndex: 'createUserName', render: (name, rec) => (
      <UserAvatar name={name || rec?.createUser || ''} showName />
    ) },
    { key: 'createDate', label: '创建时间', dataIndex: 'createDate', render: (v) => renderDate(v) },
    { key: 'updateUserName', label: '更新人', dataIndex: 'updateUserName' },
    { key: 'updateDate', label: '更新时间', dataIndex: 'updateDate', render: (v) => renderDate(v) },
    { key: 'requestParams', label: '请求参数', dataIndex: 'requestParams' },
    { key: 'responseData', label: '响应数据', dataIndex: 'responseData' },
    { key: 'errorMessage', label: '错误信息', dataIndex: 'errorMessage' },
  ];

  const filterFields: FormFieldConfig[] = [
    { field: 'requestUri', label: '请求URI', type: 'input', placeholder: '支持模糊匹配', span: 16 },
    {
      field: 'success',
      label: '是否成功',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '成功', value: '1' },
        { label: '失败', value: '0' },
      ],
      span: 8,
    },
  ];

  useEffect(() => {
    const onResize = () => {
      const height = window.innerHeight;
      const header = 260; // 预估：过滤 + 操作区高度
      setTableScrollHeight(Math.max(320, height - header));
    };
    onResize();
    window.addEventListener('resize', onResize);
    loadData();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="syslog-manager">
      <DataManager
        data={items}
        loading={searchLoading || loading}
        pagination={pagination}
        onPaginationChange={(p) => handlePageChange(p.current, p.pageSize)}
        config={{
          displayMode: 'table',
          showModeToggle: false,
          tableColumns,
          showFilterForm: true,
          filterContent: (
            <FilterForm
              ref={filterFormRef}
              formFields={filterFields}
              onSearch={handleSearch}
              onReset={handleReset}
              onValuesChange={(changedValues) => {
                if ('success' in changedValues) {
                  handleSearch();
                }
              }}
            />
          ),
          tableProps: {
            onRow: (record) => ({
              onClick: () => handleView(record),
              style: { cursor: 'pointer' }
            })
          }
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <DetailModal
        visible={detailVisible}
        record={currentRecord || undefined}
        onCancel={() => setDetailVisible(false)}
        title="日志详情"
        detailFields={detailFields}
      />
    </div>
  );
}

export default SysLogPage;

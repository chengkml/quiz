import React, { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Grid, Layout, Menu, Message, Modal, Space, Tag } from '@arco-design/web-react';
import { IconDelete, IconEye, IconList, IconSearch } from '@arco-design/web-react/icon';
import { DataManager, DetailModal } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { DetailFieldConfig, FormFieldConfig } from '@/components/types/types';
import UserAvatar from '@/components/UserAvatar';
import { deleteSysLog, getSysLogById, searchSysLog, SysLogDto } from './api';

const { Content } = Layout;
const { Row, Col } = Grid;

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
  const [deleteVisible, setDeleteVisible] = useState(false);

  const filterFormRef = useRef<any>(null);

  // 时间格式化（与其它页面一致的相对/绝对展示）
  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffSeconds < 60) return `${diffSeconds}秒前`;
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  };

  const tableColumns = [
    { title: '模块', dataIndex: 'module', width: 140 },
    { title: '操作', dataIndex: 'action', width: 120 },
    { title: '请求URI', dataIndex: 'requestUri', width: 260, ellipsis: true },
    { title: '方法', dataIndex: 'requestMethod', width: 90 },
    {
      title: '成功',
      dataIndex: 'success',
      width: 90,
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'} bordered>
          {val === true ? '成功' : val === false ? '失败' : '-'}
        </Tag>
      ),
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
      render: (v: string) => formatDateTime(v),
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
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'} bordered>
          {val === true ? '成功' : val === false ? '失败' : '-'}
        </Tag>
      ),
    },
    { key: 'costTime', label: '耗时(毫秒)', dataIndex: 'costTime' },
    { key: 'ipAddress', label: 'IP地址', dataIndex: 'ipAddress' },
    { key: 'userAgent', label: 'User-Agent', dataIndex: 'userAgent' },
    { key: 'createUserName', label: '创建人', dataIndex: 'createUserName', render: (name, rec) => (
      <UserAvatar name={name || rec?.createUser || ''} showName />
    ) },
    { key: 'createDate', label: '创建时间', dataIndex: 'createDate', render: (v) => formatDateTime(v) },
    { key: 'updateUserName', label: '更新人', dataIndex: 'updateUserName' },
    { key: 'updateDate', label: '更新时间', dataIndex: 'updateDate', render: (v) => formatDateTime(v) },
    { key: 'requestParams', label: '请求参数', dataIndex: 'requestParams' },
    { key: 'responseData', label: '响应数据', dataIndex: 'responseData' },
    { key: 'errorMessage', label: '错误信息', dataIndex: 'errorMessage' },
  ];

  const filterFields: FormFieldConfig[] = [
    { field: 'module', label: '模块', type: 'input', placeholder: '请输入模块名', span: 6 },
    { field: 'action', label: '操作', type: 'input', placeholder: '请输入操作类型', span: 6 },
    { field: 'requestUri', label: '请求URI', type: 'input', placeholder: '支持模糊匹配', span: 8 },
    {
      field: 'success',
      label: '是否成功',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '成功', value: true },
        { label: '失败', value: false },
      ],
      span: 4,
    },
  ];

  const loadData = async (params?: any) => {
    setSearchLoading(true);
    try {
      const current = params?.current ?? pagination.current;
      const pageSize = params?.pageSize ?? pagination.pageSize;
      const formValues = filterFormRef.current?.getFieldsValue?.() || {};
      const targetParams = {
        module: formValues.module || undefined,
        action: formValues.action || undefined,
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

  const handleDelete = (record: SysLogDto) => {
    setCurrentRecord(record);
    setDeleteVisible(true);
  };

  const doDelete = async () => {
    if (!currentRecord) return;
    try {
      await deleteSysLog(currentRecord.id);
      Message.success('删除成功');
      setDeleteVisible(false);
      await handleSearch();
    } catch (e) {
      Message.error('删除失败');
    }
  };

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
    <div className="syslog-page" style={{ height: '100%' }}>
      <Layout style={{ height: '100%' }}>
        <Content style={{ padding: 16 }}>
          <DataManager
            data={items}
            loading={searchLoading || loading}
            pagination={pagination}
            onPaginationChange={(p) => handlePageChange(p.current, p.pageSize)}
            actions={{
              onView: handleView,
              onDelete: handleDelete,
            }}
            config={{
              displayMode: 'table',
              showModeToggle: false,
              tableColumns,
              showFilterForm: true,
              filterContent: (
                <div>
                  <FilterForm
                    ref={filterFormRef}
                    formFields={filterFields}
                    onSearch={handleSearch}
                    onReset={handleReset}
                  />
                </div>
              ),
            }}
            tableScrollHeight={tableScrollHeight}
          />
        </Content>
      </Layout>

      <DetailModal
        visible={detailVisible}
        record={currentRecord || undefined}
        onCancel={() => setDetailVisible(false)}
        title="日志详情"
        detailFields={detailFields}
      />

      <Modal
        visible={deleteVisible}
        title="确认删除"
        onCancel={() => setDeleteVisible(false)}
        onOk={doDelete}
      >
        确认删除该日志记录？该操作不可撤销。
      </Modal>
    </div>
  );
}

export default SysLogPage;


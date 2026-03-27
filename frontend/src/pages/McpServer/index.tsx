import React, { useCallback, useState, useEffect, useRef } from 'react';
import { DataManager, AddEditModal } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import {
  Button,
  Drawer,
  Empty,
  Message,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconDelete,
  IconEdit,
  IconRefresh,
} from '@arco-design/web-react/icon';
import renderDate from '@/utils/timeUtil';
import { FormFieldConfig } from '@/components/types/types';
import './style/index.less';
import {
  createMcpServer,
  deleteMcpServer,
  healthCheckMcpServer,
  searchMcpServers,
  updateMcpServer,
  listDiscoveredTools,
} from './api';

function McpServerManager() {
  // 状态管理
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  // 工具查看抽屉相关状态
  const [toolsDrawerVisible, setToolsDrawerVisible] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [toolsList, setToolsList] = useState<any[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [loadingAllTools, setLoadingAllTools] = useState(false);
  const discoveredToolsCacheRef = useRef<Record<string, any[]>>({});

  // 选项配置
  const statusOptions = [
    { label: '已创建', value: 'CREATED' },
    { label: '可用', value: 'ACTIVE' },
    { label: '降级', value: 'DEGRADED' },
    { label: '禁用', value: 'INACTIVE' },
  ];

  const statusTagMap: Record<string, { label: string; color: string }> = {
    CREATED: { label: '已创建', color: 'blue' },
    ACTIVE: { label: '可用', color: 'green' },
    DEGRADED: { label: '降级', color: 'orangered' },
    INACTIVE: { label: '禁用', color: 'gray' },
  };

  // 初始化数据
  useEffect(() => {
    fetchData({}, 1, 20);
  }, []);

  // 获取数据
  const fetchData = useCallback(async (params = {}, page?: number, pageSize?: number) => {
    try {
      setLoading(true);
      const queryParams = {
        keyWord: params.keyWord || '',
        env: params.env || '',
        status: params.status || '',
        pageNum: (page ?? pagination.current) - 1,
        pageSize: pageSize ?? pagination.pageSize
      };

      const response = await searchMcpServers(queryParams);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          current: (queryParams.pageNum || 0) + 1,
          pageSize: queryParams.pageSize || 20,
          total: response.data.totalElements || 0
        }));
      }
    } catch (error) {
      console.error('获取 MCP 服务器列表失败:', error);
      Message.error('获取 MCP 服务器列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: 'keyWord',
      label: '关键字',
      type: 'input',
      placeholder: '名称或标识模糊搜索',
      span: 8,
    },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      placeholder: '请选择状态',
      allowClear: true,
      options: statusOptions,
      span: 8,
    }
  ];

  // 新增/编辑表单配置
  const getFormConfig = (isEditMode: boolean): FormFieldConfig[] => [
    {
      field: 'name',
      label: '名称',
      type: 'input',
      placeholder: '请输入服务器名称',
      rules: [{ required: true, message: '请输入服务器名称' }],
      span: 24,
    },
    {
      field: 'identifier',
      label: '标识',
      type: 'input',
      placeholder: '用于唯一标识服务器的英文标识',
      rules: [{ required: true, message: '请输入服务器标识' }],
      span: 24,
    },
    {
      field: 'description',
      label: '描述',
      type: 'textarea',
      placeholder: '请输入描述',
      rules: [{ maxLength: 500, message: '描述长度不超过500字符' }],
      span: 24,
    },
    {
      field: 'address',
      label: '地址',
      type: 'input',
      placeholder: '如 https://mcp.example.com',
      rules: [{ required: true, message: '请输入服务器地址' }],
      span: 24,
    },
    {
      field: 'authConfig',
      label: '认证配置',
      type: 'textarea',
      placeholder: '可选，配置内容',
      rules: [{ maxLength: 4000, message: '配置长度不超过4000字符' }],
      span: 24,
    }
  ];

  // 提交处理
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit) {
        await updateMcpServer({ ...values, id: currentRecord.id });
        Message.success('更新 MCP 服务器成功');
      } else {
        await createMcpServer(values);
        Message.success('创建 MCP 服务器成功');
      }
      setAddEditVisible(false);
      setCurrentRecord(null);
      fetchData();
    } catch (error: any) {
      console.error(isEdit ? '更新失败:' : '创建失败:', error);
      const errorMsg = error?.response?.data?.message || error?.message || (isEdit ? '更新 MCP 服务器失败' : '创建 MCP 服务器失败');
      Message.error(errorMsg);
      throw error;
    }
  };

  // 删除处理
  const handleDelete = async (record: any) => {
    try {
      await deleteMcpServer(record.id);
      Message.success('删除 MCP 服务器成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      Message.error('删除 MCP 服务器失败');
    }
  };

  // 健康检查
  const handleHealthCheck = async (record: any) => {
    try {
      const result = await healthCheckMcpServer(record.id);
      if (result.data) {
        const status = result.data.status;
        let statusMsg = '检查完成';
        if (status === 'ACTIVE') {
          statusMsg = '服务器状态：正常';
        } else if (status === 'DEGRADED') {
          statusMsg = '服务器状态：降级';
        } else if (status === 'INACTIVE') {
          statusMsg = '服务器状态：离线';
        }
        Message.success(`健康检查完成 - ${statusMsg}`);
      }
      fetchData();
    } catch (error) {
      console.error('健康检查失败:', error);
      Message.error('健康检查失败');
    }
  };

  // 打开工具查看抽屉
  const handleViewTools = async (record: any) => {
    setSelectedServer(record);
    setToolsDrawerVisible(true);

    const cachedTools = discoveredToolsCacheRef.current[record.id];
    if (cachedTools) {
      setToolsList(cachedTools);
      return;
    }

    try {
      setToolsLoading(true);
      const response = await listDiscoveredTools(record.id);
      const discoveredTools = response.data || [];
      discoveredToolsCacheRef.current[record.id] = discoveredTools;
      setToolsList(discoveredTools);
    } catch (error) {
      console.error('获取工具列表失败:', error);
      Message.error('获取工具列表失败');
      setToolsList([]);
    } finally {
      setToolsLoading(false);
    }
  };

  // 加载整个服务器的所有工具
  const handleLoadAllTools = async () => {
    try {
      setLoadingAllTools(true);
      const serverId = selectedServer?.id;
      const tools = (serverId && discoveredToolsCacheRef.current[serverId]) || toolsList || [];
      if (tools.length === 0) {
        Message.warning('暂无已发现工具，请先刷新工具列表');
        return;
      }
      Message.success(`成功加载 ${tools.length} 个工具`);
      if (serverId) {
        delete discoveredToolsCacheRef.current[serverId];
      }
      setToolsDrawerVisible(false);
      setToolsList([]);
    } catch (error) {
      console.error('加载工具失败:', error);
      Message.error('加载工具失败');
    } finally {
      setLoadingAllTools(false);
    }
  };

  // 表格列配置
  const tableColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
      render: (text: string, record: any) => (
        <Button
          type="text"
          size="small"
          style={{ textDecoration: 'underline', padding: 0, height: 'auto' }}
          onClick={() => handleViewTools(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (v: string) => {
        const info = statusTagMap[v] || { label: v || '-', color: 'gray' };
        return (
          <Tag color={info.color} bordered>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: '最近心跳',
      dataIndex: 'lastHeartbeatAt',
      width: 180,
      render: (v: string) => renderDate(v),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 180,
      render: (v: string) => renderDate(v),
    },
  ];

  // 自定义操作列 - 延迟定义以避免闭包问题
  const customTableColumns = [
    ...tableColumns,
    {
      title: '操作',
      width: 140,
      fixed: 'right' as const,
      render: (_, record: any) => (
        <Space size="small">
          <Tooltip content="健康检查">
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={() => handleHealthCheck(record)}
            />
          </Tooltip>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => {
                setIsEdit(true);
                setCurrentRecord(record);
                setAddEditVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除？"
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                status="danger"
                size="small"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="mcp-server-manager">
      <DataManager
        data={tableData}
        loading={loading}
        pagination={pagination}
        onPaginationChange={(p) => fetchData({}, p.current, p.pageSize)}
        actions={{
          onAdd: () => {
            setIsEdit(false);
            setCurrentRecord(null);
            setAddEditVisible(true);
          },
        }}
        config={{
          displayMode: 'table',
          tableColumns: customTableColumns,
          filterContent: (
            <FilterForm
              formFields={searchFormFields}
              onSearch={(values) => fetchData(values, 1)}
              onReset={() => fetchData({}, 1)}
            />
          ),
          showModeToggle: false,
          tableProps: {
            scroll: { x: true },
          },
        }}
      />

      <AddEditModal
        visible={addEditVisible}
        title={isEdit ? '编辑 MCP 服务器' : '新增 MCP 服务器'}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentRecord(null);
        }}
        onOk={handleSubmit}
        formConfig={getFormConfig(isEdit)}
        isEdit={isEdit}
        record={currentRecord}
        loading={loading}
        bodyStyle={{
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      />

      {/* 工具查看抽屉 */}
      <Drawer
        title={`${selectedServer?.name} - 工具列表`}
        placement="right"
        onCancel={() => {
          setToolsDrawerVisible(false);
          setToolsList([]);
          setSelectedServer(null);
        }}
        visible={toolsDrawerVisible}
        width={600}
        footer={
          <Space>
            <Button onClick={() => setToolsDrawerVisible(false)}>关闭</Button>
            <Button
              type="primary"
              loading={loadingAllTools}
              onClick={handleLoadAllTools}
            >
              加载工具
            </Button>
          </Space>
        }
      >
        <Spin loading={toolsLoading}>
          {toolsList.length > 0 ? (
            <div className="tools-list">
              {toolsList.map((tool, index) => (
                <div key={index} className="tool-item">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-description">{tool.description || '暂无描述'}</div>
                  {tool.inputSchema && (
                    <div className="tool-schema">
                      <div className="schema-label">参数定义:</div>
                      <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无工具" />
          )}
        </Spin>
      </Drawer>
    </div>
  );
}

export default McpServerManager;


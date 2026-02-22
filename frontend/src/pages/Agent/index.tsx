import React, { useEffect, useRef, useState } from 'react';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import {
  Button,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tag,
  Tabs,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconCheck,
  IconCopy,
  IconDelete,
  IconEdit,
  IconStop,
  IconTool,
} from '@arco-design/web-react/icon';
import { FormFieldConfig } from '@/components/types/types';
import './style/index.less';
import {
  createAgent,
  deleteAgent,
  disableAgent,
  duplicateAgent,
  enableAgent,
  getAgent,
  listLlmModels,
  listPromptTemplates,
  searchAgents,
  updateAgent,
} from './api';
import ToolSelector from './components/ToolSelector';
import renderDate from '@/utils/timeUtil';

const { Row, Col } = Grid;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

function AgentManager() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [promptMode, setPromptMode] = useState<'direct' | 'template'>('direct');
  const [promptTemplates, setPromptTemplates] = useState<any[]>([]);
  const [llmModels, setLlmModels] = useState<any[]>([]);

  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  const statusOptions = [
    { label: '草稿', value: 'DRAFT' },
    { label: '启用', value: 'ENABLED' },
    { label: '禁用', value: 'DISABLED' },
  ];

  const statusTagMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'gray' },
    ENABLED: { label: '启用', color: 'green' },
    DISABLED: { label: '禁用', color: 'red' },
  };

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    keyWord: '',
    status: '',
    category: '',
  });

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: 'keyWord',
      label: '关键字',
      type: 'input',
      placeholder: '名称或标识符模糊搜索',
      span: 6,
    },
    {
      field: 'status',
      label: '状态',
      type: 'select',
      placeholder: '请选择状态',
      options: statusOptions,
      span: 6,
      allowClear: true,
    },
    {
      field: 'category',
      label: '分类',
      type: 'input',
      placeholder: '按分类过滤',
      span: 6,
    },
  ];

  // 获取表格数据
  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const query = {
        keyWord: params.keyWord || '',
        status: params.status || '',
        category: params.category || '',
        pageNum: current - 1,
        pageSize,
      };
      const response = await searchAgents(query);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error('获取智能体列表失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    );
    setSearchParams(filterValues as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 重置处理
  const handleReset = () => {
    const defaultParams = { keyWord: '', status: '', category: '' };
    setSearchParams(defaultParams as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(defaultParams, pagination.pageSize, 1);
    filterFormRef.current?.setFieldsValue?.(defaultParams);
  };

  const fetchPromptTemplates = async () => {
    try {
      const response = await listPromptTemplates();
      if (response.data) {
        setPromptTemplates(response.data);
      }
    } catch (error) {
      console.error('获取提示词模板失败', error);
    }
  };

  const fetchLlmModels = async () => {
    try {
      const response = await listLlmModels();
      if (response.data) {
        setLlmModels(response.data);
      }
    } catch (error) {
      console.error('获取LLM模型列表失败', error);
    }
  };

  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    setPromptMode('direct');
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.resetFields?.();
    }, 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        await createAgent(values);
        Message.success('创建智能体成功');
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData(searchParams);
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('创建智能体失败');
    }
  };

  const handleEdit = async (record: any) => {
    try {
      const response = await getAgent(record.id);
      if (response.data) {
        const detail = response.data;
        setCurrentRecord(detail);
        setPromptMode(detail.promptTemplateId ? 'template' : 'direct');
        setEditModalVisible(true);
        setTimeout(() => {
          editFormRef.current?.setFieldsValue?.({
            id: detail.id,
            name: detail.name,
            identifier: detail.identifier,
            description: detail.description,
            icon: detail.icon,
            category: detail.category,
            systemPrompt: detail.systemPrompt,
            promptTemplateId: detail.promptTemplateId,
            modelId: detail.modelId,
            modelConfig: detail.modelConfig,
            status: detail.status,
            agentTags: detail.agentTags,
            toolIds: detail.tools?.map((t: any) => t.mcpToolId) || [],
          });
        }, 50);
      }
    } catch (error) {
      Message.error('获取智能体详情失败');
    }
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        await updateAgent(values);
        Message.success('更新智能体成功');
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData(searchParams);
      }
    } catch (error) {
      if ((error as any)?.fields) return;
      Message.error('更新智能体失败');
    }
  };

  const handleDeleteConfirm = async (record: any) => {
    try {
      await deleteAgent(record.id);
      Message.success('删除智能体成功');
      fetchTableData(searchParams);
    } catch (error) {
      Message.error('删除智能体失败');
    }
  };

  const handleEnable = async (record: any) => {
    try {
      await enableAgent(record.id);
      Message.success('已启用智能体');
      fetchTableData(searchParams);
    } catch (error) {
      Message.error('启用智能体失败');
    }
  };

  const handleDisable = async (record: any) => {
    try {
      await disableAgent(record.id);
      Message.success('已禁用智能体');
      fetchTableData(searchParams);
    } catch (error) {
      Message.error('禁用智能体失败');
    }
  };

  const handleDuplicate = async (record: any) => {
    try {
      await duplicateAgent(record.id);
      Message.success('复制智能体成功');
      fetchTableData(searchParams);
    } catch (error) {
      Message.error('复制智能体失败');
    }
  };

  const columns = [
    {
      title: '图标',
      dataIndex: 'icon',
      width: 60,
      render: (v: string) => (
        <span style={{ fontSize: 24 }}>{v || '🤖'}</span>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '标识符',
      dataIndex: 'identifier',
      width: 150,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
    },
    {
      title: '关联模型',
      dataIndex: 'modelName',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: '工具数',
      dataIndex: 'toolCount',
      width: 80,
      render: (v: number) => (
        <span className="tool-count">
          <IconTool /> {v || 0}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
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
      title: '更新时间',
      dataIndex: 'updateDate',
      width: 180,
      render: (v: string) => renderDate(v),
    },
    {
      title: '操作',
      width: 170,
      fixed: 'right' as any,
      align: 'center' as any,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={e => {
                e.stopPropagation();
                handleEdit(record);
              }}
            />
          </Tooltip>
          {record.status === 'ENABLED' ? (
            <Tooltip content="禁用">
              <Button
                type="text"
                size="small"
                icon={<IconStop />}
                onClick={e => {
                  e.stopPropagation();
                  handleDisable(record);
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip content="启用">
              <Button
                type="text"
                size="small"
                icon={<IconCheck />}
                onClick={e => {
                  e.stopPropagation();
                  handleEnable(record);
                }}
              />
            </Tooltip>
          )}
          <Tooltip content="复制">
            <Button
              type="text"
              size="small"
              icon={<IconCopy />}
              onClick={e => {
                e.stopPropagation();
                handleDuplicate(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该记录吗？"
            onOk={() => handleDeleteConfirm(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                status="danger"
                size="small"
                icon={<IconDelete />}
                onClick={e => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchTableData(searchParams);
    fetchPromptTemplates();
    fetchLlmModels();
  }, []);

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      fields={searchFormFields}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  const renderAgentForm = (formRef: any, isEdit: boolean = false) => (
    <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: 10 }}>
      <Form ref={formRef} layout="vertical" className="modal-form">
        {isEdit && (
          <Form.Item field="id" hidden>
            <Input />
          </Form.Item>
        )}

        <Tabs defaultActiveKey="basic">
          <TabPane key="basic" title="基本信息">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="智能体名称"
                  field="name"
                  rules={[{ required: true, message: '请输入智能体名称' }]}
                >
                  <Input placeholder="如：客服助手、代码审查助手" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="标识符"
                  field="identifier"
                  extra="用于API调用的唯一标识"
                >
                  <Input placeholder="如：customer-service-bot" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="图标" field="icon">
                  <Input placeholder="🤖" maxLength={4} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="分类" field="category">
                  <Input placeholder="如：客服、开发、运维" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="标签" field="agentTags">
                  <Input placeholder="多个标签用逗号分隔" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="描述" field="description">
              <TextArea
                placeholder="智能体的功能描述"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
          </TabPane>

          <TabPane key="prompt" title="Prompt配置">
            <Form.Item label="配置方式">
              <Radio.Group
                value={promptMode}
                onChange={v => setPromptMode(v)}
                type="button"
              >
                <Radio value="direct">直接输入</Radio>
                <Radio value="template">选择模板</Radio>
              </Radio.Group>
            </Form.Item>

            {promptMode === 'direct' ? (
              <Form.Item
                label="系统提示词"
                field="systemPrompt"
                rules={[
                  {
                    validator: (value, callback) => {
                      if (promptMode === 'direct' && !value) {
                        callback('请输入系统提示词');
                      } else {
                        callback();
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  placeholder="输入智能体的系统提示词..."
                  autoSize={{ minRows: 8, maxRows: 16 }}
                />
              </Form.Item>
            ) : (
              <Form.Item
                label="提示词模板"
                field="promptTemplateId"
                rules={[
                  {
                    validator: (value, callback) => {
                      if (promptMode === 'template' && !value) {
                        callback('请选择提示词模板');
                      } else {
                        callback();
                      }
                    },
                  },
                ]}
              >
                <Select placeholder="选择已有的提示词模板" allowClear>
                  {promptTemplates.map((pt: any) => (
                    <Option key={pt.id} value={pt.id}>
                      {pt.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </TabPane>

          <TabPane key="model" title="模型配置">
            <Form.Item label="LLM模型" field="modelId" extra="不选择则使用系统默认模型">
              <Select placeholder="选择大语言模型" allowClear>
                {llmModels.map((model: any) => (
                  <Option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="模型参数配置"
              field="modelConfig"
              extra="JSON格式，如: {&quot;temperature&quot;: 0.7}"
            >
              <TextArea
                placeholder='{"temperature": 0.7, "maxTokens": 2048}'
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </TabPane>

          <TabPane key="tools" title="工具配置">
            <Form.Item label="选择MCP工具" field="toolIds">
              <ToolSelector />
            </Form.Item>
          </TabPane>
        </Tabs>
      </Form>
    </div>
  );

  return (
    <div className="agent-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false,
          displayMode: 'table',
          filterContent,
          tableColumns: columns,
        }}
      />

      {/* 新增智能体 Modal */}
      <Modal
        title="新建智能体"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
        style={{ width: 800 }}
        className="agent-form-modal"
      >
        {renderAgentForm(addFormRef, false)}
      </Modal>

      {/* 编辑智能体 Modal */}
      <Modal
        title="编辑智能体"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
        style={{ width: 800 }}
        className="agent-form-modal"
      >
        {renderAgentForm(editFormRef, true)}
      </Modal>

    </div>
  );
}

export default AgentManager;

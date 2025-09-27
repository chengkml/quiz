import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Modal,
  Message,
  Popconfirm,
  Tag,
  Space,
  Switch,
  InputNumber,
  Radio,
  Collapse,
  Grid,
  Pagination,
  Tooltip,
  Progress
} from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconPlus, IconEye, IconEdit, IconDelete, IconPlayArrow, IconUpload } from '@arco-design/web-react/icon';
import SynthesizerService, {
  type SynthesizerDto,
  type SynthesizerCreateDto,
  type SynthesizerUpdateDto,
  type SearchParams,
  type ModelType,
  type SynthesizerState,
  type SynthesizerTrainingParamsDto
} from '../../services/synthesizerService';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const { TextArea } = Input;
const { Option } = Select;
const Panel = Collapse.Item;
const FormItem = Form.Item;



const SynthesizerManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SynthesizerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SynthesizerDto | null>(null);
  
  const [samplingMethod, setSamplingMethod] = useState<1 | 2>(1);
  const [useMultiGpu, setUseMultiGpu] = useState(true);
  const [trainingRecords, setTrainingRecords] = useState<Set<string>>(new Set());
  const [trainingProgress, setTrainingProgress] = useState<Map<string, number>>(new Map());

  // 模型类型选项
  const modelTypeOptions = [
    { label: 'GAN', value: 'GAN' },
    { label: 'VAE', value: 'VAE' },
    { label: 'DIFFUSION', value: 'DIFFUSION' },
    { label: 'LLM', value: 'LLM' }
  ];

  // 状态选项
  const stateOptions = [
    { label: '全部', value: '' },
    { label: '训练中', value: 'TRAINING' },
    { label: '就绪', value: 'READY' },
    { label: '失败', value: 'FAILED' },
    { label: '已禁用', value: 'DISABLED' }
  ];

  // 通信后端选项
  const backendOptions = [
    { label: 'nccl', value: 'nccl' },
    { label: 'gloo', value: 'gloo' }
  ];

  // 获取状态标签颜色
  const getStateColor = (state: SynthesizerState) => {
    switch (state) {
      case 'TRAINING': return 'blue';
      case 'ACTIVE': return 'green';
      case 'FAILED': return 'red';
      case 'INACTIVE': return 'gray';
      case 'CREATED': return 'cyan';
      default: return 'gray';
    }
  };

  // 获取状态显示文本
  const getStateText = (state: SynthesizerState) => {
    switch (state) {
      case 'TRAINING': return '训练中';
      case 'ACTIVE': return '就绪';
      case 'FAILED': return '失败';
      case 'INACTIVE': return '已禁用';
      case 'CREATED': return '已创建';
      default: return state;
    }
  };

  // 查询数据
  const fetchData = async (params?: Partial<SearchParams>) => {
    setLoading(true);
    try {
      const searchParams: SearchParams = {
        page: currentPage - 1,
        size: pageSize,
        sortBy: 'createDt',
        sortDir: 'desc' as const,
        ...params
      };
      
      const result = await SynthesizerService.getSynthesizers(searchParams);
      
      if (result.success) {
        setData(result.data.content);
        setTotal(result.data.totalElements);
      } else {
        Message.error(result.message || '查询失败');
      }
    } catch (error) {
      console.error('查询失败:', error);
      Message.error('查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchData(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    fetchData();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchData(values);
  };

  // 发布合成器
  const handlePublish = async (record: SynthesizerDto) => {
    try {
      // 这里可以调用发布API
      Message.success(`合成器【${record.synthesizerName}】发布成功`);
      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('发布失败:', error);
      Message.error('发布失败');
    }
  };

  // 开始训练
  const handleStartTraining = async (record: SynthesizerDto) => {
    try {
      // 添加到训练中的记录集合
      setTrainingRecords(prev => new Set([...prev, record.synthesizerId]));
      
      // 初始化进度
      setTrainingProgress(prev => new Map(prev.set(record.synthesizerId, 0)));
      
      // 模拟训练过程
      Message.success(`合成器【${record.synthesizerName}】开始训练`);
      
      // 模拟训练状态更新
      setTimeout(() => {
        // 更新本地状态为训练中
        setData(prevData => 
          prevData.map(item => 
            item.synthesizerId === record.synthesizerId 
              ? { ...item, state: 'TRAINING' as SynthesizerState }
              : item
          )
        );
      }, 500);
      
      // 模拟进度更新（每500ms更新一次进度）
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const currentProgress = prev.get(record.synthesizerId) || 0;
          const newProgress = Math.min(currentProgress + Math.random() * 15 + 5, 100);
          const newMap = new Map(prev);
          newMap.set(record.synthesizerId, newProgress);
          
          // 如果进度达到100%，清除定时器并完成训练
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            
            // 延迟一下再完成训练，让用户看到100%的进度
            setTimeout(() => {
              setData(prevData => 
                prevData.map(item => 
                  item.synthesizerId === record.synthesizerId 
                    ? { ...item, state: 'READY' as SynthesizerState }
                    : item
                )
              );
              setTrainingRecords(prev => {
                const newSet = new Set(prev);
                newSet.delete(record.synthesizerId);
                return newSet;
              });
              setTrainingProgress(prev => {
                const newMap = new Map(prev);
                newMap.delete(record.synthesizerId);
                return newMap;
              });
              Message.success(`合成器【${record.synthesizerName}】训练完成`);
            }, 1000);
          }
          
          return newMap;
        });
      }, 500);
      
    } catch (error) {
      console.error('开始训练失败:', error);
      Message.error('开始训练失败');
      setTrainingRecords(prev => {
        const newSet = new Set(prev);
        newSet.delete(record.synthesizerId);
        return newSet;
      });
      setTrainingProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(record.synthesizerId);
        return newMap;
      });
    }
  };

  // 创建合成器
  const handleCreate = async () => {
    try {
      const values = await createForm.validate();
      
      const trainingParams: SynthesizerTrainingParamsDto = {
        sampling_method: samplingMethod,
        sample_ratio: samplingMethod === 1 ? values.sample_ratio : undefined,
        sample_size: samplingMethod === 2 ? values.sample_size : undefined,
        sample_threshold: values.sample_threshold || 5000,
        epochs: values.epochs || 100,
        batch_size: values.batch_size || 1000,
        use_multi_gpu: useMultiGpu,
        backend: values.backend,
        gpu_ids: !useMultiGpu && values.gpu_ids ? 
          values.gpu_ids.split(',').map((id: string) => parseInt(id.trim())) : undefined
      };

      const createDto: SynthesizerCreateDto = {
        synthesizerName: values.synthesizerName,
        modelType: values.modelType,
        trainingDatasetId: values.trainingDatasetId,
        trainingParams,
        description: values.description
      };

      const result = await SynthesizerService.createSynthesizer(createDto);
      
      if (result.success) {
        Message.success('创建成功');
        setCreateVisible(false);
        createForm.resetFields();
        fetchData();
      } else {
        Message.error(result.message || '创建失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      Message.error('创建失败');
    }
  };

  // 编辑合成器
  const handleEdit = async () => {
    try {
      const values = await editForm.validate();
      
      if (!currentRecord?.synthesizerId) {
        Message.error('未找到要编辑的记录');
        return;
      }
      
      const updateDto: SynthesizerUpdateDto = {
        synthesizerName: values.synthesizerName,
        description: values.description
      };

      const result = await SynthesizerService.updateSynthesizer(currentRecord.synthesizerId, updateDto);
      
      if (result.success) {
        Message.success('更新成功');
        setEditVisible(false);
        fetchData();
      } else {
        Message.error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新失败:', error);
      Message.error('更新失败');
    }
  };

  // 删除合成器
  const handleDelete = async (record: SynthesizerDto) => {
    try {
      await SynthesizerService.deleteSynthesizer(record.synthesizerId);
      Message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      Message.error('删除失败');
    }
  };

  // 查看详情
  const handleView = async (record: SynthesizerDto) => {
    try {
      const result = await SynthesizerService.getSynthesizerById(record.synthesizerId);
      
      if (result.success && result.data) {
        if(result.data.createTime) {
          result.data.createTime = formatTime(result.data.createTime);
        }
        if(result.data.updateTime) {
          result.data.updateTime = formatTime(result.data.updateTime);
        }
        setCurrentRecord(result.data);
        setViewVisible(true);
      } else {
        Message.error(result.message || '获取详情失败');
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      Message.error('获取详情失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = (record: SynthesizerDto) => {
    setCurrentRecord(record);
    editForm.setFieldsValue({
      synthesizerName: record.synthesizerName,
      description: record.description
    });
    setEditVisible(true);
  };

  const formatTime = (time)=>{
    if (!time) return '-';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'synthesizerName',
      width: 150
    },
    {
      title: '表名',
      dataIndex: 'trainingDatasetId',
      width: 180
    },
    {
      title: '状态',
      dataIndex: 'state',
      align: 'center',
      width: 150,
      render: (_: any, record: SynthesizerDto) => {
        const isTraining = record.state === 'TRAINING' || trainingRecords.has(record.synthesizerId);
        const progress = trainingProgress.get(record.synthesizerId) || 0;
        
        return (
          <div>
            <Tag color={getStateColor(record.state)}>
              {getStateText(record.state)}
            </Tag>
            {isTraining && (
              <div style={{ marginTop: 4, width: '100%' }}>
                <Progress
                  percent={Math.round(progress)}
                  size="small"
                  status={progress < 100 ? 'active' : 'success'}
                  showText={false}
                />
                <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: 2 }}>
                  {Math.round(progress)}%
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 200,
      render: (text: string) => (
        <div style={{ 
          maxWidth: 180, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }} title={text}>
          {text}
        </div>
      )
    },
    {
      title: '创建人',
      dataIndex: 'createUser',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 140,
      render: (createTime: string) => {
        if (!createTime) return '-';
        const date = new Date(createTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: SynthesizerDto) => {
        const canEdit = record.state !== 'TRAINING' && record.state !== 'FAILED';
        const canTrain = record.state === 'CREATED' || record.state === 'READY';
        const canPublish = record.state === 'READY';
        const isTraining = record.state === 'TRAINING' || trainingRecords.has(record.synthesizerId);
        
        return (
          <Space>
            <Tooltip content="查看">
              <Button
                type="text"
                size="small"
                icon={<IconEye />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
            {canTrain && (
              <Tooltip content={isTraining ? "训练中..." : "开始训练"}>
                <Button
                  type="text"
                  size="small"
                  status="success"
                  icon={<IconPlayArrow />}
                  loading={isTraining}
                  disabled={isTraining}
                  onClick={() => handleStartTraining(record)}
                />
              </Tooltip>
            )}
            {canPublish && (
              <Tooltip content="发布">
                <Button
                  type="text"
                  size="small"
                  status="warning"
                  icon={<IconUpload />}
                  onClick={() => handlePublish(record)}
                />
              </Tooltip>
            )}
            {canEdit && (
              <Tooltip content="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<IconEdit />}
                  onClick={() => openEditModal(record)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title={`确定要删除【${record.synthesizerName}】吗？此操作不可恢复。`}
              onOk={() => handleDelete(record)}
            >
              <Tooltip content="删除">
                <Button
                  type="text"
                  size="small"
                  status="danger"
                  icon={<IconDelete />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  return (
    <div className={styles.synthesizerManagement}>
      {/* 查询表单 */}
      <Card className={styles.queryForm}>
        <Form form={form}>
          <div className={styles.formRow}>
            <div className={styles.formItem}>
              <FormItem field="name" label="合成器名称" className={styles.arcoFormItem}>
                <Input placeholder="请输入合成器名称" allowClear />
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="modelType" label="模型类型" className={styles.arcoFormItem}>
                <Select placeholder="请选择模型类型" allowClear>
                  {modelTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
            <div className={styles.formItem}>
              <FormItem field="state" label="状态" className={styles.arcoFormItem}>
                <Select placeholder="请选择状态" allowClear>
                  {stateOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </div>
            <div className={styles.buttonGroup}>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      {/* 合成器表格 */}
      <Card className={styles.synthesizerTable}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>合成器列表</div>
          <div className={styles.tableActions}>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={() => setCreateVisible(true)}
            >
              创建合成器
            </Button>
            <Button icon={<IconRefresh />} onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          data={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          rowKey="synthesizerId"
        />
        
        {/* 分页 */}
        <div className={styles.paginationWrapper}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
            showQuickJumper
            sizeOptions={[10, 20, 50, 100]}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </Card>

      {/* 创建模态框 */}
      <Modal
        title="创建数据合成器"
        visible={createVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
        style={{ width: 800 }}
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label="合成器名称" 
                field="synthesizerName" 
                rules={[{ required: true, message: '请输入合成器名称' }, { maxLength: 64, message: '名称不能超过64个字符' }]}
              >
                <Input placeholder="请输入合成器名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="模型类型" 
                field="modelType" 
                rules={[{ required: true, message: '请选择模型类型' }]}
              >
                <Select placeholder="请选择模型类型">
                  {modelTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            label="表名"
            field="trainingDatasetId" 
            rules={[{ required: true, message: '表名' }]}
          >
            <Input placeholder="请输入表名列表" />
          </Form.Item>
          
          <Form.Item label="描述" field="description" rules={[{ maxLength: 1024, message: '描述不能超过1024个字符' }]}>
            <TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
          
          <Form.Item label="采样方式">
            <Radio.Group value={samplingMethod} onChange={setSamplingMethod}>
              <Radio value={1}>按比例</Radio>
              <Radio value={2}>按数量</Radio>
            </Radio.Group>
          </Form.Item>
          
          {samplingMethod === 1 && (
            <Form.Item 
              label="采样比例" 
              field="sample_ratio" 
              rules={[{ required: true, message: '请输入采样比例' }]}
            >
              <InputNumber 
                placeholder="请输入采样比例" 
                min={0.01} 
                max={1} 
                step={0.01} 
                style={{ width: '100%' }} 
              />
            </Form.Item>
          )}
          
          {samplingMethod === 2 && (
            <Form.Item 
              label="采样数量" 
              field="sample_size" 
              rules={[{ required: true, message: '请输入采样数量' }]}
            >
              <InputNumber 
                placeholder="请输入采样数量" 
                min={1} 
                style={{ width: '100%' }} 
              />
            </Form.Item>
          )}
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="抽样阈值" field="sample_threshold">
                <InputNumber 
                  placeholder="默认5000" 
                  min={1} 
                  defaultValue={5000}
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="训练轮数" field="epochs">
                <InputNumber 
                  placeholder="默认100" 
                  min={1} 
                  defaultValue={100}
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="批次大小" field="batch_size">
                <InputNumber 
                  placeholder="默认1000" 
                  min={1} 
                  defaultValue={1000}
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="多卡训练">
                <Switch checked={useMultiGpu} onChange={setUseMultiGpu} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label="通信后端" 
                field="backend" 
                rules={[{ required: true, message: '请选择通信后端' }]}
              >
                <Select placeholder="请选择通信后端">
                  {backendOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          {useMultiGpu && (
            <Form.Item label="GPU ID 列表" field="gpu_ids">
              <Input placeholder="请输入GPU ID，用逗号分隔，如：0,1,2" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 编辑模态框 */}
      <Modal
        title="编辑合成器"
        visible={editVisible}
        onOk={handleEdit}
        onCancel={() => setEditVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item 
            label="合成器名称" 
            field="synthesizerName" 
            rules={[{ maxLength: 64, message: '名称不能超过64个字符' }]}
          >
            <Input placeholder="请输入合成器名称" />
          </Form.Item>
          
          <Form.Item label="描述" field="description" rules={[{ maxLength: 1024, message: '描述不能超过1024个字符' }]}>
            <TextArea placeholder="请输入描述" rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#1D2129',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <IconEye style={{ fontSize: '20px', color: '#165DFF' }} />
            【{currentRecord?.synthesizerName}】详情
          </div>
        }
        visible={viewVisible}
        onCancel={() => setViewVisible(false)}
        footer={null}
        style={{ width: 900 }}
        bodyStyle={{ padding: '24px' }}
      >
        {currentRecord && (
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {/* 基本信息卡片 */}
            <Card 
              title={
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
                  基本信息
                </span>
              }
              size="small"
              style={{ marginBottom: '16px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>合成器ID：</span>
                    <span style={{ 
                      color: '#1D2129', 
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '13px',
                      backgroundColor: '#F7F8FA',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>{currentRecord.synthesizerId}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>合成器名称：</span>
                    <span style={{ 
                      color: '#1D2129', 
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>{currentRecord.synthesizerName}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>模型类型：</span>
                    <span style={{ color: '#1D2129' }}>{currentRecord.modelTypeDescription}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>训练数据集：</span>
                    <span style={{ color: '#1D2129' }}>{currentRecord.trainingDatasetId}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>状态：</span>
                    <Tag color={getStateColor(currentRecord.state)} style={{ 
                      marginLeft: 0,
                      fontWeight: 500,
                      fontSize: '12px'
                    }}>
                      {getStateText(currentRecord.state)}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>创建人：</span>
                    <span style={{ color: '#1D2129' }}>{currentRecord.createUser}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>创建时间：</span>
                    <span style={{ 
                      color: '#1D2129',
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '13px'
                    }}>{currentRecord.createTime}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>更新时间：</span>
                    <span style={{ 
                      color: '#1D2129',
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '13px'
                    }}>{currentRecord.updateTime}</span>
                  </div>
                </Col>
              </Row>
              
              {/* 文件路径信息 */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E6EB' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    color: '#86909C', 
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px'
                  }}>模型文件路径：</div>
                  <div style={{ 
                    color: '#1D2129',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: '12px',
                    backgroundColor: '#F7F8FA',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E6EB',
                    wordBreak: 'break-all'
                  }}>{currentRecord.modelArtifactPath || '暂无'}</div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ 
                    color: '#86909C', 
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '6px'
                  }}>模型配置路径：</div>
                  <div style={{ 
                    color: '#1D2129',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: '12px',
                    backgroundColor: '#F7F8FA',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E6EB',
                    wordBreak: 'break-all'
                  }}>{currentRecord.modelConfigPath || '暂无'}</div>
                </div>
              </div>
              
              {/* 描述信息 */}
              {currentRecord.description && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E6EB' }}>
                  <div style={{ 
                    color: '#86909C', 
                    fontSize: '13px',
                    fontWeight: 500,
                    marginBottom: '8px'
                  }}>描述：</div>
                  <div style={{ 
                    color: '#1D2129',
                    backgroundColor: '#F7F8FA',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E5E6EB',
                    lineHeight: '1.6'
                  }}>{currentRecord.description}</div>
                </div>
              )}
            </Card>
            
            {/* 训练参数卡片 */}
            <Card 
              title={
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1D2129' }}>
                  训练参数
                </span>
              }
              size="small"
              bodyStyle={{ padding: '16px' }}
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>采样方式：</span>
                    <Tag color={currentRecord.trainingParams.sampling_method === 1 ? 'blue' : 'green'} style={{
                      marginLeft: 0,
                      fontWeight: 500,
                      fontSize: '12px'
                    }}>
                      {currentRecord.trainingParams.sampling_method === 1 ? '按比例' : '按数量'}
                    </Tag>
                  </div>
                </Col>
                {currentRecord.trainingParams.sample_ratio && (
                  <Col span={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ 
                        color: '#86909C', 
                        minWidth: '100px', 
                        fontSize: '13px',
                        fontWeight: 500
                      }}>采样比例：</span>
                      <span style={{ 
                        color: '#1D2129',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}>{(currentRecord.trainingParams.sample_ratio * 100).toFixed(1)}%</span>
                    </div>
                  </Col>
                )}
                {currentRecord.trainingParams.sample_size && (
                  <Col span={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ 
                        color: '#86909C', 
                        minWidth: '100px', 
                        fontSize: '13px',
                        fontWeight: 500
                      }}>采样数量：</span>
                      <span style={{ 
                        color: '#1D2129',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}>{currentRecord.trainingParams.sample_size.toLocaleString()}</span>
                    </div>
                  </Col>
                )}
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>抽样阈值：</span>
                    <span style={{ color: '#1D2129' }}>{currentRecord.trainingParams.sample_threshold?.toLocaleString()}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>训练轮数：</span>
                    <span style={{ 
                      color: '#1D2129',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>{currentRecord.trainingParams.epochs}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>批次大小：</span>
                    <span style={{ 
                      color: '#1D2129',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>{currentRecord.trainingParams.batch_size?.toLocaleString()}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>多卡训练：</span>
                    <Tag color={currentRecord.trainingParams.use_multi_gpu ? 'green' : 'gray'} style={{
                      marginLeft: 0,
                      fontWeight: 500,
                      fontSize: '12px'
                    }}>
                      {currentRecord.trainingParams.use_multi_gpu ? '是' : '否'}
                    </Tag>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      color: '#86909C', 
                      minWidth: '100px', 
                      fontSize: '13px',
                      fontWeight: 500
                    }}>通信后端：</span>
                    <span style={{ 
                      color: '#1D2129',
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '13px',
                      backgroundColor: '#F7F8FA',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>{currentRecord.trainingParams.backend}</span>
                  </div>
                </Col>
                {currentRecord.trainingParams.gpu_ids && currentRecord.trainingParams.gpu_ids.length > 0 && (
                  <Col span={24}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ 
                        color: '#86909C', 
                        fontSize: '13px',
                        fontWeight: 500,
                        marginBottom: '6px'
                      }}>GPU ID 列表：</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {currentRecord.trainingParams.gpu_ids.map((gpuId, index) => (
                          <Tag key={index} color="blue" style={{
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '12px',
                            fontWeight: 500
                          }}>
                            GPU {gpuId}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SynthesizerManagement;
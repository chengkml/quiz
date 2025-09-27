import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Grid,
  Card,
  InputNumber,
  Switch,
  Divider,
} from '@arco-design/web-react';
import { CatalogCreateDto } from '../../../types/catalog';
import { CatalogService } from '../../../services/catalogService';
import { DatasetService } from '../../../services/datasetService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

interface CreateCatalogModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface DatasetOption {
  value: string;
  label: string;
  tabId: string;
  tabName: string;
}

const CreateCatalogModal: React.FC<CreateCatalogModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [datasetOptions, setDatasetOptions] = useState<DatasetOption[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);

  // 抽样方法选项
  const samplingMethods = [
    { label: '随机抽样', value: 'RANDOM' },
    { label: '分层抽样', value: 'STRATIFIED' },
    { label: '系统抽样', value: 'SYSTEMATIC' },
  ];

  // 优化器选项
  const optimizers = [
    { label: 'Adam', value: 'ADAM' },
    { label: 'SGD', value: 'SGD' },
    { label: 'RMSprop', value: 'RMSPROP' },
  ];

  // 损失函数选项
  const lossFunctions = [
    { label: 'MSE', value: 'MSE' },
    { label: 'CrossEntropy', value: 'CROSS_ENTROPY' },
    { label: 'BCE', value: 'BCE' },
  ];

  // 获取数据集列表
  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    try {
      const response = await DatasetService.getDatasets({
        page: 0,
        size: 1000,
        state: 'ENABLED',
      });
      if (response.success) {
        const options = response.data.map((dataset: any) => ({
          value: dataset.datasetId,
          label: `${dataset.datasetName} (${dataset.tabName})`,
          tabId: dataset.tabId,
          tabName: dataset.tabName,
        }));
        setDatasetOptions(options);
      }
    } catch (error) {
      console.error('获取数据集列表失败:', error);
      Message.error('获取数据集列表失败');
    } finally {
      setLoadingDatasets(false);
    }
  };

  // 模态框打开时获取数据集列表
  useEffect(() => {
    if (visible) {
      fetchDatasets();
      // 设置默认值
      form.setFieldsValue({
        samplingConfig: {
          method: 'RANDOM',
          sampleSize: 1000,
          stratifyColumn: '',
        },
        trainingConfig: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001,
          optimizer: 'ADAM',
          lossFunction: 'MSE',
          earlyStopping: true,
          patience: 10,
        },
      });
    }
  }, [visible, form]);

  // 处理数据集选择
  const handleDatasetChange = (datasetId: string) => {
    const selectedDataset = datasetOptions.find(option => option.value === datasetId);
    if (selectedDataset) {
      form.setFieldsValue({
        tabId: selectedDataset.tabId,
        tabName: selectedDataset.tabName,
      });
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      const createData: CatalogCreateDto = {
        modelName: values.modelName,
        modelDesc: values.modelDesc,
        datasetId: values.datasetId,
        tabId: values.tabId,
        tabName: values.tabName,
        samplingConfig: values.samplingConfig,
        trainingConfig: values.trainingConfig,
      };

      const response = await CatalogService.createCatalog(createData);
      if (response.success) {
        Message.success('创建合成目录成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '创建合成目录失败');
      }
    } catch (error) {
      console.error('创建合成目录失败:', error);
      Message.error('创建合成目录失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增合成目录"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          确定
        </Button>,
      ]}
      width={800}
      className="catalog-modal"
    >
      <Form form={form} layout="vertical" scrollToFirstError>
        {/* 基本信息 */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="modelName"
                label="模型名称"
                rules={[
                  { required: true, message: '请输入模型名称' },
                  { minLength: 2, message: '模型名称至少2个字符' },
                  { maxLength: 50, message: '模型名称最多50个字符' },
                ]}
              >
                <Input placeholder="请输入模型名称" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                field="datasetId"
                label="关联数据集"
                rules={[{ required: true, message: '请选择关联数据集' }]}
              >
                <Select
                  placeholder="请选择关联数据集"
                  loading={loadingDatasets}
                  onChange={handleDatasetChange}
                  showSearch
                  filterOption={(inputValue, option) =>
                    option?.props?.children?.toString().toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  {datasetOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
          </Row>
          <FormItem
            field="modelDesc"
            label="模型描述"
            rules={[{ maxLength: 500, message: '模型描述最多500个字符' }]}
          >
            <TextArea
              placeholder="请输入模型描述"
              rows={3}
              showWordLimit
              maxLength={500}
            />
          </FormItem>
          
          {/* 隐藏字段 */}
          <FormItem field="tabId" style={{ display: 'none' }}>
            <Input />
          </FormItem>
          <FormItem field="tabName" style={{ display: 'none' }}>
            <Input />
          </FormItem>
        </Card>

        {/* 抽样配置 */}
        <Card title="抽样配置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <FormItem
                field="samplingConfig.method"
                label="抽样方法"
                rules={[{ required: true, message: '请选择抽样方法' }]}
              >
                <Select placeholder="请选择抽样方法">
                  {samplingMethods.map(method => (
                    <Option key={method.value} value={method.value}>
                      {method.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="samplingConfig.sampleSize"
                label="样本大小"
                rules={[
                  { required: true, message: '请输入样本大小' },
                  { type: 'number', min: 100, message: '样本大小至少100' },
                  { type: 'number', max: 1000000, message: '样本大小最多1000000' },
                ]}
              >
                <InputNumber
                  placeholder="请输入样本大小"
                  min={100}
                  max={1000000}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="samplingConfig.stratifyColumn"
                label="分层字段"
                tooltip="分层抽样时使用的字段名"
              >
                <Input placeholder="请输入分层字段" />
              </FormItem>
            </Col>
          </Row>
        </Card>

        {/* 训练配置 */}
        <Card title="训练配置" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <FormItem
                field="trainingConfig.epochs"
                label="训练轮数"
                rules={[
                  { required: true, message: '请输入训练轮数' },
                  { type: 'number', min: 1, message: '训练轮数至少1' },
                  { type: 'number', max: 1000, message: '训练轮数最多1000' },
                ]}
              >
                <InputNumber
                  placeholder="请输入训练轮数"
                  min={1}
                  max={1000}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="trainingConfig.batchSize"
                label="批次大小"
                rules={[
                  { required: true, message: '请输入批次大小' },
                  { type: 'number', min: 1, message: '批次大小至少1' },
                  { type: 'number', max: 1024, message: '批次大小最多1024' },
                ]}
              >
                <InputNumber
                  placeholder="请输入批次大小"
                  min={1}
                  max={1024}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="trainingConfig.learningRate"
                label="学习率"
                rules={[
                  { required: true, message: '请输入学习率' },
                  { type: 'number', min: 0.0001, message: '学习率至少0.0001' },
                  { type: 'number', max: 1, message: '学习率最多1' },
                ]}
              >
                <InputNumber
                  placeholder="请输入学习率"
                  min={0.0001}
                  max={1}
                  step={0.001}
                  precision={4}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <FormItem
                field="trainingConfig.optimizer"
                label="优化器"
                rules={[{ required: true, message: '请选择优化器' }]}
              >
                <Select placeholder="请选择优化器">
                  {optimizers.map(optimizer => (
                    <Option key={optimizer.value} value={optimizer.value}>
                      {optimizer.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="trainingConfig.lossFunction"
                label="损失函数"
                rules={[{ required: true, message: '请选择损失函数' }]}
              >
                <Select placeholder="请选择损失函数">
                  {lossFunctions.map(lossFunction => (
                    <Option key={lossFunction.value} value={lossFunction.value}>
                      {lossFunction.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem
                field="trainingConfig.patience"
                label="早停耐心值"
                rules={[
                  { type: 'number', min: 1, message: '耐心值至少1' },
                  { type: 'number', max: 100, message: '耐心值最多100' },
                ]}
              >
                <InputNumber
                  placeholder="请输入耐心值"
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                />
              </FormItem>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="trainingConfig.earlyStopping"
                label="启用早停"
                tooltip="当验证损失不再改善时提前停止训练"
              >
                <Switch />
              </FormItem>
            </Col>
          </Row>
        </Card>
      </Form>
    </Modal>
  );
};

export default CreateCatalogModal;
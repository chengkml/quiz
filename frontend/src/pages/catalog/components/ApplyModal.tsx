import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Message,
  Grid,
  Card,
  Select,
} from '@arco-design/web-react';
import { CatalogDto } from '../../../types/catalog';
import { ApplyService } from '../../../services/applyService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

interface ApplyModalProps {
  visible: boolean;
  catalog: CatalogDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ApplyFormData {
  applyTitle: string;
  applyUser: string;
  applyDescr?: string;
  modelId: string;
  modelName?: string;
  targetType?: string;
  targetDataSource?: string;
  applyType?: string;
  cycleType?: string;
  jobCode?: string;
  teamName?: string;
  paramsConf?: Record<string, any>;
}

const ApplyModal: React.FC<ApplyModalProps> = ({
  visible,
  catalog,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 目标方式选项
  const targetTypeOptions = [
    { label: '数据库', value: 'DATABASE' },
    { label: '文件', value: 'FILE' },
    { label: 'API接口', value: 'API' },
  ];

  // 目标数据源选项
  const targetDataSourceOptions = [
    { label: 'MySQL', value: 'MYSQL' },
    { label: 'PostgreSQL', value: 'POSTGRESQL' },
    { label: 'Oracle', value: 'ORACLE' },
    { label: 'CSV文件', value: 'CSV' },
    { label: 'Excel文件', value: 'EXCEL' },
    { label: 'JSON文件', value: 'JSON' },
  ];

  // 计算资源配置选项
  const computeConfigOptions = [
    { label: 'CPU Intel Xeon Spot: 14 CPUs, 26GB', value: 'CPU_INTEL_XEON_SPOT_14_26GB' },
    { label: 'CPU Intel Xeon: 8 CPUs, 16GB', value: 'CPU_INTEL_XEON_8_16GB' },
    { label: 'CPU Intel Xeon: 16 CPUs, 32GB', value: 'CPU_INTEL_XEON_16_32GB' },
    { label: 'GPU NVIDIA Tesla V100: 4 GPUs, 64GB', value: 'GPU_NVIDIA_TESLA_V100_4_64GB' },
    { label: 'GPU NVIDIA A100: 2 GPUs, 80GB', value: 'GPU_NVIDIA_A100_2_80GB' },
  ];

  // 申请类型选项
  const applyTypeOptions = [
    { label: '一次性', value: 'once' },
    { label: '周期性', value: 'cycle' },
  ];

  // 周期类型选项
  const cycleTypeOptions = [
    { label: '按天', value: 'day' },
    { label: '按月', value: 'month' },
  ];

  // 监听申请类型变化
  const [applyType, setApplyType] = useState('once');

  // 模态框打开时初始化表单
  React.useEffect(() => {
    if (visible && catalog) {
      form.setFieldsValue({
        modelId: catalog.modelId,
        modelName: catalog.modelName,
        applyTitle: `申请使用模型：${catalog.modelName}`,
        targetType: 'DATABASE',
        targetDataSource: 'MYSQL',
        computeConfig: 'CPU_INTEL_XEON_SPOT_14_26GB',
        applyType: 'once',
        cycleType: 'day',
        generateCount: '10000',
        samplingFloatRatio: '1.2',
        multiplyFactor: '2',
        outputBatchNum: '2000',
        outputFormat: 'CSV',
      });
      setApplyType('once');
    }
  }, [visible, catalog, form]);

  // 处理申请类型变化
  const handleApplyTypeChange = (value: string) => {
    setApplyType(value);
    if (value === 'once') {
      form.setFieldValue('cycleType', undefined);
    } else {
      form.setFieldValue('cycleType', 'day');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!catalog) return;
    
    try {
      const values = await form.validate();
      setLoading(true);

      const applyData: ApplyFormData = {
        applyTitle: values.applyTitle,
        applyUser: values.applyUser,
        applyDescr: values.applyDescr,
        modelId: values.modelId,
        modelName: values.modelName,
        targetType: values.targetType,
        targetDataSource: values.targetDataSource,
        applyType: values.applyType,
        cycleType: values.cycleType,
        jobCode: values.jobCode,
        teamName: values.teamName,
        paramsConf: {
          // 可以根据需要添加更多参数配置
          generateCount: values.generateCount || 10000,
          samplingFloatRatio: values.samplingFloatRatio,
          multiplyFactor: values.multiplyFactor || 2,
          outputBatchNum: values.outputBatchNum || 2000,
          outputFormat: values.outputFormat || 'CSV',
        },
      };

      const response = await ApplyService.createApply(applyData);
      if (response.success) {
        Message.success('申请提交成功');
        onSuccess();
      } else {
        Message.error(response.message || '申请提交失败');
      }
    } catch (error) {
      console.error('申请提交失败:', error);
      Message.error('申请提交失败');
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
      title="申请使用合成模型"
      visible={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleSubmit}
        >
          提交申请
        </Button>,
      ]}
      width={800}
      className="apply-modal"
    >
      <Form form={form} layout="vertical" scrollToFirstError>
        {/* 基本信息 */}
        <Card title="申请信息" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="applyTitle"
                label="申请标题"
                rules={[
                  { required: true, message: '请输入申请标题' },
                  { minLength: 2, message: '申请标题至少2个字符' },
                  { maxLength: 100, message: '申请标题最多100个字符' },
                ]}
              >
                <Input placeholder="请输入申请标题" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                field="applyUser"
                label="申请人"
                rules={[
                  { required: true, message: '请输入申请人' },
                  { minLength: 2, message: '申请人至少2个字符' },
                  { maxLength: 50, message: '申请人最多50个字符' },
                ]}
              >
                <Input placeholder="请输入申请人" />
              </FormItem>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="applyType"
                label="申请类型"
                rules={[{ required: true, message: '请选择申请类型' }]}
              >
                <Select 
                   placeholder="请选择申请类型"
                   onChange={handleApplyTypeChange}
                 >
                   {applyTypeOptions.map(option => (
                     <Option key={option.value} value={option.value}>
                       {option.label}
                     </Option>
                   ))}
                 </Select>
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                field="cycleType"
                label="周期类型"
                rules={[
                  {
                    validator: (value, callback) => {
                      const applyType = form.getFieldValue('applyType');
                      if (applyType === 'cycle' && !value) {
                        callback('周期性申请必须选择周期类型');
                      } else {
                        callback();
                      }
                    }
                  }
                ]}
              >
                <Select 
                   placeholder="请选择周期类型"
                   disabled={applyType !== 'cycle'}
                 >
                  {cycleTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="jobCode"
                label="作业代码"
                rules={[{ maxLength: 64, message: '作业代码最多64个字符' }]}
              >
                <Input placeholder="请输入作业代码" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                field="teamName"
                label="团队名称"
                rules={[{ maxLength: 64, message: '团队名称最多64个字符' }]}
              >
                <Input placeholder="请输入团队名称" />
              </FormItem>
            </Col>
          </Row>
          <FormItem
            field="applyDescr"
            label="申请理由"
            rules={[{ maxLength: 500, message: '申请理由最多500个字符' }]}
          >
            <TextArea
              placeholder="请输入申请理由"
              rows={3}
              showWordLimit
              maxLength={500}
            />
          </FormItem>
        </Card>

        {/* 模型信息 */}
        <Card title="合成模型信息" size="small" style={{ marginBottom: 16 }}>
          <FormItem field="modelId" style={{ display: 'none' }}>
            <Input type="hidden" />
          </FormItem>
          <FormItem field="modelName" label="模型名称">
            <Input disabled />
          </FormItem>
        </Card>

        {/* 目标配置 */}
        <Card title="目标配置" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <FormItem
                field="targetType"
                label="目标方式"
                rules={[{ required: true, message: '请选择目标方式' }]}
              >
                <Select placeholder="请选择目标方式">
                  {targetTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem
                field="targetDataSource"
                label="目标数据源"
                rules={[{ required: true, message: '请选择目标数据源' }]}
              >
                <Select placeholder="请选择目标数据源">
                  {targetDataSourceOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
          </Row>
        </Card>

        {/* 参数配置 */}
        <Card title="参数配置" size="small">
          <FormItem
            field="computeConfig"
            label="计算资源配置"
            tooltip="选择计算资源配置"
            rules={[{ required: true, message: '请选择计算资源配置' }]}
          >
            <Select placeholder="请选择计算资源配置">
              {computeConfigOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            field="generateCount"
            label="生成数量"
            tooltip="需要生成的数据条数"
          >
            <Input placeholder="默认10000" defaultValue="10000" />
          </FormItem>
          <FormItem
            field="samplingFloatRatio"
            label="冗余生成比例"
            tooltip="数据冗余生成的比例"
          >
            <Input placeholder="默认1.2" defaultValue="1.2" />
          </FormItem>
          <FormItem
            field="multiplyFactor"
            label="单次生成数据量倍数"
            tooltip="模型单批次生成数据量倍数，品率问题，所以需要多生成然后选择正常的样本；训练轮数越多，良品率越高，倍数可以相对缩小"
          >
            <Input placeholder="默认2" defaultValue="2" />
          </FormItem>
          <FormItem
            field="outputBatchNum"
            label="分批预测数量"
            tooltip="分批预测，每批预测的数量；一次预测太多会导致爆内存"
          >
            <Input placeholder="默认2000" defaultValue="2000" />
          </FormItem>
          <FormItem
            field="outputFormat"
            label="文件输出格式"
            tooltip="生成数据的文件输出格式"
          >
            <Select placeholder="默认CSV" defaultValue="CSV">
              <Option value="CSV">CSV</Option>
              <Option value="JSON">JSON</Option>
              <Option value="EXCEL">Excel</Option>
            </Select>
          </FormItem>
        </Card>
      </Form>
    </Modal>
  );
};

export default ApplyModal;
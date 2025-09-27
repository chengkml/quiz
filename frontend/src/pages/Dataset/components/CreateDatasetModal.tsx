import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Space,
} from '@arco-design/web-react';
import { DatasetCreateDto } from '../../../types/dataset';
import { DatasetService } from '../../../services/datasetService';

const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

interface CreateDatasetModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateDatasetModal: React.FC<CreateDatasetModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkingDatasetId, setCheckingDatasetId] = useState(false);
  const [checkingTableName, setCheckingTableName] = useState(false);

  // 权限选项
  const permissionOptions = [
    { label: '公有', value: 'public' },
    { label: '私有', value: 'private' },
  ];

  // 检查数据集ID是否存在
  const checkDatasetId = async (datasetId: string) => {
    if (!datasetId) return;
    
    setCheckingDatasetId(true);
    try {
      const response = await DatasetService.checkDatasetId(datasetId);
      if (response.exists) {
        form.setFields([
          {
            field: 'datasetId',
            errors: ['该数据集ID已存在'],
          },
        ]);
      } else {
        form.setFields([
          {
            field: 'datasetId',
            errors: [],
          },
        ]);
      }
    } catch (error) {
      console.error('检查数据集ID失败:', error);
    } finally {
      setCheckingDatasetId(false);
    }
  };

  // 检查表名是否存在
  const checkTableName = async (tableName: string) => {
    if (!tableName) return;
    
    setCheckingTableName(true);
    try {
      const response = await DatasetService.checkTableName(tableName);
      if (response.exists) {
        form.setFields([
          {
            field: 'tableName',
            errors: ['该表名已存在'],
          },
        ]);
      } else {
        form.setFields([
          {
            field: 'tableName',
            errors: [],
          },
        ]);
      }
    } catch (error) {
      console.error('检查表名失败:', error);
    } finally {
      setCheckingTableName(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      const datasetData: DatasetCreateDto = {
        datasetId: values.datasetId,
        datasetNameEn: values.datasetNameEn,
        datasetNameCn: values.datasetNameCn,
        permission: values.permission,
        tableName: values.tableName,
        description: values.description,
      };
      
      const response = await DatasetService.createDataset(datasetData);
      if (response.success) {
        Message.success('新增数据集成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '新增数据集失败');
      }
    } catch (error) {
      console.error('新增数据集失败:', error);
      if (error.response?.data?.message) {
        Message.error(error.response.data.message);
      } else {
        Message.error('新增数据集失败');
      }
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
      title="新增数据集"
      visible={visible}
      onCancel={handleCancel}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <FormItem
          field="datasetId"
          label="数据集ID"
          rules={[
            { required: true, message: '请输入数据集ID' },
            { 
              pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, 
              message: '数据集ID必须以字母开头，只能包含字母、数字和下划线' 
            },
            { maxLength: 50, message: '数据集ID长度不能超过50个字符' },
          ]}
        >
          <Input
            placeholder="请输入数据集ID"
            onBlur={(e) => checkDatasetId(e.target.value)}
            suffix={checkingDatasetId ? '检查中...' : ''}
          />
        </FormItem>

        <FormItem
          field="datasetNameEn"
          label="数据集英文名"
          rules={[
            { required: true, message: '请输入数据集英文名' },
            { maxLength: 100, message: '数据集英文名长度不能超过100个字符' },
          ]}
        >
          <Input placeholder="请输入数据集英文名" />
        </FormItem>

        <FormItem
          field="datasetNameCn"
          label="数据集中文名"
          rules={[
            { required: true, message: '请输入数据集中文名' },
            { maxLength: 100, message: '数据集中文名长度不能超过100个字符' },
          ]}
        >
          <Input placeholder="请输入数据集中文名" />
        </FormItem>

        <FormItem
          field="permission"
          label="权限"
          rules={[
            { required: true, message: '请选择权限' },
          ]}
        >
          <Select placeholder="请选择权限">
            {permissionOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FormItem>

        <FormItem
          field="tableName"
          label="表名"
          rules={[
            { required: true, message: '请输入表名' },
            { 
              pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, 
              message: '表名必须以字母开头，只能包含字母、数字和下划线' 
            },
            { maxLength: 64, message: '表名长度不能超过64个字符' },
          ]}
        >
          <Input
            placeholder="请输入表名"
            onBlur={(e) => checkTableName(e.target.value)}
            suffix={checkingTableName ? '检查中...' : ''}
          />
        </FormItem>

        <FormItem
          field="description"
          label="描述"
          rules={[
            { maxLength: 500, message: '描述长度不能超过500个字符' },
          ]}
        >
          <TextArea
            placeholder="请输入数据集描述（可选）"
            rows={3}
            showWordLimit
            maxLength={500}
          />
        </FormItem>
      </Form>
      
      <div style={{ color: '#86909c', fontSize: '12px', marginTop: '16px' }}>
        <div>• 数据集ID和表名必须以字母开头，只能包含字母、数字和下划线</div>
        <div>• 公有数据集对所有用户可见，私有数据集仅对创建者可见</div>
        <div>• 创建后数据集ID和表名不可修改，请谨慎填写</div>
      </div>
    </Modal>
  );
};

export default CreateDatasetModal;
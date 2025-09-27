import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Space,
} from '@arco-design/web-react';
import { DatasetDto, DatasetUpdateDto } from '../../../types/dataset';
import { DatasetService } from '../../../services/datasetService';

const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

interface EditDatasetModalProps {
  visible: boolean;
  dataset: DatasetDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditDatasetModal: React.FC<EditDatasetModalProps> = ({
  visible,
  dataset,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 权限选项
  const permissionOptions = [
    { label: '公有', value: 'public' },
    { label: '私有', value: 'private' },
  ];

  // 初始化表单数据
  useEffect(() => {
    if (visible && dataset) {
      form.setFieldsValue({
        datasetNameEn: dataset.datasetNameEn,
        datasetNameCn: dataset.datasetNameCn,
        permission: dataset.permission,
        description: dataset.description || '',
      });
    }
  }, [visible, dataset, form]);

  // 提交表单
  const handleSubmit = async () => {
    if (!dataset) return;
    
    try {
      const values = await form.validate();
      setLoading(true);
      
      const updateData: DatasetUpdateDto = {
        datasetNameEn: values.datasetNameEn,
        datasetNameCn: values.datasetNameCn,
        permission: values.permission,
        description: values.description,
      };
      
      const response = await DatasetService.updateDataset(dataset.id, updateData);
      if (response.success) {
        Message.success('编辑数据集成功');
        onSuccess();
      } else {
        Message.error(response.message || '编辑数据集失败');
      }
    } catch (error) {
      console.error('编辑数据集失败:', error);
      if (error.response?.data?.message) {
        Message.error(error.response.data.message);
      } else {
        Message.error('编辑数据集失败');
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

  if (!dataset) return null;

  return (
    <Modal
      title="编辑数据集"
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
      {/* 数据集基本信息 */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f7f8fa',
        borderRadius: '4px',
        marginBottom: '16px',
        borderLeft: '3px solid #165dff'
      }}>
        <div style={{ marginBottom: '4px', color: '#4e5969' }}>
          <strong style={{ color: '#1d2129', marginRight: '8px' }}>数据集ID:</strong>
          {dataset.datasetId}
        </div>
        <div style={{ marginBottom: '4px', color: '#4e5969' }}>
          <strong style={{ color: '#1d2129', marginRight: '8px' }}>表名:</strong>
          {dataset.tableName}
        </div>
        <div style={{ marginBottom: '4px', color: '#4e5969' }}>
          <strong style={{ color: '#1d2129', marginRight: '8px' }}>创建人:</strong>
          {dataset.creator}
        </div>
        <div style={{ color: '#4e5969' }}>
          <strong style={{ color: '#1d2129', marginRight: '8px' }}>创建时间:</strong>
          {dataset.createTime ? new Date(dataset.createTime).toLocaleString() : '-'}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
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
        <div>• 数据集ID和表名创建后不可修改</div>
        <div>• 公有数据集对所有用户可见，私有数据集仅对创建者可见</div>
        <div>• 修改权限可能影响其他用户对该数据集的访问</div>
      </div>
    </Modal>
  );
};

export default EditDatasetModal;
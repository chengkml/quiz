import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Message,
  Button
} from '@arco-design/web-react';
import datasetService from '../../../services/datasetService';

const { Option } = Select;
const { TextArea } = Input;
const RadioGroup = Radio.Group;

const DatasetForm = ({ visible, dataset, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [nameValidating, setNameValidating] = useState(false);

  const isEdit = !!dataset;

  // 来源类型选项
  const sourceTypeOptions = [
    { label: '数据链接', value: 'DATA_LINK' },
    { label: '文件上传', value: 'FILE_UPLOAD' }
  ];

  // 状态选项
  const stateOptions = [
    { label: '启用', value: '1' },
    { label: '禁用', value: '0' }
  ];

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      let response;
      if (isEdit) {
        // 编辑模式
        response = await datasetService.updateDataset(dataset.datasetId, {
          ...values,
          updateUser: 'current_user' // 实际项目中应从用户上下文获取
        });
      } else {
        // 新建模式
        response = await datasetService.createDataset({
          ...values,
          createUser: 'current_user' // 实际项目中应从用户上下文获取
        });
      }

      if (response.success) {
        Message.success(isEdit ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        Message.error(response.message || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('表单提交失败:', error);
      Message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 数据集名称校验
  const validateDatasetName = async (value) => {
    if (!value || !value.trim()) {
      return Promise.reject('请输入数据集名称');
    }
    
    if (value.length > 64) {
      return Promise.reject('数据集名称长度不能超过64个字符');
    }

    // 如果是编辑模式且名称未改变，跳过唯一性校验
    if (isEdit && value === dataset?.datasetName) {
      return Promise.resolve();
    }

    setNameValidating(true);
    try {
      const response = await datasetService.checkDatasetName(
        value, 
        isEdit ? dataset.datasetId : null
      );
      
      if (response.success && response.data?.exists) {
        return Promise.reject('该数据集名称已存在，请更换');
      }
      return Promise.resolve();
    } catch (error) {
      console.error('名称校验失败:', error);
      return Promise.reject('名称校验失败，请重试');
    } finally {
      setNameValidating(false);
    }
  };

  // 描述校验
  const validateDescription = (value) => {
    if (value && value.length > 1024) {
      return Promise.reject('描述长度不能超过1024个字符');
    }
    return Promise.resolve();
  };

  // 弹窗打开时初始化表单
  useEffect(() => {
    if (visible) {
      if (isEdit && dataset) {
        // 编辑模式：填充现有数据
        form.setFieldsValue({
          datasetName: dataset.datasetName,
          sourceType: dataset.sourceType,
          descr: dataset.descr || '',
          state: dataset.state || '1'
        });
      } else {
        // 新建模式：设置默认值
        form.setFieldsValue({
          datasetName: '',
          sourceType: 'DATA_LINK',
          descr: '',
          state: '1'
        });
      }
    }
  }, [visible, isEdit, dataset, form]);

  // 弹窗关闭时重置表单
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={isEdit ? '编辑数据集' : '新建数据集'}
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
          {isEdit ? '更新' : '创建'}
        </Button>
      ]}
      width={600}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          field="datasetName"
          label="数据集名称"
          rules={[
            { required: true, message: '请输入数据集名称' },
            { validator: validateDatasetName }
          ]}
          validateTrigger="onBlur"
        >
          <Input 
            placeholder="请输入数据集名称（最多64个字符）"
            maxLength={64}
            showWordLimit
            suffix={nameValidating ? <span>校验中...</span> : null}
          />
        </Form.Item>

        <Form.Item
          field="sourceType"
          label="来源类型"
          rules={[{ required: true, message: '请选择来源类型' }]}
        >
          <RadioGroup>
            {sourceTypeOptions.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        </Form.Item>

        <Form.Item
          field="descr"
          label="描述"
          rules={[{ validator: validateDescription }]}
        >
          <TextArea
            placeholder="请输入数据集描述（最多1024个字符）"
            maxLength={1024}
            showWordLimit
            rows={4}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          field="state"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <RadioGroup>
            {stateOptions.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DatasetForm;
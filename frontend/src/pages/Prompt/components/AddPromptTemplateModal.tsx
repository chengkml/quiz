import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Message, Space, Select } from '@arco-design/web-react';
import { createPromptTemplate } from '../api';

interface AddPromptTemplateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddPromptTemplateModal: React.FC<AddPromptTemplateModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      await createPromptTemplate(values);
      Message.success('提示词模板创建成功');
      onSuccess();
    } catch (error) {
      console.error('创建提示词模板失败:', error);
      Message.error('创建提示词模板失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增提示词模板"
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
    >
      <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
        <Form
            form={form}
            layout="vertical"
        >
          <Form.Item
            field="name"
            label="模板名称"
            rules={[
              { required: true, message: '请输入模板名称' },
              { max: 100, message: '模板名称不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            field="content"
            label="模板内容"
            rules={[
              { required: true, message: '请输入模板内容' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入模板内容"
              autoSize={{ minRows: 6, maxRows: 10 }}
            />
          </Form.Item>

          <Form.Item
            field="description"
            label="模板描述"
            rules={[
              { max: 500, message: '模板描述不能超过500个字符' }
            ]}
          >
            <Input.TextArea
              placeholder="请输入模板描述"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>

          <Form.Item
            field="variables"
            label="变量列表"
            description="请输入模板中使用的变量，以逗号分隔"
            rules={[
              { max: 500, message: '变量列表不能超过500个字符' }
            ]}
          >
            <Input
              placeholder="例如：question,context,options"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default AddPromptTemplateModal;
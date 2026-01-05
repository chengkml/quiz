import React, { useEffect, useState } from 'react';
import { Modal, Form, Tabs, Button, Space, Message, Spin } from '@arco-design/web-react';
import { FormFieldConfig, TabConfig } from '../types';
import { renderFormField } from '../utils';
import './modal.less';

interface AddEditModalProps {
  visible: boolean;
  isEdit?: boolean;
  record?: any;
  loading?: boolean;
  onOk?: (values: any) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  formConfig?: FormFieldConfig[];
  tabs?: TabConfig[];
  children?: React.ReactNode;
  submitLoading?: boolean;
}

/**
 * 新增/编辑模态框组件
 * 支持选项卡多步编辑
 */
const AddEditModal: React.FC<AddEditModalProps> = ({
  visible,
  isEdit = false,
  record,
  loading = false,
  onOk,
  onCancel,
  title,
  formConfig = [],
  tabs,
  children,
  submitLoading = false,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && isEdit && record) {
      // 编辑模式，填充表单
      const initialValues: any = {};
      formConfig.forEach((field) => {
        if (record[field.field] !== undefined) {
          initialValues[field.field] = record[field.field];
        }
      });
      form.setFieldsValue(initialValues);
    } else if (visible) {
      // 新增模式，重置表单
      form.resetFields();
    }
  }, [visible, isEdit, record, formConfig, form]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validate();

      if (onOk) {
        await Promise.resolve(onOk(values));
      }

      form.resetFields();
      onCancel?.();
    } catch (error: any) {
      console.error('表单验证失败:', error);
      if (error.message) {
        Message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setActiveTab('0');
    onCancel?.();
  };

  const modalTitle = title || (isEdit ? '编辑' : '新增');

  // 仅有表单字段的情况
  if (!tabs || tabs.length === 0) {
    return (
      <Modal
        visible={visible}
        title={modalTitle}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting || loading}
        maskClosable={false}
      >
        <Spin loading={loading}>
          <Form
            form={form}
            layout="vertical"
            autoComplete="off"
            className="add-edit-form"
          >
            {formConfig.map((fieldConfig) => {
              const { visible: fieldVisible = true } = fieldConfig;
              const isVisible =
                typeof fieldVisible === 'function'
                  ? fieldVisible(record || {})
                  : fieldVisible;

              if (!isVisible) return null;

              return renderFormField(fieldConfig, form);
            })}
          </Form>
          {children}
        </Spin>
      </Modal>
    );
  }

  // 选项卡模式
  const tabItems = tabs.map((tab, index) => ({
    key: String(index),
    title: tab.title,
    content: tab.content,
  }));

  return (
    <Modal
      visible={visible}
      title={modalTitle}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting || loading}
      maskClosable={false}
      style={{ maxWidth: '800px' }}
      className="add-edit-tabs-modal"
    >
      <Spin loading={loading}>
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          type="card"
          className="add-edit-tabs"
        >
          {tabItems.map((tab) => (
            <Tabs.TabPane key={tab.key} title={tab.title}>
              {tab.content}
            </Tabs.TabPane>
          ))}
        </Tabs>
        {children}
      </Spin>
    </Modal>
  );
};

export default AddEditModal;

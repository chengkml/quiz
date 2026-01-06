import React, { useEffect, useState } from "react";
import { Modal, Form, Message, Spin } from "@arco-design/web-react";
import { FormFieldConfig } from "../../types/types";
import { renderFormField } from "../../utils/utils";
import "../styles/modal.less";

interface AddEditModalProps {
  visible: boolean;
  isEdit?: boolean;
  record?: any;
  loading?: boolean;
  onOk?: (values: any) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  formConfig?: FormFieldConfig[];
  children?: React.ReactNode;
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
  children,
}) => {
  const [form] = Form.useForm();
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
      console.error("表单验证失败:", error);
      if (error.message) {
        Message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel?.();
  };

  const modalTitle = title || (isEdit ? "编辑" : "新增");

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
              typeof fieldVisible === "function"
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
};

export default AddEditModal;

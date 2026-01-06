import React from 'react';
import { Input, Select, DatePicker, InputNumber, Checkbox, Radio } from '@arco-design/web-react';
import { Form } from '@arco-design/web-react';
import { FormFieldConfig } from '../types/types';

/**
 * 为 FilterForm 渲染表单字段的工具函数
 */
export const renderFormField = (field: FormFieldConfig): React.ReactNode => {
  const { field: fieldName, label, type = 'text', placeholder, options, disabled, required, rules } = field;
  
  let fieldComponent: React.ReactNode = null;
  
  switch (type) {
    case 'input':
    case 'text':
      fieldComponent = <Input placeholder={placeholder} />;
      break;
    case 'textarea':
      fieldComponent = <Input.TextArea placeholder={placeholder} />;
      break;
    case 'select':
      fieldComponent = (
        <Select placeholder={placeholder} options={options} />
      );
      break;
    case 'number':
      fieldComponent = <InputNumber placeholder={placeholder} />;
      break;
    case 'date':
      fieldComponent = <DatePicker />;
      break;
    case 'checkbox':
      fieldComponent = <Checkbox>{label}</Checkbox>;
      break;
    case 'radio':
      fieldComponent = (
        <Radio.Group options={options} />
      );
      break;
    default:
      fieldComponent = <Input placeholder={placeholder} />;
  }

  return (
    <Form.Item
      key={fieldName}
      field={fieldName}
      label={type !== 'checkbox' ? label : undefined}
      required={required}
      rules={rules}
    >
      {fieldComponent}
    </Form.Item>
  );
};

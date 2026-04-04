import React from 'react';
import { Input, Select, DatePicker, InputNumber, Checkbox, Radio } from '@arco-design/web-react';
import { Form } from '@arco-design/web-react';
import { FormFieldConfig } from '../types/types';

/**
 * 为 FilterForm 渲染表单字段的工具函数
 * 支持搜索交互规范：Input 绑定 onPressEnter，Select 绑定 onChange
 */
export const renderFormField = (field: FormFieldConfig, formRef?: any, labelWidth?: number | string, onSearch?: () => void): React.ReactNode => {
  const {
    field: fieldName,
    label,
    type = 'text',
    placeholder,
    options,
    disabled,
    required,
    rules,
    allowClear,
    showSearch,
    mode,
  } = field;
  
  let fieldComponent: React.ReactNode = null;
  
  switch (type) {
    case 'input':
    case 'text':
      fieldComponent = (
        <Input 
          placeholder={placeholder}
          onPressEnter={() => onSearch?.()}
        />
      );
      break;
    case 'textarea':
      fieldComponent = (
        <Input.TextArea 
          placeholder={placeholder}
          onPressEnter={() => onSearch?.()}
        />
      );
      break;
    case 'select':
      fieldComponent = (
        <Select
          placeholder={placeholder}
          options={options}
          allowClear={allowClear}
          showSearch={showSearch}
          mode={mode}
          onChange={() => onSearch?.()}
        />
      );
      break;
    case 'number':
      fieldComponent = (
        <InputNumber 
          placeholder={placeholder}
          onPressEnter={() => onSearch?.()}
        />
      );
      break;
    case 'date':
      fieldComponent = <DatePicker onChange={() => onSearch?.()} />;
      break;
    case 'checkbox':
      fieldComponent = <Checkbox onChange={() => onSearch?.()}>{label}</Checkbox>;
      break;
    case 'radio':
      fieldComponent = (
        <Radio.Group options={options} onChange={() => onSearch?.()} />
      );
      break;
    default:
      fieldComponent = (
        <Input 
          placeholder={placeholder}
          onPressEnter={() => onSearch?.()}
        />
      );
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

import React, { ReactNode } from "react";
import {
  FormInstance,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Checkbox,
  Radio,
} from "@arco-design/web-react";
import { FormFieldConfig } from "../types/types";

/**
 * 渲染表单字段的工具函数
 */
import { Form } from "@arco-design/web-react";

export const renderFormField = (
  fieldConfig: FormFieldConfig,
  form?: FormInstance
): ReactNode => {
  const {
    field,
    label,
    type = "text",
    required = false,
    placeholder,
    rules = [],
    options = [],
    initialValue,
    disabled = false,
    render,
  } = fieldConfig;

  const formRules = required
    ? [{ required: true, message: `请输入${label}` }, ...rules]
    : rules;

  const formItemProps = {
    key: field,
    field: field,
    label: label,
    rules: formRules,
    initialValue: initialValue,
  };

  let fieldNode: React.ReactNode = null;

  switch (type) {
    case "input":
    case "text":
      fieldNode = React.createElement(Input, {
        placeholder: placeholder || `请输入${label}`,
        disabled: disabled,
      });
      break;

    case "textarea":
      fieldNode = React.createElement(Input.TextArea, {
        placeholder: placeholder || `请输入${label}`,
        disabled: disabled,
        rows: 4,
      });
      break;

    case "number":
      fieldNode = React.createElement(InputNumber, {
        placeholder: placeholder || `请输入${label}`,
        disabled: disabled,
      });
      break;

    case "select":
      fieldNode = React.createElement(Select, {
        placeholder: placeholder || `请选择${label}`,
        disabled: disabled,
        options: options,
      });
      break;

    case "date":
      fieldNode = React.createElement(DatePicker, {
        placeholder: placeholder || `请选择${label}`,
        disabled: disabled,
      });
      break;

    case "checkbox":
      fieldNode = React.createElement(
        Checkbox,
        { disabled: disabled },
        label
      );
      break;

    case "radio":
      fieldNode = React.createElement(Radio.Group, {
        disabled: disabled,
        options: options,
      });
      break;

    default:
      fieldNode = React.createElement(Input, {
        placeholder: placeholder || `请输入${label}`,
        disabled: disabled,
      });
  }

  if (render && form) {
    const fieldValue = form.getFieldValue(field);
    const allValues = form.getFieldsValue();
    fieldNode = render(fieldValue, allValues);
  }

  return React.createElement(
    Form.Item,
    { ...formItemProps },
    fieldNode
  );
};

/**
 * 获取表单初始值
 */
export const getFormInitialValues = (
  formConfig: FormFieldConfig[],
  record?: any
) => {
  const initialValues: any = {};

  formConfig.forEach((field) => {
    if (record && record[field.field] !== undefined) {
      initialValues[field.field] = record[field.field];
    } else if (field.initialValue !== undefined) {
      initialValues[field.field] = field.initialValue;
    }
  });

  return initialValues;
};

/**
 * 验证表单字段
 */
export const validateFormFields = async (
  form: FormInstance,
  fieldNames?: string[]
) => {
  if (fieldNames && fieldNames.length > 0) {
    return await form.validate(fieldNames);
  }
  return await form.validate();
};

/**
 * 从对象数组生成Select选项
 */
export const generateSelectOptions = (
  data: any[],
  labelField: string = "label",
  valueField: string = "value"
) => {
  return data.map((item) => ({
    label: item[labelField],
    value: item[valueField],
  }));
};

/**
 * 数据分页处理
 */
export const paginateData = (
  data: any[],
  current: number,
  pageSize: number
): any[] => {
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  return data.slice(start, end);
};

/**
 * 格式化日期
 */
export const formatDate = (
  date: any,
  format: string = "YYYY-MM-DD HH:mm:ss"
): string => {
  if (!date) return "--";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "--";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
};

/**
 * 相对时间格式化（如 "2小时前"）
 */
export const formatRelativeTime = (date: any): string => {
  if (!date) return "--";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "--";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds}秒前`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays === 1) {
    return "昨天";
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(date, "YYYY-MM-DD");
  }
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
) => {
  let lastCallTime = 0;

  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      fn(...args);
    }
  }) as T;
};

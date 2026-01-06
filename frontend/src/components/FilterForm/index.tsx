import React, { useCallback, useEffect, useRef, useState } from 'react';
import {Button, Grid, Typography, Tag, Form} from '@arco-design/web-react';
import { findDOMNode } from 'react-dom';
import { contains, off, on } from '@arco-design/web-react/es/_util/dom';
import './style/index.less';
import { IconDown, IconUp } from "@arco-design/web-react/icon";
import { FormFieldConfig } from '../types/types';
import { renderFormField } from '../utils/utils';

const Row = Grid.Row;
const Col = Grid.Col;

interface FilterItem {
  field: string;
  value: any;
  valueLabel: string | React.ReactNode;
  label: string;
}

interface FilterFormProps {
  children: React.ReactNode;
  initialValues?: Record<string, any>;
  onValuesChange?: (changeValue: any, values: any) => void;
  onSearch?: (values: any) => void;
  onReset?: () => void;
  min?: number;
  className?: string;
  style?: React.CSSProperties;
  showButtonText?: boolean;
  fieldLabelMap?: Record<string, string>;
  formFields?: FormFieldConfig[];
}

/**
 * 抽象的筛选表单组件 (Functional Component)
 * - 默认单行展示筛选项目，超出部分隐藏
 * - 支持展开/收起更多筛选项
 * - 显示已选条件标签
 * - 支持删除单个筛选条件
 */
const FilterForm = React.forwardRef<any, FilterFormProps>((props, ref) => {
  const {
    children,
    initialValues = {},
    onValuesChange,
    onSearch,
    onReset,
    min = 3,
    className,
    style,
    fieldLabelMap = {},
    formFields = [],
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [valueList, setValueList] = useState<FilterItem[]>([]);
  const [values, setValues] = useState(initialValues);
  
  const formRef = useRef<any>(null);
  const triggerRef = useRef<any>(null);
  const valuesRef = useRef(initialValues);

  // 更新已选条件标签
  const updateValueList = useCallback((currentValues: Record<string, any>) => {
    const newValueList: FilterItem[] = [];
    for (let key in currentValues) {
      const value = currentValues[key];
      if (value !== undefined && value !== null && value !== '') {
        const label = fieldLabelMap[key] || key;
        // 处理数组、对象等复杂值
        const valueLabel = Array.isArray(value)
          ? value.join(', ')
          : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
        
        newValueList.push({
          field: key,
          value,
          valueLabel,
          label,
        });
      }
    }
    setValueList(newValueList);
  }, [fieldLabelMap]);

  // 表单值变化回调
  const handleValuesChange = useCallback((changeValue: any, currentValues: any) => {
    updateValueList(currentValues);
    setValues(currentValues);
    valuesRef.current = currentValues;
    
    if (onValuesChange) {
      setTimeout(() => {
        onValuesChange(changeValue, currentValues);
      }, 0);
    }
  }, [onValuesChange, updateValueList]);

  // 获取当前筛选条件
  const getFilterValues = useCallback(() => {
    return { ...valuesRef.current };
  }, []);

  // 重置表单
  const handleResetForm = useCallback(() => {
    if (formRef.current) {
      formRef.current.resetFields();
    }
    valuesRef.current = { ...initialValues };
    setValues({ ...initialValues });
    updateValueList({ ...initialValues });
    
    if (onReset) {
      onReset();
    }
  }, [initialValues, onReset, updateValueList]);

  // 展开/收起更多筛选项
  const handleToggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // 删除单个筛选条件
  const handleRemoveFilter = useCallback((field: string) => {
    const newValues = { ...valuesRef.current };
    delete newValues[field];
    valuesRef.current = newValues;
    setValues(newValues);
    updateValueList(newValues);
  }, [updateValueList]);

  // 查询按钮
  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(getFilterValues());
    }
  }, [onSearch, getFilterValues]);

  // 点击组件外部时收起更多筛选项
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!expanded) return;
      
      const triggerNode = findDOMNode(triggerRef.current);
      if (triggerNode && !contains(triggerNode as Element, e.target as Element)) {
        setExpanded(false);
      }
    };

    on(window.document, 'mousedown', handleClickOutside);
    return () => {
      off(window.document, 'mousedown', handleClickOutside);
    };
  }, [expanded]);

  // 初始化已选条件
  useEffect(() => {
    updateValueList(initialValues);
  }, [initialValues, updateValueList]);

  // 暴露公共方法
  React.useImperativeHandle(ref, () => ({
    getFilterValues,
    resetForm: handleResetForm,
    setFieldsValue: (fieldsValue: Record<string, any>) => {
      if (formRef.current) {
        formRef.current.setFieldsValue(fieldsValue);
        handleValuesChange({}, { ...valuesRef.current, ...fieldsValue });
      }
    },
  }), [getFilterValues, handleResetForm, handleValuesChange]);

  // 获取要渲染的字段
  const fieldsToRender = formFields.length > 0 ? formFields : [];
  const childrenArray = formFields.length === 0 ? React.Children.toArray(children) : [];
  const totalFields = formFields.length > 0 ? formFields.length : childrenArray.length;
  const isFull = totalFields <= min;

  // 按钮组宽度计算
  let operFlexWidth = 0;
  if (totalFields > min) {
    operFlexWidth = expanded ? 220 : 186;
  } else {
    operFlexWidth = 138;
  }
  const resultOperFlexWidth = 238;

  return (
    <div
      className={[className, 'smart-filter-form', expanded ? 'expanded' : '', isFull ? 'full' : ''].join(' ')}
      style={style}
      ref={triggerRef}
    >
      <div className="smart-filter-form-content">
        <Row style={{ flexFlow: 'nowrap', alignItems: 'flex-start' }}>
          {/* 自定义表单区域 */}
          <Col flex="auto" style={{ width: '100%', minWidth: 0 }}>
            <Form
              ref={formRef}
              initialValues={initialValues}
              onValuesChange={handleValuesChange}
              className="filter-form-fields"
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]} style={{ width: '100%' }}>
                  {(!expanded
                    ? fieldsToRender.slice(0, min)
                    : fieldsToRender
                  ).map(field => (
                    <Col key={field.field} span={field.span || 8} style={{ width: 'auto' }}>
                      {renderFormField(field)}
                    </Col>
                  ))}
                </Row>
            </Form>
          </Col>

          {/* 按钮组 */}
          <Col className="filter-oper-group" flex={`${operFlexWidth}px`} style={{ marginLeft: '12px', flexShrink: 0 }}>
            {/* 重置按钮 */}
            <Button
              className="filter-btn reset-btn"
              onClick={handleResetForm}
              size="small"
            >
              重置
            </Button>

            {/* 查询按钮 */}
            <Button
              className="filter-btn search-btn"
              type="primary"
              onClick={handleSearch}
              size="small"
            >
              查询
            </Button>

            {/* 更多筛选按钮 */}
            {!isFull && !expanded && (
              <Button
                className="filter-btn more-btn"
                icon={<IconDown />}
                onClick={handleToggleExpand}
                size="small"
              >
                更多
              </Button>
            )}

            {/* 收起按钮 */}
            {expanded && (
              <Button
                className="filter-btn collapse-btn"
                icon={<IconUp />}
                onClick={handleToggleExpand}
                size="small"
              >
                收起
              </Button>
            )}
          </Col>
        </Row>

        {/* 已选筛选条件标签 */}
        {(isFull || valueList.length > 0) && (
          <div
            className="filter-tags-section"
            style={{
              width: expanded ? `calc(100% - ${resultOperFlexWidth}px)` : '100%',
            }}
          >
            <span className="filter-tags-label">已选条件:</span>
            <div className="filter-tags-list">
              {valueList.map(item => (
                <Tag
                  key={item.field}
                  visible
                  size="small"
                  closable
                  color="arcoblue"
                  onClose={() => handleRemoveFilter(item.field)}
                  className="filter-tag"
                >
                  <span className="filter-tag-content">
                    <span className="filter-tag-label">{item.label}:</span>
                    <Typography.Text
                      className="filter-tag-value"
                      ellipsis={{ cssEllipsis: true, rows: 1, showTooltip: true }}
                    >
                      {item.valueLabel}
                    </Typography.Text>
                  </span>
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FilterForm.displayName = 'FilterForm';

export default FilterForm;

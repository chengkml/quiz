import React, { useEffect } from 'react';
import { Modal, Tabs, Spin, Divider, Row, Col, Descriptions, Tag, Avatar, Empty } from '@arco-design/web-react';
import { DetailFieldConfig, TabConfig } from '../types';
import './modal.less';

interface DetailModalProps {
  visible: boolean;
  record?: any;
  loading?: boolean;
  onCancel?: () => void;
  title?: string;
  detailFields?: DetailFieldConfig[];
  tabs?: TabConfig[];
  children?: React.ReactNode;
}

/**
 * 详情查看模态框组件
 * 支持选项卡展示详情信息
 */
const DetailModal: React.FC<DetailModalProps> = ({
  visible,
  record,
  loading = false,
  onCancel,
  title,
  detailFields = [],
  tabs,
  children,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>('0');

  useEffect(() => {
    if (visible) {
      setActiveTab('0');
    }
  }, [visible]);

  const renderFieldValue = (field: DetailFieldConfig): React.ReactNode => {
    if (!record) return '--';

    const value = record[field.dataIndex];

    if (field.render) {
      return field.render(value, record);
    }

    switch (field.type) {
      case 'tag':
        return value ? <Tag>{value}</Tag> : '--';
      case 'avatar':
        return value ? <Avatar size={32}>{value}</Avatar> : '--';
      case 'image':
        return value ? (
          <img
            src={value}
            alt={field.label}
            style={{ maxWidth: '200px', maxHeight: '200px' }}
          />
        ) : (
          '--'
        );
      case 'link':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          '--'
        );
      default:
        return value || '--';
    }
  };

  // 仅有字段的情况
  if (!tabs || tabs.length === 0) {
    return (
      <Modal
        visible={visible}
        title={title || '详情'}
        onCancel={onCancel}
        footer={null}
        maskClosable={true}
      >
        <Spin loading={loading}>
          {record && detailFields.length > 0 ? (
            <Descriptions
              data={detailFields.map((field) => ({
                label: field.label,
                value: renderFieldValue(field),
              }))}
              column={2}
              layout="horizontal"
              style={{ marginTop: '16px' }}
            />
          ) : (
            <Empty />
          )}
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
      title={title || '详情'}
      onCancel={onCancel}
      footer={null}
      maskClosable={true}
      style={{ maxWidth: '800px' }}
      className="detail-tabs-modal"
    >
      <Spin loading={loading}>
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          type="button"
          className="detail-tabs"
        >
          {tabItems.map((tab) => (
            <Tabs.TabPane key={tab.key} title={tab.title}>
              <div style={{ marginTop: '16px' }}>{tab.content}</div>
            </Tabs.TabPane>
          ))}
        </Tabs>
        {children}
      </Spin>
    </Modal>
  );
};

export default DetailModal;

import React from 'react';
import {
  Modal,
  Button,
  Tag,
  Descriptions,
  Space,
} from '@arco-design/web-react';
import { DatasetDto } from '../../../types/dataset';

const DescriptionsItem = Descriptions.Item;

interface ViewDatasetModalProps {
  visible: boolean;
  dataset: DatasetDto | null;
  onCancel: () => void;
}

const ViewDatasetModal: React.FC<ViewDatasetModalProps> = ({
  visible,
  dataset,
  onCancel,
}) => {
  if (!dataset) return null;

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 权限标签
  const renderPermissionTag = (permission: string) => {
    const permissionText = permission === 'public' ? '公有' : '私有';
    const color = permission === 'public' ? 'blue' : 'orange';
    return (
      <Tag color={color} size="small">
        {permissionText}
      </Tag>
    );
  };

  // 状态标签
  const renderStatusTag = (status: string) => {
    const statusText = status === 'active' ? '生效' : '未生效';
    const color = status === 'active' ? 'green' : 'red';
    return (
      <Tag color={color} size="small">
        {statusText}
      </Tag>
    );
  };

  return (
    <Modal
      title="查看数据集详情"
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button type="primary" onClick={onCancel}>
            关闭
          </Button>
        </Space>
      }
      width={700}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Descriptions
          column={2}
          title="基本信息"
          data={[
            {
              label: '数据集ID',
              value: (
                <span style={{
                  fontFamily: 'Courier New, monospace',
                  backgroundColor: '#f2f3f5',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}>
                  {dataset.datasetId}
                </span>
              ),
            },
            {
              label: '状态',
              value: renderStatusTag(dataset.status),
            },
            {
              label: '数据集英文名',
              value: dataset.datasetNameEn,
            },
            {
              label: '数据集中文名',
              value: dataset.datasetNameCn,
            },
            {
              label: '权限',
              value: renderPermissionTag(dataset.permission),
            },
            {
              label: '表名',
              value: (
                <span style={{
                  fontFamily: 'Courier New, monospace',
                  backgroundColor: '#f2f3f5',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  fontSize: '12px'
                }}>
                  {dataset.tableName}
                </span>
              ),
            },
            {
              label: '创建人',
              value: dataset.creator,
            },
            {
              label: '创建时间',
              value: formatTime(dataset.createTime),
            },
          ]}
          style={{ marginBottom: '24px' }}
        />

        {dataset.description && (
          <Descriptions
            column={1}
            title="描述信息"
            data={[
              {
                label: '数据集描述',
                value: (
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#f7f8fa',
                    borderRadius: '4px',
                    border: '1px solid #e5e6eb',
                    lineHeight: '1.5',
                    color: '#4e5969',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {dataset.description}
                  </div>
                ),
              },
            ]}
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 权限说明 */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          border: '1px solid #bae6fd',
          marginTop: '16px'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '8px', color: '#0369a1' }}>
            权限说明
          </div>
          <div style={{ fontSize: '12px', color: '#0c4a6e', lineHeight: '1.4' }}>
            <div>• <strong>公有数据集：</strong>对所有用户可见，任何用户都可以查看和使用</div>
            <div>• <strong>私有数据集：</strong>仅对创建者可见，其他用户无法访问</div>
          </div>
        </div>

        {/* 状态说明 */}
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '4px',
          border: '1px solid #bbf7d0',
          marginTop: '12px'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '8px', color: '#15803d' }}>
            状态说明
          </div>
          <div style={{ fontSize: '12px', color: '#14532d', lineHeight: '1.4' }}>
            <div>• <strong>生效：</strong>数据集正常可用，可以进行数据操作</div>
            <div>• <strong>未生效：</strong>数据集暂时不可用，可能正在维护或配置中</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewDatasetModal;
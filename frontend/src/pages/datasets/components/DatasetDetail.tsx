import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Empty
} from '@arco-design/web-react';

const DatasetDetail = ({ visible, dataset, onCancel }) => {
  if (!dataset) {
    return (
      <Modal
        title="数据集详情"
        visible={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Empty description="暂无数据" />
      </Modal>
    );
  }

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 来源类型映射
  const getSourceTypeLabel = (sourceType) => {
    const typeMap = {
      'DATA_LINK': '数据链接',
      'FILE_UPLOAD': '文件上传'
    };
    return typeMap[sourceType] || sourceType;
  };

  // 状态标签
  const getStateTag = (state) => {
    return state === '1' ? 
      <Tag color="green">启用</Tag> : 
      <Tag color="gray">禁用</Tag>;
  };

  const data = [
    {
      label: '数据集ID',
      value: dataset.datasetId || '-'
    },
    {
      label: '数据集名称',
      value: dataset.datasetName || '-'
    },
    {
      label: '来源类型',
      value: getSourceTypeLabel(dataset.sourceType)
    },
    {
      label: '状态',
      value: getStateTag(dataset.state)
    },
    {
      label: '描述',
      value: dataset.descr || '-',
      span: 2
    },
    {
      label: '创建人',
      value: dataset.createUser || '-'
    },
    {
      label: '创建时间',
      value: formatDate(dataset.createDt)
    },
    {
      label: '更新人',
      value: dataset.updateUser || '-'
    },
    {
      label: '更新时间',
      value: formatDate(dataset.updateDt)
    }
  ];

  return (
    <Modal
      title="数据集详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Descriptions
        data={data}
        column={2}
        layout="inline-horizontal"
        labelStyle={{ width: 120, fontWeight: 'bold' }}
        valueStyle={{ color: '#1d2129' }}
        style={{ marginBottom: 20 }}
      />
      
      {/* 如果有额外的配置信息，可以在这里展示 */}
      {dataset.sourceType === 'DATA_LINK' && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 16, color: '#1d2129', fontSize: 16 }}>数据链接配置</h4>
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f7f8fa', 
            borderRadius: 6,
            color: '#86909c'
          }}>
            数据链接配置信息由后端服务管理，详细配置请联系系统管理员。
          </div>
        </div>
      )}
      
      {dataset.sourceType === 'FILE_UPLOAD' && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 16, color: '#1d2129', fontSize: 16 }}>文件上传配置</h4>
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f7f8fa', 
            borderRadius: 6,
            color: '#86909c'
          }}>
            文件上传配置信息由后端服务管理，详细配置请联系系统管理员。
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DatasetDetail;
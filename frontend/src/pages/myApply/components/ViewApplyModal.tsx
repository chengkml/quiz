import React from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Space,
  Typography,
} from '@arco-design/web-react';
import { ApplyDto } from '../../../types/apply';

const { Text } = Typography;

interface ViewApplyModalProps {
  visible: boolean;
  apply: ApplyDto | null;
  onCancel: () => void;
}

const ViewApplyModal: React.FC<ViewApplyModalProps> = ({
  visible,
  apply,
  onCancel,
}) => {
  if (!apply) {
    return null;
  }

  // 渲染状态标签
  const renderStateTag = (state: string | number) => {
    let color = 'gray';
    let text = String(state);
    
    switch (Number(state)) {
      case 0:
        color = 'orange';
        text = '待处理';
        break;
      case 1:
        color = 'green';
        text = '已批准';
        break;
      case 2:
        color = 'red';
        text = '已拒绝';
        break;
      default:
        break;
    }
    
    return (
      <Tag color={color} size="small">
        {text}
      </Tag>
    );
  };

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

  // 渲染参数配置
  const renderParamsConf = (paramsConf: Record<string, any>) => {
    if (!paramsConf || Object.keys(paramsConf).length === 0) {
      return <Text type="secondary">无参数配置</Text>;
    }

    return (
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <pre style={{ 
          background: '#f7f8fa', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '12px',
          margin: 0,
          border: '1px solid #e5e6eb'
        }}>
          {JSON.stringify(paramsConf, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Modal
      title="查看申请详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ maxHeight: '80vh' }}
    >
      <Descriptions
        column={2}
        data={[
          {
            label: '申请ID',
            value: (
              <Text code style={{ fontSize: '12px' }}>
                {apply.applyId}
              </Text>
            ),
          },
          {
            label: '申请标题',
            value: apply.applyTitle || '-',
          },
          {
            label: '申请人',
            value: apply.applyUser || '-',
          },
          {
            label: '申请时间',
            value: formatTime(apply.applyTime),
          },
          {
            label: '状态',
            value: renderStateTag(apply.state),
          },
          {
            label: '状态描述',
            value: apply.stateDesc || '-',
          },
          {
            label: '模型ID',
            value: (
              <Text code style={{ fontSize: '12px' }}>
                {apply.modelId || '-'}
              </Text>
            ),
          },
          {
            label: '模型名称',
            value: apply.modelName || '-',
          },
          {
            label: '目标方式',
            value: apply.targetType || '-',
          },
          {
            label: '目标数据源',
            value: (
              <Tag color="blue" size="small">
                {apply.targetDataSource || '-'}
              </Tag>
            ),
          },
          {
            label: '申请类型',
            value: apply.applyType ? (
              <Tag color={apply.applyType === 'once' ? 'blue' : 'green'} size="small">
                {apply.applyType === 'once' ? '一次性' : '周期性'}
              </Tag>
            ) : '-',
          },
          {
            label: '周期类型',
            value: (apply.cycleType && apply.applyType === 'cycle') ? (
              <Tag color={apply.cycleType === 'day' ? 'orange' : 'purple'} size="small">
                {apply.cycleType === 'day' ? '每日' : '每月'}
              </Tag>
            ) : '-',
          },
          {
            label: '申请理由',
            value: (
              <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                {apply.applyDescr || '-'}
              </div>
            ),
            span: 2,
          },
          {
            label: '参数配置',
            value: renderParamsConf(apply.paramsConf),
            span: 2,
          },
        ]}
        style={{ marginTop: '16px' }}
        labelStyle={{ fontWeight: 600 }}
      />

      {/* 模型信息 */}
      {apply.modelInfo && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            marginBottom: '16px',
            borderBottom: '1px solid #e5e6eb',
            paddingBottom: '8px'
          }}>
            关联模型信息
          </div>
          <Descriptions
            column={2}
            data={[
              {
                label: '模型ID',
                value: (
                  <Text code style={{ fontSize: '12px' }}>
                    {apply.modelInfo.modelId}
                  </Text>
                ),
              },
              {
                label: '模型名称',
                value: apply.modelInfo.modelName || '-',
              },
              {
                label: '模型状态',
                value: apply.modelInfo.state || '-',
              },
              {
                label: '创建用户',
                value: apply.modelInfo.createUser || '-',
              },
              {
                label: '创建时间',
                value: formatTime(apply.modelInfo.createTime),
              },
              {
                label: '模型描述',
                value: (
                  <div style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                    {apply.modelInfo.modelDesc || '-'}
                  </div>
                ),
                span: 2,
              },
            ]}
            labelStyle={{ fontWeight: 600 }}
          />
        </div>
      )}

      {/* 权限信息 */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          marginBottom: '16px',
          borderBottom: '1px solid #e5e6eb',
          paddingBottom: '8px'
        }}>
          权限信息
        </div>
        <Space wrap>
          <Tag color={apply.canEdit ? 'green' : 'gray'}>
            {apply.canEdit ? '可编辑' : '不可编辑'}
          </Tag>
          <Tag color={apply.canDelete ? 'red' : 'gray'}>
            {apply.canDelete ? '可删除' : '不可删除'}
          </Tag>
          <Tag color={apply.canApprove ? 'blue' : 'gray'}>
            {apply.canApprove ? '可审批' : '不可审批'}
          </Tag>
          <Tag color={apply.canCancel ? 'orange' : 'gray'}>
            {apply.canCancel ? '可取消' : '不可取消'}
          </Tag>
        </Space>
      </div>
    </Modal>
  );
};

export default ViewApplyModal;
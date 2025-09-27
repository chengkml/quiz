import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Grid,
  Card,
  Descriptions,
  Tag,
  Table,
  Progress,
  Divider,
} from '@arco-design/web-react';
import { CatalogDto, FieldInfoDto } from '../../../types/catalog';
import { CatalogService } from '../../../services/catalogService';
import styles from '../index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const DescriptionsItem = Descriptions.Item;

interface ViewCatalogModalProps {
  visible: boolean;
  catalog: CatalogDto | null;
  onCancel: () => void;
}

const ViewCatalogModal: React.FC<ViewCatalogModalProps> = ({
  visible,
  catalog,
  onCancel,
}) => {
  const [trainingProgress, setTrainingProgress] = useState<number>(0);



  // 获取训练进度
  const fetchTrainingProgress = async () => {
    if (!catalog?.modelId || catalog.state !== 'TRAINING') return;
    
    try {
      const response = await CatalogService.getTrainingProgress(catalog.modelId);
      if (response.success) {
        setTrainingProgress(response.data.progress || 0);
      }
    } catch (error) {
      console.error('获取训练进度失败:', error);
    }
  };

  // 模态框打开时获取数据
  useEffect(() => {
    if (visible && catalog) {
      fetchTrainingProgress();
      
      // 如果正在训练，定时获取进度
      let progressInterval: NodeJS.Timeout;
      if (catalog.state === 'TRAINING') {
        progressInterval = setInterval(fetchTrainingProgress, 5000);
      }
      
      return () => {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      };
    }
  }, [visible, catalog]);

  // 渲染状态标签
  const renderStateTag = (state: string) => {
    let color = 'gray';
    let text = state;
    
    switch (state) {
      case 'TRAINING':
        color = 'blue';
        text = '训练中';
        break;
      case 'COMPLETED':
        color = 'green';
        text = '已完成';
        break;
      case 'FAILED':
        color = 'red';
        text = '失败';
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

  // 渲染字段类型标签
  const renderFieldTypeTag = (type: string) => {
    let color = 'gray';
    
    switch (type?.toUpperCase()) {
      case 'VARCHAR':
      case 'TEXT':
      case 'CHAR':
        color = 'blue';
        break;
      case 'INT':
      case 'BIGINT':
      case 'SMALLINT':
        color = 'green';
        break;
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE':
        color = 'orange';
        break;
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
        color = 'purple';
        break;
      default:
        break;
    }
    
    return (
      <Tag color={color} size="small">
        {type}
      </Tag>
    );
  };

  // 字段信息表格列定义
  const fieldColumns = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      width: 150,
      render: (fieldName: string) => (
        <span style={{ fontWeight: 500 }}>{fieldName}</span>
      ),
    },
    {
      title: '字段类型',
      dataIndex: 'fieldType',
      width: 100,
      render: (fieldType: string) => renderFieldTypeTag(fieldType),
    },
    {
      title: '是否主键',
      dataIndex: 'isPrimaryKey',
      width: 80,
      align: 'center' as const,
      render: (isPrimaryKey: boolean) => (
        <Tag color={isPrimaryKey ? 'red' : 'gray'} size="small">
          {isPrimaryKey ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '是否可空',
      dataIndex: 'isNullable',
      width: 80,
      align: 'center' as const,
      render: (isNullable: boolean) => (
        <Tag color={isNullable ? 'orange' : 'green'} size="small">
          {isNullable ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '默认值',
      dataIndex: 'defaultValue',
      width: 120,
      render: (defaultValue: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {defaultValue || '-'}
        </span>
      ),
    },
    {
      title: '字段注释',
      dataIndex: 'fieldComment',
      render: (fieldComment: string) => fieldComment || '-',
    },
  ];



  if (!catalog) {
    return null;
  }

  return (
    <Modal
      title="查看合成目录"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" type="primary" onClick={onCancel}>
          关闭
        </Button>,
      ]}
      width={1000}
      className="catalog-modal"
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* 基本信息 */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
          <Descriptions
            column={2}
            data={[
              {
                label: '模型名称',
                value: catalog.modelName,
              },
              {
                label: '关联表名',
                value: catalog.tabName || '-',
              },
              {
                label: '创建人',
                value: catalog.createUser,
              },
              {
                label: '创建时间',
                value: catalog.createTime ? new Date(catalog.createTime).toLocaleString() : '-',
              },
            ]}
          />
          
          {catalog.modelDesc && (
            <>
              <Divider style={{ margin: '16px 0' }} />
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>模型描述：</div>
                <div style={{ color: '#4e5969', lineHeight: 1.6 }}>
                  {catalog.modelDesc}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* 训练进度 */}
        {catalog.state === 'TRAINING' && (
          <Card title="训练进度" size="small" style={{ marginBottom: 16 }}>
            <div className={styles.progressWrapper}>
              <Progress
                percent={trainingProgress}
                status={trainingProgress === 100 ? 'success' : 'normal'}
                showText
                style={{ flex: 1 }}
              />
              <span className={styles.progressText}>
                {trainingProgress.toFixed(1)}%
              </span>
            </div>
          </Card>
        )}

        {/* 数据抽样 */}
        <Card title="数据抽样" size="small" style={{ marginBottom: 16 }}>
          <Descriptions
            column={2}
            data={[
              {
                label: '抽样方法',
                value: catalog.samplingConfig?.method === 'RANDOM' ? '随机抽样' :
                       catalog.samplingConfig?.method === 'STRATIFIED' ? '分层抽样' :
                       catalog.samplingConfig?.method === 'SYSTEMATIC' ? '系统抽样' :
                       catalog.samplingConfig?.method || '-',
              },
              {
                label: '样本大小',
                value: catalog.samplingConfig?.sampleSize?.toLocaleString() || '-',
              },
              {
                label: '分层字段',
                value: catalog.samplingConfig?.stratifyColumn || '-',
              },
            ]}
          />
        </Card>

        {/* 模型训练 */}
        <Card title="模型训练" size="small" style={{ marginBottom: 16 }}>
          <Descriptions
            column={2}
            data={[
              {
                label: '训练轮数',
                value: catalog.trainingConfig?.epochs || '-',
              },
              {
                label: '批次大小',
                value: catalog.trainingConfig?.batchSize || '-',
              },
              {
                label: '学习率',
                value: catalog.trainingConfig?.learningRate || '-',
              },
              {
                label: '优化器',
                value: catalog.trainingConfig?.optimizer || '-',
              },
              {
                label: '损失函数',
                value: catalog.trainingConfig?.lossFunction || '-',
              },
              {
                label: '早停耐心值',
                value: catalog.trainingConfig?.patience || '-',
              },
              {
                label: '启用早停',
                value: catalog.trainingConfig?.earlyStopping ? '是' : '否',
              },
            ]}
          />
        </Card>

        {/* 字段信息 */}
        {catalog.fieldInfos && catalog.fieldInfos.length > 0 && (
          <Card title="字段信息" size="small" style={{ marginBottom: 16 }}>
            <Table
              columns={fieldColumns}
              data={catalog.fieldInfos}
              pagination={false}
              size="small"
              rowKey="fieldName"
              scroll={{ x: 600 }}
            />
          </Card>
        )}


      </div>
    </Modal>
  );
};

export default ViewCatalogModal;
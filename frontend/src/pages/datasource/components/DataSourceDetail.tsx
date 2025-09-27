import React, { useState } from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Card,
  Typography,
  Grid
} from '@arco-design/web-react';
import { IconEye, IconEyeInvisible, IconRefresh } from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import {
  DataSourceDto,
  DataSourceType,
  DataSourceState
} from '../../../types/datasource';
import { DataSourceService, handleApiError } from '../../../services/datasourceService';

const Row = Grid.Row;
const Col = Grid.Col;
const { Text } = Typography;

interface DataSourceDetailProps {
  dataSource: DataSourceDto | null;
  onClose: () => void;
}

const DataSourceDetail: React.FC<DataSourceDetailProps> = ({
  dataSource,
  onClose
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testing, setTesting] = useState(false);

  if (!dataSource) {
    return <div>数据源信息不存在</div>;
  }

  // 测试连接
  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await DataSourceService.testConnectionById(dataSource.dsId);
      if (response.success) {
        if (response.data) {
          Message.success('连接测试成功');
        } else {
          Message.error('连接测试失败');
        }
      } else {
        Message.error(response.message || '连接测试失败');
      }
    } catch (error) {
      Message.error(handleApiError(error));
    } finally {
      setTesting(false);
    }
  };

  // 获取状态标签
  const getStateTag = () => {
    if (dataSource.state === DataSourceState.DISABLED) {
      return <Tag color="gray">禁用</Tag>;
    }
    if (dataSource.lastTestResult === true) {
      return <Tag color="green">正常</Tag>;
    }
    if (dataSource.lastTestResult === false) {
      return <Tag color="red">连接失败</Tag>;
    }
    return <Tag color="blue">未测试</Tag>;
  };

  // 格式化时间
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString();
  };

  // 渲染敏感信息
  const renderSensitiveField = (value?: string, show: boolean, toggle: () => void) => {
    if (!value) return '-';
    return (
      <Space>
        <Text>{show ? value : '••••••••••••'}</Text>
        <Button
          type="text"
          size="small"
          icon={show ? <IconEyeInvisible /> : <IconEye />}
          onClick={toggle}
        />
      </Space>
    );
  };

  // 渲染连接参数
  const renderConnectionParams = () => {
    if (!dataSource.connectionParams) return '-';
    try {
      const params = JSON.parse(dataSource.connectionParams);
      return (
        <pre style={{ 
          background: '#f7f8fa', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '12px',
          margin: 0
        }}>
          {JSON.stringify(params, null, 2)}
        </pre>
      );
    } catch {
      return dataSource.connectionParams;
    }
  };

  // 基础信息描述项
  const basicItems = [
    {
      label: '数据源ID',
      value: dataSource.dsId
    },
    {
      label: '数据源名称',
      value: dataSource.dsName
    },
    {
      label: '数据源类型',
      value: <Tag color="blue">{dataSource.dsType}</Tag>
    },
    {
      label: '状态',
      value: getStateTag()
    },
    {
      label: '描述',
      value: dataSource.dsDesc || '-'
    },
    {
      label: '创建人',
      value: dataSource.creator || '-'
    },
    {
      label: '创建时间',
      value: formatTime(dataSource.createTime)
    },
    {
      label: '更新时间',
      value: formatTime(dataSource.updateTime)
    }
  ];

  // 连接配置描述项
  const getConnectionItems = () => {
    const items = [];
    
    // 数据库类型配置
    if ([DataSourceType.MYSQL, DataSourceType.ORACLE, DataSourceType.MONGODB, DataSourceType.POSTGRESQL].includes(dataSource.dsType)) {
      items.push(
        {
          label: '主机地址',
          value: dataSource.host || '-'
        },
        {
          label: '端口',
          value: dataSource.port || '-'
        },
        {
          label: '数据库名',
          value: dataSource.databaseName || '-'
        }
      );
      
      if (dataSource.schemaName) {
        items.push({
          label: 'Schema名',
          value: dataSource.schemaName
        });
      }
      
      items.push(
        {
          label: '用户名',
          value: dataSource.username
        },
        {
          label: '密码',
          value: renderSensitiveField(dataSource.password, showPassword, () => setShowPassword(!showPassword))
        }
      );
    }
    
    // S3配置
    if (dataSource.dsType === DataSourceType.S3) {
      items.push(
        {
          label: '访问密钥',
          value: dataSource.accessKey || '-'
        },
        {
          label: '密钥',
          value: renderSensitiveField(dataSource.secretKey, showSecretKey, () => setShowSecretKey(!showSecretKey))
        },
        {
          label: '存储桶',
          value: dataSource.bucketName || '-'
        },
        {
          label: '区域',
          value: dataSource.region || '-'
        }
      );
    }
    
    // FTP/SFTP配置
    if ([DataSourceType.FTP, DataSourceType.SFTP].includes(dataSource.dsType)) {
      items.push(
        {
          label: '主机地址',
          value: dataSource.host || '-'
        },
        {
          label: '端口',
          value: dataSource.port || '-'
        },
        {
          label: '用户名',
          value: dataSource.username
        },
        {
          label: '密码',
          value: renderSensitiveField(dataSource.password, showPassword, () => setShowPassword(!showPassword))
        }
      );
      
      if (dataSource.accessKey) {
        items.push({
          label: '访问密钥',
          value: dataSource.accessKey
        });
      }
    }
    
    return items;
  };

  // 高级配置描述项
  const advancedItems = [
    {
      label: '连接URL',
      value: dataSource.url || '-'
    },
    {
      label: '连接参数',
      value: renderConnectionParams()
    },
    {
      label: '版本号',
      value: dataSource.version
    }
  ];

  // 测试信息描述项
  const testItems = [
    {
      label: '最后测试时间',
      value: formatTime(dataSource.lastTestTime)
    },
    {
      label: '测试结果',
      value: dataSource.lastTestResult === true ? (
        <Tag color="green">成功</Tag>
      ) : dataSource.lastTestResult === false ? (
        <Tag color="red">失败</Tag>
      ) : (
        <Tag color="gray">未测试</Tag>
      )
    }
  ];

  return (
    <div>
      {/* 基础信息 */}
      <Card title="基础信息" style={{ marginBottom: 16 }}>
        <Descriptions
          data={basicItems}
          column={2}
          labelStyle={{ width: 120 }}
        />
      </Card>

      {/* 连接配置 */}
      <Card title="连接配置" style={{ marginBottom: 16 }}>
        <Descriptions
          data={getConnectionItems()}
          column={2}
          labelStyle={{ width: 120 }}
        />
      </Card>

      {/* 高级配置 */}
      <Card title="高级配置" style={{ marginBottom: 16 }}>
        <Descriptions
          data={advancedItems}
          column={1}
          labelStyle={{ width: 120 }}
        />
      </Card>

      {/* 测试信息 */}
      <Card 
        title="测试信息" 
        style={{ marginBottom: 16 }}
        extra={
          <Button
            type="primary"
            size="small"
            icon={<IconRefresh />}
            loading={testing}
            onClick={handleTestConnection}
          >
            重新测试
          </Button>
        }
      >
        <Descriptions
          data={testItems}
          column={2}
          labelStyle={{ width: 120 }}
        />
      </Card>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Button type="primary" onClick={onClose}>
          关闭
        </Button>
      </div>
    </div>
  );
};

export default DataSourceDetail;
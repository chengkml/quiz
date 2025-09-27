import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  Collapse,
  Switch,
  Grid
} from '@arco-design/web-react';
import { IconEye, IconEyeInvisible } from '@arco-design/web-react/icon';
import { Message } from '@arco-design/web-react';
import {
  DataSourceDto,
  DataSourceCreateDto,
  DataSourceUpdateDto,
  DataSourceType,
  ModalType,
  TestConnectionStatus,
  FieldGroupConfig
} from '../../../types/datasource';
import { DataSourceService, handleApiError, debounce } from '../../../services/datasourceService';

const Row = Grid.Row;
const Col = Grid.Col;
const Option = Select.Option;
const TextArea = Input.TextArea;
const FormItem = Form.Item;
const Panel = Collapse.Item;

interface DataSourceFormProps {
  type: ModalType;
  dataSource?: DataSourceDto | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// 数据源类型选项
const DATA_SOURCE_TYPE_OPTIONS = [
  { label: 'MySQL', value: DataSourceType.MYSQL },
  { label: 'Oracle', value: DataSourceType.ORACLE },
  { label: 'MongoDB', value: DataSourceType.MONGODB },
  { label: 'PostgreSQL', value: DataSourceType.POSTGRESQL },
  { label: 'S3', value: DataSourceType.S3 },
  { label: 'FTP', value: DataSourceType.FTP },
  { label: 'SFTP', value: DataSourceType.SFTP }
];

// 字段分组配置
const FIELD_GROUPS: FieldGroupConfig = {
  [DataSourceType.MYSQL]: ['host', 'port', 'databaseName', 'username', 'password'],
  [DataSourceType.ORACLE]: ['host', 'port', 'databaseName', 'schemaName', 'username', 'password'],
  [DataSourceType.MONGODB]: ['host', 'port', 'databaseName', 'username', 'password'],
  [DataSourceType.POSTGRESQL]: ['host', 'port', 'databaseName', 'schemaName', 'username', 'password'],
  [DataSourceType.S3]: ['accessKey', 'secretKey', 'bucketName', 'region'],
  [DataSourceType.FTP]: ['host', 'port', 'username', 'password', 'accessKey'],
  [DataSourceType.SFTP]: ['host', 'port', 'username', 'password']
};

// 默认端口配置
const DEFAULT_PORTS: Record<DataSourceType, number> = {
  [DataSourceType.MYSQL]: 3306,
  [DataSourceType.ORACLE]: 1521,
  [DataSourceType.MONGODB]: 27017,
  [DataSourceType.POSTGRESQL]: 5432,
  [DataSourceType.S3]: 443,
  [DataSourceType.FTP]: 21,
  [DataSourceType.SFTP]: 22
};

const DataSourceForm: React.FC<DataSourceFormProps> = ({
  type,
  dataSource,
  onSuccess,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<TestConnectionStatus>(TestConnectionStatus.IDLE);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [selectedType, setSelectedType] = useState<DataSourceType | undefined>();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (type === ModalType.EDIT && dataSource) {
      form.setFieldsValue({
        dsName: dataSource.dsName,
        dsType: dataSource.dsType,
        dsDesc: dataSource.dsDesc,
        host: dataSource.host,
        port: dataSource.port,
        databaseName: dataSource.databaseName,
        schemaName: dataSource.schemaName,
        url: dataSource.url,
        username: dataSource.username,
        password: dataSource.password,
        accessKey: dataSource.accessKey,
        secretKey: dataSource.secretKey,
        bucketName: dataSource.bucketName,
        region: dataSource.region,
        connectionParams: dataSource.connectionParams
      });
      setSelectedType(dataSource.dsType);
    }
  }, [type, dataSource, form]);

  // 防抖的名称唯一性检查
  const debouncedCheckName = useCallback(
    debounce(async (name: string) => {
      if (!name || (type === ModalType.EDIT && dataSource?.dsName === name)) {
        setNameExists(false);
        return;
      }
      
      try {
        const response = await DataSourceService.checkNameExists(name);
        setNameExists(response.exists);
        if (response.exists) {
          form.setFields([{
            name: 'dsName',
            errors: ['该名称已存在，请更换']
          }]);
        }
      } catch (error) {
        console.error('名称校验失败:', error);
      }
    }, 500),
    [type, dataSource, form]
  );

  // 处理名称变化
  const handleNameChange = (value: string) => {
    debouncedCheckName(value);
  };

  // 处理类型变化
  const handleTypeChange = (value: DataSourceType) => {
    setSelectedType(value);
    // 设置默认端口
    if (DEFAULT_PORTS[value]) {
      form.setFieldValue('port', DEFAULT_PORTS[value]);
    }
    // 清空不相关字段
    const currentFields = FIELD_GROUPS[value] || [];
    const allFields = ['host', 'port', 'databaseName', 'schemaName', 'username', 'password', 'accessKey', 'secretKey', 'bucketName', 'region'];
    const fieldsToReset = allFields.filter(field => !currentFields.includes(field));
    
    const resetValues: any = {};
    fieldsToReset.forEach(field => {
      resetValues[field] = undefined;
    });
    form.setFieldsValue(resetValues);
  };

  // 测试连接
  const handleTestConnection = async () => {
    try {
      const values = await form.validate();
      setTestStatus(TestConnectionStatus.TESTING);
      
      const testData: DataSourceCreateDto = {
        dsName: values.dsName || 'temp-test',
        dsType: values.dsType,
        dsDesc: values.dsDesc,
        host: values.host,
        port: values.port,
        databaseName: values.databaseName,
        schemaName: values.schemaName,
        url: values.url,
        username: values.username,
        password: values.password,
        accessKey: values.accessKey,
        secretKey: values.secretKey,
        bucketName: values.bucketName,
        region: values.region,
        connectionParams: values.connectionParams
      };
      
      const response = await DataSourceService.testConnection(testData);
      if (response.success && response.data) {
        if (response.data.testResult === 'SUCCESS') {
          setTestStatus(TestConnectionStatus.SUCCESS);
          Message.success('连接测试成功');
        } else {
          setTestStatus(TestConnectionStatus.FAILED);
          Message.error(`连接测试失败：${response.data.errorDetail || '未知错误'}`);
        }
      } else {
        setTestStatus(TestConnectionStatus.FAILED);
        Message.error('连接测试失败');
      }
    } catch (error) {
      setTestStatus(TestConnectionStatus.FAILED);
      if (error.errors) {
        Message.warning('请先完善表单信息');
      } else {
        Message.error(handleApiError(error));
      }
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (nameExists) {
      Message.error('数据源名称已存在，请更换');
      return;
    }
    
    try {
      const values = await form.validate();
      setLoading(true);
      
      if (type === ModalType.CREATE) {
        const response = await DataSourceService.createDataSource(values);
        if (response.success) {
          Message.success('创建成功');
          onSuccess();
        } else {
          Message.error(response.message || '创建失败');
        }
      } else if (type === ModalType.EDIT && dataSource) {
        const updateData: DataSourceUpdateDto = {
          ...values,
          dsId: dataSource.dsId,
          version: dataSource.version,
          state: dataSource.state
        };
        const response = await DataSourceService.updateDataSource(dataSource.dsId, updateData);
        if (response.success) {
          Message.success('更新成功');
          onSuccess();
        } else {
          Message.error(response.message || '更新失败');
        }
      }
    } catch (error) {
      if (error.errors) {
        Message.warning('请完善表单信息');
      } else {
        Message.error(handleApiError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取测试按钮状态
  const getTestButtonProps = () => {
    switch (testStatus) {
      case TestConnectionStatus.TESTING:
        return { loading: true, children: '测试中...' };
      case TestConnectionStatus.SUCCESS:
        return { type: 'primary' as const, children: '测试成功' };
      case TestConnectionStatus.FAILED:
        return { type: 'secondary' as const, children: '测试失败' };
      default:
        return { children: '测试连接' };
    }
  };

  // 判断字段是否可见
  const isFieldVisible = (fieldName: string): boolean => {
    if (!selectedType) return false;
    const visibleFields = FIELD_GROUPS[selectedType] || [];
    return visibleFields.includes(fieldName);
  };

  // 验证JSON格式
  const validateJSON = (rule: any, value: string) => {
    if (!value) return Promise.resolve();
    try {
      JSON.parse(value);
      return Promise.resolve();
    } catch {
      return Promise.reject('请输入有效的JSON格式');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      scrollToFirstError
    >
      <Row gutter={16}>
        <Col span={12}>
          <FormItem
            label="数据源名称"
            field="dsName"
            rules={[
              { required: true, message: '请输入数据源名称' },
              { minLength: 2, message: '名称至少2个字符' },
              { maxLength: 50, message: '名称不能超过50个字符' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '名称必须以字母开头，只能包含字母、数字和下划线' }
            ]}
          >
            <Input
              placeholder="请输入数据源名称"
              onChange={handleNameChange}
              status={nameExists ? 'error' : undefined}
            />
          </FormItem>
        </Col>
        <Col span={12}>
          <FormItem
            label="数据源类型"
            field="dsType"
            rules={[{ required: true, message: '请选择数据源类型' }]}
          >
            <Select
              placeholder="请选择数据源类型"
              onChange={handleTypeChange}
            >
              {DATA_SOURCE_TYPE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </FormItem>
        </Col>
      </Row>

      <FormItem
        label="描述"
        field="dsDesc"
      >
        <TextArea
          placeholder="请输入数据源描述（可选）"
          rows={3}
          maxLength={500}
          showWordLimit
        />
      </FormItem>

      {/* 基础配置 */}
      {selectedType && (
        <div>
          <h4>连接配置</h4>
          <Row gutter={16}>
            {isFieldVisible('host') && (
              <Col span={12}>
                <FormItem
                  label="主机地址"
                  field="host"
                  rules={[{ required: true, message: '请输入主机地址' }]}
                >
                  <Input placeholder="请输入主机地址" />
                </FormItem>
              </Col>
            )}
            {isFieldVisible('port') && (
              <Col span={12}>
                <FormItem
                  label="端口"
                  field="port"
                  rules={[
                    { required: true, message: '请输入端口' },
                    { type: 'number', min: 1, max: 65535, message: '端口范围1-65535' }
                  ]}
                >
                  <InputNumber
                    placeholder="端口"
                    min={1}
                    max={65535}
                    style={{ width: '100%' }}
                  />
                </FormItem>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {isFieldVisible('databaseName') && (
              <Col span={12}>
                <FormItem
                  label="数据库名"
                  field="databaseName"
                  rules={[{ required: true, message: '请输入数据库名' }]}
                >
                  <Input placeholder="请输入数据库名" />
                </FormItem>
              </Col>
            )}
            {isFieldVisible('schemaName') && (
              <Col span={12}>
                <FormItem
                  label="Schema名"
                  field="schemaName"
                >
                  <Input placeholder="请输入Schema名（可选）" />
                </FormItem>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {isFieldVisible('username') && (
              <Col span={12}>
                <FormItem
                  label="用户名"
                  field="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" />
                </FormItem>
              </Col>
            )}
            {isFieldVisible('password') && (
              <Col span={12}>
                <FormItem
                  label="密码"
                  field="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    suffix={
                      <Button
                        type="text"
                        icon={showPassword ? <IconEyeInvisible /> : <IconEye />}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </FormItem>
              </Col>
            )}
          </Row>

          {/* S3配置 */}
          {selectedType === DataSourceType.S3 && (
            <>
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem
                    label="访问密钥"
                    field="accessKey"
                    rules={[{ required: true, message: '请输入访问密钥' }]}
                  >
                    <Input placeholder="请输入访问密钥" />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label="密钥"
                    field="secretKey"
                    rules={[{ required: true, message: '请输入密钥' }]}
                  >
                    <Input
                      type={showSecretKey ? 'text' : 'password'}
                      placeholder="请输入密钥"
                      suffix={
                        <Button
                          type="text"
                          icon={showSecretKey ? <IconEyeInvisible /> : <IconEye />}
                          onClick={() => setShowSecretKey(!showSecretKey)}
                        />
                      }
                    />
                  </FormItem>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem
                    label="存储桶"
                    field="bucketName"
                    rules={[{ required: true, message: '请输入存储桶名称' }]}
                  >
                    <Input placeholder="请输入存储桶名称" />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem
                    label="区域"
                    field="region"
                    rules={[{ required: true, message: '请输入区域' }]}
                  >
                    <Input placeholder="如：us-east-1" />
                  </FormItem>
                </Col>
              </Row>
            </>
          )}

          {/* FTP配置 */}
          {(selectedType === DataSourceType.FTP) && isFieldVisible('accessKey') && (
            <Row gutter={16}>
              <Col span={12}>
                <FormItem
                  label="访问密钥"
                  field="accessKey"
                >
                  <Input placeholder="请输入访问密钥（可选）" />
                </FormItem>
              </Col>
            </Row>
          )}
        </div>
      )}

      {/* 高级配置 */}
      <Collapse
      >
        <Panel header="高级配置" key="advanced">
          <FormItem
            label="连接URL"
            field="url"
            extra="如果填写URL，将覆盖上述主机、端口、数据库配置"
          >
            <Input placeholder="完整的连接URL（可选）" />
          </FormItem>
          <FormItem
            label="连接参数"
            field="connectionParams"
            rules={[{ validator: validateJSON }]}
            extra="JSON格式的额外连接参数"
          >
            <TextArea
              placeholder='{"charset": "utf8", "timeout": 30}'
              rows={4}
            />
          </FormItem>
        </Panel>
      </Collapse>

      {/* 操作按钮 */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button
            type="default"
            onClick={handleTestConnection}
            disabled={!selectedType}
            {...getTestButtonProps()}
          />
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            {type === ModalType.CREATE ? '创建' : '更新'}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default DataSourceForm;
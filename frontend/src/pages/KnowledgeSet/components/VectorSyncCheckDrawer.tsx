import React, { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Input,
  InputNumber,
  List,
  Message,
  Space,
  Spin,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import { vectorSyncCheck, VectorSyncCheckItem, VectorSyncIssueSample } from '../api';

type Props = {
  visible: boolean;
  knowledgeSetId?: string | null;
  onCancel: () => void;
};

const normalizeCount = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const ItemSection: React.FC<{
  title: string;
  item?: VectorSyncCheckItem;
  showTag?: 'warning' | 'error' | 'success';
}> = ({ title, item, showTag = 'warning' }) => {
  const count = normalizeCount(item?.count);
  const samples = item?.samples || [];

  return (
    <div style={{ marginBottom: 16 }}>
      <Space style={{ marginBottom: 8 }}>
        <Typography.Text bold>{title}</Typography.Text>
        <Tag color={count > 0 ? showTag : 'green'}>{count}</Tag>
      </Space>
      {count <= 0 ? (
        <Typography.Text type='secondary'>未发现异常</Typography.Text>
      ) : samples.length === 0 ? (
        <Typography.Text type='secondary'>存在异常，但当前无样本返回</Typography.Text>
      ) : (
        <List
          size='small'
          bordered
          dataSource={samples}
          render={(sample: VectorSyncIssueSample, idx) => (
            <List.Item key={`${sample.chunkId || 'c'}-${sample.vectorId || 'v'}-${idx}`}>
              <Space direction='vertical' size={2} style={{ width: '100%' }}>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  chunk={sample.chunkId || '-'} | vector={sample.vectorId || '-'}
                </Typography.Text>
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  source={sample.knowledgeSourceId || '-'} | set={sample.knowledgeSetId || '-'}
                </Typography.Text>
                {!!sample.createDate && (
                  <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                    createDate={sample.createDate}
                  </Typography.Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

const VectorSyncCheckDrawer: React.FC<Props> = ({ visible, knowledgeSetId, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [knowledgeSourceId, setKnowledgeSourceId] = useState('');
  const [sampleLimit, setSampleLimit] = useState<number>(50);
  const [result, setResult] = useState<any>(null);

  const totalIssues = useMemo(() => normalizeCount(result?.summary?.totalIssues), [result]);

  const handleRun = async () => {
    try {
      setLoading(true);
      const payload = {
        knowledgeSetId: knowledgeSetId || undefined,
        knowledgeSourceId: knowledgeSourceId?.trim() || undefined,
        sampleLimit: sampleLimit || 50,
      };
      const resp = await vectorSyncCheck(payload);
      setResult(resp.data || null);
    } catch (error: any) {
      console.error(error);
      Message.error(error?.response?.data?.message || error?.message || '同步检查失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      width={680}
      title='向量同步检查'
      visible={visible}
      onCancel={onCancel}
      footer={null}
      unmountOnClose
      maskClosable={false}
    >
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Alert
          type='info'
          showIcon
          content='用于排查知识切片与向量数据不同步问题：缺失向量、孤儿向量、来源缺失知识集等。'
        />

        <Descriptions column={1} bordered size='small'>
          <Descriptions.Item label='知识集ID'>{knowledgeSetId || '全部（全局）'}</Descriptions.Item>
        </Descriptions>

        <Space wrap>
          <Input
            style={{ width: 280 }}
            placeholder='可选：按知识来源ID过滤'
            value={knowledgeSourceId}
            onChange={setKnowledgeSourceId}
            allowClear
          />
          <InputNumber
            style={{ width: 140 }}
            min={1}
            max={200}
            value={sampleLimit}
            onChange={(v) => setSampleLimit((v as number) || 50)}
            placeholder='样本条数'
          />
          <Button type='primary' loading={loading} icon={<IconRefresh />} onClick={handleRun}>
            执行检查
          </Button>
        </Space>

        <Spin loading={loading} style={{ display: 'block' }}>
          {!result ? (
            <Empty description='请先执行检查' />
          ) : (
            <>
              <Descriptions column={3} bordered size='small' style={{ marginBottom: 12 }}>
                <Descriptions.Item label='切片总数'>{normalizeCount(result?.summary?.totalChunks)}</Descriptions.Item>
                <Descriptions.Item label='向量总数'>{normalizeCount(result?.summary?.totalVectors)}</Descriptions.Item>
                <Descriptions.Item label='异常总数'>
                  <Tag color={totalIssues > 0 ? 'red' : 'green'}>{totalIssues}</Tag>
                </Descriptions.Item>
              </Descriptions>

              <ItemSection title='1) chunkWithoutVector（有切片无向量）' item={result?.checks?.chunkWithoutVector} showTag='warning' />
              <ItemSection title='2) vectorWithoutChunk（有向量无切片）' item={result?.checks?.vectorWithoutChunk} showTag='error' />
              <ItemSection title='3) chunkWithoutSet（切片来源未绑定知识集）' item={result?.checks?.chunkWithoutSet} showTag='warning' />
              <ItemSection title='4) sourceWithoutSet（来源未绑定知识集）' item={result?.checks?.sourceWithoutSet} showTag='warning' />
            </>
          )}
        </Spin>
      </Space>
    </Drawer>
  );
};

export default VectorSyncCheckDrawer;

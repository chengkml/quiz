import React, { useState } from 'react';
import { Drawer, Form, Input, InputNumber, Radio, Button, List, Card, Typography, Spin, Tag, Empty, Divider } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import { vectorSearch } from '../api';

const FormItem = Form.Item;

interface SearchDrawerProps {
    visible: boolean;
    knowledgeSetId: string | null;
    onCancel: () => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({ visible, knowledgeSetId, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        try {
            const values = await form.validate();
            setLoading(true);
            setResults([]);
            setSearched(true);
            
            const params = {
                ...values,
                knowledgeSetId,
            };

            const response = await vectorSearch(params);
            setResults(response.data || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer
            width={600}
            title="检索测试"
            visible={visible}
            onCancel={onCancel}
            footer={null}
            unmountOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical" initialValues={{ searchType: 'VECTOR', topK: 5 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <FormItem label="检索模式" field="searchType" style={{ flex: 1 }}>
                        <Radio.Group type="button">
                            <Radio value="VECTOR">向量检索</Radio>
                            <Radio value="TEXT">全文检索</Radio>
                        </Radio.Group>
                    </FormItem>
                    <FormItem label="Top K" field="topK" style={{ width: 100 }}>
                        <InputNumber min={1} max={50} />
                    </FormItem>
                </div>
                
                <FormItem label="查询内容" field="query" rules={[{ required: true, message: '请输入查询内容' }]}>
                    <Input.Search 
                        searchButton={<Button type="primary" icon={<IconSearch />}>搜索</Button>}
                        onSearch={handleSearch} 
                        placeholder="输入关键词或问题..." 
                        style={{ width: '100%' }}
                    />
                </FormItem>
            </Form>

            <Divider orientation="left">检索结果</Divider>

            <Spin loading={loading} style={{ display: 'block', minHeight: 100 }}>
                {results.length > 0 ? (
                    <List
                        dataSource={results}
                        render={(item, index) => (
                            <List.Item key={index} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-1)' }}>
                                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        Chunk #{item.chunk?.chunkIndex} 
                                        {item.chunk?.knowledgeSourceId ? ` · Source: ${item.chunk.knowledgeSourceId.substring(0, 8)}...` : ''}
                                    </Typography.Text>
                                    <Tag size="small" color="arcoblue">
                                        Dist: {item.distance?.toFixed(4)}
                                    </Tag>
                                </div>
                                <Typography.Paragraph 
                                    ellipsis={{ rows: 3, expandable: true }}
                                    style={{ margin: 0, fontSize: 14 }}
                                >
                                    {item.chunk?.content}
                                </Typography.Paragraph>
                            </List.Item>
                        )}
                    />
                ) : searched ? (
                     <Empty description="未找到相关内容" />
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-3)', padding: 40 }}>
                        请输入内容进行检索
                    </div>
                )}
            </Spin>
        </Drawer>
    );
};

export default SearchDrawer;

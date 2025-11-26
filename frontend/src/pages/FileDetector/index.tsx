import React, { useState } from 'react';
import { Button, Form, Grid, Layout, Message, Modal, Select, Table, Upload } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import { formatFileSize } from './utils/fileTypeUtils';
import './index.less';
import { Content } from "antd/es/layout/layout";

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const FileCheck: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [fileInfos, setFileInfos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detectorType, setDetectorType] = useState<string>('tika');

    // 处理上传
    const handleCustomUpload = async (option: any) => {
        const file = option.file as File;
        setLoading(true);
        setError(null);

        // 检查文件大小
        const maxFileSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxFileSize) {
            Message.error(`文件 ${file.name} 大小超过限制（最大100MB）`);
            option.onError && option.onError(new Error('文件大小超限'));
            setLoading(false);
            return;
        }

        setFiles(prev => [...prev, file]);

        let loadingMessage: (() => void) | null = null;
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', detectorType);

            loadingMessage = Message.loading(`正在识别文件类型: ${file.name}...`, 0);

            const response = await fetch('/quiz/api/file/detector/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `服务器错误 (${response.status})`);
            }

            const data = await response.json();

            if (!data.mimeType || data.mimeType === 'unknown') {
                Message.warning(`文件 ${file.name} 识别结果可能不准确，无法确定具体的MIME类型`);
            }

            setFileInfos(prev => [...prev, data]);
            if (loadingMessage) loadingMessage();
            Message.success(`成功识别文件类型: ${file.name}`);

            // 调用上传成功回调
            option.onSuccess && option.onSuccess(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '文件类型识别失败';
            setError(errorMessage);
            if (loadingMessage) loadingMessage();
            Message.error(errorMessage);
            option.onError && option.onError(err);
            console.error('文件识别错误:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDetectorTypeChange = (value: string) => {
        if (files.length > 0 && fileInfos.length > 0) {
            Message.info('检测方式已切换，请重新上传文件以应用新的检测方式');
        }
        setDetectorType(value);
    };

    const handleDelete = (record: any) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除文件 "${record.fileName}" 的识别结果吗？`,
            onOk: () => {
                setFileInfos(prev => prev.filter(item => !(item.fileName === record.fileName && item.size === record.size && item.detectorType === record.detectorType)));
                setFiles(prev => prev.filter(file => file.name !== record.fileName || file.size !== record.size));
                Message.success(`成功删除文件: ${record.fileName}`);
            },
            onCancel: () => {
                Message.info('已取消删除操作');
            },
            okText: '确认删除',
            cancelText: '取消',
            okType: 'danger'
        });
    };

    const handleReset = () => {
        setFiles([]);
        setFileInfos([]);
        setError(null);
        Message.info('已重置，请上传新文件');
    };

    const columns = [
        { title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: true },
        { title: '文件大小', dataIndex: 'size', key: 'size', render: (text: number) => formatFileSize(text) },
        { title: '文件扩展名', dataIndex: 'extension', key: 'extension', render: (text: string) => text || '无扩展名' },
        { title: 'MIME类型', dataIndex: 'mimeType', key: 'mimeType', render: (text: string) => text || 'unknown' },
        { title: '检测方式', dataIndex: 'detectorType', key: 'detectorType', render: (text: string) => text === 'tika' ? 'Apache Tika' : 'Magic Number' },
        {
            title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
                <Button type="text" danger icon={<IconDelete />} onClick={() => handleDelete(record)}>删除</Button>
            )
        },
    ];

    const getUniqueKey = (record: any, index: number) => `${record.fileName}-${index}-${record.size}`;

    return (
        <div className="file-check-container">
            <Layout>
                <Content>
                    <Row style={{ height: '100%' }}>
                        <Col span={8}>
                            <div style={{ padding: '0 20px' }}>
                                <Form autoComplete='off'>
                                    <FormItem label="检测方式">
                                        <Select
                                            value={detectorType}
                                            onChange={handleDetectorTypeChange}
                                            options={[
                                                { label: 'Apache Tika', value: 'tika' },
                                                { label: 'Magic Number', value: 'magic' }
                                            ]}
                                        />
                                    </FormItem>
                                    <FormItem label="文件上传" extra="支持单个或多个文件上传，文件最大100MB">
                                        <Upload
                                            drag
                                            multiple
                                            accept=".pdf,.txt,.doc,.docx,.jpg,.png"
                                            showUploadList={true}
                                            customRequest={handleCustomUpload}
                                        />
                                    </FormItem>
                                    <Button onClick={handleReset} type="primary" style={{ marginTop: 10 }}>重置</Button>
                                </Form>
                            </div>
                        </Col>
                        <Col span={16}>
                            <Table
                                columns={columns}
                                data={fileInfos}
                                rowKey={getUniqueKey}
                                style={{ marginTop: 20, flex: 1 }}
                                pagination={{ pageSize: 10 }}
                            />
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </div>
    );
};

export default FileCheck;

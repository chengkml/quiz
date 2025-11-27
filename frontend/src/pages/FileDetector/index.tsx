import React, {useEffect, useState} from 'react';
import {Button, Form, Grid, Layout, Message, Select, Table, Upload} from '@arco-design/web-react';
import {IconDelete} from '@arco-design/web-react/icon';
import './index.less';
import { formatFileSize } from './utils/fileTypeUtils';
import {Content} from "antd/es/layout/layout";

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

const FileCheck: React.FC = () => {
    const [tableScrollHeight, setTableScrollHeight] = useState(420);
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

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', detectorType);

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

            // 调用上传成功回调
            option.onSuccess && option.onSuccess(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '文件类型识别失败';
            setError(errorMessage);
            Message.error(errorMessage);
            option.onError && option.onError(err);
            console.error('文件识别错误:', err);
        } finally {
            setLoading(false);
        }
    };

    // 初始化与高度自适应
    useEffect(() => {
        const calculateTableHeight = () => {
            const windowHeight = window.innerHeight;
            const otherElementsHeight = 220;
            const newHeight = Math.max(200, windowHeight - otherElementsHeight);
            setTableScrollHeight(newHeight);
        };
        calculateTableHeight();
        const handleResize = () => calculateTableHeight();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDetectorTypeChange = (value: string) => {
        if (files.length > 0 && fileInfos.length > 0) {
            Message.info('检测方式已切换，请重新上传文件以应用新的检测方式');
        }
        setDetectorType(value);
    };

    const handleDelete = (record: any) => {
        setFileInfos(prev => prev.filter(item => !(item.fileName === record.fileName && item.size === record.size && item.detectorType === record.detectorType)));
        setFiles(prev => prev.filter(file => file.name !== record.fileName || file.size !== record.size));
    };

    const columns = [
        {title: '文件名', dataIndex: 'fileName', key: 'fileName', ellipsis: true},
        { title: '文件大小', dataIndex: 'size', key: 'size', render: (text: number) => formatFileSize(text) },
        {
            title: '检测方式',
            dataIndex: 'detectorType',
            key: 'detectorType',
            render: (text: string) => text === 'tika' ? 'Apache Tika' : 'Magic Number'
        },
        {title: 'MIME类型', dataIndex: 'mimeType', key: 'mimeType', render: (text: string) => text || 'unknown'},
        {
            title: '操作', key: 'action', width: 100, render: (_: any, record: any) => (
                <Button type="text" status="danger" icon={<IconDelete/>} onClick={() => handleDelete(record)}></Button>
            )
        },
    ];

    return (
        <div className="file-check-container">
            <Layout>
                <Content>
                    <Row style={{height: '100%'}}>
                        <Col span={10} style={{padding: '20px', height: '100%'}}>
                            <Form layout="vertical" autoComplete='off' style={{height: '100%'}}>
                                <FormItem label="检测方式" rules={[{required: true}]} style={{height: '62px'}}>
                                    <Select
                                        value={detectorType}
                                        onChange={handleDetectorTypeChange}
                                        options={[
                                            {label: 'Apache Tika', value: 'tika'},
                                            {label: 'Magic Number', value: 'magic'}
                                        ]}
                                    />
                                </FormItem>
                                <FormItem label="文件上传" rules={[{required: true}]}
                                          style={{height: 'calc(100% - 62px)', overflow: 'hidden'}}>
                                    <Upload
                                        drag
                                        multiple
                                        showUploadList={true}
                                        tip='支持单个或多个文件上传，文件最大100MB'
                                        customRequest={handleCustomUpload}
                                    />
                                </FormItem>
                            </Form>
                        </Col>
                        <Col span={14}
                             style={{padding: '20px', height: '100%', borderLeft: '1px solid var(--color-neutral-3)'}}>
                            <Form layout="vertical" autoComplete='off' style={{height: '100%'}}>
                                <FormItem label="识别结果">
                                    <Table
                                        columns={columns}
                                        data={fileInfos}
                                        rowKey="id"
                                        scroll={{y: tableScrollHeight}}
                                        pagination={false}
                                    />
                                </FormItem>
                            </Form>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </div>
    );
};

export default FileCheck;

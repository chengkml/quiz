import React, { useEffect, useState } from 'react';
import {
    Button,
    Drawer,
    Empty,
    Image,
    Input,
    Message,
    Space,
    Spin,
    Upload,
} from '@arco-design/web-react';
import { IconDelete, IconImage, IconRefresh } from '@arco-design/web-react/icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { testMultimodalModel } from '../api';

const { TextArea } = Input;

interface ModelMultimodalDrawerProps {
    visible: boolean;
    model: any;
    onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ModelMultimodalDrawer: React.FC<ModelMultimodalDrawerProps> = ({ visible, model, onClose }) => {
    const [prompt, setPrompt] = useState('请描述这张图片的主要内容，并提取关键信息。');
    const [result, setResult] = useState('');
    const [testing, setTesting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;
        setPrompt('请描述这张图片的主要内容，并提取关键信息。');
        setResult('');
        setTesting(false);
        setSelectedImage(null);
        setPreviewImage(null);
    }, [visible]);

    const handleCustomUpload = async (option: any) => {
        const file = option.file as File;
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Message.error('仅支持 jpg/png/gif/bmp/webp 图片');
            option.onError?.(new Error('invalid image type'));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            Message.error('图片大小不能超过 10MB');
            option.onError?.(new Error('image too large'));
            return;
        }

        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewImage(e.target?.result as string);
            option.onSuccess?.({});
        };
        reader.readAsDataURL(file);
    };

    const handleClearImage = () => {
        setSelectedImage(null);
        setPreviewImage(null);
    };

    const handleTest = async () => {
        if (!model?.id) {
            Message.error('模型信息异常，请重新打开测试面板');
            return;
        }
        if (!selectedImage) {
            Message.warning('请先上传图片');
            return;
        }
        if (!prompt.trim()) {
            Message.warning('请输入测试提示词');
            return;
        }

        setTesting(true);
        setResult('');
        try {
            const response = await testMultimodalModel(model.id, prompt.trim(), selectedImage);
            const content = response?.data?.content || '';
            setResult(content);
            Message.success('多模态测试完成');
        } catch (error: any) {
            const errMsg = error?.response?.data?.message || error?.message || '多模态测试失败';
            Message.error(errMsg);
        } finally {
            setTesting(false);
        }
    };

    return (
        <Drawer
            width={760}
            title={`多模态测试 - ${model?.name || ''}`}
            visible={visible}
            onCancel={onClose}
            onOk={onClose}
            footer={null}
            bodyStyle={{ padding: 16, backgroundColor: 'var(--color-fill-2)' }}
        >
            <div style={{ display: 'flex', gap: 16, height: '100%' }}>
                <div style={{ width: 300, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>测试图片</span>
                        {previewImage && (
                            <Space>
                                <Upload showUploadList={false} customRequest={handleCustomUpload} accept="image/*">
                                    <Button type="text" size="small" icon={<IconRefresh />}>替换</Button>
                                </Upload>
                                <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={handleClearImage}>删除</Button>
                            </Space>
                        )}
                    </div>

                    {!previewImage ? (
                        <Upload drag showUploadList={false} customRequest={handleCustomUpload} accept="image/*" tip="拖拽或点击上传图片">
                            <div style={{ padding: '28px 8px' }}>
                                <IconImage style={{ fontSize: 26, marginBottom: 8 }} />
                                <div>上传后可进行图文测试</div>
                            </div>
                        </Upload>
                    ) : (
                        <Image src={previewImage} width="100%" preview style={{ borderRadius: 6, maxHeight: 380, objectFit: 'contain' }} />
                    )}

                    <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8, fontWeight: 600 }}>提示词</div>
                        <TextArea
                            value={prompt}
                            onChange={setPrompt}
                            placeholder="请输入测试提示词"
                            autoSize={{ minRows: 4, maxRows: 8 }}
                        />
                        <Button type="primary" long style={{ marginTop: 10 }} loading={testing} onClick={handleTest}>
                            开始测试
                        </Button>
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 6, padding: 14, overflow: 'auto' }}>
                    <div style={{ fontWeight: 600, marginBottom: 10 }}>模型响应</div>
                    {testing ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                            <Spin tip="模型正在处理图片..." />
                        </div>
                    ) : result ? (
                        <div className="markdown-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                        </div>
                    ) : (
                        <Empty description="上传图片并输入提示词后开始测试" />
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default ModelMultimodalDrawer;

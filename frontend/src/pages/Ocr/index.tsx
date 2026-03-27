import React, {useEffect, useState} from 'react';
import {Button, Card, Form, Grid, Image, Layout, Message, Select, Spin, Upload} from '@arco-design/web-react';
import {IconCopy, IconDelete, IconImage, IconRefresh} from '@arco-design/web-react/icon';
import {Content} from 'antd/es/layout/layout';
import './index.less';
import { getLLMModelsByType } from '@/services/llmModelService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

interface UploadFile {
    uid: string;
    name: string;
    status: string;
    url?: string;
}

interface OcrResult {
    text: string;
    confidence?: number;
    language?: string;
}

const OcrPage: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
    const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [models, setModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadModels = async () => {
            setModelsLoading(true);
            try {
                const res = await getLLMModelsByType('VISION');
                if (!isMounted) return;
                if (res.data && Array.isArray(res.data)) {
                    setModels(res.data);
                    const defaultModel = res.data.find((m: any) => m.isDefault === '1' || m.isDefault === 1);
                    if (defaultModel) setCurrentModel(defaultModel.name);
                    else if (res.data.length > 0) setCurrentModel(res.data[0].name);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('获取模型列表失败:', error);
                    Message.error('获取模型列表失败');
                }
            } finally {
                if (isMounted) setModelsLoading(false);
            }
        };

        loadModels();

        return () => {
            isMounted = false;
        };
    }, []);

    // 处理图片上传
    const handleCustomUpload = async (option: any) => {
        const file = option.file as File;
        setLoading(true);
        setError(null);
        setErrorDetail(null);
        setOcrResult(null);

        // 检查文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Message.error(`文件 ${file.name} 不是有效的图片格式`);
            option.onError && option.onError(new Error('无效的图片格式'));
            setLoading(false);
            return;
        }

        // 检查文件大小
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            Message.error(`文件 ${file.name} 大小超过限制（最大10MB）`);
            option.onError && option.onError(new Error('文件大小超限'));
            setLoading(false);
            return;
        }

        setSelectedImage(file);

        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        // 调用后端 SSE 接口进行流式识别
        try {
            const formData = new FormData();
            formData.append('image', file);
            if (currentModel) {
                formData.append('model', currentModel);
            }

            const resp = await fetch('/api/ocr/recognize', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'text/event-stream'
                }
            });

            if (!resp.ok || !resp.body) {
                const text = await resp.text();
                setErrorDetail(text || `HTTP ${resp.status}`);
                throw new Error(text || `HTTP ${resp.status}`);
            }

            // 把流式响应逐步读取并按 SSE 格式解析（data: ...\n\n）
            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = '';
            let accumulated = '';

            // 标记上传文件为进行中
            setUploadedFiles(prev => [{uid: `file-${Date.now()}`, name: file.name, status: 'uploading', url: URL.createObjectURL(file)}]);

            while (!done) {
                const {value, done: d} = await reader.read();
                done = d;
                if (value) {
                    buffer += decoder.decode(value, {stream: true});

                    // SSE event 以空行分隔，可能一次收到多个事件
                    let idx;
                    while ((idx = buffer.indexOf('\n\n')) !== -1) {
                        const eventBlock = buffer.slice(0, idx);
                        buffer = buffer.slice(idx + 2);

                        // 解析 eventBlock 中的 data 行
                        const lines = eventBlock.split(/\r?\n/);
                        const dataLines: string[] = [];
                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                dataLines.push(line.substring(5).trimStart());
                            }
                        }
                        if (dataLines.length === 0) {
                            continue;
                        }
                        const data = dataLines.join('\n');

                        if (data.startsWith('[ERROR]')) {
                            const errMsg = data.replace('[ERROR]', '').trim();
                            setError(errMsg);
                            setErrorDetail(errMsg);
                            Message.error(errMsg);
                            option.onError && option.onError(new Error(errMsg));
                            setLoading(false);
                            return;
                        }

                        if (data.trim() === '[PARSE_RESULT]') {
                            // 服务端表示已解析完毕
                            setUploadedFiles(prev => prev.map(f => ({...f, status: 'done'})));
                            Message.success('OCR识别完成');
                            option.onSuccess && option.onSuccess({});
                            setLoading(false);
                            // 继续处理剩余缓冲区（若有）
                            continue;
                        }

                        // 正常数据片段，追加并显示
                        accumulated += data;
                        setOcrResult({text: accumulated});
                    }
                }
            }

            // 读取循环结束，如果还剩缓冲数据，处理一次
            if (buffer.trim()) {
                // 尝试直接提取 data: 前缀后的内容
                const lines = buffer.split(/\r?\n/);
                const dataLines: string[] = [];
                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        dataLines.push(line.substring(5).trimStart());
                    }
                }
                const data = dataLines.join('\n') || buffer;
                if (data.startsWith('[ERROR]')) {
                    const errMsg = data.replace('[ERROR]', '').trim();
                    setError(errMsg);
                    setErrorDetail(errMsg);
                    Message.error(errMsg);
                    option.onError && option.onError(new Error(errMsg));
                    setLoading(false);
                    return;
                }
                if (data.trim() !== '[PARSE_RESULT]') {
                    accumulated += data;
                    setOcrResult({text: accumulated});
                }
            }

            // 确保文件状态为完成
            setUploadedFiles(prev => prev.map(f => ({...f, status: 'done'})));
            setLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'OCR识别失败';
            setError(errorMessage);
            const detail = err instanceof Error ? (err.stack || err.message) : String(err);
            setErrorDetail(detail);
            Message.error(errorMessage);
            option.onError && option.onError(err);
            setLoading(false);
        }
    };

    // 处理文件移除
    const handleRemove = (file: UploadFile) => {
        setUploadedFiles(prev => prev.filter(item => item.uid !== file.uid));
        setSelectedImage(null);
        setPreviewImage(null);
        setOcrResult(null);
        return true;
    };

    // 清除图片
    const handleClearImage = () => {
        setSelectedImage(null);
        setPreviewImage(null);
        setOcrResult(null);
        setError(null);
        setErrorDetail(null);
        setUploadedFiles([]);
    };

    // 复制识别结果
    const handleCopyResult = () => {
        if (ocrResult?.text) {
            navigator.clipboard.writeText(ocrResult.text).then(() => {
                Message.success('文本已复制到剪贴板');
            }).catch(() => {
                Message.error('复制失败');
            });
        }
    };

    return (
        <div className="ocr-container">
            
            <Layout className="ocr-layout">
                <Content>
                    <Row gutter={20} style={{height: '100%'}}>
                        <Col span={10}>
                            <div className="ocr-model-row">
                                <span className="ocr-model-label">识别模型</span>
                                <Select
                                    className="ocr-model-select"
                                    placeholder="选择模型"
                                    loading={modelsLoading}
                                    value={currentModel || undefined}
                                    allowClear
                                    onChange={(value) => setCurrentModel(value)}
                                    options={models.map((model: any) => ({
                                        label: model.name,
                                        value: model.name,
                                    }))}
                                />
                            </div>
                            <Card 
                                className="upload-card" 
                                title="上传图片" 
                                bordered={false}
                                extra={previewImage && (
                                    <div className="card-actions">
                                        <Upload
                                            showUploadList={false}
                                            customRequest={handleCustomUpload}
                                            accept="image/*"
                                        >
                                            <Button type="text" size="small" icon={<IconRefresh/>}>
                                                重新上传
                                            </Button>
                                        </Upload>
                                        <Button
                                            type="text"
                                            size="small"
                                            status="danger"
                                            icon={<IconDelete/>}
                                            onClick={handleClearImage}
                                        >
                                            删除
                                        </Button>
                                    </div>
                                )}
                            >
                                {!previewImage ? (
                                    <Upload
                                        drag
                                        limit={1}
                                        showUploadList={false}
                                        tip='拖拽图片到此区域，或点击上传'
                                        customRequest={handleCustomUpload}
                                        accept="image/*"
                                    />
                                ) : (
                                    <div className="image-preview">
                                        <Image 
                                            src={previewImage} 
                                            alt="Preview" 
                                            className="preview-img"
                                            preview
                                            width="100%"
                                            height="auto"
                                            style={{maxHeight: '400px', objectFit: 'contain'}}
                                        />
                                    </div>
                                )}
                            </Card>
                        </Col>
                        
                        <Col span={14}>
                            <Card 
                                className="result-card" 
                                title="识别结果"
                                bordered={false}
                                extra={ocrResult?.text && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<IconCopy/>}
                                        onClick={handleCopyResult}
                                        disabled={loading}
                                    >
                                        复制
                                    </Button>
                                )}
                            >
                                <div className="ocr-result-content">
                                    {loading && (
                                        <div className="loading-state">
                                            <Spin size={40}/>
                                            <div className="loading-text">正在识别图片中的文字...</div>
                                            {ocrResult?.text && (
                                                <div className="streaming-result">
                                                    <pre className="result-text">{ocrResult.text}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {error && (
                                        <div className="error-state">
                                            <div className="error-message">{error}</div>
                                            {errorDetail && (
                                                <pre className="error-detail">{errorDetail}</pre>
                                            )}
                                        </div>
                                    )}
                                    {!loading && !error && ocrResult?.text && (
                                        <div className="success-state">
                                            <pre className="result-text">{ocrResult.text}</pre>
                                        </div>
                                    )}
                                    {!loading && !error && !ocrResult?.text && (
                                        <div className="empty-state">
                                            <IconImage style={{fontSize: 64, color: 'var(--color-text-4)'}}/>
                                            <div className="empty-text">上传图片开始识别</div>
                                            <div className="empty-hint">支持中文、英文、数字等多种文字识别</div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </div>
    );
};

export default OcrPage;
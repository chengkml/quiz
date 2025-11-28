import React, {useState} from 'react';
import {Button, Form, Grid, Layout, Message, Upload} from '@arco-design/web-react';
import {IconDownload} from '@arco-design/web-react/icon';
import {Content} from 'antd/es/layout/layout';
import './index.less';

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
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // 处理图片上传
    const handleCustomUpload = async (option: any) => {
        const file = option.file as File;
        setLoading(true);
        setError(null);
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

        // 模拟OCR识别（实际项目中应调用后端API）
        try {
            // 在实际项目中，这里应该发送文件到后端进行OCR识别
            // 这里使用模拟数据进行演示
            setTimeout(() => {
                setOcrResult({
                    text: '这是一个OCR识别结果示例文本。在实际应用中，这里将显示从图片中识别出的文字内容。',
                    confidence: 0.95,
                    language: 'zh-CN'
                });

                // 更新上传文件列表
                setUploadedFiles(prev => [{
                    uid: `file-${Date.now()}`,
                    name: file.name,
                    status: 'done',
                    url: URL.createObjectURL(file)
                }]);

                Message.success(`成功识别图片文本`);
                option.onSuccess && option.onSuccess({});
                setLoading(false);
            }, 1500);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'OCR识别失败';
            setError(errorMessage);
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

    // 下载识别结果
    const handleDownloadResult = () => {
        if (ocrResult?.text) {
            const blob = new Blob([ocrResult.text], {type: 'text/plain;charset=utf-8'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'ocr_result.txt';
            link.click();
            URL.revokeObjectURL(link.href);
        }
    };

    return (
        <div className="ocr-container">
            <Layout>
                <Content>
                    <Row style={{height: '100%'}}>
                        <Col span={10} style={{padding: '20px', height: '100%'}}>
                            <Form layout="vertical" autoComplete='off' style={{height: '100%'}}>
                                <FormItem label="图片上传" rules={[{required: true}]} style={{height: '100%'}}>
                                    <Upload
                                        multiple
                                        imagePreview
                                        listType='picture-card'
                                        tip='支持JPG、PNG、GIF、BMP、WebP格式图片，文件最大10MB'
                                        customRequest={handleCustomUpload}
                                    >
                                    </Upload>
                                </FormItem>
                            </Form>
                        </Col>
                        <Col span={14}
                             style={{padding: '20px', height: '100%', borderLeft: '1px solid var(--color-neutral-3)'}}>
                            <Form layout="vertical" autoComplete='off' style={{height: '100%'}}>
                                <div className="ocr-result-header">
                                    <h3>OCR识别结果</h3>
                                    <div className="result-actions">
                                        <Button
                                            type="primary"
                                            icon={<IconDownload/>}
                                            onClick={handleDownloadResult}
                                            disabled={!ocrResult?.text}
                                            style={{marginRight: 8}}
                                        >
                                            下载文本
                                        </Button>
                                        <Button
                                            icon={<IconDownload/>}
                                            onClick={handleCopyResult}
                                            disabled={!ocrResult?.text}
                                        >
                                            复制文本
                                        </Button>
                                    </div>
                                </div>
                                <FormItem>
                                    <div className="ocr-result-content">
                                        {loading && <div className="loading">正在识别中...</div>}
                                        {error && <div className="error">{error}</div>}
                                        {!loading && !error && ocrResult?.text && (
                                            <pre className="result-text">{ocrResult.text}</pre>
                                        )}
                                        {!loading && !error && !ocrResult?.text && (
                                            <div className="empty-state">上传图片以进行OCR识别</div>
                                        )}
                                        {ocrResult?.confidence && (
                                            <div
                                                className="confidence-info">识别置信度: {Math.round(ocrResult.confidence * 100)}%</div>
                                        )}
                                        {ocrResult?.language && (
                                            <div className="language-info">识别语言: {ocrResult.language}</div>
                                        )}
                                    </div>
                                </FormItem>
                            </Form>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </div>
    );
};

export default OcrPage;
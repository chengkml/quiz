import React, { useState, useEffect } from 'react';
import {
    Card,
    Input,
    Button,
    Select,
    Tabs,
    Table,
    Message,
    Space,
    Typography,
    Empty,
    Spin,
    Tag,
    Tooltip,
    Switch,
    InputNumber,
    AutoComplete,
} from '@arco-design/web-react';
import {
    IconCopy,
    IconSend,
    IconPlus,
    IconDelete,
    IconCode,
    IconClockCircle,
    IconCheck,
    IconClose,
    IconRefresh,
} from '@arco-design/web-react/icon';
import MonacoEditor from '@monaco-editor/react';
import './index.less';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface HeaderItem {
    key: string;
    name: string;
    value: string;
    enabled: boolean;
}

interface ParamItem {
    key: string;
    name: string;
    value: string;
    enabled: boolean;
}

interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
    size: number;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
    GET: 'green',
    POST: 'orangered',
    PUT: 'blue',
    DELETE: 'red',
    PATCH: 'purple',
    HEAD: 'gray',
    OPTIONS: 'cyan',
};

const DEFAULT_HEADERS: HeaderItem[] = [
    { key: '1', name: 'Content-Type', value: 'application/json', enabled: true },
];

const ApiTesterPage: React.FC = () => {
    const [method, setMethod] = useState<string>('GET');
    const [url, setUrl] = useState<string>('');
    const [headers, setHeaders] = useState<HeaderItem[]>(DEFAULT_HEADERS);
    const [params, setParams] = useState<ParamItem[]>([]);
    const [body, setBody] = useState<string>('{\n  \n}');
    const [withDatasetContext, setWithDatasetContext] = useState<boolean>(false);
    const [datasetIdsInput, setDatasetIdsInput] = useState<string>('');
    const [datasetVariables, setDatasetVariables] = useState<string>('{\n  \n}');
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [responseTab, setResponseTab] = useState<string>('body');
    const [timeout, setTimeout] = useState<number>(30000);
    const [autoAddAuth, setAutoAddAuth] = useState<boolean>(true);

    // 自动添加 Authorization header
    useEffect(() => {
        if (autoAddAuth) {
            const token = localStorage.getItem('token');
            if (token) {
                const authHeader = headers.find(h => h.name.toLowerCase() === 'authorization');
                if (!authHeader) {
                    setHeaders(prev => [
                        ...prev,
                        { key: Date.now().toString(), name: 'Authorization', value: `Bearer ${token}`, enabled: true }
                    ]);
                }
            }
        }
    }, [autoAddAuth]);

    interface ApiEndpoint {
        path: string;
        method: string;
        summary: string;
        tag: string;
    }

    const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
    const [endpointsLoading, setEndpointsLoading] = useState(false);

    // 获取 Swagger 端点
    const fetchSwaggerEndpoints = async () => {
        setEndpointsLoading(true);
        try {
            // 尝试获取 Swagger 文档，不同环境可能路径不同
            // 后端 context-path 为 /quiz，但前端代理可能已经处理了
            // 尝试几个常见的路径
            const paths = ['/v3/api-docs', '/api/v3/api-docs', '/quiz/v3/api-docs'];
            let data: any = null;

            for (const path of paths) {
                try {
                    const res = await fetch(path);
                    if (res.ok) {
                        data = await res.json();
                        break;
                    }
                } catch (e) {
                    console.warn(`Failed to fetch swagger from ${path}`, e);
                }
            }

            if (!data) {
                // 如果后端没有配置跨域或路径不匹配，尝试通过代理的前缀
                // 这里假设是开发环境，通过 /api 代理转发
                try {
                    const res = await fetch('/api/v3/api-docs');
                     if (res.ok) {
                        data = await res.json();
                    }
                } catch (e) {
                     // ignore
                }
            }

            if (data && data.paths) {
                const parsed: ApiEndpoint[] = [];
                
                for (const [path, methods] of Object.entries(data.paths)) {
                    for (const [method, info] of Object.entries(methods as any)) {
                        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
                            const apiInfo = info as any;
                            parsed.push({
                                path,
                                method: method.toUpperCase(),
                                summary: apiInfo.summary || apiInfo.operationId || path,
                                tag: apiInfo.tags?.[0] || '其他',
                            });
                        }
                    }
                }
                // 按 URL 排序
                parsed.sort((a, b) => a.path.localeCompare(b.path));
                setEndpoints(parsed);
                // Message.success(`成功加载 ${parsed.length} 个 API 端点`);
            }
        } catch (error) {
            console.error('获取接口列表失败', error);
            // Message.error('获取接口列表失败');
        } finally {
            setEndpointsLoading(false);
        }
    };

    useEffect(() => {
        fetchSwaggerEndpoints();
    }, []);


    // 构建完整 URL（含查询参数）
    const buildFullUrl = (): string => {
        const enabledParams = params.filter(p => p.enabled && p.name);
        if (enabledParams.length === 0) return url;
        
        const queryString = enabledParams
            .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
            .join('&');
        
        return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    };

    // 生成 cURL 命令
    const generateCurl = (): string => {
        const fullUrl = buildFullUrl();
        const enabledHeaders = headers.filter(h => h.enabled && h.name);
        
        let curl = `curl -X ${method}`;
        
        enabledHeaders.forEach(h => {
            curl += ` \\\n  -H '${h.name}: ${h.value}'`;
        });
        
        if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
            const escapedBody = body.replace(/'/g, "'\\''");
            curl += ` \\\n  -d '${escapedBody}'`;
        }
        
        curl += ` \\\n  '${fullUrl}'`;
        
        return curl;
    };

    // 复制 cURL 命令
    const handleCopyCurl = async () => {
        if (!url) {
            Message.warning('请先输入 URL');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(generateCurl());
            Message.success('cURL 命令已复制');
        } catch {
            Message.error('复制失败');
        }
    };

    const tryBuildDatasetContext = () => {
        if (!withDatasetContext) return null;

        const datasetIds = datasetIdsInput
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);

        if (datasetIds.length === 0) {
            Message.warning('已启用数据集上下文，请至少填写一个 datasetId');
            return undefined;
        }

        let variablesObj: Record<string, any> = {};
        const trimmed = (datasetVariables || '').trim();
        if (trimmed) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    variablesObj = parsed;
                } else {
                    Message.warning('dataset variables 必须是 JSON 对象');
                    return undefined;
                }
            } catch (e) {
                Message.warning('dataset variables 不是合法 JSON');
                return undefined;
            }
        }

        return {
            datasetIds,
            variables: variablesObj,
        };
    };

    // 发送请求
    const handleSend = async () => {
        if (!url) {
            Message.warning('请输入请求 URL');
            return;
        }

        setLoading(true);
        setResponse(null);
        const startTime = Date.now();

        try {
            const fullUrl = buildFullUrl();
            const enabledHeaders = headers.filter(h => h.enabled && h.name);
            const headerObj: Record<string, string> = {};
            enabledHeaders.forEach(h => {
                headerObj[h.name] = h.value;
            });

            const fetchOptions: RequestInit = {
                method,
                headers: headerObj,
            };

            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                let bodyText = body.trim();

                if (withDatasetContext) {
                    const datasetContext = tryBuildDatasetContext();
                    if (datasetContext === undefined) {
                        setLoading(false);
                        return;
                    }

                    let bodyObj: any = {};
                    if (bodyText) {
                        try {
                            bodyObj = JSON.parse(bodyText);
                        } catch (e) {
                            Message.warning('请求 Body 需要是合法 JSON 才能注入 datasetContext');
                            setLoading(false);
                            return;
                        }
                    }

                    if (bodyObj.triggerParams && typeof bodyObj.triggerParams === 'string') {
                        try {
                            const triggerObj = JSON.parse(bodyObj.triggerParams);
                            bodyObj.triggerParams = JSON.stringify({
                                ...(triggerObj || {}),
                                datasetContext,
                            });
                        } catch (e) {
                            Message.warning('triggerParams 不是合法 JSON 字符串，无法注入 datasetContext');
                            setLoading(false);
                            return;
                        }
                    } else {
                        bodyObj.triggerParams = JSON.stringify({
                            ...(bodyObj.triggerParams && typeof bodyObj.triggerParams === 'object'
                                ? bodyObj.triggerParams
                                : {}),
                            datasetContext,
                        });
                    }

                    bodyText = JSON.stringify(bodyObj, null, 2);
                    setBody(bodyText);
                }

                if (bodyText) {
                    fetchOptions.body = bodyText;
                }
            }

            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), timeout);
            fetchOptions.signal = controller.signal;

            const res = await fetch(fullUrl, fetchOptions);
            clearTimeout(timeoutId);

            const endTime = Date.now();
            const responseText = await res.text();
            
            const responseHeaders: Record<string, string> = {};
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            setResponse({
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                body: responseText,
                time: endTime - startTime,
                size: new Blob([responseText]).size,
            });

            if (res.ok) {
                Message.success(`请求成功 (${res.status})`);
            } else {
                Message.warning(`请求完成 (${res.status})`);
            }
        } catch (error: any) {
            const endTime = Date.now();
            if (error.name === 'AbortError') {
                Message.error('请求超时');
                setResponse({
                    status: 0,
                    statusText: 'Timeout',
                    headers: {},
                    body: '请求超时',
                    time: endTime - startTime,
                    size: 0,
                });
            } else {
                Message.error(`请求失败: ${error.message}`);
                setResponse({
                    status: 0,
                    statusText: 'Error',
                    headers: {},
                    body: error.message || '请求失败',
                    time: endTime - startTime,
                    size: 0,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Header 表格配置
    const headerColumns = [
        {
            title: '',
            dataIndex: 'enabled',
            width: 50,
            render: (enabled: boolean, record: HeaderItem) => (
                <Switch
                    size="small"
                    checked={enabled}
                    onChange={(checked) => {
                        setHeaders(prev =>
                            prev.map(h => h.key === record.key ? { ...h, enabled: checked } : h)
                        );
                    }}
                />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            render: (name: string, record: HeaderItem) => (
                <Input
                    size="small"
                    value={name}
                    placeholder="Header Name"
                    onChange={(val) => {
                        setHeaders(prev =>
                            prev.map(h => h.key === record.key ? { ...h, name: val } : h)
                        );
                    }}
                />
            ),
        },
        {
            title: 'Value',
            dataIndex: 'value',
            render: (value: string, record: HeaderItem) => (
                <Input
                    size="small"
                    value={value}
                    placeholder="Header Value"
                    onChange={(val) => {
                        setHeaders(prev =>
                            prev.map(h => h.key === record.key ? { ...h, value: val } : h)
                        );
                    }}
                />
            ),
        },
        {
            title: '',
            width: 50,
            render: (_: any, record: HeaderItem) => (
                <Button
                    type="text"
                    status="danger"
                    size="small"
                    icon={<IconDelete />}
                    onClick={() => {
                        setHeaders(prev => prev.filter(h => h.key !== record.key));
                    }}
                />
            ),
        },
    ];

    // Params 表格配置
    const paramColumns = [
        {
            title: '',
            dataIndex: 'enabled',
            width: 50,
            render: (enabled: boolean, record: ParamItem) => (
                <Switch
                    size="small"
                    checked={enabled}
                    onChange={(checked) => {
                        setParams(prev =>
                            prev.map(p => p.key === record.key ? { ...p, enabled: checked } : p)
                        );
                    }}
                />
            ),
        },
        {
            title: 'Key',
            dataIndex: 'name',
            render: (name: string, record: ParamItem) => (
                <Input
                    size="small"
                    value={name}
                    placeholder="Parameter Key"
                    onChange={(val) => {
                        setParams(prev =>
                            prev.map(p => p.key === record.key ? { ...p, name: val } : p)
                        );
                    }}
                />
            ),
        },
        {
            title: 'Value',
            dataIndex: 'value',
            render: (value: string, record: ParamItem) => (
                <Input
                    size="small"
                    value={value}
                    placeholder="Parameter Value"
                    onChange={(val) => {
                        setParams(prev =>
                            prev.map(p => p.key === record.key ? { ...p, value: val } : p)
                        );
                    }}
                />
            ),
        },
        {
            title: '',
            width: 50,
            render: (_: any, record: ParamItem) => (
                <Button
                    type="text"
                    status="danger"
                    size="small"
                    icon={<IconDelete />}
                    onClick={() => {
                        setParams(prev => prev.filter(p => p.key !== record.key));
                    }}
                />
            ),
        },
    ];

    // 格式化响应 JSON
    const formatResponseBody = (bodyText: string): string => {
        try {
            const parsed = JSON.parse(bodyText);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return bodyText;
        }
    };

    // 格式化文件大小
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // 渲染响应头表格
    const renderResponseHeaders = () => {
        if (!response) return <Empty description="暂无响应" />;
        
        const headerData = Object.entries(response.headers).map(([key, value], index) => ({
            key: index.toString(),
            name: key,
            value,
        }));

        return (
            <Table
                size="small"
                columns={[
                    { title: 'Name', dataIndex: 'name', width: 200 },
                    { title: 'Value', dataIndex: 'value' },
                ]}
                data={headerData}
                pagination={false}
            />
        );
    };

    return (
        <div className="api-tester-container">
            <div className="api-tester-layout">
                {/* 请求区域 */}
                <Card className="request-card" title={
                    <span className="card-title">
                        <IconCode style={{ marginRight: 8 }} />
                        API 测试工具
                    </span>
                }>
                    {/* URL 输入区 */}
                    <div className="url-bar">
                        <Select
                            value={method}
                            onChange={setMethod}
                            style={{ width: 120 }}
                            className="method-select"
                        >
                            {HTTP_METHODS.map(m => (
                                <Option key={m} value={m}>
                                    <Tag color={METHOD_COLORS[m]} size="small">{m}</Tag>
                                </Option>
                            ))}
                        </Select>
                        
                        <div style={{ flex: 1, position: 'relative' }}>
                            <AutoComplete
                                placeholder="输入或选择 API 端点"
                                value={url}
                                onChange={setUrl}
                                onSelect={(val, option) => {
                                    setUrl(val);
                                    if (option.extra && option.extra.method) {
                                        setMethod(option.extra.method);
                                    }
                                }}
                                onPressEnter={handleSend}
                                data={endpoints.map(ep => ({
                                    value: `${ep.path}`,
                                    name: `[${ep.tag}] ${ep.summary}`,
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span>
                                                <Tag color={METHOD_COLORS[ep.method] || 'gray'} size="small" style={{ marginRight: 8, width: 60, textAlign: 'center' }}>
                                                    {ep.method}
                                                </Tag>
                                                <Typography.Text type="secondary" style={{ marginRight: 8 }}>
                                                    {ep.path}
                                                </Typography.Text>
                                                <span>{ep.summary}</span>
                                            </span>
                                            <Tag size="small">{ep.tag}</Tag>
                                        </div>
                                    ),
                                    extra: ep
                                }))}
                                triggerElement={<Input className="url-input" />}
                                style={{ width: '100%' }}
                                allowClear
                            />
                            {endpoints.length === 0 && (
                                <Button 
                                    type="text" 
                                    size="mini"
                                    loading={endpointsLoading}
                                    icon={<IconRefresh />} 
                                    onClick={fetchSwaggerEndpoints}
                                    style={{ position: 'absolute', right: 30, top: 4, zIndex: 2 }}
                                />
                            )}
                        </div>

                        <Space>
                            <Tooltip content="刷新 API 列表">
                                <Button
                                    type="secondary"
                                    icon={<IconRefresh />}
                                    loading={endpointsLoading}
                                    onClick={fetchSwaggerEndpoints}
                                />
                            </Tooltip>
                            <Tooltip content="复制 cURL 命令">
                                <Button
                                    type="outline"
                                    icon={<IconCopy />}
                                    onClick={handleCopyCurl}
                                />
                            </Tooltip>
                            <Button
                                type="primary"
                                icon={<IconSend />}
                                loading={loading}
                                onClick={handleSend}
                            >
                                发送
                            </Button>
                        </Space>
                    </div>

                    {/* 设置区 */}
                    <div className="settings-bar">
                        <Space size="large" wrap>
                            <span className="setting-item">
                                <span className="setting-label">超时时间 (ms):</span>
                                <InputNumber
                                    size="small"
                                    value={timeout}
                                    onChange={(val) => setTimeout(val || 30000)}
                                    min={1000}
                                    max={120000}
                                    step={1000}
                                    style={{ width: 100 }}
                                />
                            </span>
                            <span className="setting-item">
                                <span className="setting-label">自动添加 Token:</span>
                                <Switch
                                    size="small"
                                    checked={autoAddAuth}
                                    onChange={setAutoAddAuth}
                                />
                            </span>
                            <span className="setting-item">
                                <span className="setting-label">携带数据集上下文:</span>
                                <Switch
                                    size="small"
                                    checked={withDatasetContext}
                                    onChange={setWithDatasetContext}
                                />
                            </span>
                        </Space>
                    </div>

                    {withDatasetContext && (
                        <Card size="small" style={{ marginBottom: 12 }} title="datasetContext（用于编排/原子组件测试）">
                            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                                <Input
                                    placeholder="datasetIds（逗号分隔），例如：ds_demo_1,ds_demo_2"
                                    value={datasetIdsInput}
                                    onChange={setDatasetIdsInput}
                                />
                                <TextArea
                                    placeholder='variables(JSON对象)，例如：{"scene":"api-tester"}'
                                    value={datasetVariables}
                                    onChange={setDatasetVariables}
                                    autoSize={{ minRows: 3, maxRows: 8 }}
                                />
                            </Space>
                        </Card>
                    )}

                    {/* 请求配置标签页 */}
                    <Tabs defaultActiveTab="headers" className="request-tabs">
                        <TabPane key="params" title={`Params (${params.filter(p => p.enabled).length})`}>
                            <div className="tab-content">
                                <Table
                                    size="small"
                                    columns={paramColumns}
                                    data={params}
                                    pagination={false}
                                    noDataElement={<Empty description="无查询参数" />}
                                />
                                <Button
                                    type="text"
                                    icon={<IconPlus />}
                                    className="add-btn"
                                    onClick={() => setParams(prev => [
                                        ...prev,
                                        { key: Date.now().toString(), name: '', value: '', enabled: true }
                                    ])}
                                >
                                    添加参数
                                </Button>
                            </div>
                        </TabPane>
                        <TabPane key="headers" title={`Headers (${headers.filter(h => h.enabled).length})`}>
                            <div className="tab-content">
                                <Table
                                    size="small"
                                    columns={headerColumns}
                                    data={headers}
                                    pagination={false}
                                    noDataElement={<Empty description="无请求头" />}
                                />
                                <Button
                                    type="text"
                                    icon={<IconPlus />}
                                    className="add-btn"
                                    onClick={() => setHeaders(prev => [
                                        ...prev,
                                        { key: Date.now().toString(), name: '', value: '', enabled: true }
                                    ])}
                                >
                                    添加 Header
                                </Button>
                            </div>
                        </TabPane>
                        <TabPane key="body" title="Body">
                            <div className="body-editor">
                                <MonacoEditor
                                    height="200px"
                                    language="json"
                                    theme="vs-dark"
                                    value={body}
                                    onChange={(val) => setBody(val || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 2,
                                    }}
                                />
                            </div>
                        </TabPane>
                        <TabPane key="curl" title="cURL">
                            <div className="curl-preview">
                                <div className="curl-header">
                                    <Typography.Text bold>cURL 命令</Typography.Text>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<IconCopy />}
                                        onClick={handleCopyCurl}
                                    >
                                        复制
                                    </Button>
                                </div>
                                <pre className="curl-code">{url ? generateCurl() : '请输入 URL 以生成 cURL 命令'}</pre>
                            </div>
                        </TabPane>
                    </Tabs>
                </Card>

                {/* 响应区域 */}
                <Card className="response-card" title={
                    <div className="response-header">
                        <span>响应</span>
                        {response && (
                            <Space size="medium">
                                <Tag color={response.status >= 200 && response.status < 300 ? 'green' : response.status >= 400 ? 'red' : 'orange'}>
                                    {response.status ? `${response.status} ${response.statusText}` : 'Error'}
                                </Tag>
                                <span className="response-meta">
                                    <IconClockCircle /> {response.time} ms
                                </span>
                                <span className="response-meta">
                                    {formatSize(response.size)}
                                </span>
                            </Space>
                        )}
                    </div>
                }>
                    {loading ? (
                        <div className="loading-state">
                            <Spin size={32} />
                            <Typography.Text type="secondary">请求中...</Typography.Text>
                        </div>
                    ) : response ? (
                        <Tabs activeTab={responseTab} onChange={setResponseTab} className="response-tabs">
                            <TabPane key="body" title="Body">
                                <div className="response-body">
                                    <MonacoEditor
                                        height="300px"
                                        language="json"
                                        theme="vs-dark"
                                        value={formatResponseBody(response.body)}
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            wordWrap: 'on',
                                        }}
                                    />
                                </div>
                            </TabPane>
                            <TabPane key="headers" title={`Headers (${Object.keys(response.headers).length})`}>
                                <div className="response-headers">
                                    {renderResponseHeaders()}
                                </div>
                            </TabPane>
                        </Tabs>
                    ) : (
                        <div className="empty-state">
                            <IconSend className="empty-icon" />
                            <Typography.Text type="secondary">
                                点击"发送"按钮发起请求
                            </Typography.Text>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ApiTesterPage;

import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style';
import './style/index.less';
import {Button, Layout, Message, Spin} from '@arco-design/web-react';
import {
    createMindMap,
    formatMindMapData,
    getMindMapById,
    parseMindMapData,
    updateMindMap,
    updateMindMapData,
} from '../api/mindMapService';
import {MindMapData, MindMapDto} from '../types';

const { Content } = Layout;

const MindMapEditPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const mindMapRef = useRef<HTMLDivElement>(null);
    const mindElixirRef = useRef<MindElixir | null>(null);
    const mountedRef = useRef(false);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [mindMap, setMindMap] = useState<MindMapDto | null>(null);
    const [jsonData, setJsonData] = useState<string>('');

    // 移除handleUserEdit函数，直接在初始化时定义事件处理逻辑

    /** 初始化思维导图 */
    const doInitMindMap = useCallback((data?: MindMapData) => {
        if (!mindMapRef.current) return;

        // 先清理旧的实例
        if (mindElixirRef.current) {
            try {
                // 根据v5.3.4版本API，使用正确的清理方法
                if (typeof mindElixirRef.current.unmount === 'function') {
                    mindElixirRef.current.unmount();
                }
            } catch (error) {
                console.error('清理旧实例失败:', error);
            }
            mindElixirRef.current = null;
        }

        // 创建一个新的容器元素来避免React DOM冲突
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'mind-elixir-container';

        // 清空容器并添加新的canvas容器
        while (mindMapRef.current.firstChild) {
            // 只移除非React管理的子元素
            if (mindMapRef.current.firstChild.className !== 'arco-spin') {
                mindMapRef.current.removeChild(mindMapRef.current.firstChild);
            } else {
                break;
            }
        }
        mindMapRef.current.appendChild(canvasContainer);

        // 初始化 MindElixir
        mindElixirRef.current = new MindElixir({
            el: canvasContainer,
            direction: MindElixir.LEFT,
            locale: 'zh_CN',
            draggable: true,
            contextMenu: true,
            toolBar: true,
            nodeMenu: true,
            keypress: true,
            newNodeText: '新节点',
        });

        const mindData = data || {
            nodeData: { id: 'root', topic: '新思维导图', root: true },
            nodeChild: [],
        };

        mindElixirRef.current.init(mindData);

        // 更新JSON数据显示
        if (mountedRef.current) {
            // 使用正确的方式获取数据，根据v5.3.4版本API
            const currentData = mindElixirRef.current.getData();
            setJsonData(JSON.stringify(currentData, null, 2));
        }

        // 添加事件监听器来更新JSON数据
        // 在mind-elixir v5.3.4中，使用on方法而不是addListener
        try {
            const updateJsonDisplay = () => {
                if (mountedRef.current && mindElixirRef.current) {
                    try {
                        const data = mindElixirRef.current.getData();
                        setJsonData(JSON.stringify(data, null, 2));
                    } catch (error) {
                        console.error('更新JSON数据失败:', error);
                    }
                }
            };

            // 绑定多个事件以确保自动更新功能正常工作
            if (mindElixirRef.current.on) {
                mindElixirRef.current.on('operation', updateJsonDisplay);
                mindElixirRef.current.on('insertNode', updateJsonDisplay);
                mindElixirRef.current.on('updateNode', updateJsonDisplay);
                mindElixirRef.current.on('deleteNode', updateJsonDisplay);
                mindElixirRef.current.on('moveNode', updateJsonDisplay);
            } else {
                console.warn('MindElixir实例不支持on方法，无法设置自动更新');
            }
        } catch (error) {
            console.error('设置事件监听失败:', error);
        }

        setIsLoading(false);
    }, []); // 移除handleUserEdit依赖

    /** 加载思维导图数据 */
    useEffect(() => {
        // 使用一个标志来防止重复加载
        let isMounted = true;
        
        const loadMindMap = async () => {
            if (!id) {
                if (isMounted) {
                    setIsLoading(false);
                    doInitMindMap();
                }
                return;
            }

            try {
                if (isMounted) {
                    setIsLoading(true);
                }
                const response = await getMindMapById(id);
                
                // 确保组件仍然挂载
                if (!isMounted) return;
                
                const data = response.data;
                setMindMap(data);

                if (data.mapData && mindMapRef.current) {
                    const parsedData = parseMindMapData(data.mapData);
                    parsedData.nodeData.topic = data.mapName;
                    doInitMindMap(parsedData);
                } else if (mindMapRef.current) {
                    doInitMindMap();
                }
            } catch (error) {
                console.error('加载思维导图失败:', error);
                if (isMounted) {
                    Message.error('加载思维导图失败');
                    setIsLoading(false);
                }
            }
        };

        loadMindMap();
        
        // 清理函数，防止组件卸载后更新状态
        return () => {
            isMounted = false;
        };
    }, [id]); // 移除doInitMindMap依赖

    /** 组件挂载状态管理 */
    useLayoutEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            // 移除所有监听器并清理实例
            if (mindElixirRef.current) {
                try {
                    // 根据v5.3.4版本API，使用正确的清理方法
                    if (typeof mindElixirRef.current.unmount === 'function') {
                        mindElixirRef.current.unmount();
                    }
                } catch (error) {
                    console.error('卸载思维导图失败:', error);
                }
                mindElixirRef.current = null;
            }
        };
    }, []);

    /** 保存思维导图 */
    const handleSave = async () => {
        if (!mindElixirRef.current) {
            Message.error('思维导图未初始化');
            return;
        }

        try {
            setSaveLoading(true);
            // 使用正确的API方法获取数据
            const mindData = mindElixirRef.current.getData();
            const formattedData = formatMindMapData(mindData);
            
            // 获取当前思维导图的标题作为mapName（根据后端接口要求，这是必填字段）
            const mapName = mindData.nodeData?.topic || '未命名思维导图';

            // 当有ID时，始终调用更新接口
            if (id) {
                // 使用新的思维导图数据更新接口
                await updateMindMapData({ 
                    id, 
                    mapData: formattedData 
                });
                Message.success('思维导图更新成功');
                // 更新本地状态中的mapName
                if (mindMap) {
                    setMindMap({ ...mindMap, mapName });
                }
            } else {
                // 没有ID时才创建新的思维导图
                await createMindMap({ mapName, mapData: formattedData });
                Message.success('思维导图创建成功');
            }
        } catch (error) {
            console.error('保存失败:', error);
            Message.error('保存失败');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleBack = () => navigate('/quiz/frame/mindmap');

    // 手动刷新JSON数据
    const refreshJsonData = () => {
        if (mindElixirRef.current) {
            try {
                // 使用正确的API方法获取数据
                const data = mindElixirRef.current.getData();
                setJsonData(JSON.stringify(data, null, 2));
            } catch (error) {
                console.error('获取思维导图数据失败:', error);
                Message.error('获取数据失败，请检查思维导图实例');
            }
        }
    };

    return (
        <Layout style={{height: '100vh'}}>
            <Content style={{
                margin: 10,
                background: '#fff',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                height: 'calc(100vh - 30px)'
            }}>
                {isLoading && <Spin tip="加载中..." className="mindmap-loading-overlay" />}
                <div className="mindmap-editor-container">
                    <div ref={mindMapRef} style={{height: '100%', width: '100%'}} />
                </div>
                <div className="mindmap-json-container">
                    <div className="mindmap-json-content">
                        <pre className="mindmap-json-pre">{jsonData}</pre>
                    </div>
                    <div className="button-group">
                        <Button
                            onClick={handleBack}
                        >
                            返回
                        </Button>
                        <Button
                            type="primary"
                            onClick={refreshJsonData}
                        >
                            刷新
                        </Button>
                        <Button
                            status="success"
                            onClick={handleSave}
                            disabled={saveLoading}
                        >
                            {saveLoading ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

export default MindMapEditPage;

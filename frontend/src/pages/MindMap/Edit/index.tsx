import React, {useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style';
import './style/index.less';
import {Layout, Message, Spin} from '@arco-design/web-react';
import {
    createMindMap,
    formatMindMapData,
    getMindMapById,
    parseMindMapData,
    updateMindMap,
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

    // 使用简单的防抖实现 - 使用 useRef 而不是 useState 来避免不必要的重渲染
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    /** 自动保存思维导图 */
    const autoSaveMindMap = useCallback(async () => {
        if (!mindElixirRef.current || !id || !mindMap || saveLoading) return;

        try {
            setSaveLoading(true);
            const mindData = mindElixirRef.current.getAllData();
            const formattedData = formatMindMapData(mindData);
            await updateMindMap({ id, mapData: formattedData });
            console.log('思维导图自动保存成功');
        } catch (error) {
            console.error('自动保存失败:', error);
        } finally {
            // 短暂显示保存状态后再隐藏
            setTimeout(() => {
                if (mountedRef.current) {
                    setSaveLoading(false);
                }
            }, 500);
        }
    }, [id, mindMap, saveLoading]);

    // 移除handleUserEdit函数，直接在初始化时定义事件处理逻辑

    /** 初始化思维导图 */
    const doInitMindMap = useCallback((data?: MindMapData) => {
        if (!mindMapRef.current) return;

        // 先清理旧的实例
        if (mindElixirRef.current) {
            try {
                mindElixirRef.current.removeAllListeners();
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

        // 初始化完成后添加事件监听器 - 使用防抖定时器引用而不是函数本身
        if (mountedRef.current) {
            const handleNodeUpdate = () => {
                if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                }
                debounceTimerRef.current = setTimeout(() => {
                    if (mountedRef.current && mindElixirRef.current) {
                        autoSaveMindMap();
                    }
                }, 2000);
            };
            
            mindElixirRef.current.addListener('updateNodeData', handleNodeUpdate);
            mindElixirRef.current.addListener('addNode', handleNodeUpdate);
            mindElixirRef.current.addListener('deleteNode', handleNodeUpdate);
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

            // 清除防抖定时器
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }

            // 移除所有监听器并清理实例
            if (mindElixirRef.current) {
                try {
                    mindElixirRef.current.removeAllListeners();
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
            const mindData = mindElixirRef.current.getAllData();
            const formattedData = formatMindMapData(mindData);

            if (id && mindMap) {
                await updateMindMap({ id, mapData: formattedData });
                Message.success('思维导图更新成功');
            } else {
                await createMindMap({ mapName: '新思维导图', mapData: formattedData });
                Message.success('思维导图创建成功');
                navigate('/mindmap');
            }
        } catch (error) {
            console.error('保存失败:', error);
            Message.error('保存失败');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleBack = () => navigate('/mindmap');

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
                <div ref={mindMapRef} style={{height: '100%', width: '100%'}} />
                {saveLoading && (
                    <div style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: 4,
                        fontSize: 14
                    }}>
                        自动保存中...
                    </div>
                )}
            </Content>
        </Layout>
    );
};

export default MindMapEditPage;

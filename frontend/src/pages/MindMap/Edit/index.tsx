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

    /** 初始化思维导图 */
    const doInitMindMap = useCallback((data?: MindMapData) => {
        if (!mindMapRef.current) return;

        // 先清理旧的实例
        if (mindElixirRef.current) {
            try {
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

        setIsLoading(false);
    }, []);

    /** 加载思维导图数据 */
    useEffect(() => {
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
        
        return () => {
            isMounted = false;
        };
    }, [id, doInitMindMap]);

    /** 组件挂载状态管理 */
    useLayoutEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            if (mindElixirRef.current) {
                try {
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
            const mindData = mindElixirRef.current.getData();
            const formattedData = formatMindMapData(mindData);
            
            const mapName = mindData.nodeData?.topic || '未命名思维导图';

            if (id) {
                await updateMindMapData({ 
                    id, 
                    mapData: formattedData 
                });
                Message.success('思维导图更新成功');
                if (mindMap) {
                    setMindMap({ ...mindMap, mapName });
                }
            } else {
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

    return (
        <Layout style={{height: '100%'}}>
            <Content style={{
                background: '#fff',
                borderRadius: 8,
                padding: '10px',
                height: '100%',
                position: 'relative'
            }}>
                {isLoading && <Spin tip="加载中..." className="mindmap-loading-overlay" />}
                <div className="mindmap-editor-container" style={{height: '100%'}}>
                    <div ref={mindMapRef} style={{height: '100%', width: '100%'}} />
                </div>
                <div className="button-group" style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    gap: '10px'
                }}>
                    <Button
                        onClick={handleBack}
                    >
                        返回
                    </Button>
                    <Button
                        status="success"
                        onClick={handleSave}
                        disabled={saveLoading}
                    >
                        {saveLoading ? '保存中...' : '保存'}
                    </Button>
                </div>
            </Content>
        </Layout>
    );
};

export default MindMapEditPage;

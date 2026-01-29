import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style';
import './style/index.less';
import {Button, Layout, Message, Spin, Tooltip, Dropdown, Menu, Slider} from '@arco-design/web-react';
import {
    IconDownload,
    IconClose,
    IconPalette
} from '@arco-design/web-react/icon';
import { getMindMapById, parseMindMapData } from '../api/mindMapService';
import {MindMapDto, MindMapData} from '../types';

const { Content } = Layout;

interface MindMapViewPageProps {
    id?: string;
    onClose?: () => void;
}

const MindMapViewPage: React.FC<MindMapViewPageProps> = (props) => {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Support both props (drawer mode) and params (route mode)
    const id = props.id || params.id;
    const isDrawerMode = !!props.id;
    
    const mindMapRef = useRef<HTMLDivElement>(null);
    const mindElixirRef = useRef<any>(null);
    const mountedRef = useRef(false);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [mindMap, setMindMap] = useState<MindMapDto | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [isDragging, setIsDragging] = useState(false);

    /** 初始化思维导图 */
    const doInitMindMap = useCallback((data?: MindMapData) => {
        if (!mindMapRef.current) return;

        // Clean up old instance
        if (mindElixirRef.current) {
            try {
                // @ts-ignore
                if (typeof mindElixirRef.current.destroy === 'function') {
                    mindElixirRef.current.destroy();
                }
            } catch (error) {
                console.error('Clean up failed:', error);
            }
            mindElixirRef.current = null;
        }

        // Create container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'mind-elixir-container';
        
        // Clear children
        while (mindMapRef.current.firstChild) {
            const firstChild = mindMapRef.current.firstChild as HTMLElement;
            if (firstChild.className !== 'arco-spin') {
                mindMapRef.current.removeChild(mindMapRef.current.firstChild);
            } else {
                break;
            }
        }
        mindMapRef.current.appendChild(canvasContainer);

        // Initialize MindElixir in Read-Only mode
        mindElixirRef.current = new MindElixir({
            el: canvasContainer,
            direction: MindElixir.LEFT,
            locale: 'zh_CN',
            draggable: true, // Allow panning
            contextMenu: false, // Disable editing context menu
            toolBar: false, // Disable editing toolbar
            keypress: false, // Disable shortcuts
            editable: false, // Core read-only flag if supported, otherwise rely on UI hiding
        });
        
        // If editable: false is not sufficient (depends on library version), we rely on no toolbar/contextMenu
        
        const mindData = data || {
            nodeData: { id: 'root', topic: '思维导图', root: true },
            nodeChild: [],
        };

        mindElixirRef.current.init(mindData);
        
        // Disable editing interactions manually if needed
        // For MindElixir, hiding toolbar and contextMenu is the main way to "read-only"
        
        setIsLoading(false);
    }, []);

    /** 加载思维导图数据 */
    useEffect(() => {
        let isMounted = true;
        
        const loadMindMap = async () => {
            if (!id) return;

            try {
                if (isMounted) setIsLoading(true);
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
                console.error('Failed to load mindmap:', error);
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

    /** Cleanup */
    useLayoutEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (mindElixirRef.current) {
                // @ts-ignore
                 if (typeof mindElixirRef.current.destroy === 'function') {
                    mindElixirRef.current.destroy();
                }
                mindElixirRef.current = null;
            }
        };
    }, []);

    const handleBack = () => {
        if (props.onClose) {
            props.onClose();
        } else {
            navigate('/frame/mindmap');
        }
    };

    /** 导出为图片 */
    const handleExportImage = async () => {
        if (!mindElixirRef.current) {
            Message.error('思维导图未初始化');
            return;
        }

        try {
            const svgElement = mindElixirRef.current.el.querySelector('svg');
            if (!svgElement) {
                throw new Error('未找到SVG元素');
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                
                const link = document.createElement('a');
                const mapName = mindMap?.mapName || '思维导图';
                link.download = `${mapName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                Message.success('导出成功');
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } catch (error) {
            console.error('导出图片失败:', error);
            Message.error('导出失败');
        }
    };

    /** 导出菜单 */
    const exportMenu = (
        <Menu className="mindmap-dropdown-menu">
            <Menu.Item key='png' onClick={handleExportImage}>
                导出为图片 (PNG)
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout style={{height: isDrawerMode ? '100%' : 'calc(100% - 20px)'}}>
            <Content className="mindmap-view-page" style={{
                margin: isDrawerMode ? '0' : '10px',
                padding: '10px',
                background: '#fff',
                borderRadius: isDrawerMode ? 0 : 8,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {isLoading && <Spin tip="加载中..." className="mindmap-loading-overlay" />}
                
                {/* 顶部栏: 仅显示返回和导出 */}
                <div className="mindmap-toolbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 10px', borderBottom: '1px solid #f0f0f0' }}>
                     <div className="left">
                        <Tooltip content={isDrawerMode ? "关闭" : "返回"}>
                            <Button icon={<IconClose />} onClick={handleBack} />
                        </Tooltip>
                        <span style={{ marginLeft: 16, fontWeight: 'bold', fontSize: 16 }}>
                            {mindMap?.mapName} <span style={{ fontSize: 12, color: '#888', fontWeight: 'normal' }}>(只读模式)</span>
                        </span>
                     </div>
                     <div className="right" style={{ display: 'flex', alignItems: 'center' }}>
                        {/* 缩放控制区域 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '150px',
                            marginRight: '12px'
                        }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                            {Math.round(zoomLevel * 100)}%
                            </span>
                            <Slider
                            style={{ width: '100px' }}
                            min={50}
                            max={200}
                            step={10}
                            value={Math.round(zoomLevel * 100)}
                            onChange={(value) => {
                                // value is number | number[]
                                const val = typeof value === 'number' ? value : value[0];
                                const newScale = val / 100;
                                if (mindElixirRef.current && mindElixirRef.current.scale) {
                                    mindElixirRef.current.scale(newScale);
                                    setZoomLevel(newScale);
                                }
                            }}
                            tooltipVisible={false}
                            />
                        </div>
                        <div style={{ width: 1, height: 20, background: '#e5e6eb', margin: '0 12px' }} />
                        <Tooltip content="导出">
                            <Dropdown droplist={exportMenu} position="br">
                                <Button icon={<IconDownload />} />
                            </Dropdown>
                        </Tooltip>
                     </div>
                </div>

                {/* 视图容器 */}
                <div className="mindmap-viewer-container" style={{flex: 1}}>
                    <div 
                        ref={mindMapRef} 
                        style={{
                            height: '100%', 
                            width: '100%',
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default MindMapViewPage;

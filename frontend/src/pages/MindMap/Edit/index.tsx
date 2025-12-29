import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import MindElixir from 'mind-elixir';
import 'mind-elixir/style';
import './style/index.less';
import {Button, Layout, Message, Spin, Dropdown, Menu, Space, Tooltip} from '@arco-design/web-react';
import {
    IconDownload,
    IconUndo,
    IconRedo,
    IconZoomIn,
    IconZoomOut,
    IconExpand,
    IconPalette,
    IconClose,
    IconSave
} from '@arco-design/web-react/icon';
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
    const mindElixirRef = useRef<any>(null);
    const mountedRef = useRef(false);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [mindMap, setMindMap] = useState<MindMapDto | null>(null);
    const [currentTheme, setCurrentTheme] = useState<string>('default');
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    /** 初始化思维导图 */
    const doInitMindMap = useCallback((data?: MindMapData) => {
        if (!mindMapRef.current) return;

        // 先清理旧的实例
        if (mindElixirRef.current) {
            try {
                if (typeof mindElixirRef.current.destroy === 'function') {
                    mindElixirRef.current.destroy();
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
            const firstChild = mindMapRef.current.firstChild as HTMLElement;
            if (firstChild.className !== 'arco-spin') {
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
            keypress: true
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
                    if (typeof mindElixirRef.current.destroy === 'function') {
                        mindElixirRef.current.destroy();
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
            const formattedData = JSON.stringify(mindData);
            
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

    const handleBack = () => navigate('/frame/mindmap');

    /** 导出为图片 */
    const handleExportImage = async () => {
        if (!mindElixirRef.current) {
            Message.error('思维导图未初始化');
            return;
        }

        try {
            // MindElixir不直接提供exportPng，需要手动实现
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

    /** 导出为JSON */
    const handleExportJSON = () => {
        if (!mindElixirRef.current) {
            Message.error('思维导图未初始化');
            return;
        }

        try {
            const mindData = mindElixirRef.current.getData();
            const jsonStr = JSON.stringify(mindData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const link = document.createElement('a');
            const mapName = mindMap?.mapName || '思维导图';
            link.download = `${mapName}.json`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            Message.success('导出成功');
        } catch (error) {
            console.error('导出JSON失败:', error);
            Message.error('导出失败');
        }
    };

    /** 导出为Markdown */
    const handleExportMarkdown = () => {
        if (!mindElixirRef.current) {
            Message.error('思维导图未初始化');
            return;
        }

        try {
            const mindData = mindElixirRef.current.getData();
            const markdown = convertToMarkdown(mindData);
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const link = document.createElement('a');
            const mapName = mindMap?.mapName || '思维导图';
            link.download = `${mapName}.md`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            Message.success('导出成功');
        } catch (error) {
            console.error('导出Markdown失败:', error);
            Message.error('导出失败');
        }
    };

    /** 转换为Markdown格式 */
    const convertToMarkdown = (data: any, level: number = 1): string => {
        let markdown = '';
        const prefix = '#'.repeat(level);
        
        if (data.nodeData) {
            markdown += `${prefix} ${data.nodeData.topic}\n\n`;
        }
        
        if (data.children && data.children.length > 0) {
            data.children.forEach((child: any) => {
                markdown += convertToMarkdown(child, level + 1);
            });
        }
        
        return markdown;
    };

    /** 撤销 */
    const handleUndo = () => {
        if (mindElixirRef.current && mindElixirRef.current.undo) {
            try {
                mindElixirRef.current.undo();
            } catch (error) {
                Message.warning('无法撤销');
            }
        } else {
            Message.warning('撤销功能不可用');
        }
    };

    /** 重做 */
    const handleRedo = () => {
        if (mindElixirRef.current && mindElixirRef.current.redo) {
            try {
                mindElixirRef.current.redo();
            } catch (error) {
                Message.warning('无法重做');
            }
        } else {
            Message.warning('重做功能不可用');
        }
    };

    /** 放大 */
    const handleZoomIn = () => {
        if (mindElixirRef.current) {
            const newScale = Math.min(zoomLevel + 0.1, 2);
            mindElixirRef.current.scale(newScale);
            setZoomLevel(newScale);
        }
    };

    /** 缩小 */
    const handleZoomOut = () => {
        if (mindElixirRef.current) {
            const newScale = Math.max(zoomLevel - 0.1, 0.5);
            mindElixirRef.current.scale(newScale);
            setZoomLevel(newScale);
        }
    };

    /** 适应窗口 */
    const handleFitView = () => {
        if (mindElixirRef.current) {
            mindElixirRef.current.toCenter();
            mindElixirRef.current.scale(1);
            setZoomLevel(1);
        }
    };

    /** 切换主题 */
    const handleThemeChange = (theme: string) => {
        if (mindElixirRef.current) {
            try {
                const themeConfig: any = {
                    default: { name: 'default', palette: ['#5f9ea0', '#00afef', '#f39800', '#fb7299'] },
                    dark: { name: 'dark', palette: ['#4a5568', '#2d3748', '#1a202c', '#718096'] },
                    colorful: { name: 'colorful', palette: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'] }
                };
                
                if (themeConfig[theme] && mindElixirRef.current.changeTheme) {
                    mindElixirRef.current.changeTheme(themeConfig[theme]);
                    setCurrentTheme(theme);
                    Message.success(`已切换到${theme}主题`);
                }
            } catch (error) {
                Message.warning('主题切换功能不可用');
            }
        }
    };

    /** 导出菜单 */
    const exportMenu = (
        <Menu className="mindmap-dropdown-menu">
            <Menu.Item key='png' onClick={handleExportImage}>
                导出为图片 (PNG)
            </Menu.Item>
            <Menu.Item key='json' onClick={handleExportJSON}>
                导出为 JSON
            </Menu.Item>
            <Menu.Item key='markdown' onClick={handleExportMarkdown}>
                导出为 Markdown
            </Menu.Item>
        </Menu>
    );

    /** 主题菜单 */
    const themeMenu = (
        <Menu className="mindmap-dropdown-menu">
            <Menu.Item key='default' onClick={() => handleThemeChange('default')}>
                默认主题
            </Menu.Item>
            <Menu.Item key='dark' onClick={() => handleThemeChange('dark')}>
                深色主题
            </Menu.Item>
            <Menu.Item key='colorful' onClick={() => handleThemeChange('colorful')}>
                多彩主题
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout style={{height: 'calc(100% - 20px)'}}>
            <Content className="mindmap-edit-page" style={{
                margin: '10px',
                padding: '10px',
                background: '#fff',
                borderRadius: 8,
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {isLoading && <Spin tip="加载中..." className="mindmap-loading-overlay" />}
                
                {/* 工具栏 */}
                <div className="mindmap-toolbar">
                    <div className="mindmap-toolbar-left">
                        <Tooltip content="保存">
                            <Button
                                type="primary"
                                icon={<IconSave />}
                                onClick={handleSave}
                                loading={saveLoading}
                            />
                        </Tooltip>
                        <Tooltip content="返回">
                            <Button icon={<IconClose />} onClick={handleBack} />
                        </Tooltip>
                        <span className="toolbar-divider" />
                        <Tooltip content="撤销">
                            <Button icon={<IconUndo />} onClick={handleUndo} />
                        </Tooltip>
                        <Tooltip content="重做">
                            <Button icon={<IconRedo />} onClick={handleRedo} />
                        </Tooltip>
                    </div>
                    <div className="mindmap-toolbar-right">
                        <Tooltip content="切换主题">
                            <Dropdown droplist={themeMenu} position="br">
                                <Button icon={<IconPalette />} />
                            </Dropdown>
                        </Tooltip>
                        <Tooltip content="导出">
                            <Dropdown droplist={exportMenu} position="br">
                                <Button icon={<IconDownload />} />
                            </Dropdown>
                        </Tooltip>
                    </div>
                </div>

                {/* 编辑器主体 */}
                <div className="mindmap-editor-container" style={{flex: 1}}>
                    <div ref={mindMapRef} style={{height: '100%', width: '100%'}} />
                </div>
            </Content>
        </Layout>
    );
};

export default MindMapEditPage;

import React, {useCallback, useEffect, useState} from 'react';
import {Button, Dropdown, Layout, Menu, Message, Badge, Modal, List, Spin, Empty, Space, Tooltip, Switch} from '@arco-design/web-react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
    IconCaretLeft,
    IconCaretRight,
    IconDashboard,
    IconFile,
    IconHome,
    IconLock,
    IconPoweroff,
    IconSettings,
    IconStorage,
    IconUser,
    IconNotification,
    IconSun,
    IconMoon,
} from '@arco-design/web-react/icon';
// 主题切换逻辑
const getInitTheme = () => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('themeMode');
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
    }
    return 'light';
};
import {MenuTreeDto} from '../../types/menu';
import UserAvatar from '@/components/UserAvatar';
import {useUser} from '@/contexts/UserContext';
import {clearUserInfo} from '@/utils/userUtils';
import {logoutUser} from '@/pages/User/api';
import {getUnreadCount, getUnreadMessages, SystemMessageDto} from '@/pages/Notification/systemMessageApi';
import {wsClient} from '@/core/websocket';
import './style.less';

const {Content, Header, Sider} = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const AppLayout: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(getInitTheme());
        // 切换主题
        const handleThemeChange = (checked: boolean) => {
            const mode = checked ? 'dark' : 'light';
            setTheme(mode);
            document.body.setAttribute('arco-theme', mode === 'dark' ? 'dark' : '');
            localStorage.setItem('themeMode', mode);
        };

        // 初始化主题
        useEffect(() => {
            document.body.setAttribute('arco-theme', theme === 'dark' ? 'dark' : '');
        }, [theme]);
    const navigate = useNavigate();
    const location = useLocation();
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const {user, logout, menuTree, loadMenuFromServer} = useUser();
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messageDropdownVisible, setMessageDropdownVisible] = useState(false);
    const [messageList, setMessageList] = useState<SystemMessageDto[]>([]);
    const [messageLoading, setMessageLoading] = useState(false);

    // 组件挂载时加载菜单（始终从服务器获取最新数据）
    useEffect(() => {
        const loadUserMenus = async () => {
            if (!user?.userId) {
                return;
            }

            setLoading(true);
            try {
                await loadMenuFromServer();
            } catch (error) {
                console.error('Failed to load menu from server:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserMenus();
    }, [user?.userId, loadMenuFromServer]);

    // 加载未读消息计数（无轮询）
    const loadUnreadCount = useCallback(async () => {
        if (!user?.userId) {
            setUnreadCount(0);
            return;
        }
        try {
            const data = await getUnreadCount();
            setUnreadCount(data?.unreadCount || 0);
        } catch (error) {
            console.error('Failed to load unread count:', error);
        }
    }, [user?.userId]);

    useEffect(() => {
        loadUnreadCount();
    }, [loadUnreadCount]);

    useEffect(() => {
        setOpenKeys(getOpenKeys());
    }, [location.pathname, menuTree]);

    // 建立用户级 websocket 连接并更新未读消息
    useEffect(() => {
        if (!user?.userId) {
            wsClient.disconnect();
            return;
        }

        const unsubscribe = wsClient.subscribe('/user/queue/sys_msg', (payload, _ctx) => {
            if (payload?.type === 'SYS_MSG_NEW') {
                loadUnreadCount();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user?.userId, loadUnreadCount]);

    // 处理菜单点击
    const handleMenuClick = (key: string) => {
        const menu = findMenuByKey(menuTree, key);
        if (menu && menu.url) {
            navigate(`/frame/${menu.url}`);
        }
    };

    // 根据key查找菜单项
    const findMenuByKey = (menus: MenuTreeDto[], key: string): MenuTreeDto | null => {
        for (const menu of menus) {
            if (menu.menuId === key) {
                return menu;
            }
            if (menu.children && menu.children.length > 0) {
                const found = findMenuByKey(menu.children, key);
                if (found) return found;
            }
        }
        return null;
    };

    // 获取菜单选中项
    const getSelectedKeys = () => {
        const path = location.pathname;

        // 将URL转换为标准化的路径段数组（去除空字符串和斜杠）
        const getSegments = (url: string): string[] => {
            return url.split('/').filter(Boolean);
        };

        // 递归查找匹配的菜单项（精确匹配路径段）
        const findMatchingMenu = (menus: MenuTreeDto[]): string[] => {
            const pathSegments = getSegments(path);
            for (const menu of menus) {
                if (menu.url) {
                    const menuSegments = getSegments(menu.url);
                    // 检查路径的最后N个段是否与菜单URL段完全匹配（N为菜单段长度）
                    const lastPathSegments = pathSegments.slice(-menuSegments.length);
                    if (JSON.stringify(lastPathSegments) === JSON.stringify(menuSegments)) {
                        return [menu.menuId];
                    }
                }
                if (menu.children) {
                    const childResult = findMatchingMenu(menu.children);
                    if (childResult.length > 0) {
                        return childResult;
                    }
                }
            }
            return [];
        };

        return findMatchingMenu(menuTree || []);
    };

    // 获取需要展开的菜单项
    const getOpenKeys = () => {
        const path = location.pathname;
        const openKeys: string[] = [];

        // 将URL转换为标准化的路径段数组（去除空字符串和斜杠）
        const getSegments = (url: string): string[] => {
            return url.split('/').filter(Boolean);
        };

        // 递归查找需要展开的父菜单（精确匹配路径段）
        const findOpenKeys = (menus: MenuTreeDto[], parentKey?: string): boolean => {
            const pathSegments = getSegments(path);
            for (const menu of menus) {
                // 检查当前菜单是否匹配路径（精确匹配）
                if (menu.url) {
                    const menuSegments = getSegments(menu.url);
                    const lastPathSegments = pathSegments.slice(-menuSegments.length);
                    if (JSON.stringify(lastPathSegments) === JSON.stringify(menuSegments)) {
                        if (parentKey) {
                            openKeys.push(parentKey);
                        }
                        return true;
                    }
                }
                // 递归检查子菜单
                if (menu.children && menu.children.length > 0) {
                    if (findOpenKeys(menu.children, menu.menuId)) {
                        if (parentKey) {
                            openKeys.push(parentKey);
                        }
                        openKeys.push(menu.menuId);
                        return true;
                    }
                }
            }
            return false;
        };

        findOpenKeys(menuTree || []);
        return openKeys;
    };

    // 根据菜单配置获取图标（支持菜单配置值与自动回退）
    const toPascal = (name: string) =>
        (name || '')
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join('');

    const getMenuIcon = (menu: MenuTreeDto) => {
        // 1) 优先根据 menuIcon 字段渲染（如：'user-add' -> IconUserAdd）
        if (menu.menuIcon) {
            const compName = `${toPascal(menu.menuIcon)}`;
            // 仅支持已静态导入的图标
            const staticIcons: Record<string, JSX.Element> = {
                IconDashboard: <IconDashboard/>,
                IconUser: <IconUser/>,
                IconSettings: <IconSettings/>,
                IconFile: <IconFile/>,
                IconStorage: <IconStorage/>,
                IconLock: <IconLock/>,
                IconHome: <IconHome/>,
            };
            if (staticIcons[compName]) {
                return staticIcons[compName];
            }
            // 常用简写的兼容映射
            const fallbackMap: Record<string, JSX.Element> = {
                dashboard: <IconDashboard/>,
                user: <IconUser/>,
                settings: <IconSettings/>,
                file: <IconFile/>,
                storage: <IconStorage/>,
                lock: <IconLock/>,
                home: <IconHome/>,
            };
            if (fallbackMap[menu.menuIcon]) {
                return fallbackMap[menu.menuIcon];
            }
        }

        // 2) 根据菜单路径或名称提供默认图标
        const url = (menu.url || '').toLowerCase();
        if (url.includes('dashboard')) return <IconDashboard/>;
        if (url.includes('user')) return <IconUser/>;
        if (url.includes('exam') || url.includes('file')) return <IconFile/>;
        if (url.includes('question') || url.includes('storage')) return <IconStorage/>;
        if (url.includes('setting') || url.includes('config')) return <IconSettings/>;
        if (url.includes('home')) return <IconHome/>;

        // 3) 最终回退
        return <IconFile/>;
    };

    // 渲染菜单项
    const renderMenuItems = (menus: MenuTreeDto[]) => {
        return menus.map(menu => {
            if (menu.children && menu.children.length > 0) {
                return (
                    <SubMenu
                        key={menu.menuId}
                        title={
                            <span>
                                {getMenuIcon(menu)}
                                {menu.menuLabel}
                            </span>
                        }
                    >
                        {renderMenuItems(menu.children)}
                    </SubMenu>
                );
            } else {
                return (
                    <MenuItem key={menu.menuId}>
                        {getMenuIcon(menu)}
                        {menu.menuLabel}
                    </MenuItem>
                );
            }
        });
    };

    // 处理退出登录
    const handleLogout = async () => {
        try {
            // 调用后端登出API
            await logoutUser();
            // 清除本地用户信息
            clearUserInfo();
            logout();
            Message.success('退出登录成功');
        } catch (error) {
            console.error('登出失败:', error);
            // 即使后端调用失败，也要清除本地信息
            clearUserInfo();
            logout();
            Message.success('退出登录成功');
        }
    };

    // 处理消息按钮点击（下拉）
    const handleMessageDropdownVisible = (visible: boolean) => {
        setMessageDropdownVisible(visible);
        if (visible) {
            loadUnreadMessages();
        }
    };

    // 加载未读消息列表
    const loadUnreadMessages = async () => {
        setMessageLoading(true);
        try {
            const response = await getUnreadMessages(0, 10);
            setMessageList(response?.content || []);
        } catch (error) {
            console.error('Failed to load unread messages:', error);
            Message.error('加载消息失败');
        } finally {
            setMessageLoading(false);
        }
    };

    // 查看全部消息
    const handleViewAll = () => {
        setMessageDropdownVisible(false);
        navigate('/frame/systemmessage');
    };

    // 处理修改密码
    const handleChangePassword = () => {
        Message.info('修改密码功能');
        // TODO: 实现修改密码逻辑
    };

    // 用户下拉菜单点击处理
    const handleUserMenuClick = (key: string) => {
        switch (key) {
            case 'logout':
                handleLogout();
                break;
            case 'password':
                handleChangePassword();
                break;
            default:
                break;
        }
    };

    // 用户下拉菜单配置
    const userDropdownMenu = (
        <Menu onClickMenuItem={handleUserMenuClick}>
            <MenuItem key="password">
                <IconLock/>
                修改密码
            </MenuItem>
            <MenuItem key="divider" style={{height: '1px', backgroundColor: '#f2f3f5', margin: '4px 0'}} disabled/>
            <MenuItem key="logout">
                <IconPoweroff/>
                退出登录
            </MenuItem>
        </Menu>
    );

    return (
        <Layout className='app-layout'>
            <Header className="app-header" style={{
                backgroundColor: '#fff',
                padding: '10px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div></div>
                <Space size={6} align="center" className="header-actions">
                    <Tooltip content={theme === 'dark' ? '切换为亮色' : '切换为暗黑'} position="bottom">
                        <button
                            className="theme-toggle-btn"
                            type="button"
                            aria-label={theme === 'dark' ? '切换为亮色' : '切换为暗黑'}
                            onClick={() => handleThemeChange(theme !== 'dark')}
                        >
                            {theme === 'dark' ? <IconSun /> : <IconMoon />}
                        </button>
                    </Tooltip>
                    <Dropdown
                        trigger={['click']}
                        position="br"
                        popupVisible={messageDropdownVisible}
                        onVisibleChange={handleMessageDropdownVisible}
                        droplist={
                            <div className="system-message-dropdown" style={{ width: 340, maxHeight: 400, padding: 0 }}>
                                <div style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid #f0f0f0' }}>系统消息</div>
                                <Spin loading={messageLoading} style={{ minHeight: 180 }}>
                                    {messageList && messageList.length > 0 ? (
                                        <List
                                            dataSource={messageList}
                                            style={{ maxHeight: 260, overflowY: 'auto', margin: 0, padding: 0 }}
                                            render={(item: SystemMessageDto) => (
                                                <List.Item key={item.id} style={{ padding: '10px 16px' }}>
                                                    <List.Item.Meta
                                                        title={
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span>{item.title}</span>
                                                                <span
                                                                    style={{
                                                                        display: 'inline-block',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '12px',
                                                                        backgroundColor:
                                                                            item.type === 'SUCCESS'
                                                                                ? '#f6ffed'
                                                                                : item.type === 'WARNING'
                                                                                ? '#fffbe6'
                                                                                : item.type === 'ERROR'
                                                                                ? '#fff1f0'
                                                                                : '#f0f5ff',
                                                                        color:
                                                                            item.type === 'SUCCESS'
                                                                                ? '#52c41a'
                                                                                : item.type === 'WARNING'
                                                                                ? '#faad14'
                                                                                : item.type === 'ERROR'
                                                                                ? '#ff4d4f'
                                                                                : '#1890ff',
                                                                    }}
                                                                >
                                                                    {item.type}
                                                                </span>
                                                            </div>
                                                        }
                                                        description={
                                                            <div>
                                                                <div
                                                                    style={{
                                                                        color: '#999',
                                                                        fontSize: '12px',
                                                                        marginTop: '4px',
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: item.content?.substring(0, 100) || '',
                                                                    }}
                                                                />
                                                            </div>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    ) : (
                                        <Empty description="暂无未读消息" style={{ margin: '32px 0' }} />
                                    )}
                                </Spin>
                                <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 16px', textAlign: 'right' }}>
                                    <Button type="text" size="small" onClick={handleViewAll}>
                                        查看全部
                                    </Button>
                                </div>
                            </div>
                        }
                    >
                        <Tooltip content="系统消息" position="bottom" getPopupContainer={() => document.body}>
                            <Badge className="message-badge" count={unreadCount} maxCount={99} offset={[2, -2]}>
                                <button
                                    className="message-icon-btn"
                                    type="button"
                                    aria-label="系统消息"
                                    tabIndex={0}
                                >
                                    <IconNotification />
                                </button>
                            </Badge>
                        </Tooltip>
                    </Dropdown>
                    <Tooltip position="bottom" getPopupContainer={() => document.body}>
                        <Dropdown droplist={userDropdownMenu} position="br" getPopupContainer={() => document.body}>
                            <Button className="header-action-btn user-btn" type="text">
                                <Space size={8} align="center">
                                    <UserAvatar
                                        name={user?.userName || ''}
                                        size={24}
                                        style={{ backgroundColor: '#165DFF', color: '#fff' }}
                                    />
                                    <span className="user-name">{user?.userName}</span>
                                </Space>
                            </Button>
                        </Dropdown>
                    </Tooltip>
                </Space>
            </Header>
            

            
            <Layout style={{height:'calc(100% - 60px)'}}>
                <Sider
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    collapsible
                    trigger={collapsed ? <IconCaretRight/> : <IconCaretLeft/>}
                    breakpoint='xl'
                >
                    <Menu
                        selectedKeys={getSelectedKeys()}
                        openKeys={openKeys}
                        onClickMenuItem={handleMenuClick}
                        onClickSubMenu={(_key, keys) => setOpenKeys(keys)}
                        style={{width: '100%', height: '100%'}}
                    >
                        {menuTree && menuTree.length > 0 ? (
                            renderMenuItems(menuTree)
                        ) : (
                            <MenuItem key="no-menu" disabled>
                                <IconHome/>
                                暂无菜单
                            </MenuItem>
                        )}
                    </Menu>
                </Sider>
                <Content style={{height: '100%', padding: 0, overflow: 'auto'}}>
                    <Outlet/>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
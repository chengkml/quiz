import React, {useEffect, useState} from 'react';
import {Button, Dropdown, Layout, Menu, Message} from '@arco-design/web-react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import * as ArcoIcons from '@arco-design/web-react/icon';
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
} from '@arco-design/web-react/icon';
import {MenuTreeDto} from '../../types/menu';
import {useUser} from '@/contexts/UserContext';
import {clearUserInfo} from '@/utils/userUtils';
import {logoutUser} from '@/pages/User/api';
import './style.less';

const {Content, Header, Sider} = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const {user, logout, menuTree, loadMenuFromServer} = useUser();
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        setOpenKeys(getOpenKeys());
    }, [location.pathname, menuTree]);

    // 处理菜单点击
    const handleMenuClick = (key: string) => {
        const menu = findMenuByKey(menuTree, key);
        if (menu && menu.url) {
            navigate(`/quiz/frame/${menu.url}`);
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

        // 递归查找匹配的菜单项
        const findMatchingMenu = (menus: MenuTreeDto[]): string[] => {
            for (const menu of menus) {
                if (menu.url && path.includes(menu.url.replace('/', ''))) {
                    return [menu.menuId];
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

        // 递归查找需要展开的父菜单
        const findOpenKeys = (menus: MenuTreeDto[], parentKey?: string): boolean => {
            for (const menu of menus) {
                if (menu.url && path.includes(menu.url.replace('/', ''))) {
                    if (parentKey) {
                        openKeys.push(parentKey);
                    }
                    return true;
                }
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
            const IconComp = (ArcoIcons as any)[compName];
            if (IconComp) {
                return <IconComp/>;
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
            <Header style={{
                backgroundColor: '#fff',
                padding: '10px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end'
            }}>
                <Dropdown droplist={userDropdownMenu} position="br">
                    <Button
                        type="text"
                        icon={<IconUser/>}
                        style={{display: 'flex', alignItems: 'center'}}
                    >
                        <span style={{marginLeft: 8}}>{user?.userName}</span>
                    </Button>
                </Dropdown>
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
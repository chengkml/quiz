import React, {useEffect, useState} from 'react';
import {Button, Dropdown, Layout, Menu, Message, Space} from '@arco-design/web-react';
import {useLocation, useNavigate} from 'react-router-dom';
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
import './style.less';

const {Header, Content, Sider} = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const AppLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
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

    // 根据菜单配置获取图标
    const getMenuIcon = (menu: MenuTreeDto) => {
        // 如果菜单有图标配置，使用配置的图标
        if (menu.menuIcon) {
            // 这里可以根据图标名称返回对应的图标组件
            switch (menu.menuIcon) {
                case 'dashboard':
                    return <IconDashboard/>;
                case 'user':
                    return <IconUser/>;
                case 'settings':
                    return <IconSettings/>;
                case 'file':
                    return <IconFile/>;
                case 'storage':
                    return <IconStorage/>;
                case 'lock':
                    return <IconLock/>;
                default:
                    return <IconFile/>;
            }
        }

        // 根据菜单路径或名称提供默认图标
        if (menu.url) {
            if (menu.url.includes('dashboard')) return <IconDashboard/>;
            if (menu.url.includes('user')) return <IconUser/>;
            if (menu.url.includes('exam')) return <IconFile/>;
            if (menu.url.includes('question')) return <IconStorage/>;
            if (menu.url.includes('setting')) return <IconSettings/>;
        }

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
    const handleLogout = () => {
        clearUserInfo();
        logout();
        Message.success('退出登录成功');
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
            <Sider
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                collapsible
                trigger={collapsed ? <IconCaretRight/> : <IconCaretLeft/>}
                breakpoint='xl'
            >
                <div className='logo'/>
                <Menu
                    selectedKeys={getSelectedKeys()}
                    openKeys={getOpenKeys()}
                    onClickMenuItem={handleMenuClick}
                    style={{width: '100%'}}
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
            <Layout>
                <Header className="app-header">
                    <div className="header-content">
                        <div className="header-left">
                            <h2>Quiz管理系统</h2>
                        </div>
                        <div className="header-right">
                            <Space>
                                <span>欢迎，{user?.username || '用户'}</span>
                                <Dropdown droplist={userDropdownMenu} position="br">
                                    <Button type="text" icon={<IconUser />}>
                                        {user?.username || '用户'}
                                    </Button>
                                </Dropdown>
                            </Space>
                        </div>
                    </div>
                </Header>
                <Layout>
                    <Content>Content</Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
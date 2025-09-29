import React, {useEffect, useState} from 'react';
import {Button, Dropdown, Layout, Menu, Message, Spin} from '@arco-design/web-react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
  IconDashboard,
  IconDown,
  IconFile,
  IconLock,
  IconPoweroff,
  IconSettings,
  IconStorage,
  IconUser,
} from '@arco-design/web-react/icon';
import {MenuTreeDto} from '../../types/menu';
import {useUser} from '@/contexts/UserContext';
import {clearUserInfo, getUserDisplayName} from '@/utils/userUtils';
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
        // 在菜单树中查找对应的菜单项
        const findMenuByKey = (menus: MenuTreeDto[], targetKey: string): MenuTreeDto | null => {
            for (const menu of menus) {
                if (menu.menuName === targetKey) {
                    return menu;
                }
                if (menu.children) {
                    const found = findMenuByKey(menu.children, targetKey);
                    if (found) return found;
                }
            }
            return null;
        };

        const menuItem = findMenuByKey(menuTree || [], key);
        if (menuItem && menuItem.menuExtConf) {
            try {
                const extConf = typeof menuItem.menuExtConf === 'string' 
                    ? JSON.parse(menuItem.menuExtConf) 
                    : menuItem.menuExtConf;
                if (extConf.path) {
                    // 直接跳转到对应路径，不带frame前缀
                    navigate(extConf.path);
                    return;
                }
            } catch (error) {
                console.error('解析菜单扩展配置失败:', error);
            }
        }
        
        // 如果没有找到对应的菜单项或路径，使用默认路径
        navigate(`/${key}`);
    };

    // 获取菜单选中项
    const getSelectedKeys = () => {
        const path = location.pathname;
        
        // 递归查找匹配的菜单项
        const findMatchingMenu = (menus: MenuTreeDto[]): string[] => {
            for (const menu of menus) {
                if (menu.menuExtConf) {
                    try {
                        const extConf = typeof menu.menuExtConf === 'string' 
                            ? JSON.parse(menu.menuExtConf) 
                            : menu.menuExtConf;
                        if (extConf.path && path.includes(extConf.path.replace('/', ''))) {
                            return [menu.menuName];
                        }
                    } catch (error) {
                        console.error('解析菜单扩展配置失败:', error);
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

    // 获取展开的菜单项
    const getOpenKeys = () => {
        const path = location.pathname;
        const openKeys: string[] = [];
        
        // 递归查找需要展开的父菜单
        const findOpenKeys = (menus: MenuTreeDto[], parentKey?: string): boolean => {
            for (const menu of menus) {
                if (menu.menuExtConf) {
                    try {
                        const extConf = typeof menu.menuExtConf === 'string' 
                            ? JSON.parse(menu.menuExtConf) 
                            : menu.menuExtConf;
                        if (extConf.path && path.includes(extConf.path.replace('/', ''))) {
                            if (parentKey) {
                                openKeys.push(parentKey);
                            }
                            return true;
                        }
                    } catch (error) {
                        console.error('解析菜单扩展配置失败:', error);
                    }
                }
                
                if (menu.children && findOpenKeys(menu.children, menu.menuName)) {
                    if (parentKey) {
                        openKeys.push(parentKey);
                    }
                    openKeys.push(menu.menuName);
                    return true;
                }
            }
            return false;
        };

        findOpenKeys(menuTree || []);
        return openKeys;
    };

    // 根据菜单路径获取图标
    const getMenuIcon = (menuExtConf?: any, icon?: string) => {
        // 如果后台返回了图标，可以在这里处理图标映射
        if (icon) {
            // 这里可以根据icon字符串返回对应的React图标组件
            // 暂时使用默认图标
        }

        // 解析菜单扩展配置获取路径
        let path = '';
        if (menuExtConf) {
            try {
                const extConf = typeof menuExtConf === 'string' ? JSON.parse(menuExtConf) : menuExtConf;
                path = extConf.path || '';
            } catch (error) {
                console.error('解析菜单扩展配置失败:', error);
            }
        }

        // 根据路径返回默认图标
        if (path?.includes('dataset')) {
            if (path.includes('list')) return <IconStorage/>;
            if (path.includes('upload')) return <IconFile/>;
            if (path.includes('analysis')) return <IconDashboard/>;
            return <IconStorage/>;
        }
        if (path?.includes('datasource')) {
            return <IconStorage/>;
        }
        if (path?.includes('synthesizers')) {
            return <IconSettings/>;
        }
        if (path?.includes('system') || path?.includes('user') || path?.includes('role')) {
            return <IconUser/>;
        }
        if (path?.includes('permission')) {
            return <IconSettings/>;
        }
        return <IconDashboard/>;
    };

    // 渲染菜单项
    const renderMenuItems = (menus: MenuTreeDto[]) => {
        return menus.map(menu => {
            if (menu.children && menu.children.length > 0) {
                return (
                    <SubMenu
                        key={menu.menuName}
                        title={
                            <span>
                                {getMenuIcon(menu.menuExtConf, menu.icon)}
                                {menu.menuLabel}
                            </span>
                        }
                    >
                        {renderMenuItems(menu.children)}
                    </SubMenu>
                );
            } else {
                return (
                    <MenuItem key={menu.menuName}>
                        {getMenuIcon(menu.menuExtConf, menu.icon)}
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

    // 处理选择团队
    const handleSelectTeam = () => {
        Message.info('选择团队功能');
        // TODO: 实现选择团队逻辑
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
            case 'team':
                handleSelectTeam();
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
            <MenuItem key="team">
                <IconUser/>
                选择团队
            </MenuItem>
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
        <Layout className="app-layout">
            <Header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="app-title">Quiz Management System</div>
                    </div>
                    <div className="header-right">
                        <Dropdown droplist={userDropdownMenu} trigger="click">
                            <Button type="text" className="user-dropdown-btn">
                                <IconUser/>
                                <span className="user-name">{getUserDisplayName(user)}</span>
                                <IconDown/>
                            </Button>
                        </Dropdown>
                    </div>
                </div>
            </Header>
            <Layout>
                <Sider
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    collapsible
                    width={240}
                    className="app-sider"
                >
                    {loading ? (
                        <div style={{padding: '20px', textAlign: 'center'}}>
                            <Spin size={16}/>
                        </div>
                    ) : (
                        <Menu
                            mode="vertical"
                            selectedKeys={getSelectedKeys()}
                            openKeys={getOpenKeys()}
                            onClickMenuItem={handleMenuClick}
                            className="side-menu"
                        >
                            {renderMenuItems(menuTree || [])}
                        </Menu>
                    )}
                </Sider>
                <Layout>
                    <Content className="app-content">
                        <Outlet/>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
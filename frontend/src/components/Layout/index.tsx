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
import asiainfoLogo from '../../assets/logo.png';
import {MenuTreeDto} from '../../types/menu';
import {useUser} from '@/contexts/UserContext';
import {clearUserInfo, getUserDisplayName} from '@/utils/userUtils';
import './style.less';

const {Header, Content, Footer, Sider} = Layout;
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const AppLayout: React.FC = () => {
    const [sideMenuItems, setSideMenuItems] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [activeTopMenu, setActiveTopMenu] = useState(() => {
        // 初始化时先使用默认值，后续会在useEffect中更新
        return 'dashboard';
    });
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
        const targets = getSideMenuItems();
        setSideMenuItems(targets);
    }, [activeTopMenu, menuTree]);


    // 根据当前路径和菜单数据设置activeTopMenu
    useEffect(() => {
        if (menuTree && menuTree.length > 0) {
            const path = location.pathname;
            const topMenuItems = getTopMenuItems();

            // 根据路径匹配菜单项
            for (const item of topMenuItems) {
                const extConf = typeof item.menuExtConf === 'string' ? JSON.parse(item.menuExtConf) : item.menuExtConf;
                if(extConf) {
                    if (extConf.path && path.includes(extConf.path.replace('/', ''))) {
                        setActiveTopMenu(item.key);
                        return;
                    }
                }
            }
        }
    }, [menuTree]);

    // 根据当前路径设置顶部菜单选中项
    const getTopSelectedKeys = () => {
        return [activeTopMenu];
    };

    // 处理顶部菜单点击
    const handleTopMenuClick = (key: string) => {
        // 如果点击的是当前已选中的菜单，不执行任何操作
        if (key === activeTopMenu) {
            return;
        }

        setActiveTopMenu(key);

        // setSideMenuItems(getSideMenuItems(key));

        // 找到对应的顶级菜单
        const topMenu = menuTree.find(menu => {
            let menuPath = '';
            if (menu.menuExtConf) {
                try {
                    const extConf = typeof menu.menuExtConf === 'string' ? JSON.parse(menu.menuExtConf) : menu.menuExtConf;
                    menuPath = extConf.path || '';
                } catch (error) {
                    console.error('解析菜单扩展配置失败:', error);
                }
            }
            return menuPath?.includes(key) || menu.menuName === key;
        });

        // 如果有子菜单，导航到第一个子菜单
        if (topMenu && topMenu.children && topMenu.children.length > 0) {
            const firstChild = topMenu.children[0];
            if (firstChild.menuExtConf) {
                try {
                    const extConf = typeof firstChild.menuExtConf === 'string'
                        ? JSON.parse(firstChild.menuExtConf)
                        : firstChild.menuExtConf;
                    if (extConf.path) {
                        navigate('/data_synth/frame/'+extConf.path);
                        return;
                    }
                } catch (error) {
                    console.error('解析菜单扩展配置失败:', error);
                }
            }else{
                navigate('/data_synth/frame/notfound');
            }
        } else {
            // 如果没有子菜单，导航到顶级菜单路径
            const topMenuItems = getTopMenuItems();
            const menuItem = topMenuItems.find(item => item.key === key);
            const extConf = typeof menuItem.menuExtConf === 'string'
                ? JSON.parse(menuItem.menuExtConf)
                : menuItem.menuExtConf;
            if (menuItem && extConf.path) {
                navigate('/data_synth/frame/'+extConf.path);
            } else {
                navigate('/data_synth/frame/'+`${key}`);
            }
        }
    };

    // 处理左侧菜单点击
    const handleSideMenuClick = (key: string) => {
        // 从菜单树中找到对应的菜单项
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

        const menuItem = findMenuByKey(menuTree, key);
        if (menuItem && menuItem.menuExtConf) {
            try {
                const extConf = typeof menuItem.menuExtConf === 'string'
                    ? JSON.parse(menuItem.menuExtConf)
                    : menuItem.menuExtConf;
                if (extConf.path) {
                    navigate('/data_synth/frame/'+extConf.path);
                    return;
                }
            } catch (error) {
                console.error('解析菜单扩展配置失败:', error);
            }
        }
        // 如果没有找到对应的菜单项或路径，使用默认路径
        navigate(`/data_synth/frame/${activeTopMenu}/${key}`);
    };

    // 获取左侧菜单选中项
    const getSideSelectedKeys = () => {
        const path = location.pathname;
        const sideMenuItems = getSideMenuItems();

        // 首先尝试精确匹配菜单项的路径
        for (const item of sideMenuItems) {
            const extConf = typeof item.menuExtConf === 'string' ? JSON.parse(item.menuExtConf) : item.menuExtConf;
            if (extConf&&extConf.path && path === extConf.path) {
                return [extConf.key];
            }
        }

        // 如果精确匹配失败，尝试包含匹配
        for (const item of sideMenuItems) {
            const extConf = typeof item.menuExtConf === 'string' ? JSON.parse(item.menuExtConf) : item.menuExtConf;
            if (extConf&&extConf.path && path.includes(extConf.path.replace('/', ''))) {
                return [item.key];
            }
        }

        // 最后使用路径分段匹配（兜底逻辑）
        const pathSegments = path.split('/');
        if (pathSegments.length > 2) {
            const targetKey = pathSegments[2];
            // 检查是否存在对应的菜单项
            const menuItem = sideMenuItems.find(item => item.key === targetKey);
            if (menuItem) {
                return [targetKey];
            }
        }

        return [];
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

    // 从菜单树中获取对应顶级菜单的子菜单
    const getSideMenuItems = (topKey?: string) => {
        const currentKey = topKey || activeTopMenu;
        if (!menuTree || menuTree.length === 0) return [];

        const topMenu = menuTree.find(menu => {
            let menuPath = '';
            if (menu.menuExtConf) {
                try {
                    const extConf = typeof menu.menuExtConf === 'string' ? JSON.parse(menu.menuExtConf) : menu.menuExtConf;
                    menuPath = extConf.path || '';
                } catch (error) {
                    console.error('解析菜单扩展配置失败:', error);
                }
            }
            return menuPath?.includes(currentKey) || menu.menuName === currentKey;
        });

        if (!topMenu?.children) return [];

        return topMenu.children.map(child => {
            let childPath = '';
            if (child.menuExtConf) {
                try {
                    const extConf = typeof child.menuExtConf === 'string' ? JSON.parse(child.menuExtConf) : child.menuExtConf;
                    childPath = extConf.path || '';
                } catch (error) {
                    console.error('解析菜单扩展配置失败:', error);
                }
            }
            return {
                key: child.menuName,
                label: child.menuLabel,
                menuExtConf: child.menuExtConf,
                icon: getMenuIcon(child.menuExtConf, child.icon),
                path: childPath
            };
        });
    };
    // 获取顶级菜单项
    const getTopMenuItems = () => {
        if (!menuTree || menuTree.length === 0) {
            // 如果没有菜单数据，返回默认菜单
            return [];
        }

        // 使用menuTree的一级数据
        return menuTree.map(menu => {
            return {
                key: menu.menuName,
                label: menu.menuLabel,
                menuExtConf: menu.menuExtConf
            };
        });
    };

    // 获取顶级菜单名称
    const getTopMenuName = (key: string) => {
        const topMenuItems = getTopMenuItems();
        const menuItem = topMenuItems.find(item => item.key === key);
        return menuItem ? menuItem.label : '';
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
                        <div className="logo">
                            <img src={asiainfoLogo} alt="Logo"/>
                        </div>
                        <Menu
                            mode="horizontal"
                            selectedKeys={getTopSelectedKeys()}
                            onClickMenuItem={handleTopMenuClick}
                            className="top-menu"
                            triggerProps={{
                                autoAlignPopupWidth: false,
                                autoAlignPopupMinWidth: true,
                                position: 'bl'
                            }}
                            ellipsis={false}
                        >
                            {getTopMenuItems().map(item => (
                                <MenuItem key={item.key}>
                                    {item.label}
                                </MenuItem>
                            ))}
                        </Menu>
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
                {sideMenuItems.length > 0 && (
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
                                selectedKeys={getSideSelectedKeys()}
                                onClickMenuItem={handleSideMenuClick}
                                className="side-menu"
                            >
                                {sideMenuItems.map(item => (
                                    <MenuItem key={item.key}>
                                        {item.icon}
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        )}
                    </Sider>
                )}
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
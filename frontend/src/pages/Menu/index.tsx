import React, {useEffect, useState} from 'react';
import {
    Button,
    Cascader,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Message,
    Modal,
    Select,
    Space,
    Table,
    Tag,
} from '@arco-design/web-react';
import './style/index.less';
import {createMenu, deleteMenu, disableMenu, enableMenu, getMenuList, getMenuTree, updateMenu,} from './api';
import {
    IconApps,
    IconArchive,
    IconBook,
    IconBug,
    IconBulb,
    IconCalendar,
    IconCamera,
    IconCheckCircle,
    IconClockCircle,
    IconCloud,
    IconCloudDownload,
    IconCode,
    IconCommand,
    IconCompass,
    IconCopy,
    IconCustomerService,
    IconDashboard,
    IconDelete,
    IconDesktop,
    IconDice,
    IconDownload,
    IconDriveFile,
    IconEar,
    IconEdit,
    IconEmail,
    IconExclamation,
    IconEye,
    IconEyeInvisible,
    IconFaceSmileFill,
    IconFile,
    IconFire,
    IconFolder,
    IconGift,
    IconHeart,
    IconHistory,
    IconHome,
    IconIdcard,
    IconImage,
    IconInfo,
    IconInteraction,
    IconLanguage,
    IconLink,
    IconList,
    IconLoading,
    IconLocation,
    IconLock,
    IconMenu,
    IconMindMapping,
    IconMobile,
    IconMusic,
    IconNav,
    IconNotification,
    IconPalette,
    IconPhone,
    IconPlayArrow,
    IconPlus,
    IconPoweroff,
    IconPrinter,
    IconPushpin,
    IconQrcode,
    IconQuestionCircle,
    IconRecord,
    IconRefresh,
    IconReply,
    IconRobot,
    IconSafe,
    IconSave,
    IconScan,
    IconSchedule,
    IconSearch,
    IconSelectAll,
    IconSend,
    IconSettings,
    IconShake,
    IconShareAlt,
    IconSound,
    IconStar,
    IconStorage,
    IconSync,
    IconTag,
    IconThumbUp,
    IconThunderbolt,
    IconTiktokColor,
    IconTool,
    IconTranslate,
    IconTrophy,
    IconUndo,
    IconUpload,
    IconUser,
    IconUserGroup,
    IconVideoCamera,
    IconVoice,
    IconWechat,
    IconWifi,
    IconZoomIn,
    IconZoomOut,
} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';
import * as ArcoIcons from '@arco-design/web-react/icon';

const {TextArea} = Input;
const {Content} = Layout;

function MenuManager() {
    // 状态管理
    const [tableData, setTableData] = useState([]);
    const [tableLoading, setTableLoading] = useState(false);
    const [tableScrollHeight, setTableScrollHeight] = useState(200);
    const [menuTree, setMenuTree] = useState([]);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [currentMenu, setCurrentMenu] = useState(null);

    // 分页状态
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
        pageSizeOptions: ['10', '20', '50', '100'],
    });

    // 查询条件
    const [searchParams, setSearchParams] = useState({
        menuName: '',
        menuType: '',
        state: '',
        parentId: '',
    });

    // 表单引用
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [searchForm] = Form.useForm();

    // 菜单类型选项
    const menuTypeOptions = [
        {label: '目录', value: 'DIRECTORY'},
        {label: '菜单', value: 'MENU'},
        {label: '按钮', value: 'BUTTON'},
    ];

    // 菜单状态选项
    const menuStateOptions = [
        {label: '启用', value: 'ENABLED'},
        {label: '禁用', value: 'DISABLED'},
    ];

    // 菜单图标选项
    const menuIconOptions = [
        // 基础功能图标
        {label: '仪表盘', value: 'IconDashboard', icon: <IconDashboard/>},
        {label: '菜单', value: 'IconMenu', icon: <IconMenu/>},
        {label: '首页', value: 'IconHome', icon: <IconHome/>},
        {label: '应用', value: 'IconApps', icon: <IconApps/>},
        {label: '桌面', value: 'IconDesktop', icon: <IconDesktop/>},
        {label: '导航', value: 'IconNav', icon: <IconNav/>},

        // 文件和文档图标
        {label: '文件', value: 'IconFile', icon: <IconFile/>},
        {label: '文件夹', value: 'IconFolder', icon: <IconFolder/>},
        {label: '书籍', value: 'IconBook', icon: <IconBook/>},
        {label: '驱动文件', value: 'IconDriveFile', icon: <IconDriveFile/>},
        {label: '复制', value: 'IconCopy', icon: <IconCopy/>},
        {label: '列表', value: 'IconList', icon: <IconList/>},
        {label: '归档', value: 'IconArchive', icon: <IconArchive/>},
        {label: '保存', value: 'IconSave', icon: <IconSave/>},
        {label: '下载', value: 'IconDownload', icon: <IconDownload/>},
        {label: '上传', value: 'IconUpload', icon: <IconUpload/>},

        // 用户和权限图标
        {label: '用户', value: 'IconUser', icon: <IconUser/>},
        {label: '用户组', value: 'IconUserGroup', icon: <IconUserGroup/>},
        {label: '身份证', value: 'IconIdcard', icon: <IconIdcard/>},
        {label: '锁定', value: 'IconLock', icon: <IconLock/>},
        {label: '安全', value: 'IconSafe', icon: <IconSafe/>},

        // 系统和设置图标
        {label: '设置', value: 'IconSettings', icon: <IconSettings/>},
        {label: '存储', value: 'IconStorage', icon: <IconStorage/>},
        {label: '工具', value: 'IconTool', icon: <IconTool/>},
        {label: '命令', value: 'IconCommand', icon: <IconCommand/>},
        {label: '代码', value: 'IconCode', icon: <IconCode/>},
        {label: '调试', value: 'IconBug', icon: <IconBug/>},
        {label: '刷新', value: 'IconRefresh', icon: <IconRefresh/>},
        {label: '同步', value: 'IconSync', icon: <IconSync/>},
        {label: '电源', value: 'IconPoweroff', icon: <IconPoweroff/>},

        // 通信和联系图标
        {label: '邮件', value: 'IconEmail', icon: <IconEmail/>},
        {label: '电话', value: 'IconPhone', icon: <IconPhone/>},
        {label: '手机', value: 'IconMobile', icon: <IconMobile/>},
        {label: '发送', value: 'IconSend', icon: <IconSend/>},
        {label: '通知', value: 'IconNotification', icon: <IconNotification/>},
        {label: '客服', value: 'IconCustomerService', icon: <IconCustomerService/>},
        {label: '微信', value: 'IconWechat', icon: <IconWechat/>},
        {label: '分享', value: 'IconShareAlt', icon: <IconShareAlt/>},
        {label: '回复', value: 'IconReply', icon: <IconReply/>},

        // 媒体和娱乐图标
        {label: '图片', value: 'IconImage', icon: <IconImage/>},
        {label: '相机', value: 'IconCamera', icon: <IconCamera/>},
        {label: '摄像头', value: 'IconVideoCamera', icon: <IconVideoCamera/>},
        {label: '调色板', value: 'IconPalette', icon: <IconPalette/>},
        {label: '笑脸', value: 'IconFaceSmileFill', icon: <IconFaceSmileFill/>},
        {label: '心形', value: 'IconHeart', icon: <IconHeart/>},
        {label: '星星', value: 'IconStar', icon: <IconStar/>},
        {label: '奖杯', value: 'IconTrophy', icon: <IconTrophy/>},
        {label: '礼物', value: 'IconGift', icon: <IconGift/>},
        {label: '音乐', value: 'IconMusic', icon: <IconMusic/>},
        {label: '声音', value: 'IconSound', icon: <IconSound/>},
        {label: '语音', value: 'IconVoice', icon: <IconVoice/>},
        {label: '播放', value: 'IconPlayArrow', icon: <IconPlayArrow/>},
        {label: '录制', value: 'IconRecord', icon: <IconRecord/>},
        {label: '点赞', value: 'IconThumbUp', icon: <IconThumbUp/>},

        // 导航和位置图标
        {label: '搜索', value: 'IconSearch', icon: <IconSearch/>},
        {label: '指南针', value: 'IconCompass', icon: <IconCompass/>},
        {label: '位置', value: 'IconLocation', icon: <IconLocation/>},
        {label: '链接', value: 'IconLink', icon: <IconLink/>},
        {label: '放大', value: 'IconZoomIn', icon: <IconZoomIn/>},
        {label: '缩小', value: 'IconZoomOut', icon: <IconZoomOut/>},
        {label: '全选', value: 'IconSelectAll', icon: <IconSelectAll/>},

        // 时间和日程图标
        {label: '日历', value: 'IconCalendar', icon: <IconCalendar/>},
        {label: '日程', value: 'IconSchedule', icon: <IconSchedule/>},
        {label: '历史', value: 'IconHistory', icon: <IconHistory/>},
        {label: '时钟', value: 'IconClockCircle', icon: <IconClockCircle/>},
        {label: '撤销', value: 'IconUndo', icon: <IconUndo/>},

        // 网络和云服务图标
        {label: '云', value: 'IconCloud', icon: <IconCloud/>},
        {label: '云下载', value: 'IconCloudDownload', icon: <IconCloudDownload/>},
        {label: 'WiFi', value: 'IconWifi', icon: <IconWifi/>},
        {label: '加载', value: 'IconLoading', icon: <IconLoading/>},

        // 商业和购物图标
        {label: '标签', value: 'IconTag', icon: <IconTag/>},

        // 工作流程图标
        {label: '检查', value: 'IconCheckCircle', icon: <IconCheckCircle/>},
        {label: '图钉', value: 'IconPushpin', icon: <IconPushpin/>},
        {label: '交互', value: 'IconInteraction', icon: <IconInteraction/>},
        {label: '思维导图', value: 'IconMindMapping', icon: <IconMindMapping/>},
        {label: '火焰', value: 'IconFire', icon: <IconFire/>},
        {label: '灯泡', value: 'IconBulb', icon: <IconBulb/>},

        // 其他功能图标
        {label: '打印机', value: 'IconPrinter', icon: <IconPrinter/>},
        {label: '机器人', value: 'IconRobot', icon: <IconRobot/>},
        {label: '闪电', value: 'IconThunderbolt', icon: <IconThunderbolt/>},
        {label: '语言', value: 'IconLanguage', icon: <IconLanguage/>},
        {label: '翻译', value: 'IconTranslate', icon: <IconTranslate/>},
        {label: '信息', value: 'IconInfo', icon: <IconInfo/>},
        {label: '问号', value: 'IconQuestionCircle', icon: <IconQuestionCircle/>},
        {label: '感叹号', value: 'IconExclamation', icon: <IconExclamation/>},
        {label: '二维码', value: 'IconQrcode', icon: <IconQrcode/>},
        {label: '扫描', value: 'IconScan', icon: <IconScan/>},
        {label: '眼睛', value: 'IconEye', icon: <IconEye/>},
        {label: '隐藏', value: 'IconEyeInvisible', icon: <IconEyeInvisible/>},
        {label: '耳朵', value: 'IconEar', icon: <IconEar/>},
        {label: '骰子', value: 'IconDice', icon: <IconDice/>},
        {label: '震动', value: 'IconShake', icon: <IconShake/>},
        {label: '抖音', value: 'IconTiktokColor', icon: <IconTiktokColor/>},
    ];

    // 转换菜单树为级联选择器数据
    const convertMenuTreeToCascaderData = (menuTree) => {
        return menuTree.map(menu => ({
            value: menu.menuId,
            label: menu.menuLabel,
            children: menu.children && menu.children.length > 0
                ? convertMenuTreeToCascaderData(menu.children)
                : undefined
        }));
    };

    // 查找菜单在树中的完整路径
    const findMenuPath = (menuTree, targetId, path = []) => {
        for (const menu of menuTree) {
            const currentPath = [...path, menu.menuId];

            if (menu.menuId === targetId) {
                return currentPath;
            }

            if (menu.children && menu.children.length > 0) {
                const result = findMenuPath(menu.children, targetId, currentPath);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    };

    // 获取菜单树数据
    const fetchMenuTree = async () => {
        try {
            const response = await getMenuTree();
            setMenuTree(response.data || []);
        } catch (error) {
            console.error('获取菜单树失败:', error);
        }
    };

    // 根据英文编码渲染图标组件（用于列表与详情展示）
    const renderIconByName = (iconName?: string) => {
        if (!iconName) return null;
        const IconComp = (ArcoIcons as any)[iconName];
        if (IconComp) return <IconComp/>;
        const fallback = menuIconOptions.find(opt => opt.value === iconName);
        return fallback ? fallback.icon : null;
    };

    // 表格列定义
    const columns = [
        {
            title: '菜单编码',
            dataIndex: 'menuName',
            key: 'menuName',
            width: 150,
        },
        {
            title: '菜单名称',
            dataIndex: 'menuLabel',
            key: 'menuLabel',
            width: 150,
        },
        {
            title: '菜单类型',
            dataIndex: 'menuType',
            key: 'menuType',
            width: 100,
            render: (type) => {
                const typeMap = {
                    'DIRECTORY': {color: 'blue', text: '目录'},
                    'MENU': {color: 'green', text: '菜单'},
                    'BUTTON': {color: 'orange', text: '按钮'},
                };
                const config = typeMap[type] || {color: 'gray', text: type};
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '路由地址',
            dataIndex: 'url',
            key: 'url',
            width: 200,
            ellipsis: true,
        },
        {
            title: '图标',
            dataIndex: 'menuIcon',
            key: 'menuIcon',
            width: 80,
            render: (iconName) => {
                const iconEl = renderIconByName(iconName);
                return iconEl ? iconEl : '-';
            }
        },
        {
            title: '排序',
            dataIndex: 'seq',
            key: 'seq',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'state',
            key: 'state',
            width: 80,
            render: (state) => {
                const stateMap = {
                    'ENABLED': {color: 'green', text: '启用'},
                    'DISABLED': {color: 'red', text: '禁用'},
                };
                const config = stateMap[state] || {color: 'gray', text: state};
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createDate',
            key: 'createDate',
            width: 180,
            render: (date) => date ? new Date(date).toLocaleString() : '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="large" className="dropdown-demo table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu
                                onClickMenuItem={(key, e) => {
                                    handleMenuClick(key, e, record);
                                }}
                                className="handle-dropdown-menu"
                            >
                                <Menu.Item key="view">
                                    <IconEye style={{marginRight: '5px'}}/>
                                    查看详情
                                </Menu.Item>
                                <Menu.Item key="edit">
                                    <IconEdit style={{marginRight: '5px'}}/>
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="toggle">
                                    {record.state === 'ENABLED' ? (
                                        <>
                                            <IconPoweroff style={{marginRight: '5px'}}/>
                                            禁用
                                        </>
                                    ) : (
                                        <>
                                            <IconPoweroff style={{marginRight: '5px'}}/>
                                            启用
                                        </>
                                    )}
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <IconDelete style={{marginRight: '5px'}}/>
                                    删除
                                </Menu.Item>
                            </Menu>
                        }
                    >
                        <Button
                            type="text"
                            className="more-btn"
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <IconList/>
                        </Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 获取菜单列表
    const fetchMenuList = async (params = {}) => {
        setTableLoading(true);
        try {
            const queryParams = {
                ...searchParams,
                ...params,
                pageNum: pagination.current - 1,
                pageSize: pagination.pageSize,
            };

            const response = await getMenuList(queryParams);
            if (response.data) {
                setTableData(response.data.content || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.totalElements || 0,
                }));
            }
        } catch (error) {
            Message.error('获取菜单列表失败');
            console.error('获取菜单列表失败:', error);
        } finally {
            setTableLoading(false);
        }
    };

    // 处理搜索
    const handleSearch = (values) => {
        setSearchParams(values);
        setPagination(prev => ({...prev, current: 1}));
        fetchMenuList(values);
    };

    // 处理重置
    const handleReset = () => {
        searchForm.resetFields();
        const resetParams = {
            menuName: '',
            menuType: '',
            state: '',
            parentId: '',
        };
        setSearchParams(resetParams);
        setPagination(prev => ({...prev, current: 1}));
        fetchMenuList(resetParams);
    };

    // 处理分页变化
    const handleTableChange = (pagination) => {
        setPagination(prev => ({...prev, ...pagination}));
        fetchMenuList();
    };

    // 处理新增
    const handleAdd = () => {
        setCurrentMenu(null);
        addForm.resetFields();
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = (record) => {
        setCurrentMenu(record);

        // 处理父菜单路径回显
        const formValues = {...record};
        if (record.parentId && menuTree.length > 0) {
            const parentPath = findMenuPath(menuTree, record.parentId);
            if (parentPath) {
                formValues.parentId = parentPath;
            }
        }

        editForm.setFieldsValue(formValues);
        setEditModalVisible(true);
    };

    // 处理查看
    const handleView = (record) => {
        setCurrentMenu(record);
        setViewModalVisible(true);
    };

    // 处理删除
    const handleDelete = (record) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除菜单"${record.menuLabel || record.menuName}"吗？`,
            onOk: async () => {
                try {
                    await deleteMenu(record.menuId);
                    Message.success('删除成功');
                    fetchMenuList();
                } catch (error) {
                    Message.error('删除失败');
                    console.error('删除菜单失败:', error);
                }
            },
        });
    };

    // 处理状态切换
    const handleToggleState = async (record) => {
        try {
            if (record.state === 'ENABLED') {
                await disableMenu(record.menuId);
                Message.success('禁用成功');
            } else {
                await enableMenu(record.menuId);
                Message.success('启用成功');
            }
            fetchMenuList();
        } catch (error) {
            Message.error('操作失败');
            console.error('切换菜单状态失败:', error);
        }
    };

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'view') {
            handleView(record);
        } else if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'toggle') {
            handleToggleState(record);
        } else if (key === 'delete') {
            handleDelete(record);
        }
    };

    // 处理新增提交
    const handleAddSubmit = async (values) => {
        try {
            // 处理级联选择器的值，取最后一个作为父菜单ID
            const submitValues = {...values};
            if (values.parentId && Array.isArray(values.parentId)) {
                submitValues.parentId = values.parentId[values.parentId.length - 1];
            }

            await createMenu(submitValues);
            Message.success('创建成功');
            setAddModalVisible(false);
            fetchMenuList();
        } catch (error) {
            Message.error('创建失败');
            console.error('创建菜单失败:', error);
        }
    };

    // 处理编辑提交
    const handleEditSubmit = async (values) => {
        try {
            // 处理级联选择器的值，取最后一个作为父菜单ID
            const submitValues = {...values};
            if (values.parentId && Array.isArray(values.parentId)) {
                submitValues.parentId = values.parentId[values.parentId.length - 1];
            }

            await updateMenu(currentMenu.menuId, submitValues);
            Message.success('更新成功');
            setEditModalVisible(false);
            fetchMenuList();
        } catch (error) {
            Message.error('更新失败');
            console.error('更新菜单失败:', error);
        }
    };

    // 初始化
    useEffect(() => {
        fetchMenuList();
        fetchMenuTree();
    }, []);

    // 搜索表单配置
    const searchFormItems = [
        {
            label: '菜单编码',
            field: 'menuName',
            component: <Input placeholder="请输入菜单编码"/>,
        },
        {
            label: '菜单类型',
            field: 'menuType',
            component: (
                <Select placeholder="请选择菜单类型" allowClear>
                    {menuTypeOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
        {
            label: '状态',
            field: 'state',
            component: (
                <Select placeholder="请选择状态" allowClear>
                    {menuStateOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
    ];

    return (
        <div className="menu-manager">
            <Layout>
                <Content>
                    {/* 搜索区域 */}
                    <FilterForm
                        form={searchForm}
                        items={searchFormItems}
                        onSearch={handleSearch}
                        onReset={handleReset}
                    >
                        <Form.Item field='menuName' label='菜单名'>
                            <Input
                                placeholder='请输入菜单名关键词'
                            />
                        </Form.Item>
                    </FilterForm>

                    {/* 操作按钮区域 */}
                    <div className="action-buttons">
                        <Button
                            type="primary"
                            icon={<IconPlus/>}
                            onClick={handleAdd}
                        >
                            新增菜单
                        </Button>
                    </div>

                    {/* 表格区域 */}
                    <Table
                        columns={columns}
                        data={tableData}
                        loading={tableLoading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{
                            x: 1200,
                            y: tableScrollHeight,
                        }}
                        rowKey="menuId"
                    />
                </Content>
            </Layout>

            {/* 新增菜单对话框 */}
            <Modal
                title="新增菜单"
                visible={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                onOk={() => addForm.submit()}
                width={600}
            >
                <Form
                    form={addForm}
                    layout="vertical"
                    onSubmit={handleAddSubmit}
                >
                    <Form.Item
                        label="菜单编码"
                        field="menuName"
                        rules={[{required: true, message: '请输入菜单编码'}]}
                    >
                        <Input placeholder="请输入菜单编码"/>
                    </Form.Item>
                    <Form.Item
                        label="菜单名称"
                        field="menuLabel"
                        rules={[{required: true, message: '请输入菜单名称'}]}
                    >
                        <Input placeholder="请输入菜单名称"/>
                    </Form.Item>
                    <Form.Item
                        label="菜单类型"
                        field="menuType"
                        rules={[{required: true, message: '请选择菜单类型'}]}
                    >
                        <Select placeholder="请选择菜单类型">
                            {menuTypeOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="父菜单" field="parentId">
                        <Cascader
                            placeholder="请选择父菜单（可选）"
                            options={convertMenuTreeToCascaderData(menuTree)}
                            allowClear
                            changeOnSelect
                        />
                    </Form.Item>
                    <Form.Item label="路由地址" field="url">
                        <Input placeholder="请输入路由地址"/>
                    </Form.Item>
                    <Form.Item label="菜单图标" field="menuIcon">
                        <Select placeholder="请选择菜单图标" allowClear showSearch filterOption={(inputValue, option) =>
                            option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                        }>
                            {menuIconOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    <Space>
                                        {option.icon}
                                        {option.label}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="排序号" field="seq">
                        <InputNumber placeholder="请输入排序号" min={0} style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item label="菜单描述" field="menuDescr">
                        <TextArea placeholder="请输入菜单描述" rows={3}/>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑菜单对话框 */}
            <Modal
                title="编辑菜单"
                visible={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={() => editForm.submit()}
                width={600}
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    onSubmit={handleEditSubmit}
                >
                    <Form.Item
                        label="菜单编码"
                        field="menuName"
                        rules={[{required: true, message: '请输入菜单编码'}]}
                    >
                        <Input placeholder="请输入菜单编码"/>
                    </Form.Item>
                    <Form.Item
                        label="菜单名称"
                        field="menuLabel"
                        rules={[{required: true, message: '请输入菜单名称'}]}
                    >
                        <Input placeholder="请输入菜单名称"/>
                    </Form.Item>
                    <Form.Item
                        label="菜单类型"
                        field="menuType"
                        rules={[{required: true, message: '请选择菜单类型'}]}
                    >
                        <Select placeholder="请选择菜单类型">
                            {menuTypeOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="父菜单" field="parentId">
                        <Cascader
                            placeholder="请选择父菜单（可选）"
                            options={convertMenuTreeToCascaderData(menuTree)}
                            allowClear
                            changeOnSelect
                        />
                    </Form.Item>
                    <Form.Item label="路由地址" field="url">
                        <Input placeholder="请输入路由地址"/>
                    </Form.Item>
                    <Form.Item label="菜单图标" field="menuIcon">
                        <Select placeholder="请选择菜单图标" allowClear>
                            {menuIconOptions.map(option => (
                                <Select.Option key={option.value} value={option.value}>
                                    <Space>
                                        {option.icon}
                                        {option.label}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="排序号" field="seq">
                        <InputNumber placeholder="请输入排序号" min={0} style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item label="菜单描述" field="menuDescr">
                        <TextArea placeholder="请输入菜单描述" rows={3}/>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 查看菜单详情对话框 */}
            <Modal
                title="菜单详情"
                visible={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
                width={600}
            >
                {currentMenu && (
                    <div className="menu-detail">
                        <div className="detail-item">
                            <span className="label">菜单ID：</span>
                            <span className="value">{currentMenu.menuId}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单编码：</span>
                            <span className="value">{currentMenu.menuName}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单名称：</span>
                            <span className="value">{currentMenu.menuLabel}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单类型：</span>
                            <span className="value">
                                <Tag color={
                                    currentMenu.menuType === 'DIRECTORY' ? 'blue' :
                                        currentMenu.menuType === 'MENU' ? 'green' : 'orange'
                                }>
                                    {currentMenu.menuType === 'DIRECTORY' ? '目录' :
                                        currentMenu.menuType === 'MENU' ? '菜单' : '按钮'}
                                </Tag>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">父菜单ID：</span>
                            <span className="value">{currentMenu.parentId || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">路由地址：</span>
                            <span className="value">{currentMenu.url || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单图标：</span>
                            <span className="value">
                                {renderIconByName(currentMenu.menuIcon) || '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">排序号：</span>
                            <span className="value">{currentMenu.seq || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">状态：</span>
                            <span className="value">
                                <Tag color={currentMenu.state === 'ENABLED' ? 'green' : 'red'}>
                                    {currentMenu.state === 'ENABLED' ? '启用' : '禁用'}
                                </Tag>
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">菜单描述：</span>
                            <span className="value">{currentMenu.menuDescr || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">创建时间：</span>
                            <span className="value">
                                {currentMenu.createDate ? new Date(currentMenu.createDate).toLocaleString() : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">创建人：</span>
                            <span className="value">{currentMenu.createUser || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">更新时间：</span>
                            <span className="value">
                                {currentMenu.updateDate ? new Date(currentMenu.updateDate).toLocaleString() : '-'}
                            </span>
                        </div>
                        <div className="detail-item">
                            <span className="label">更新人：</span>
                            <span className="value">{currentMenu.updateUser || '-'}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default MenuManager;
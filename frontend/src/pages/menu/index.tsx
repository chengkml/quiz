import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  Space,
  Message,
  Popconfirm,
  Tag,
  Grid,
  Pagination,
  Tooltip,
  Tree,
  Modal,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconEye,
  IconEyeInvisible,
  IconFolder,
  IconFile,
  IconSettings,
  IconSearch,
  IconExpand,
  IconShrink,
  IconUnlock,
  IconLock,
} from '@arco-design/web-react/icon';
import { MenuDto, MenuTreeDto, MenuQueryParams, MenuType } from '../../types/menu';
import { menuService } from '../../services/menuService';
import CreateMenuModal from './components/CreateMenuModal';
import EditMenuModal from './components/EditMenuModal';
import MenuTree from './components/MenuTree';
import styles from './index.module.css';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const TreeNode = Tree.Node;

interface MenuTableData extends MenuDto {
  key: string;
}

const MenuManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [menus, setMenus] = useState<MenuDto[]>([]);
  const [menuTree, setMenuTree] = useState<MenuTreeDto[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [treeSearchValue, setTreeSearchValue] = useState('');
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<MenuDto | null>(null);

  // 菜单类型选项
  const menuTypeOptions = [
    { label: '全部', value: '' },
    { label: '目录', value: MenuType.DIRECTORY },
    { label: '菜单', value: MenuType.MENU },
    { label: '按钮', value: MenuType.BUTTON },
  ];

  // 状态选项
  const statusOptions = [
    { label: '全部', value: '' },
    { label: '生效', value: 1 },
    { label: '失效', value: 0 },
  ];

  // 获取菜单树
  const fetchMenuTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const response = await menuService.getMenuTree();
      if (response.success) {
        setMenuTree(response.data);
        // 默认展开第一层
        const firstLevelKeys = response.data.map(item => item.menuName);
        setExpandedKeys(firstLevelKeys);
      } else {
        Message.error('获取菜单树失败');
      }
    } catch (error) {
      console.error('获取菜单树失败:', error);
      Message.error('获取菜单树失败');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // 获取菜单列表
  const fetchMenus = useCallback(async (params?: Partial<MenuQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: MenuQueryParams = {
        page: currentPage - 1, // 后端从0开始
        size: pageSize,
        parentId: selectedTreeNodeId || undefined,
        ...params,
      };
      
      const response = await menuService.getMenus(queryParams);
      if (response.success) {
        setMenus(response.data);
        setTotal(response.totalElements || 0);
      } else {
        Message.error('获取菜单列表失败');
      }
    } catch (error) {
      console.error('获取菜单列表失败:', error);
      Message.error('获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedTreeNodeId]);

  // 初始化加载
  useEffect(() => {
    fetchMenuTree();
  }, [fetchMenuTree]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // 查询
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setCurrentPage(1);
    fetchMenus(values);
  };

  // 重置
  const handleReset = () => {
    form.resetFields();
    setCurrentPage(1);
    setSelectedTreeNodeId('');
    fetchMenus();
  };

  // 刷新
  const handleRefresh = () => {
    const values = form.getFieldsValue();
    fetchMenus(values);
    fetchMenuTree();
  };

  // 分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
  };

  // 树节点选择
  const handleTreeSelect = (selectedKeys: string[]) => {
    const nodeId = selectedKeys[0] || '';
    setSelectedTreeNodeId(nodeId);
    setCurrentPage(1);
    const values = form.getFieldsValue();
    fetchMenus(values);
  };

  // 菜单树操作回调
  const handleTreeCreateMenu = (parentId?: string) => {
    setCurrentMenu(null);
    setCreateModalVisible(true);
  };

  const handleTreeEditMenu = (menu: MenuTreeDto) => {
    // 将 MenuTreeDto 转换为 MenuDto
     const menuDto: MenuDto = {
       menuName: menu.menuName,
       menuLabel: menu.menuLabel,
      menuType: menu.menuType,
      parentId: menu.parentId,
      path: menu.path,
      component: menu.component,
      icon: menu.icon,
      seq: menu.seq,
      status: menu.status,
      remark: menu.remark,
      createTime: menu.createTime,
      updateTime: menu.updateTime,
    };
    setCurrentMenu(menuDto);
    setEditModalVisible(true);
  };

  const handleTreeDeleteMenu = (menuName: string) => {
    fetchMenus();
    fetchMenuTree();
  };

  // 展开全部
  const handleExpandAll = () => {
    const getAllKeys = (nodes: MenuTreeDto[]): string[] => {
      let keys: string[] = [];
      nodes.forEach(node => {
        keys.push(node.menuName);
        if (node.children && node.children.length > 0) {
          keys = keys.concat(getAllKeys(node.children));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllKeys(menuTree));
  };

  // 折叠全部
  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  // 启用菜单
  const handleEnableMenu = async (menu: MenuDto) => {
    try {
      const response = await menuService.enableMenu(menu.menuId);
      if (response.success) {
        Message.success('启用菜单成功');
        handleRefresh();
      } else {
        Message.error(response.message || '启用菜单失败');
      }
    } catch (error) {
      console.error('启用菜单失败:', error);
      Message.error('启用菜单失败');
    }
  };

  // 禁用菜单
  const handleDisableMenu = async (menu: MenuDto) => {
    try {
      const response = await menuService.disableMenu(menu.menuId);
      if (response.success) {
        Message.success('禁用菜单成功');
        handleRefresh();
      } else {
        Message.error(response.message || '禁用菜单失败');
      }
    } catch (error) {
      console.error('禁用菜单失败:', error);
      Message.error('禁用菜单失败');
    }
  };

  // 删除菜单
  const handleDeleteMenu = async (menu: MenuDto) => {
    try {
      const response = await menuService.deleteMenu(menu.menuId);
      if (response.success) {
        Message.success('删除菜单成功');
        handleRefresh();
      } else {
        Message.error(response.message || '删除菜单失败');
      }
    } catch (error) {
      console.error('删除菜单失败:', error);
      Message.error('删除菜单失败');
    }
  };

  // 编辑菜单
  const handleEditMenu = (menu: MenuDto) => {
    setCurrentMenu(menu);
    setEditModalVisible(true);
  };

  // 模态框成功回调
  const handleModalSuccess = () => {
    setCreateModalVisible(false);
    setEditModalVisible(false);
    setCurrentMenu(null);
    fetchMenus();
    fetchMenuTree();
  };

  // 渲染菜单类型图标
  const renderMenuTypeIcon = (type: MenuType) => {
    switch (type) {
      case MenuType.DIRECTORY:
        return <IconFolder style={{ color: '#f7ba2a' }} />;
      case MenuType.MENU:
        return <IconFile style={{ color: '#165dff' }} />;
      case MenuType.BUTTON:
        return <IconSettings style={{ color: '#00b42a' }} />;
      default:
        return <IconFile />;
    }
  };

  // 渲染树节点
  const renderTreeNodes = (nodes: MenuTreeDto[]): React.ReactNode => {
    return nodes.map(node => {
      const title = (
        <span className={styles.treeNodeTitle}>
          {renderMenuTypeIcon(node.menuType)}
          <span className={styles.treeNodeText}>{node.menuName}</span>
        </span>
      );
      
      if (node.children && node.children.length > 0) {
        return (
          <TreeNode key={node.menuName} title={title}>
            {renderTreeNodes(node.children)}
          </TreeNode>
        );
      }
      return <TreeNode key={node.menuName} title={title} />;
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: '菜单名称',
      dataIndex: 'menuLabel',
      width: 150,
      render: (menuLabel: string, record: MenuDto) => (
        <Space>
          {renderMenuTypeIcon(record.menuType)}
          <span>{menuLabel}</span>
        </Space>
      ),
    },
    {
      title: '菜单ID',
      dataIndex: 'menuName',
      width: 120,
    },
    {
      title: '菜单类型',
      dataIndex: 'menuType',
      width: 100,
      render: (type: MenuType) => {
        const typeMap = {
          [MenuType.DIRECTORY]: { text: '目录', color: 'orange' },
          [MenuType.MENU]: { text: '菜单', color: 'blue' },
          [MenuType.BUTTON]: { text: '按钮', color: 'green' },
        };
        const config = typeMap[type] || { text: type, color: 'gray' };
        return (
          <Tag color={config.color} size="small">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '路由路径',
      dataIndex: 'menuExtConf',
      width: 150,
      render: (menuExtConf: any, record: MenuDto) => {
        if (record.menuType === MenuType.MENU && menuExtConf) {
          try {
            const extConf = typeof menuExtConf === 'string' ? JSON.parse(menuExtConf) : menuExtConf;
            return extConf?.path || '-';
          } catch (error) {
            console.error('解析menuExtConf失败:', error);
            return '-';
          }
        }
        return '-';
      },
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 80,
      align: 'center' as const,
      render: (icon: string) => {
        if (icon) {
          return <span className={styles.iconPreview}>{icon}</span>;
        }
        return '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'state',
      width: 80,
      align: 'center' as const,
      render: (state: string) => {
        const isEnabled = state === '1';
        return (
          <Tag color={isEnabled ? 'green' : 'red'} size="small">
            {isEnabled ? '生效' : '失效'}
          </Tag>
        );
      },
    },
    {
      title: '排序号',
      dataIndex: 'seq',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: MenuDto) => (
        <Space>
          <Tooltip content="编辑">
              <Button
                 type="text"
                 size="small"
                 icon={<IconEdit />}
                 onClick={() => handleEditMenu(record)}
               />
            </Tooltip>
          {record.state === '1' ? (
            <Popconfirm
              title="确定要禁用该菜单吗？"
              onOk={() => handleDisableMenu(record)}
            >
              <Tooltip content="禁用">
                <Button
                  type="text"
                  size="small"
                  status="warning"
                  icon={<IconLock />}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="确定要启用该菜单吗？"
              onOk={() => handleEnableMenu(record)}
            >
              <Tooltip content="启用">
                <Button
                  type="text"
                  size="small"
                  status="success"
                  icon={<IconUnlock />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定要删除该菜单吗？删除后不可恢复！"
            onOk={() => handleDeleteMenu(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 转换数据格式
  const tableData: MenuTableData[] = menus.map(menu => ({
    ...menu,
    key: menu.menuName,
  }));

  return (
    <div className={styles.menuManagement}>
      <Row gutter={16} className={styles.mainLayout}>
        {/* 左侧菜单树 */}
        <Col span={4} className={styles.leftPanel}>
          <MenuTree
            menuTree={menuTree}
            selectedKeys={selectedTreeNodeId ? [selectedTreeNodeId] : []}
            onSelect={handleTreeSelect}
            onRefresh={fetchMenuTree}
            onCreateMenu={handleTreeCreateMenu}
            onEditMenu={handleTreeEditMenu}
            onDeleteMenu={handleTreeDeleteMenu}
          />
        </Col>

        {/* 右侧内容区 */}
        <Col span={20} className={styles.rightPanel}>
          {/* 过滤表单 */}
          <Card className={styles.filterCard}>
            <Form form={form} layout="horizontal" className={styles.filterForm}>
              <div className={styles.formRow}>
                <div className={styles.formItem}>
                  <FormItem field="menuName" label="名称" className={styles.arcoFormItem}>
                    <Input placeholder="请输入菜单名称" allowClear />
                  </FormItem>
                </div>
                <div className={styles.formItem}>
                  <FormItem field="menuType" label="类型" className={styles.arcoFormItem}>
                    <Select placeholder="请选择菜单类型" allowClear>
                      {menuTypeOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                </div>
                <div className={styles.formItem}>
                  <FormItem field="status" label="状态" className={styles.arcoFormItem}>
                    <Select placeholder="请选择状态" allowClear>
                      {statusOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </FormItem>
                </div>
                <div className={styles.buttonGroup}>
                  <Button type="primary" onClick={handleSearch}>
                    查询
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </div>
              </div>
            </Form>
          </Card>

          {/* 数据表格 */}
          <Card className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div className={styles.tableTitle}>菜单列表</div>
              <div className={styles.tableActions}>
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  新增菜单
                </Button>
                <Button icon={<IconRefresh />} onClick={handleRefresh}>
                  刷新
                </Button>
              </div>
            </div>
            <Table
              columns={columns}
              data={tableData}
              loading={loading}
              pagination={false}
              scroll={{ x: 1200 }}
              rowKey="key"
            />
            
            {/* 分页 */}
            <div className={styles.paginationWrapper}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                showQuickJumper
                sizeCanChange
                sizeOptions={[10, 20, 50, 100]}
                onChange={handlePageChange}
                onPageSizeChange={handlePageChange}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 创建菜单模态框 */}
      <CreateMenuModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
      
      {/* 编辑菜单模态框 */}
      <EditMenuModal
        visible={editModalVisible}
        menu={currentMenu}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentMenu(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default MenuManagement;
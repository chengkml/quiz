import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tree,
  Button,
  Message,
  Spin,
  Space,
  Checkbox,
  Divider,
  Typography
} from '@arco-design/web-react';
import {
  IconMenuFold,
  IconMenuUnfold,
  IconSave,
  IconRefresh
} from '@arco-design/web-react/icon';
import { MenuTreeDto, MenuType } from '../../../types/menu';
import { RoleDto } from '../../../types/role';
import { menuService } from '../../../services/menuService';
import styles from './RoleMenuConfigModal.module.css';

const { Title, Text } = Typography;
const TreeNode = Tree.Node;

interface RoleMenuConfigModalProps {
  visible: boolean;
  role: RoleDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const RoleMenuConfigModal: React.FC<RoleMenuConfigModalProps> = ({
  visible,
  role,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuTree, setMenuTree] = useState<MenuTreeDto[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [expandAll, setExpandAll] = useState(false);

  // 获取菜单树数据
  const fetchMenuTree = async () => {
    if (!role) return;
    
    setLoading(true);
    try {
      // 获取所有菜单树
      const menuResponse = await menuService.getMenuTree();
      if (menuResponse.success) {
        setMenuTree(menuResponse.data || []);
        
        // 获取角色已分配的菜单
        const roleMenuResponse = await menuService.getRoleMenus(role.roleId);
        if (roleMenuResponse.success) {
          const roleMenuIds = roleMenuResponse.data?.map(menu => menu.menuId) || [];
          setCheckedKeys(roleMenuIds);
        }
      } else {
        Message.error('获取菜单数据失败');
      }
    } catch (error) {
      console.error('获取菜单数据失败:', error);
      Message.error('获取菜单数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    if (visible && role) {
      fetchMenuTree();
    }
  }, [visible, role]);

  // 展开/折叠所有节点
  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedKeys([]);
    } else {
      const allKeys = getAllMenuKeys(menuTree);
      setExpandedKeys(allKeys);
    }
    setExpandAll(!expandAll);
  };

  // 获取所有菜单键值
  const getAllMenuKeys = (menus: MenuTreeDto[]): string[] => {
    const keys: string[] = [];
    const traverse = (nodes: MenuTreeDto[]) => {
      nodes.forEach(node => {
        keys.push(node.menuId);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(menus);
    return keys;
  };

  // 处理树节点选择
  const handleCheck = (checkedKeys: string[], info: any) => {
    setCheckedKeys(checkedKeys);
    setHalfCheckedKeys(info.halfCheckedKeys || []);
  };

  // 处理展开/折叠
  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
  };

  // 保存菜单权限配置
  const handleSave = async () => {
    if (!role) return;
    
    setSaving(true);
    try {
      const response = await menuService.replaceRoleMenus(role.roleId, checkedKeys);
      if (response.success) {
        Message.success('菜单权限配置保存成功');
        onSuccess();
      } else {
        Message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存菜单权限配置失败:', error);
      Message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 渲染菜单图标
  const renderMenuIcon = (menuType: MenuType) => {
    switch (menuType) {
      case MenuType.DIRECTORY:
        return <IconMenuFold />;
      case MenuType.MENU:
        return <IconMenuUnfold />;
      case MenuType.BUTTON:
        return <span className={styles.buttonIcon}>B</span>;
      default:
        return null;
    }
  };

  // 渲染树节点
  const renderTreeNodes = (nodes: MenuTreeDto[]) => {
    return nodes.map(node => {
      const title = (
        <div className={styles.treeNodeTitle}>
          <span className={styles.menuIcon}>
            {renderMenuIcon(node.menuType)}
          </span>
          <span className={styles.menuName}>{node.menuName}</span>
          <span className={styles.menuType}>
            {node.menuType === MenuType.DIRECTORY && '目录'}
            {node.menuType === MenuType.MENU && '菜单'}
            {node.menuType === MenuType.BUTTON && '按钮'}
          </span>
        </div>
      );

      return (
        <TreeNode key={node.menuId} title={title} dataRef={node}>
          {node.children && node.children.length > 0 && renderTreeNodes(node.children)}
        </TreeNode>
      );
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchMenuTree();
  };

  return (
    <Modal
      title={`配置角色菜单权限 - ${role?.roleName || ''}`}
      visible={visible}
      onCancel={onCancel}
      width={800}
      className={styles.roleMenuConfigModal}
      footer={
        <div className={styles.modalFooter}>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSave}
            icon={<IconSave />}
          >
            保存
          </Button>
        </div>
      }
    >
      <div className={styles.modalContent}>
        {/* 操作栏 */}
        <div className={styles.toolbar}>
          <Space>
            <Button
              size="small"
              onClick={handleExpandAll}
              icon={expandAll ? <IconMenuFold /> : <IconMenuUnfold />}
            >
              {expandAll ? '折叠全部' : '展开全部'}
            </Button>
            <Button
              size="small"
              onClick={handleRefresh}
              icon={<IconRefresh />}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          <div className={styles.statistics}>
            <Text type="secondary">
              已选择 {checkedKeys.length} 个菜单
            </Text>
          </div>
        </div>

        <Divider />

        {/* 菜单树 */}
        <div className={styles.treeContainer}>
          <Spin loading={loading}>
            {menuTree.length > 0 ? (
              <Tree
                checkable
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                onCheck={handleCheck}
                onExpand={handleExpand}
                className={styles.menuTree}
              >
                {renderTreeNodes(menuTree)}
              </Tree>
            ) : (
              <div className={styles.emptyState}>
                <Text type="secondary">暂无菜单数据</Text>
              </div>
            )}
          </Spin>
        </div>

        {/* 说明信息 */}
        <div className={styles.helpInfo}>
          <Text type="secondary" size="small">
            提示：选择菜单项将为该角色分配相应的访问权限。目录和菜单权限会自动包含其子项权限。
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default RoleMenuConfigModal;
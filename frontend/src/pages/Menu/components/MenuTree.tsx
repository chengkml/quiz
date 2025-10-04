import React, { useState, useEffect } from 'react';
import {
  Tree,
  Card,
  Button,
  Space,
  Dropdown,
  Menu,
  Message,
  Popconfirm,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconRefresh,
  IconMore,
  IconFolder,
  IconFile,
  IconSettings,
} from '@arco-design/web-react/icon';
import { MenuTreeDto, MenuType } from '../../../types/menu';
import { menuService } from '../../../services/menuService';

const TreeNode = Tree.Node;
const MenuItem = Menu.Item;

interface MenuTreeProps {
  menuTree: MenuTreeDto[];
  selectedKeys: string[];
  onSelect: (selectedKeys: string[], info: any) => void;
  onRefresh: () => void;
  onCreateMenu: (parentId?: string) => void;
  onEditMenu: (menu: MenuTreeDto) => void;
  onDeleteMenu: (menuName: string) => void;
}

const MenuTree: React.FC<MenuTreeProps> = ({
  menuTree,
  selectedKeys,
  onSelect,
  onRefresh,
  onCreateMenu,
  onEditMenu,
  onDeleteMenu,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 渲染菜单类型图标
  const renderMenuIcon = (type: MenuType) => {
    switch (type) {
      case MenuType.DIRECTORY:
        return <IconFolder style={{ color: '#f7ba2a' }} />;
      case MenuType.MENU:
        return <IconFile style={{ color: '#00b42a' }} />;
      case MenuType.BUTTON:
        return <IconSettings style={{ color: '#165dff' }} />;
      default:
        return <IconFile />;
    }
  };

  // 删除菜单
  const handleDelete = async (menuName: string) => {
    try {
      setLoading(true);
      const response = await menuService.deleteMenu(menuName);
      if (response.success) {
        Message.success('删除菜单成功');
        onDeleteMenu(menuName);
      } else {
        Message.error(response.message || '删除菜单失败');
      }
    } catch (error) {
      console.error('删除菜单失败:', error);
      Message.error('删除菜单失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染右键菜单
  const renderContextMenu = (node: MenuTreeDto) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <Menu>
        <MenuItem key="add" onClick={() => onCreateMenu(node.menuName)}>
          <IconPlus /> 新增子菜单
        </MenuItem>
        <MenuItem key="edit" onClick={() => onEditMenu(node)}>
          <IconEdit /> 编辑菜单
        </MenuItem>
      </Menu>
    );
  };

  // 渲染树节点
  const renderTreeNodes = (nodes: MenuTreeDto[]): React.ReactNode => {
    return nodes.map((node) => {
      const title = (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {renderMenuIcon(node.menuType)}
            <span style={{ marginLeft: 8 }}>{node.menuLabel}</span>
            {node.status === 0 && (
              <span style={{ marginLeft: 8, color: '#f53f3f', fontSize: 12 }}>
                (已失效)
              </span>
            )}
          </div>
          <Dropdown
            droplist={renderContextMenu(node)}
            trigger="click"
            position="bottom"
          >
            <Button
              type="text"
              size="mini"
              icon={<IconMore />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      );

      return (
        <TreeNode key={node.menuName} title={title} dataRef={node}>
          {node.children && node.children.length > 0
            ? renderTreeNodes(node.children)
            : null}
        </TreeNode>
      );
    });
  };

  // 展开所有节点
  const expandAll = () => {
    const getAllKeys = (nodes: MenuTreeDto[]): string[] => {
      let keys: string[] = [];
      nodes.forEach((node) => {
        keys.push(node.menuName);
        if (node.children && node.children.length > 0) {
          keys = keys.concat(getAllKeys(node.children));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllKeys(menuTree));
  };

  // 收起所有节点
  const collapseAll = () => {
    setExpandedKeys([]);
  };

  // 初始化时展开第一层节点
  useEffect(() => {
    if (menuTree.length > 0) {
      const firstLevelKeys = menuTree.map(node => node.menuName);
      setExpandedKeys(firstLevelKeys);
    }
  }, [menuTree]);

  return (
    <Card
      title="菜单管理"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' }}
    >
      {menuTree.length > 0 ? (
        <Tree
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onSelect={onSelect}
          onExpand={setExpandedKeys}
          blockNode
          showLine
        >
          {renderTreeNodes(menuTree)}
        </Tree>
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#86909c',
            padding: '40px 0',
          }}
        >
          暂无菜单数据
        </div>
      )}
    </Card>
  );
};

export default MenuTree;
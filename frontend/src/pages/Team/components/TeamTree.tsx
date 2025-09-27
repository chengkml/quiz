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
  Input,
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconMore,
  IconFolder,
  IconTeam,
  IconSearch,
} from '@arco-design/web-react/icon';
import { TeamDto } from '../../../types/team';
import { teamService } from '../../../services/teamService';

const TreeNode = Tree.Node;
const MenuItem = Menu.Item;

interface TeamTreeProps {
  teamTree: TeamDto[];
  selectedKeys: string[];
  onSelect: (selectedKeys: string[], info: any) => void;
  onRefresh: () => void;
  onCreateTeam: (parentId?: string) => void;
  onEditTeam: (team: TeamDto) => void;
  onDeleteTeam: (teamId: string) => void;
}

const TeamTree: React.FC<TeamTreeProps> = ({
  teamTree,
  selectedKeys,
  onSelect,
  onRefresh,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');

  // 过滤团队数据
  const filterTeamTree = (nodes: TeamDto[], searchText: string): TeamDto[] => {
    if (!searchText.trim()) {
      return nodes;
    }

    const filtered: TeamDto[] = [];
    
    nodes.forEach(node => {
      const matchesSearch = 
        (node.label && node.label.toLowerCase().includes(searchText.toLowerCase())) ||
        (node.teamName && node.teamName.toLowerCase().includes(searchText.toLowerCase())) ||
        (node.teamCode && node.teamCode.toLowerCase().includes(searchText.toLowerCase()));
      
      const filteredChildren = node.children ? filterTeamTree(node.children, searchText) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
    });
    
    return filtered;
  };

  // 获取过滤后的团队数据
  const filteredTeamTree = filterTeamTree(teamTree, searchValue);

  // 搜索时自动展开匹配的节点
  useEffect(() => {
    if (searchValue.trim() && filteredTeamTree.length > 0) {
      const getAllKeys = (nodes: TeamDto[]): string[] => {
        let keys: string[] = [];
        nodes.forEach((node) => {
          keys.push(node.teamId);
          if (node.children && node.children.length > 0) {
            keys = keys.concat(getAllKeys(node.children));
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(filteredTeamTree));
    }
  }, [searchValue, filteredTeamTree]);

  // 渲染团队图标
  const renderTeamIcon = () => {
    return <IconFolder style={{ color: '#f7ba2a' }} />;
  };

  // 删除团队
  const handleDelete = async (teamId: string) => {
    try {
      setLoading(true);
      const response = await teamService.deleteTeam(teamId);
      if (response.success) {
        Message.success('删除团队成功');
        onDeleteTeam(teamId);
      } else {
        Message.error(response.message || '删除团队失败');
      }
    } catch (error) {
      console.error('删除团队失败:', error);
      Message.error('删除团队失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染右键菜单
  const renderContextMenu = (node: TeamDto) => {
    return (
      <Menu>
        <MenuItem key="add" onClick={() => onCreateTeam(node.teamId)}>
          <IconPlus /> 新增团队
        </MenuItem>
        <MenuItem key="edit" onClick={() => onEditTeam(node)}>
          <IconEdit /> 编辑团队
        </MenuItem>
        <MenuItem key="delete" onClick={() => handleDelete(node.teamId)}>
          <IconDelete /> 删除团队
        </MenuItem>
      </Menu>
    );
  };

  // 渲染树节点
  const renderTreeNodes = (nodes: TeamDto[]): React.ReactNode => {
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
            {renderTeamIcon()}
            <span style={{ marginLeft: 8 }}>{node.label || node.teamName}</span>

            {node.state === '0' && (
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
        <TreeNode key={node.teamId} title={title} dataRef={node}>
          {node.children && node.children.length > 0
            ? renderTreeNodes(node.children)
            : null}
        </TreeNode>
      );
    });
  };

  // 展开所有节点
  const expandAll = () => {
    const getAllKeys = (nodes: TeamDto[]): string[] => {
      let keys: string[] = [];
      nodes.forEach((node) => {
        keys.push(node.teamId);
        if (node.children && node.children.length > 0) {
          keys = keys.concat(getAllKeys(node.children));
        }
      });
      return keys;
    };
    setExpandedKeys(getAllKeys(teamTree));
  };

  // 收起所有节点
  const collapseAll = () => {
    setExpandedKeys([]);
  };

  // 初始化时展开第一层节点
  useEffect(() => {
    if (teamTree.length > 0) {
      const firstLevelKeys = teamTree.map(node => node.teamId);
      setExpandedKeys(firstLevelKeys);
    }
  }, [teamTree]);

  return (
    <Card
      title="团队管理"
      style={{ height: '100%' }}
      bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' }}
      extra={
        teamTree.length === 0 && (
          <Space>
            <Button
              type="text"
              size="mini"
              icon={<IconPlus />}
              onClick={() => onCreateTeam()}
            />
          </Space>
        )
      }
    >
      {/* 搜索框 */}
      <div style={{ marginBottom: '12px' }}>
        <Input
          placeholder="请输入团队编码或中文名称进行搜索"
          value={searchValue}
          onChange={setSearchValue}
          prefix={<IconSearch />}
          allowClear
        />
      </div>
      
      {teamTree.length > 0 ? (
        filteredTeamTree.length > 0 ? (
          <Tree
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
            onSelect={onSelect}
            onExpand={setExpandedKeys}
            blockNode
            showLine
          >
            {renderTreeNodes(filteredTeamTree)}
          </Tree>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#86909c',
              padding: '40px 0',
            }}
          >
            未找到匹配的团队
          </div>
        )
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: '#86909c',
            padding: '40px 0',
          }}
        >
          暂无团队数据
        </div>
      )}
    </Card>
  );
};

export default TeamTree;
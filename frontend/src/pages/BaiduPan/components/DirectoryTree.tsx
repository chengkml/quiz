import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Tree, Spin } from '@arco-design/web-react';
import { IconFolder, IconHome } from '@arco-design/web-react/icon';
import { BaiduPanFileItemDto, listBaiduPanFiles } from '../api';

interface DirectoryTreeProps {
  currentPath: string;
  onSelect: (path: string) => void;
  refreshToken?: number;
  disabled?: boolean;
  disabledText?: string;
}

interface TreeNodeItem {
  title: string;
  key: string;
  icon?: React.ReactNode;
  isLeaf?: boolean;
  children?: TreeNodeItem[];
}

const ROOT_PATH = '/';

const toTreeNode = (item: BaiduPanFileItemDto): TreeNodeItem => ({
  title: item.name,
  key: item.path,
  icon: <IconFolder />,
  isLeaf: false,
});

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  currentPath,
  onSelect,
  refreshToken = 0,
  disabled = false,
  disabledText = '暂未接入真实百度网盘目录接口',
}) => {
  const [treeData, setTreeData] = useState<TreeNodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([ROOT_PATH]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([ROOT_PATH]);

  const rootNode = useMemo<TreeNodeItem>(() => ({
    title: '全部文件',
    key: ROOT_PATH,
    icon: <IconHome />,
    isLeaf: false,
    children: treeData,
  }), [treeData]);

  useEffect(() => {
    if (disabled) {
      setTreeData([]);
      setLoading(false);
      return;
    }
    loadChildren(ROOT_PATH, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, disabled]);

  useEffect(() => {
    const path = currentPath || ROOT_PATH;
    setSelectedKeys([path]);
    const segments = path.split('/').filter(Boolean);
    const keys = [ROOT_PATH];
    let accum = ROOT_PATH;
    segments.forEach(segment => {
      accum = `${accum === ROOT_PATH ? ROOT_PATH : accum}${segment}/`;
      keys.push(accum);
    });
    setExpandedKeys(prev => Array.from(new Set([...prev, ...keys])));
  }, [currentPath]);

  const replaceChildren = (nodes: TreeNodeItem[], key: string, children: TreeNodeItem[]): TreeNodeItem[] => {
    return nodes.map(node => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children?.length) {
        return { ...node, children: replaceChildren(node.children, key, children) };
      }
      return node;
    });
  };

  const loadChildren = async (path: string, root = false) => {
    setLoading(true);
    try {
      const items = await listBaiduPanFiles(path === ROOT_PATH ? undefined : path);
      const children = (items || []).filter(item => item.directory).map(toTreeNode);
      if (root) {
        setTreeData(children);
      } else {
        setTreeData(prev => replaceChildren(prev, path, children));
      }
    } catch {
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async (node: any) => {
    if (disabled) {
      return;
    }
    await loadChildren(node.key);
  };

  if (disabled) {
    return (
      <div className="baidu-pan-tree">
        <div className="baidu-pan-tree__title">目录</div>
        <div className="baidu-pan-tree__empty">
          <Empty description={disabledText} />
        </div>
      </div>
    );
  }

  return (
    <div className="baidu-pan-tree">
      <div className="baidu-pan-tree__title">目录</div>
      {loading && treeData.length === 0 ? (
        <div className="baidu-pan-tree__empty"><Spin /></div>
      ) : (
        <Tree
          blockNode
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          treeData={[rootNode]}
          loadMore={handleLoadMore}
          onExpand={(keys) => setExpandedKeys(keys as string[])}
          onSelect={(keys) => {
            const next = (keys?.[0] as string) || ROOT_PATH;
            setSelectedKeys([next]);
            onSelect(next);
          }}
          renderTitle={(node) => <span className="baidu-pan-tree__node-title">{node.title}</span>}
        />
      )}
    </div>
  );
};

export default DirectoryTree;

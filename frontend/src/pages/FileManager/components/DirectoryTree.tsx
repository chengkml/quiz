import React, { useState, useEffect } from 'react';
import { Tree } from '@arco-design/web-react';
import { IconFolder } from '@arco-design/web-react/icon';
import { listFiles, FileInfo } from '../api';

interface DirectoryTreeProps {
  onSelect: (path: string) => void;
  currentPath: string;
}

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ onSelect, currentPath }) => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    loadRoot();
  }, []);

  useEffect(() => {
    // When currentPath changes externally (e.g. breadcrumb), update selection and expansion
    if (currentPath) {
        setSelectedKeys([currentPath]);
        // Auto expand parent paths?
        // path: "A/B/" -> expand "A/"
        const parts = currentPath.split('/').filter(Boolean);
        const keysToExpand: string[] = [];
        let accum = "";
        parts.forEach(p => {
            accum += p + "/";
            keysToExpand.push(accum);
        });
        setExpandedKeys(prev => Array.from(new Set([...prev, ...keysToExpand])));
    } else {
        setSelectedKeys([]);
    }
  }, [currentPath]);

  const loadRoot = async () => {
    try {
      const files = await listFiles('');
      const nodes = files
        .filter(f => f.isDirectory)
        .map(f => ({
          title: f.name,
          key: f.path,
          icon: <IconFolder />,
          isLeaf: false, // Assume folders might have children, we don't know yet strictly unless we check empty
          // But to enable loadData, we usually set isLeaf: false
        }));
      setTreeData(nodes);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async (node: any) => {
    const { key } = node;
    // key is the path, e.g., "Folder1/"
    try {
      const files = await listFiles(key);
      const children = files
        .filter(f => f.isDirectory)
        .map(f => ({
          title: f.name,
          key: f.path,
          icon: <IconFolder />,
          isLeaf: false, 
        }));
      
      node.children = children;
      setTreeData([...treeData]); // Trigger re-render
    } catch (e) {
        console.error(e);
    }
  };

  return (
    <div style={{ width: 240, borderRight: '1px solid var(--color-border-2)', marginRight: 16, height: '100%', overflow: 'auto' }}>
      <Tree
        loadMore={loadData}
        treeData={treeData}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onExpand={(keys, extra) => {
            setExpandedKeys(keys);
        }}
        onSelect={(keys, extra) => {
            if (keys.length > 0) {
                const path = keys[0];
                setSelectedKeys([path]);
                onSelect(path);
            } else {
                // If deselected, maybe go to root?
                setSelectedKeys([]);
                onSelect("");
            }
        }}
        renderTitle={(props) => <span style={{ whiteSpace: 'nowrap' }}>{props.title}</span>}
      />
    </div>
  );
};

export default DirectoryTree;

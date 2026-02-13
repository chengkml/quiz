import React, { useEffect, useState } from 'react';
import {
  Button,
  Breadcrumb,
  Space,
  Upload,
  Modal,
  Input,
  Message,
  Popconfirm,
  Typography,
  Select,
  Checkbox,
  Image
} from '@arco-design/web-react';
import {
  IconFolder,
  IconFile,
  IconDelete,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconUpload,
  IconHome,
  IconEye,
  IconEdit,
} from '@arco-design/web-react/icon';
import { DataManager } from '@/components/DataManager';
import { listFiles, createFolder, deleteFile, renameFile, batchDelete, moveFiles, FileInfo, UPLOAD_URL, getDownloadUrl } from './api';
import DirectoryTree from './components/DirectoryTree';
import dayjs from 'dayjs';
import './style.less';

const getFileIcon = (name: string, isDirectory: boolean) => {
  if (isDirectory) return <IconFolder style={{ color: '#ffb400', fontSize: 24 }} />;
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <IconFile style={{ color: '#ff4d4f', fontSize: 24 }} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <IconFile style={{ color: '#52c41a', fontSize: 24 }} />;
    case 'doc':
    case 'docx': return <IconFile style={{ color: '#1890ff', fontSize: 24 }} />;
    case 'xls':
    case 'xlsx': return <IconFile style={{ color: '#52c41a', fontSize: 24 }} />;
    case 'zip':
    case 'rar':
    case '7z': return <IconFile style={{ color: '#fa8c16', fontSize: 24 }} />;
    default: return <IconFile style={{ fontSize: 24 }} />;
  }
};

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveTargetPath, setMoveTargetPath] = useState('');

  // View & Filter State
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'time'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'folder' | 'image' | 'doc' | 'archive'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Tree Refresh
  const [treeKey, setTreeKey] = useState(0);

  const token = localStorage.getItem('token');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await listFiles(currentPath);
      const sorted = (res || []).sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name);
        }
        return a.isDirectory ? -1 : 1;
      });
      setFileList(sorted);
    } catch (error) {
      console.error(error);
      Message.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [currentPath]);

  // --- Handlers ---

  const handleEnterFolder = (path: string) => {
    setCurrentPath(path);
  };

  const handleNavigateBreadcrumb = (index: number, parts: string[]) => {
    if (index === -1) {
      setCurrentPath('');
    } else {
      const newPath = parts.slice(0, index + 1).join('/') + '/';
      setCurrentPath(newPath);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Message.error('Folder name is required');
      return;
    }
    try {
      await createFolder(newFolderName, currentPath);
      Message.success('Folder created');
      setIsCreateFolderModalVisible(false);
      setNewFolderName('');
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      Message.error('Failed to create folder');
    }
  };

  const handleRename = async () => {
    if (!renamingItem || !newName.trim() || newName === renamingItem.name) {
      setIsRenameModalVisible(false);
      return;
    }
    try {
      await renameFile(renamingItem.id, newName);
      Message.success('Renamed successfully');
      setIsRenameModalVisible(false);
      fetchFiles();
      if (renamingItem.isDirectory) setTreeKey(prev => prev + 1);
    } catch (error) {
      Message.error('Failed to rename');
    }
  };

  const handleDelete = async (record: FileInfo) => {
    try {
      await deleteFile(record.id);
      Message.success('Deleted successfully');
      fetchFiles();
      if (record.isDirectory) setTreeKey(prev => prev + 1);
    } catch (error) {
      Message.error('Failed to delete');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await batchDelete(selectedRowKeys);
      Message.success('Deleted successfully');
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      Message.error('Failed to delete');
    }
  };

  const handleMove = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await moveFiles(selectedRowKeys, moveTargetPath);
      Message.success('Moved successfully');
      setMoveModalVisible(false);
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      Message.error('Failed to move');
    }
  };

  // --- Utils ---

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  const handlePreview = (item: FileInfo) => {
    setPreviewImageUrl(getDownloadUrl(item.id));
    setPreviewVisible(true);
  };

  const getFileCategory = (item: FileInfo) => {
    if (item.isDirectory) return 'folder';
    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt'].includes(ext)) return 'doc';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'other';
  };

  // --- Filtering & Sorting ---

  const filteredFileList = fileList
    .filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
    .filter(item => (filterType === 'all' ? true : getFileCategory(item) === filterType));

  const sortedFileList = [...filteredFileList].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    let compareValue = 0;
    if (sortKey === 'name') compareValue = a.name.localeCompare(b.name);
    else if (sortKey === 'size') compareValue = (a.size || 0) - (b.size || 0);
    else {
      const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      compareValue = aTime - bTime;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const selectedItems = fileList.filter(item => item.id && selectedRowKeys.includes(item.id));

  // --- Configurations ---

  const pathParts = currentPath.split('/').filter(p => p);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_: any, item: FileInfo) => (
        <Space>
          {getFileIcon(item.name, item.isDirectory)}
          {item.isDirectory ? (
            <a onClick={() => handleEnterFolder(item.path)} style={{ cursor: 'pointer', fontWeight: 500 }}>
              {item.name}
            </a>
          ) : (
            <span
              onClick={() => isImage(item.name) && handlePreview(item)}
              style={{ cursor: isImage(item.name) ? 'pointer' : 'default', color: isImage(item.name) ? 'var(--color-primary-6)' : 'inherit' }}
            >
              {item.name}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 150,
      render: (_: any, item: FileInfo) => (item.isDirectory ? '-' : formatSize(item.size)),
    },
    {
      title: 'Date',
      dataIndex: 'lastModified',
      width: 200,
      render: (col: string) => col ? dayjs(col).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Actions',
      width: 150,
      render: (_: any, item: FileInfo) => (
        <Space>
          {isImage(item.name) && !item.isDirectory && (
            <Button icon={<IconEye />} size="mini" onClick={() => handlePreview(item)} />
          )}
          {!item.isDirectory && (
            <Button icon={<IconDownload />} size="mini" href={getDownloadUrl(item.id)} target="_blank" />
          )}
          {item.id && (
            <Button
              icon={<IconEdit />}
              size="mini"
              onClick={() => {
                setRenamingItem(item);
                setNewName(item.name);
                setIsRenameModalVisible(true);
              }}
            />
          )}
          {item.id && (
             <Popconfirm title="Are you sure?" onOk={() => handleDelete(item)}>
                <Button icon={<IconDelete />} status="danger" size="mini" />
             </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filterContent = (
    <div className="file-manager-toolbar">
      <div style={{ marginBottom: 12 }}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => handleNavigateBreadcrumb(-1, [])} style={{ cursor: 'pointer' }}>
            <IconHome /> Home
          </Breadcrumb.Item>
          {pathParts.map((part, index) => (
            <Breadcrumb.Item key={index} onClick={() => handleNavigateBreadcrumb(index, pathParts)} style={{ cursor: 'pointer' }}>
              {part}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size={12}>
          <Input.Search
            placeholder="Search"
            style={{ width: 180 }}
            value={searchText}
            onChange={setSearchText}
            allowClear
          />
          <Select
            style={{ width: 120 }}
            value={filterType}
            onChange={setFilterType}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Folder', value: 'folder' },
              { label: 'Image', value: 'image' },
              { label: 'Doc', value: 'doc' },
              { label: 'Archive', value: 'archive' }
            ]}
          />
          <Select
            style={{ width: 120 }}
            value={sortKey}
            onChange={setSortKey}
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Size', value: 'size' },
              { label: 'Date', value: 'time' }
            ]}
          />
          <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
          <Space>
             <Button
               type={viewMode === 'list' ? 'primary' : 'default'}
               onClick={() => setViewMode('list')}
               icon={<IconFile />}
             />
             <Button
               type={viewMode === 'grid' ? 'primary' : 'default'}
               onClick={() => setViewMode('grid')}
               icon={<IconRefresh style={{ transform: 'rotate(90deg)' }} />} // Using a placeholder icon for grid if IconApps not available, actually reusing IconRefresh or similar
             />
          </Space>
        </Space>

        {selectedItems.length > 0 && (
          <Space>
            <Typography.Text>Selected {selectedItems.length}</Typography.Text>
            <Button onClick={() => {
              setMoveTargetPath(currentPath);
              setMoveModalVisible(true);
            }}>Move</Button>
            <Popconfirm title="Delete selected?" onOk={handleBatchDelete}>
              <Button status="danger">Delete</Button>
            </Popconfirm>
            <Button onClick={() => setSelectedRowKeys([])}>Clear</Button>
          </Space>
        )}
      </div>
    </div>
  );

  return (
    <div className="file-manager-page" style={{ height: '100%' }}>
      <DataManager
        data={sortedFileList}
        loading={loading}
        pagination={{
            pageSize: 50,
            current: 1,
            total: sortedFileList.length,
            showTotal: true
        }}
        config={{
          displayMode: viewMode === 'list' ? 'table' : 'shortCard',
          showModeToggle: false,
          showTree: true,
          treeContent: (
            <DirectoryTree
                key={treeKey}
                currentPath={currentPath}
                onSelect={(path) => setCurrentPath(path)}
            />
          ),
          filterContent: filterContent,
          showFilterForm: true, // Enable custom filter content area
          tableColumns: columns,
          // Custom Card Rendering for Grid View
          renderShortCard: (item, index) => {
             const isSelected = !!item.id && selectedRowKeys.includes(item.id);
             return (
               <div
                 className={`file-card ${isSelected ? 'selected' : ''}`}
                 style={{
                    border: isSelected ? '1px solid var(--color-primary-6)' : '1px solid var(--color-border-2)',
                    borderRadius: 4,
                    padding: 12,
                    position: 'relative',
                    cursor: 'pointer',
                    height: '100%',
                    background: isSelected ? 'var(--color-primary-light-1)' : 'var(--color-bg-2)'
                 }}
                 onClick={() => {
                    // Toggle selection logic
                    if(!item.id) return;
                    const newKeys = selectedRowKeys.includes(item.id)
                       ? selectedRowKeys.filter(k => k !== item.id)
                       : [...selectedRowKeys, item.id];
                    setSelectedRowKeys(newKeys);
                 }}
                 onDoubleClick={() => item.isDirectory && handleEnterFolder(item.path)}
               >
                 <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    {getFileIcon(item.name, item.isDirectory)}
                 </div>
                 <Typography.Text
                    style={{ display: 'block', textAlign: 'center', width: '100%' }}
                    ellipsis={{ tooltip: true }}
                 >
                    {item.name}
                 </Typography.Text>
                 <div style={{ fontSize: 12, color: 'var(--color-text-3)', textAlign: 'center', marginTop: 4 }}>
                    {item.isDirectory ? 'Folder' : formatSize(item.size)}
                 </div>
               </div>
             );
          },
          tableProps: {
            rowSelection: {
                selectedRowKeys,
                onChange: (keys: any[]) => setSelectedRowKeys(keys),
                getCheckboxProps: (record: any) => ({ disabled: !record.id })
            },
            onRow: (record: any) => ({
                onDoubleClick: () => record.isDirectory && handleEnterFolder(record.path)
            })
          }
        }}
        actionsPosition="top"
        actionButtons={
          <Space>
             <Button icon={<IconRefresh />} onClick={fetchFiles}>Refresh</Button>
             <Button icon={<IconPlus />} type="primary" onClick={() => setIsCreateFolderModalVisible(true)}>New Folder</Button>
             <Upload
                action={UPLOAD_URL}
                data={{ path: currentPath }}
                headers={{ Authorization: token || '' }}
                showUploadList={false}
                multiple
                onChange={(info) => {
                    if (info.file.status === 'done') {
                        Message.success('Uploaded successfully');
                        fetchFiles();
                    } else if (info.file.status === 'error') {
                        Message.error('Upload failed');
                    }
                }}
             >
                <Button icon={<IconUpload />}>Upload</Button>
             </Upload>
          </Space>
        }
      />

      {/* Modals */}
      <Image.Preview
         src={previewImageUrl}
         visible={previewVisible}
         onVisibleChange={setPreviewVisible}
      />

      <Modal
        title="Move to"
        visible={moveModalVisible}
        onOk={handleMove}
        onCancel={() => setMoveModalVisible(false)}
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <Typography.Text>Current: {moveTargetPath || '/'}</Typography.Text>
          <Button size="mini" onClick={() => setMoveTargetPath('')}>Root</Button>
        </div>
        <div style={{ height: 300, overflow: 'auto', border: '1px solid var(--color-border-2)', borderRadius: 4 }}>
            <DirectoryTree
                currentPath={moveTargetPath}
                onSelect={(path) => setMoveTargetPath(path)}
            />
        </div>
      </Modal>

      <Modal
        title="Rename"
        visible={isRenameModalVisible}
        onOk={handleRename}
        onCancel={() => setIsRenameModalVisible(false)}
      >
        <Input
          placeholder="New Name"
          value={newName}
          onChange={setNewName}
          onPressEnter={handleRename}
        />
      </Modal>

      <Modal
        title="Create New Folder"
        visible={isCreateFolderModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => setIsCreateFolderModalVisible(false)}
      >
        <Input
          placeholder="Folder Name"
          value={newFolderName}
          onChange={setNewFolderName}
          onPressEnter={handleCreateFolder}
        />
      </Modal>
    </div>
  );
};

export default FileManager;

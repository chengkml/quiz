import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Breadcrumb,
  Space,
  Upload,
  Modal,
  Input,
  Message,
  Popconfirm,
  Typography,
  Empty,
  Select,
  Checkbox
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
import { ColumnProps } from '@arco-design/web-react/es/Table';
import { listFiles, createFolder, deleteFile, renameFile, batchDelete, moveFiles, FileInfo, UPLOAD_URL, getDownloadUrl } from './api';
import DirectoryTree from './components/DirectoryTree';
import dayjs from 'dayjs';
import './style.less';

const getFileIcon = (name: string, isDirectory: boolean) => {
  if (isDirectory) return <IconFolder style={{ color: '#ffb400', fontSize: 20 }} />;
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <IconFile style={{ color: '#ff4d4f', fontSize: 20 }} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return <IconFile style={{ color: '#52c41a', fontSize: 20 }} />;
    case 'doc':
    case 'docx': return <IconFile style={{ color: '#1890ff', fontSize: 20 }} />;
    case 'xls':
    case 'xlsx': return <IconFile style={{ color: '#52c41a', fontSize: 20 }} />;
    case 'zip':
    case 'rar':
    case '7z': return <IconFile style={{ color: '#fa8c16', fontSize: 20 }} />;
    default: return <IconFile style={{ fontSize: 20 }} />;
  }
};

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renamingItem, setRenamingItem] = useState<FileInfo | null>(null);
  const [newName, setNewName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'time'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'folder' | 'image' | 'doc' | 'archive'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveTargetPath, setMoveTargetPath] = useState('');
  
  // To trigger tree refresh
  const [treeKey, setTreeKey] = useState(0);

  const token = localStorage.getItem('token');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await listFiles(currentPath);
      // Sort: Folders first, then files.
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
      setTreeKey(prev => prev + 1); // Refresh tree to show new folder
    } catch (error) {
      console.error(error);
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
      if (renamingItem.isDirectory) {
          setTreeKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      Message.error('Failed to rename');
    }
  };

  const handleDelete = async (id: string, isDirectory: boolean) => {
    try {
      await deleteFile(id);
      Message.success('Deleted successfully');
      fetchFiles();
      if (isDirectory) {
          setTreeKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      Message.error('Failed to delete');
    }
  };

  const handleBatchDelete = async () => {
    const ids = selectedRowKeys;
    if (ids.length === 0) {
      return;
    }
    try {
      await batchDelete(ids);
      Message.success('Deleted successfully');
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      Message.error('Failed to delete');
    }
  };

  const handleMove = async () => {
    const ids = selectedRowKeys;
    if (ids.length === 0) {
      return;
    }
    try {
      await moveFiles(ids, moveTargetPath);
      Message.success('Moved successfully');
      setMoveModalVisible(false);
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      Message.error('Failed to move');
    }
  };

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

  const filteredFileList = fileList
    .filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
    .filter(item => (filterType === 'all' ? true : getFileCategory(item) === filterType));

  const sortedFileList = [...filteredFileList].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    let compareValue = 0;
    if (sortKey === 'name') {
      compareValue = a.name.localeCompare(b.name);
    } else if (sortKey === 'size') {
      compareValue = (a.size || 0) - (b.size || 0);
    } else {
      const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      compareValue = aTime - bTime;
    }
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const selectedItems = fileList.filter(item => item.id && selectedRowKeys.includes(item.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;

  const columns: ColumnProps<FileInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (col, item) => (
        <Space>
          {getFileIcon(item.name, item.isDirectory)}
          {item.isDirectory ? (
            <a onClick={() => handleEnterFolder(item.path)} style={{ cursor: 'pointer', fontWeight: 500 }}>
              {item.name}
            </a>
          ) : (
            <span 
              onClick={() => isImage(item.name) && handlePreview(item)} 
              style={{ cursor: isImage(item.name) ? 'pointer' : 'default', color: isImage(item.name) ? 'var(--color-primary-light-4)' : 'inherit' }}
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
      render: (col, item) => (item.isDirectory ? '-' : formatSize(item.size)),
    },
    {
      title: 'Date',
      dataIndex: 'lastModified',
      width: 200,
      render: (col) => col ? dayjs(col).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Actions',
      width: 150,
      render: (_, item) => (
        <Space>
          {isImage(item.name) && !item.isDirectory && (
            <Button
              icon={<IconEye />}
              size="mini"
              onClick={() => handlePreview(item)}
              title="Preview"
            />
          )}
          {!item.isDirectory && (
            <Button
              icon={<IconDownload />}
              size="mini"
              href={getDownloadUrl(item.id)}
              target="_blank"
              title="Download"
            />
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
              title="Rename"
            />
          )}
          {item.id && ( 
             <Popconfirm
                title="Are you sure you want to delete this?"
                onOk={() => handleDelete(item.id, item.isDirectory)}
             >
                <Button icon={<IconDelete />} status="danger" size="mini" title="Delete" />
             </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const pathParts = currentPath.split('/').filter(p => p);

  return (
    <Card bodyStyle={{ padding: 0, height: '85vh', overflow: 'hidden' }} style={{ height: '85vh' }} className="file-manager">
       <div className="file-manager__layout">
            <div className="file-manager__sidebar">
                <DirectoryTree 
                    key={treeKey}
                    currentPath={currentPath}
                    onSelect={(path) => setCurrentPath(path)}
                />
            </div>
            
            <div className="file-manager__content">
                  <div className="file-manager__header">
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

                  <div className="file-manager__toolbar">
                    <Space size={12}>
                      <Input.Search
                        placeholder="Search in folder"
                        style={{ width: 200 }}
                        value={searchText}
                        onChange={setSearchText}
                        allowClear
                      />
                      <Select
                        style={{ width: 140 }}
                        value={filterType}
                        onChange={setFilterType}
                        options={[
                          { label: 'All', value: 'all' },
                          { label: 'Folders', value: 'folder' },
                          { label: 'Images', value: 'image' },
                          { label: 'Documents', value: 'doc' },
                          { label: 'Archives', value: 'archive' }
                        ]}
                      />
                      <Select
                        style={{ width: 140 }}
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
                      <Button onClick={() => setViewMode('list')} type={viewMode === 'list' ? 'primary' : 'default'}>
                        List
                      </Button>
                      <Button onClick={() => setViewMode('grid')} type={viewMode === 'grid' ? 'primary' : 'default'}>
                        Grid
                      </Button>
                    </Space>

                    <Space>
                      <Button icon={<IconRefresh />} onClick={fetchFiles} />
                      <Button icon={<IconPlus />} onClick={() => setIsCreateFolderModalVisible(true)}>Folder</Button>
                      <Upload
                        action={UPLOAD_URL}
                        data={{ path: currentPath }}
                        headers={{ Authorization: token || '' }}
                        showUploadList={false}
                        multiple
                        onChange={(fileList, file) => {
                          if (file.status === 'done') {
                            Message.success('Uploaded successfully');
                            fetchFiles();
                          } else if (file.status === 'error') {
                            Message.error('Upload failed');
                          }
                        }}
                      >
                        <Button type="primary" icon={<IconUpload />}>Upload</Button>
                      </Upload>
                    </Space>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="file-manager__actionbar">
                      <Typography.Text>Selected {selectedItems.length} item(s)</Typography.Text>
                      <Space>
                        {singleSelected && !singleSelected.isDirectory && (
                          <Button
                            icon={<IconDownload />}
                            onClick={() => window.open(getDownloadUrl(singleSelected.id), '_blank')}
                          >
                            Download
                          </Button>
                        )}
                        <Button onClick={() => {
                          setMoveTargetPath(currentPath);
                          setMoveModalVisible(true);
                        }}>
                          Move
                        </Button>
                        {singleSelected && (
                          <Button
                            icon={<IconEdit />}
                            onClick={() => {
                              setRenamingItem(singleSelected);
                              setNewName(singleSelected.name);
                              setIsRenameModalVisible(true);
                            }}
                          >
                            Rename
                          </Button>
                        )}
                        <Popconfirm
                          title="Are you sure you want to delete selected items?"
                          onOk={handleBatchDelete}
                        >
                          <Button icon={<IconDelete />} status="danger">
                            Delete
                          </Button>
                        </Popconfirm>
                        <Button onClick={() => setSelectedRowKeys([])}>Clear</Button>
                      </Space>
                    </div>
                  )}

                  {viewMode === 'list' ? (
                    <Table
                      loading={loading}
                      columns={columns}
                      data={sortedFileList}
                      pagination={false}
                      rowKey={record => record.id || record.path}
                      scroll={{ y: '100%' }}
                      style={{ flex: 1, overflow: 'hidden' }}
                      noDataElement={<Empty description="No files found" />}
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (keys) => setSelectedRowKeys(keys as string[]),
                        getCheckboxProps: (record) => ({ disabled: !record.id })
                      }}
                    />
                  ) : (
                    <div className="file-manager__grid">
                      {sortedFileList.map(item => {
                        const isSelected = !!item.id && selectedRowKeys.includes(item.id);
                        return (
                          <div
                            key={item.path}
                            className={`file-card${isSelected ? ' file-card--selected' : ''}`}
                            onDoubleClick={() => item.isDirectory && handleEnterFolder(item.path)}
                          >
                            <div className="file-card__select">
                              <Checkbox
                                checked={isSelected}
                                disabled={!item.id}
                                onChange={() => {
                                  if (!item.id) return;
                                  setSelectedRowKeys(prev =>
                                    prev.includes(item.id)
                                      ? prev.filter(key => key !== item.id)
                                      : [...prev, item.id]
                                  );
                                }}
                              />
                            </div>
                            <div className="file-card__icon" onClick={() => {
                              if (item.isDirectory) {
                                handleEnterFolder(item.path);
                              } else if (isImage(item.name)) {
                                handlePreview(item);
                              }
                            }}>
                              {getFileIcon(item.name, item.isDirectory)}
                            </div>
                            <div className="file-card__name" title={item.name}>{item.name}</div>
                            <div className="file-card__meta">
                              {item.isDirectory ? 'Folder' : formatSize(item.size)}
                            </div>
                            <div className="file-card__meta">
                              {item.lastModified ? dayjs(item.lastModified).format('YYYY-MM-DD HH:mm') : '--'}
                            </div>
                            <div className="file-card__actions">
                              {isImage(item.name) && !item.isDirectory && (
                                <Button
                                  icon={<IconEye />}
                                  size="mini"
                                  onClick={() => handlePreview(item)}
                                />
                              )}
                              {!item.isDirectory && (
                                <Button
                                  icon={<IconDownload />}
                                  size="mini"
                                  href={getDownloadUrl(item.id)}
                                  target="_blank"
                                />
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            </div>
       </div>

      <Modal
        title="Image Preview"
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        style={{ width: '80%', maxWidth: 800 }}
      >
        <img src={previewImageUrl} alt="Preview" style={{ width: '100%' }} />
      </Modal>

      <Modal
        title="Move to"
        visible={moveModalVisible}
        onOk={handleMove}
        onCancel={() => setMoveModalVisible(false)}
        autoFocus={false}
        focusLock={true}
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text>Choose destination folder</Typography.Text>
          <Button size="mini" onClick={() => setMoveTargetPath('')}>
            Root
          </Button>
        </div>
        <Typography.Text type="secondary">
          Current: {moveTargetPath || '/'}
        </Typography.Text>
        <DirectoryTree
          currentPath={moveTargetPath}
          onSelect={(path) => setMoveTargetPath(path)}
        />
      </Modal>

      <Modal
        title="Rename"
        visible={isRenameModalVisible}
        onOk={handleRename}
        onCancel={() => setIsRenameModalVisible(false)}
        autoFocus={false}
        focusLock={true}
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
        autoFocus={false}
        focusLock={true}
      >
        <Input
          placeholder="Folder Name"
          value={newFolderName}
          onChange={setNewFolderName}
          onPressEnter={handleCreateFolder}
        />
      </Modal>
    </Card>
  );
};

export default FileManager;

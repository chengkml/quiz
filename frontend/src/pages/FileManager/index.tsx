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
      Message.error('文件加载失败');
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
      Message.error('请输入文件夹名称');
      return;
    }
    try {
      await createFolder(newFolderName, currentPath);
      Message.success('文件夹创建成功');
      setIsCreateFolderModalVisible(false);
      setNewFolderName('');
      fetchFiles();
      setTreeKey(prev => prev + 1); // Refresh tree to show new folder
    } catch (error) {
      console.error(error);
      Message.error('文件夹创建失败');
    }
  };

  const handleRename = async () => {
    if (!renamingItem || !newName.trim() || newName === renamingItem.name) {
      setIsRenameModalVisible(false);
      return;
    }
    try {
      await renameFile(renamingItem.id, newName);
      Message.success('重命名成功');
      setIsRenameModalVisible(false);
      fetchFiles();
      if (renamingItem.isDirectory) {
          setTreeKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      Message.error('重命名失败');
    }
  };

  const handleDelete = async (id: string, isDirectory: boolean) => {
    try {
      await deleteFile(id);
      Message.success('删除成功');
      fetchFiles();
      if (isDirectory) {
          setTreeKey(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      Message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    const ids = selectedRowKeys;
    if (ids.length === 0) {
      return;
    }
    try {
      await batchDelete(ids);
      Message.success('删除成功');
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      Message.error('删除失败');
    }
  };

  const handleMove = async () => {
    const ids = selectedRowKeys;
    if (ids.length === 0) {
      return;
    }
    try {
      await moveFiles(ids, moveTargetPath);
      Message.success('移动成功');
      setMoveModalVisible(false);
      setSelectedRowKeys([]);
      fetchFiles();
      setTreeKey(prev => prev + 1);
    } catch (error) {
      console.error(error);
      Message.error('移动失败');
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
      title: '名称',
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
      title: '大小',
      dataIndex: 'size',
      width: 150,
      render: (col, item) => (item.isDirectory ? '-' : formatSize(item.size)),
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      width: 200,
      render: (col) => col ? dayjs(col).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      width: 150,
      render: (_, item) => (
        <Space>
          {isImage(item.name) && !item.isDirectory && (
            <Button
              icon={<IconEye />}
              size="mini"
              onClick={() => handlePreview(item)}
              title="预览"
            />
          )}
          {!item.isDirectory && (
            <Button
              icon={<IconDownload />}
              size="mini"
              href={getDownloadUrl(item.id)}
              target="_blank"
              title="下载"
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
              title="重命名"
            />
          )}
          {item.id && ( 
             <Popconfirm
                title="确定删除该文件吗？"
                okText="确定"
                cancelText="取消"
                onOk={() => handleDelete(item.id, item.isDirectory)}
             >
                <Button icon={<IconDelete />} status="danger" size="mini" title="删除" />
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
                        <IconHome /> 根目录
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
                        placeholder="搜索当前目录"
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
                          { label: '全部', value: 'all' },
                          { label: '文件夹', value: 'folder' },
                          { label: '图片', value: 'image' },
                          { label: '文档', value: 'doc' },
                          { label: '压缩包', value: 'archive' }
                        ]}
                      />
                      <Select
                        style={{ width: 140 }}
                        value={sortKey}
                        onChange={setSortKey}
                        options={[
                          { label: '名称', value: 'name' },
                          { label: '大小', value: 'size' },
                          { label: '时间', value: 'time' }
                        ]}
                      />
                      <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                        {sortOrder === 'asc' ? '升序' : '降序'}
                      </Button>
                      <Button onClick={() => setViewMode('list')} type={viewMode === 'list' ? 'primary' : 'default'}>
                        列表
                      </Button>
                      <Button onClick={() => setViewMode('grid')} type={viewMode === 'grid' ? 'primary' : 'default'}>
                        网格
                      </Button>
                    </Space>

                    <Space>
                      <Button icon={<IconRefresh />} onClick={fetchFiles} />
                      <Button icon={<IconPlus />} onClick={() => setIsCreateFolderModalVisible(true)}>新建文件夹</Button>
                      <Upload
                        action={UPLOAD_URL}
                        data={{ path: currentPath }}
                        headers={{ Authorization: token || '' }}
                        showUploadList={false}
                        multiple
                        onChange={(fileList, file) => {
                          if (file.status === 'done') {
                            Message.success('上传成功');
                            fetchFiles();
                          } else if (file.status === 'error') {
                            Message.error('上传失败');
                          }
                        }}
                      >
                        <Button type="primary" icon={<IconUpload />}>上传</Button>
                      </Upload>
                    </Space>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="file-manager__actionbar">
                      <Typography.Text>已选择 {selectedItems.length} 项</Typography.Text>
                      <Space>
                        {singleSelected && !singleSelected.isDirectory && (
                          <Button
                            icon={<IconDownload />}
                            onClick={() => window.open(getDownloadUrl(singleSelected.id), '_blank')}
                          >
                            下载
                          </Button>
                        )}
                        <Button onClick={() => {
                          setMoveTargetPath(currentPath);
                          setMoveModalVisible(true);
                        }}>
                          移动
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
                            重命名
                          </Button>
                        )}
                        <Popconfirm
                          title="确定删除选中的文件吗？"
                          okText="确定"
                          cancelText="取消"
                          onOk={handleBatchDelete}
                        >
                          <Button icon={<IconDelete />} status="danger">
                            删除
                          </Button>
                        </Popconfirm>
                        <Button onClick={() => setSelectedRowKeys([])}>清空选择</Button>
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
                      noDataElement={<Empty description="暂无文件" />}
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
                              {item.isDirectory ? '文件夹' : formatSize(item.size)}
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
        title="图片预览"
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        style={{ width: '80%', maxWidth: 800 }}
      >
        <img src={previewImageUrl} alt="预览图片" style={{ width: '100%' }} />
      </Modal>

      <Modal
        title="移动到"
        visible={moveModalVisible}
        onOk={handleMove}
        onCancel={() => setMoveModalVisible(false)}
        okText="确定"
        cancelText="取消"
        autoFocus={false}
        focusLock={true}
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text>选择目标文件夹</Typography.Text>
          <Button size="mini" onClick={() => setMoveTargetPath('')}>
            根目录
          </Button>
        </div>
        <Typography.Text type="secondary">
          当前路径：{moveTargetPath || '/'}
        </Typography.Text>
        <DirectoryTree
          currentPath={moveTargetPath}
          onSelect={(path) => setMoveTargetPath(path)}
        />
      </Modal>

      <Modal
        title="重命名"
        visible={isRenameModalVisible}
        onOk={handleRename}
        onCancel={() => setIsRenameModalVisible(false)}
        okText="确定"
        cancelText="取消"
        autoFocus={false}
        focusLock={true}
      >
        <Input
          placeholder="请输入新名称"
          value={newName}
          onChange={setNewName}
          onPressEnter={handleRename}
        />
      </Modal>

      <Modal
        title="新建文件夹"
        visible={isCreateFolderModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => setIsCreateFolderModalVisible(false)}
        okText="确定"
        cancelText="取消"
        autoFocus={false}
        focusLock={true}
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={setNewFolderName}
          onPressEnter={handleCreateFolder}
        />
      </Modal>
    </Card>
  );
};

export default FileManager;

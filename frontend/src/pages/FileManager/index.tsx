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
import { listFiles, createFolder, deleteFile, renameFile, FileInfo, UPLOAD_URL, getDownloadUrl } from './api';
import dayjs from 'dayjs';

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

  const handleEnterFolder = (path: string) => {
    // path is the folder path, e.g., "A/"
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
    } catch (error) {
      console.error(error);
      Message.error('Failed to rename');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFile(id);
      Message.success('Deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error(error);
      Message.error('Failed to delete');
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

  const filteredFileList = fileList.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

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
          {item.id && ( // Only items with ID (explicit files/folders) can be deleted
             <Popconfirm
                title="Are you sure you want to delete this?"
                onOk={() => handleDelete(item.id)}
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
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <Space>
          <Input.Search
            placeholder="Search in folder"
            style={{ width: 240, marginRight: 8 }}
            value={searchText}
            onChange={setSearchText}
            allowClear
          />
          <Button icon={<IconRefresh />} onClick={fetchFiles} />
          <Button icon={<IconPlus />} onClick={() => setIsCreateFolderModalVisible(true)}>New Folder</Button>
          <Upload
            action={UPLOAD_URL}
            data={{ path: currentPath }}
            headers={{ Authorization: token || '' }}
            showUploadList={false}
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

      <Table
        loading={loading}
        columns={columns}
        data={filteredFileList}
        pagination={false}
        rowKey={record => record.path + record.name}
        noDataElement={<Empty description="No files found" />}
      />

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

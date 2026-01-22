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
} from '@arco-design/web-react/icon';
import { ColumnProps } from '@arco-design/web-react/es/Table';
import { listFiles, createFolder, deleteFile, FileInfo, UPLOAD_URL, getDownloadUrl } from './api';
import dayjs from 'dayjs';

const FileManager: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateFolderModalVisible, setIsCreateFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const columns: ColumnProps<FileInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (col, item) => (
        <Space>
          {item.isDirectory ? <IconFolder style={{ color: '#ffb400', fontSize: 20 }} /> : <IconFile style={{ fontSize: 20 }} />}
          {item.isDirectory ? (
            <a onClick={() => handleEnterFolder(item.path)} style={{ cursor: 'pointer', fontWeight: 500 }}>
              {item.name}
            </a>
          ) : (
            <span>{item.name}</span>
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
          {!item.isDirectory && (
            <Button
              icon={<IconDownload />}
              size="mini"
              href={getDownloadUrl(item.id)}
              target="_blank"
            />
          )}
          {item.id && ( // Only items with ID (explicit files/folders) can be deleted
             <Popconfirm
                title="Are you sure you want to delete this?"
                onOk={() => handleDelete(item.id)}
             >
                <Button icon={<IconDelete />} status="danger" size="mini" />
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
          <Button icon={<IconRefresh />} onClick={fetchFiles} />
          <Button icon={<IconPlus />} onClick={() => setIsCreateFolderModalVisible(true)}>New Folder</Button>
          <Upload
            action={UPLOAD_URL}
            data={{ path: currentPath }}
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
        data={fileList}
        pagination={false}
        rowKey={record => record.path + record.name}
      />

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

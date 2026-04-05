import React, { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  Input,
  Link,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from '@arco-design/web-react';
import {
  IconCloud,
  IconDelete,
  IconDownload,
  IconEdit,
  IconExclamationCircleFill,
  IconFile,
  IconFolder,
  IconHome,
  IconLink,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconUpload,
} from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import DirectoryTree from './components/DirectoryTree';
import {
  BaiduPanAuthStatusDto,
  BaiduPanFileItemDto,
  createBaiduPanFolder,
  deleteBaiduPanFiles,
  getBaiduPanAuthStatus,
  getBaiduPanAuthorizeUrl,
  getBaiduPanDownloadUrl,
  listBaiduPanFiles,
  moveBaiduPanFiles,
  renameBaiduPanFile,
  unbindBaiduPan,
  uploadBaiduPanUrl,
} from './api';
import './style/index.less';

const { Text, Title, Paragraph } = Typography;

const ROOT_PATH = '/';
const DEFAULT_CONFIG_ROUTE = '/frame/systemparam';
const DEFAULT_CONFIG_CATEGORY = '百度网盘配置';

const getFileIcon = (item: BaiduPanFileItemDto) => {
  if (item.directory) {
    return <IconFolder style={{ color: '#165dff', fontSize: 22 }} />;
  }
  const ext = item.extension?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '')) {
    return <IconFile style={{ color: '#00b42a', fontSize: 22 }} />;
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext || '')) {
    return <IconFile style={{ color: '#722ed1', fontSize: 22 }} />;
  }
  return <IconFile style={{ color: '#86909c', fontSize: 22 }} />;
};

const normalizeDirPath = (path?: string) => {
  if (!path || path === ROOT_PATH) return ROOT_PATH;
  const normalized = path.startsWith(ROOT_PATH) ? path : `${ROOT_PATH}${path}`;
  return normalized.endsWith(ROOT_PATH) ? normalized : `${normalized}${ROOT_PATH}`;
};

const formatSize = (size: number) => {
  if (!size) return '0 B';
  const unit = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), unit.length - 1);
  return `${(size / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${unit[index]}`;
};

const BaiduPanPage: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<BaiduPanAuthStatusDto | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(ROOT_PATH);
  const [fileList, setFileList] = useState<BaiduPanFileItemDto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'size' | 'time'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [moveVisible, setMoveVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<BaiduPanFileItemDto | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveTargetPath, setMoveTargetPath] = useState(ROOT_PATH);
  const [refreshToken, setRefreshToken] = useState(0);

  const token = localStorage.getItem('token') || '';

  const providerName = authStatus?.providerName || '百度网盘';
  const configured = Boolean(authStatus?.configured);
  const bound = Boolean(authStatus?.bound);
  const workspaceEnabled = configured && bound;
  const requiredConfigKeys = authStatus?.requiredConfigKeys || [
    'quiz.baidu-pan.client_id',
    'quiz.baidu-pan.client_secret',
    'quiz.baidu-pan.redirect_uri',
  ];
  const missingConfigKeys = authStatus?.missingConfigKeys || requiredConfigKeys;
  const statusMessage = authStatus?.message || '暂未接入真实百度网盘开放平台';
  const authTip = authStatus?.authTip || '请先完成百度网盘开放平台配置与真实 OAuth 接入';
  const configRoute = authStatus?.configRoute || DEFAULT_CONFIG_ROUTE;
  const configCategory = authStatus?.configCategory || DEFAULT_CONFIG_CATEGORY;

  const fetchAuthStatus = async () => {
    setAuthLoading(true);
    try {
      const data = await getBaiduPanAuthStatus();
      setAuthStatus(data);
    } catch (e: any) {
      Message.error(e?.message || '加载百度网盘绑定状态失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchFiles = async (path = currentPath) => {
    if (!workspaceEnabled) {
      setFileList([]);
      return;
    }
    setFileLoading(true);
    try {
      const data = await listBaiduPanFiles(path === ROOT_PATH ? undefined : path);
      setFileList(data || []);
    } catch (e: any) {
      setFileList([]);
      Message.error(e?.message || '加载百度网盘目录失败');
    } finally {
      setFileLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  useEffect(() => {
    if (workspaceEnabled) {
      fetchFiles(currentPath);
    } else {
      setFileList([]);
      setSelectedPaths([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceEnabled, currentPath]);

  const openSystemParamPage = () => {
    window.open(configRoute, '_blank', 'noopener,noreferrer');
  };

  const handleAuthorize = async () => {
    if (!configured) {
      Message.warning(`${statusMessage}。请前往系统参数管理补齐：${missingConfigKeys.join(' / ')}`);
      return;
    }
    try {
      const data = await getBaiduPanAuthorizeUrl();
      if (!data?.authorizeUrl) {
        Message.error(data?.message || '后端未返回可用授权地址');
        return;
      }
      window.open(data.authorizeUrl, '_blank', 'noopener,noreferrer');
      Message.success('已打开百度网盘授权窗口，请完成授权后返回当前页面刷新状态');
    } catch (e: any) {
      Message.error(e?.message || '获取授权链接失败');
    }
  };

  const handleUnavailableAction = (actionName: string) => {
    Message.warning(`${actionName}不可用：${authTip}`);
  };

  const handleUnbind = async () => {
    try {
      const status = await unbindBaiduPan();
      setAuthStatus(status);
      setCurrentPath(ROOT_PATH);
      setSelectedPaths([]);
      setRefreshToken(v => v + 1);
      Message.success('已刷新百度网盘绑定状态');
    } catch (e: any) {
      Message.error(e?.message || '解除绑定失败');
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      Message.warning('请输入文件夹名称');
      return;
    }
    try {
      await createBaiduPanFolder({ name: folderName.trim(), parentPath: currentPath });
      setCreateVisible(false);
      setFolderName('');
      setRefreshToken(v => v + 1);
      fetchFiles();
      Message.success('文件夹已创建');
    } catch (e: any) {
      Message.error(e?.message || '创建文件夹失败');
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) {
      setRenameVisible(false);
      return;
    }
    try {
      await renameBaiduPanFile({ path: renameTarget.path, newName: renameValue.trim() });
      setRenameVisible(false);
      setRenameTarget(null);
      setRenameValue('');
      setRefreshToken(v => v + 1);
      fetchFiles();
      Message.success('重命名成功');
    } catch (e: any) {
      Message.error(e?.message || '重命名失败');
    }
  };

  const handleDelete = async (paths: string[]) => {
    if (!paths.length) return;
    try {
      await deleteBaiduPanFiles({ paths });
      setSelectedPaths(prev => prev.filter(path => !paths.includes(path)));
      setRefreshToken(v => v + 1);
      fetchFiles();
      Message.success('删除成功');
    } catch (e: any) {
      Message.error(e?.message || '删除失败');
    }
  };

  const handleMove = async () => {
    if (!selectedPaths.length) {
      Message.warning('请先选择文件或文件夹');
      return;
    }
    try {
      await moveBaiduPanFiles({ sourcePaths: selectedPaths, targetPath: moveTargetPath || ROOT_PATH });
      setMoveVisible(false);
      setSelectedPaths([]);
      setRefreshToken(v => v + 1);
      fetchFiles();
      Message.success('移动成功');
    } catch (e: any) {
      Message.error(e?.message || '移动失败');
    }
  };

  const filteredList = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    const sorted = [...fileList]
      .filter(item => !search || item.name.toLowerCase().includes(search))
      .sort((a, b) => {
        if (a.directory !== b.directory) return a.directory ? -1 : 1;
        let compare = 0;
        if (sortKey === 'size') compare = (a.size || 0) - (b.size || 0);
        else if (sortKey === 'time') compare = dayjs(a.modifiedAt).valueOf() - dayjs(b.modifiedAt).valueOf();
        else compare = a.name.localeCompare(b.name, 'zh-CN');
        return sortOrder === 'asc' ? compare : -compare;
      });
    return sorted;
  }, [fileList, searchText, sortKey, sortOrder]);

  const selectedItems = useMemo(() => fileList.filter(item => selectedPaths.includes(item.path)), [fileList, selectedPaths]);
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;

  const pathSegments = useMemo(() => {
    if (currentPath === ROOT_PATH) return [] as string[];
    return currentPath.split('/').filter(Boolean);
  }, [currentPath]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (_: string, record: BaiduPanFileItemDto) => (
        <Space>
          {getFileIcon(record)}
          {record.directory ? (
            <Link onClick={() => setCurrentPath(normalizeDirPath(record.path))}>{record.name}</Link>
          ) : (
            <span>{record.name}</span>
          )}
        </Space>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 120,
      render: (value: number, record: BaiduPanFileItemDto) => (record.directory ? '-' : formatSize(value)),
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedAt',
      width: 180,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      width: 220,
      render: (_: unknown, record: BaiduPanFileItemDto) => (
        <Space>
          {!record.directory && (
            <Button
              size="mini"
              icon={<IconDownload />}
              onClick={() => window.open(getBaiduPanDownloadUrl(record.path), '_blank')}
            >
              下载
            </Button>
          )}
          <Button
            size="mini"
            icon={<IconEdit />}
            onClick={() => {
              setRenameTarget(record);
              setRenameValue(record.name);
              setRenameVisible(true);
            }}
          >
            重命名
          </Button>
          <Popconfirm title="确定删除该项吗？" onOk={() => handleDelete([record.path])}>
            <Button size="mini" status="danger" icon={<IconDelete />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!workspaceEnabled) {
    return (
      <div className="baidu-pan-page">
        <Card loading={authLoading} className="baidu-pan-page__status-card" bordered={false}>
          <div className="baidu-pan-page__status-row">
            <div className="baidu-pan-page__status-meta">
              <div className="baidu-pan-page__status-icon"><IconCloud /></div>
              <div className="baidu-pan-page__status-text">
                <Title heading={6} style={{ margin: 0 }}>{providerName}接入</Title>
                <Text type="secondary">保留页面、路由、接口骨架、system param 配置与 OAuth 回调位点；当前不提供任何 mock 数据。</Text>
              </div>
            </div>
            <Space>
              <Tag color={configured ? 'arcoblue' : 'orange'}>{configured ? '已配置待接通' : '未配置'}</Tag>
              <Tag color={bound ? 'green' : 'red'}>{bound ? '已绑定' : '未绑定'}</Tag>
              <Button onClick={fetchAuthStatus} icon={<IconRefresh />}>刷新状态</Button>
            </Space>
          </div>
        </Card>

        <div className="baidu-pan-page__unavailable">
          <Card bordered={false} className="baidu-pan-page__unavailable-card">
            <div className="baidu-pan-page__unavailable-body">
              <div className="baidu-pan-page__hero baidu-pan-page__hero--warning">
                <div>
                  <div className="baidu-pan-page__hero-badge"><IconExclamationCircleFill /> 暂未真实接入</div>
                  <div className="baidu-pan-page__hero-title">暂未接入真实百度网盘开放平台</div>
                  <div className="baidu-pan-page__hero-desc">
                    当前百度网盘模块只保留前端页面、路由、后端 controller/service/dto、system param 配置入口与开放平台回调位点。
                    未配置真实参数、未完成 OAuth、未接通真实文件接口前，页面不会展示伪目录树、伪文件列表、伪上传下载结果。
                  </div>
                </div>
                <div className="baidu-pan-page__hero-feature-list">
                  <div className="baidu-pan-page__hero-feature">不会再返回 mock 授权成功</div>
                  <div className="baidu-pan-page__hero-feature">不会再返回 mock 文件树/文件列表</div>
                  <div className="baidu-pan-page__hero-feature">上传、下载、移动、删除、重命名默认不可用</div>
                  <div className="baidu-pan-page__hero-feature">参数统一通过系统参数管理配置</div>
                </div>
              </div>

              <div className="baidu-pan-page__auth-panel">
                <Title heading={5} style={{ marginBottom: 0 }}>接入说明</Title>
                <Paragraph type="secondary" style={{ marginTop: 0 }}>
                  真实接入完成前，本页统一展示不可用说明，并阻止依赖真实百度网盘能力的操作。
                </Paragraph>

                <Descriptions
                  column={1}
                  layout="inline-horizontal"
                  data={[
                    { label: '当前状态', value: statusMessage },
                    { label: '接入提示', value: authTip },
                    { label: '系统参数入口', value: `${configRoute}（分类：${configCategory}）` },
                    { label: 'OAuth 回调位点', value: authStatus?.callbackPath || '/open/baidu-pan/auth/callback' },
                    { label: '缺少参数', value: missingConfigKeys.length ? missingConfigKeys.join(' / ') : '无' },
                  ]}
                />

                <div className="baidu-pan-page__config-list">
                  {requiredConfigKeys.map((item) => (
                    <Tag key={item} color={missingConfigKeys.includes(item) ? 'red' : 'green'}>{item}</Tag>
                  ))}
                </div>

                <div className="baidu-pan-page__disabled-actions">
                  <Button type="primary" size="large" onClick={openSystemParamPage}>去系统参数管理</Button>
                  <Button type="primary" size="large" icon={<IconLink />} disabled={!configured} onClick={handleAuthorize}>立即授权</Button>
                  <Button size="large" icon={<IconPlus />} disabled onClick={() => handleUnavailableAction('新建文件夹')}>新建文件夹</Button>
                  <Button size="large" icon={<IconUpload />} disabled onClick={() => handleUnavailableAction('上传')}>上传</Button>
                  <Button size="large" icon={<IconDownload />} disabled onClick={() => handleUnavailableAction('下载')}>下载</Button>
                </div>

                <div className="baidu-pan-page__hint-box">
                  <Text type="secondary">
                    未配置时，后端 auth/status 会返回 missingConfigKeys；授权入口会明确报缺少哪些参数，并提示前往系统参数管理（/frame/systemparam）配置。
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="baidu-pan-page">
      <Card loading={authLoading} className="baidu-pan-page__status-card" bordered={false}>
        <div className="baidu-pan-page__status-row">
          <div className="baidu-pan-page__status-meta">
            <div className="baidu-pan-page__status-icon"><IconCloud /></div>
            <div className="baidu-pan-page__status-text">
              <Space>
                <Title heading={6} style={{ margin: 0 }}>{providerName}</Title>
                <Tag color="green">已绑定</Tag>
                {!configured ? <Tag color="orange">配置缺失</Tag> : null}
              </Space>
              <Text type="secondary">账号：{authStatus?.accountName || '未显示'} · {authTip}</Text>
            </div>
          </div>
          <div className="baidu-pan-page__status-actions">
            <Text type="secondary">绑定时间：{authStatus?.boundAt ? dayjs(authStatus.boundAt).format('YYYY-MM-DD HH:mm:ss') : '--'}</Text>
            <Button icon={<IconRefresh />} onClick={() => { fetchAuthStatus(); fetchFiles(); }}>刷新</Button>
            <Popconfirm title="确定解绑当前百度网盘账号吗？" onOk={handleUnbind}>
              <Button status="danger">解绑</Button>
            </Popconfirm>
          </div>
        </div>
      </Card>

      <Card bordered={false} className="baidu-pan-page__workspace-card">
        <div className="baidu-pan-page__workspace">
          <div className="baidu-pan-page__sidebar">
            <DirectoryTree currentPath={currentPath} onSelect={(path) => setCurrentPath(path || ROOT_PATH)} refreshToken={refreshToken} />
          </div>
          <div className="baidu-pan-page__content">
            <div className="baidu-pan-page__header">
              <div className="baidu-pan-page__breadcrumb">
                <Breadcrumb>
                  <Breadcrumb.Item onClick={() => setCurrentPath(ROOT_PATH)} style={{ cursor: 'pointer' }}>
                    <IconHome /> 全部文件
                  </Breadcrumb.Item>
                  {pathSegments.map((segment, index) => {
                    const path = `${ROOT_PATH}${pathSegments.slice(0, index + 1).join('/')}${ROOT_PATH}`;
                    return (
                      <Breadcrumb.Item key={path} onClick={() => setCurrentPath(path)} style={{ cursor: 'pointer' }}>
                        {segment}
                      </Breadcrumb.Item>
                    );
                  })}
                </Breadcrumb>
                <div className="baidu-pan-page__breadcrumb-right">
                  <Text type="secondary">当前路径：{currentPath}</Text>
                </div>
              </div>
            </div>

            <div className="baidu-pan-page__toolbar">
              <div className="baidu-pan-page__toolbar-left">
                <Input
                  allowClear
                  prefix={<IconSearch />}
                  placeholder="搜索当前目录"
                  style={{ width: 240 }}
                  value={searchText}
                  onChange={setSearchText}
                />
                <Select
                  style={{ width: 140 }}
                  value={sortKey}
                  onChange={(value) => setSortKey(value)}
                  options={[
                    { label: '按名称', value: 'name' },
                    { label: '按大小', value: 'size' },
                    { label: '按时间', value: 'time' },
                  ]}
                />
                <Button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? '升序' : '降序'}
                </Button>
                <Button type={viewMode === 'list' ? 'primary' : 'default'} onClick={() => setViewMode('list')}>列表</Button>
                <Button type={viewMode === 'grid' ? 'primary' : 'default'} onClick={() => setViewMode('grid')}>网格</Button>
              </div>
              <div className="baidu-pan-page__toolbar-right">
                <Button icon={<IconRefresh />} onClick={() => fetchFiles()}>刷新</Button>
                <Button icon={<IconPlus />} onClick={() => setCreateVisible(true)}>新建文件夹</Button>
                <Upload
                  action={uploadBaiduPanUrl}
                  headers={{ Authorization: token }}
                  data={{ path: currentPath }}
                  showUploadList={false}
                  multiple
                  onChange={(_fileList, file) => {
                    if (file.status === 'done') {
                      Message.success('上传成功');
                      setRefreshToken(v => v + 1);
                      fetchFiles();
                    } else if (file.status === 'error') {
                      Message.error('上传失败');
                    }
                  }}
                >
                  <Button type="primary" icon={<IconUpload />}>上传</Button>
                </Upload>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="baidu-pan-page__selection-bar">
                <Text>已选中 {selectedItems.length} 项</Text>
                {singleSelected && !singleSelected.directory ? (
                  <Button icon={<IconDownload />} onClick={() => window.open(getBaiduPanDownloadUrl(singleSelected.path), '_blank')}>下载</Button>
                ) : null}
                {singleSelected ? (
                  <Button icon={<IconEdit />} onClick={() => {
                    setRenameTarget(singleSelected);
                    setRenameValue(singleSelected.name);
                    setRenameVisible(true);
                  }}>重命名</Button>
                ) : null}
                <Button onClick={() => { setMoveTargetPath(currentPath); setMoveVisible(true); }}>移动</Button>
                <Popconfirm title="确定删除选中项吗？" onOk={() => handleDelete(selectedPaths)}>
                  <Button status="danger" icon={<IconDelete />}>删除</Button>
                </Popconfirm>
                <Button onClick={() => setSelectedPaths([])}>清空选择</Button>
              </div>
            )}

            {viewMode === 'list' ? (
              <div className="baidu-pan-page__table-wrap">
                <Table
                  className="baidu-pan-page__table"
                  rowKey="path"
                  loading={fileLoading}
                  columns={columns}
                  data={filteredList}
                  pagination={false}
                  scroll={{ y: '100%' }}
                  noDataElement={<Empty description="当前目录暂无文件" />}
                  rowSelection={{
                    selectedRowKeys: selectedPaths,
                    onChange: (keys) => setSelectedPaths(keys as string[]),
                  }}
                />
              </div>
            ) : (
              <div className="baidu-pan-page__grid">
                {filteredList.length === 0 ? <Empty description="当前目录暂无文件" /> : filteredList.map(item => {
                  const selected = selectedPaths.includes(item.path);
                  return (
                    <div key={item.path} className={`baidu-pan-file-card${selected ? ' baidu-pan-file-card--selected' : ''}`}>
                      <div className="baidu-pan-file-card__select">
                        <Checkbox checked={selected} onChange={() => {
                          setSelectedPaths(prev => prev.includes(item.path) ? prev.filter(path => path !== item.path) : [...prev, item.path]);
                        }} />
                      </div>
                      <div className="baidu-pan-file-card__icon" onClick={() => item.directory ? setCurrentPath(normalizeDirPath(item.path)) : undefined}>
                        {getFileIcon(item)}
                      </div>
                      <div className="baidu-pan-file-card__name">{item.name}</div>
                      <div className="baidu-pan-file-card__meta">{item.directory ? '文件夹' : formatSize(item.size)}</div>
                      <div className="baidu-pan-file-card__meta">{item.modifiedAt ? dayjs(item.modifiedAt).format('YYYY-MM-DD HH:mm') : '--'}</div>
                      <div className="baidu-pan-file-card__actions">
                        {!item.directory ? <Button size="mini" icon={<IconDownload />} onClick={() => window.open(getBaiduPanDownloadUrl(item.path), '_blank')} /> : null}
                        <Button size="mini" icon={<IconEdit />} onClick={() => {
                          setRenameTarget(item);
                          setRenameValue(item.name);
                          setRenameVisible(true);
                        }} />
                        <Popconfirm title="确定删除该项吗？" onOk={() => handleDelete([item.path])}>
                          <Button size="mini" status="danger" icon={<IconDelete />} />
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="新建文件夹"
        visible={createVisible}
        onOk={handleCreateFolder}
        onCancel={() => setCreateVisible(false)}
      >
        <Input placeholder="请输入文件夹名称" value={folderName} onChange={setFolderName} onPressEnter={handleCreateFolder} />
      </Modal>

      <Modal
        title="重命名"
        visible={renameVisible}
        onOk={handleRename}
        onCancel={() => setRenameVisible(false)}
      >
        <Input placeholder="请输入新名称" value={renameValue} onChange={setRenameValue} onPressEnter={handleRename} />
      </Modal>

      <Modal
        title="移动到"
        visible={moveVisible}
        onOk={handleMove}
        onCancel={() => setMoveVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">目标目录：{moveTargetPath}</Text>
          <Button size="mini" onClick={() => setMoveTargetPath(ROOT_PATH)}>移动到根目录</Button>
          <DirectoryTree currentPath={moveTargetPath} onSelect={(path) => setMoveTargetPath(path || ROOT_PATH)} refreshToken={refreshToken} />
        </Space>
      </Modal>
    </div>
  );
};

export default BaiduPanPage;

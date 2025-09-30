import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    Button,
    Cascader,
    Dropdown,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Message,
    Modal,
    Pagination,
    Radio,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tree,
    Upload,
} from '@arco-design/web-react';
import './style/index.less';
import {
    addDimension,
    cascadeDeleteDimension,
    disableDimension,
    enableDimension,
    exportDimensions,
    getDimensionList,
    getDimensionTree,
    importDimensions,
    safeDeleteDimension,
    updateDimension,
    validateDimCode,
} from './api';
import Sider from '@arco-design/web-react/es/Layout/sider';
import {debounce} from 'lodash';
import {
    IconCheckCircle,
    IconCheckSquare,
    IconDelete,
    IconDownload,
    IconEdit,
    IconExclamationCircleFill, IconList,
    IconPlus,
    IconUpload, IconUserGroup
} from '@arco-design/web-react/icon';
import FilterForm from '@/components/FilterForm';

const {TextArea} = Input;

const Header = Layout.Header;
const Content = Layout.Content;

function DimensionManager() {
    // 状态管理
    const [treeData, setTreeData] = useState([]);
    const [srcTreeData, setSrcTreeData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [selectedTreeKeys, setSelectedTreeKeys] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // 对话框状态
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [deleteType, setDeleteType] = useState('safe'); // safe | cascade

    // 导入导出状态
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    // 表单引用
    const filterFormRef = useRef();
    const addFormRef = useRef();
    const editFormRef = useRef();

    // 分页配置
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: true,
        showJumper: true,
        showPageSize: true,
    });

    // 分组选项
    const [groupOptions, setGroupOptions] = useState([]);

    // 级联选择的父维度数据
    const [cascaderOptions, setCascaderOptions] = useState([]);
    const [currentGroupDimensions, setCurrentGroupDimensions] = useState([]);

    // 状态选项
    const stateOptions = [
        {label: '启用', value: '1'},
        {label: '禁用', value: '0'},
    ];

    // 表格列配置
    const columns = [
        {
            title: '维度编码',
            dataIndex: 'dimCode',
            width: 150,
            fixed: 'left',
            ellipsis: true,
        },
        {
            title: '维度分组',
            dataIndex: 'dimGroup',
            width: 120,
            ellipsis: true,
        },
        {
            title: '维度值',
            dataIndex: 'dimValue',
            minWidth: 200,
            ellipsis: true,
            render: (value) => {
                if (!value) return '--';
                try {
                    const parsed = JSON.parse(value);
                    return JSON.stringify(parsed, null, 2);
                } catch {
                    return value;
                }
            },
        },
        {
            title: '父维度',
            dataIndex: 'parentDimCode',
            width: 120,
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: '排序',
            dataIndex: 'seq',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'state',
            aligin: 'center',
            width: 120,
            render: (value) => (
                <Tag color={value === '1' ? 'green' : 'gray'}>
                    {value === '1' ? '启用' : '禁用'}
                </Tag>
            ),
        },
        {
            title: '操作',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="large" className="dropdown-demo table-btn-group">
                    <Dropdown
                        position="bl"
                        droplist={
                            <Menu
                                onClickMenuItem={(key, e) => {
                                    handleMenuClick(key, e, record);
                                }}
                                className="handle-dropdown-menu"
                            >
                                <Menu.Item key="edit">
                                    <IconEdit/>
                                    编辑
                                </Menu.Item>
                                <Menu.Item key="toggle">
                                    {record.state === '1' ? (
                                        <>
                                            <IconExclamationCircleFill/>
                                            禁用
                                        </>
                                    ) : (
                                        <>
                                            <IconCheckCircle/>
                                            启用
                                        </>
                                    )}
                                </Menu.Item>
                                <Menu.Item key="delete">
                                    <IconDelete/>
                                    删除
                                </Menu.Item>
                            </Menu>
                        }
                    >
                        <Button
                            type="text"
                            className="more-btn"
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <IconList/>
                        </Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    // 搜索树形数据
    const searchTreeData = (inputValue) => {
        const loop = data => {
            const result = [];
            data.forEach(item => {
                if (
                    item.dimCode.toLowerCase().indexOf(inputValue.toLowerCase()) > -1 ||
                    item.dimValue.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                ) {
                    result.push({...item});
                } else if (item.children) {
                    const filterData = loop(item.children);
                    if (filterData.length) {
                        result.push({...item, children: filterData});
                    }
                }
            });
            return result;
        };
        return loop(srcTreeData);
    };

    // 获取树形数据
    const fetchTreeData = async (group = '') => {
        setLoading(true);
        try {
            const response = await getDimensionTree(group);
            if (response.data.success) {
                const treeData = response.data.data;
                setTreeData(treeData);
                setSrcTreeData(treeData);

                // 提取分组选项
                const groups = new Set();
                const extractGroups = (nodes) => {
                    nodes.forEach(node => {
                        if (node.dimGroup) {
                            groups.add(node.dimGroup);
                        }
                        if (node.children) {
                            extractGroups(node.children);
                        }
                    });
                };
                extractGroups(treeData);
                setGroupOptions(Array.from(groups).map(group => ({label: group, value: group})));
            }
        } catch (error) {
            Message.error('获取树形数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 根据分组获取维度数据并构建级联选择结构
    const buildCascaderOptions = (group) => {
        if (!group || !srcTreeData.length) {
            return [];
        }

        // 从树形数据中提取指定分组的维度
        const extractDimensionsFromGroup = (nodes, targetGroup) => {
            const dimensions = [];
            const traverse = (nodeList) => {
                nodeList.forEach(node => {
                    if (node.dimGroup !== node.dimCode && node.dimGroup === targetGroup) {
                        dimensions.push({
                            value: node.dimCode,
                            label: `${node.dimCode} - ${node.dimValue || node.dimCode}`,
                            dimCode: node.dimCode,
                            dimValue: node.dimValue,
                            parentDimCode: node.parentDimCode,
                            children: []
                        });
                    }
                    if (node.children) {
                        traverse(node.children);
                    }
                });
            };
            traverse(nodes);
            return dimensions;
        };

        const dimensions = extractDimensionsFromGroup(srcTreeData, group);

        // 构建层级结构
        const buildHierarchy = (items) => {
            const map = new Map();
            const roots = [];

            // 创建映射
            items.forEach(item => {
                map.set(item.dimCode, {...item, children: []});
            });

            // 构建层级关系
            items.forEach(item => {
                const node = map.get(item.dimCode);
                if (item.parentDimCode && map.has(item.parentDimCode)) {
                    map.get(item.parentDimCode).children.push(node);
                } else {
                    roots.push(node);
                }
            });

            return roots;
        };

        return buildHierarchy(dimensions);
    };

    // 检查是否会造成循环引用
    const checkCircularReference = (parentDimCode, currentDimCode, group) => {
        if (!parentDimCode || !currentDimCode || parentDimCode === currentDimCode) {
            return false;
        }

        // 获取当前分组的所有维度
        const groupDimensions = [];
        const extractFromGroup = (nodes, targetGroup) => {
            nodes.forEach(node => {
                if (node.dimGroup === targetGroup) {
                    groupDimensions.push({
                        dimCode: node.dimCode,
                        parentDimCode: node.parentDimCode
                    });
                }
                if (node.children) {
                    extractFromGroup(node.children, targetGroup);
                }
            });
        };
        extractFromGroup(srcTreeData, group);

        // 检查是否存在循环
        const visited = new Set();
        const checkPath = (dimCode) => {
            if (visited.has(dimCode)) {
                return true; // 发现循环
            }
            if (dimCode === currentDimCode) {
                return true; // 会形成循环
            }

            visited.add(dimCode);
            const dimension = groupDimensions.find(d => d.dimCode === dimCode);
            if (dimension && dimension.parentDimCode) {
                return checkPath(dimension.parentDimCode);
            }
            return false;
        };

        return checkPath(parentDimCode);
    };

    // 获取表格数据
    const fetchTableData = async (params = {}, pageSize = pagination.pageSize, current = pagination.current) => {
        setTableLoading(true);
        try {
            const targetParams = {
                ...params,
                page: current - 1,
                size: pageSize,
            };
            if (targetParams.dimCode) {
                targetParams.dimCode = targetParams.dimCode.substring(2, targetParams.dimCode.length - 1);
            }
            const response = await getDimensionList(targetParams);
            if (response.data.success) {
                setTableData(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    current,
                    pageSize,
                    total: response.data.total || 0,
                }));
            }
        } catch (error) {
            Message.error('获取表格数据失败');
        } finally {
            setTableLoading(false);
        }
    };

    // 搜索表格数据
    const searchTableData = (params) => {
        fetchTableData(params, pagination.pageSize, 1);
    };

    // 处理树节点选择
    const handleTreeNodeSelect = (selectedKeys) => {
        setSelectedTreeKeys(selectedKeys);
        if (selectedKeys.length > 0) {
            // 根据选中的树节点过滤表格数据
            const selectedGroup = selectedKeys[0]; // 假设选中的是分组
            if (groupOptions.some(item => item.value === selectedGroup)) {
                fetchTableData({dimGroup: selectedGroup});
            } else {
                fetchTableData({dimCode: '~%' + selectedGroup + '%'});
            }
        } else {
            fetchTableData();
        }
    };

    // 处理新增
    const handleAdd = () => {
        setCurrentRecord(null);
        setCascaderOptions([]);
        setAddModalVisible(true);
    };

    // 处理编辑
    const handleEdit = (record) => {
        setCurrentRecord(record);
        // 根据当前记录的分组构建级联选择数据，排除当前维度
        const cascaderData = buildCascaderOptions(record.dimGroup);
        setCascaderOptions(cascaderData);
        setEditModalVisible(true);
    };

    // 处理删除
    const handleDelete = (record) => {
        setCurrentRecord(record);
        setDeleteModalVisible(true);
    };

    // 处理状态切换
    const handleToggleState = async (record) => {
        try {
            if (record.state === '1') {
                await disableDimension(record);
                Message.success('禁用成功');
            } else {
                await enableDimension(record);
                Message.success('启用成功');
            }
            fetchTableData();
            fetchTreeData();
        } catch (error) {
            Message.error('操作失败');
        }
    };

    // 处理菜单点击
    const handleMenuClick = (key, event, record) => {
        event.stopPropagation();
        if (key === 'edit') {
            handleEdit(record);
        } else if (key === 'toggle') {
            handleToggleState(record);
        } else if (key === 'delete') {
            handleDelete(record);
        }
    };

    // 处理批量删除

    // 关键字搜索防抖
    const debouncedSearch = useCallback(
        debounce((value) => {
            if (!value) {
                setTreeData(srcTreeData);
            } else {
                const result = searchTreeData(value);
                setTreeData(result);
            }
            setIsSearching(false);
        }, 300),
        [srcTreeData]
    );

    // 处理搜索输入
    const handleSearchChange = (value) => {
        setKeyword(value);
        setIsSearching(true);
        debouncedSearch(value);
    };

    useEffect(() => {
        if (editModalVisible && currentRecord && editFormRef.current) {
            editFormRef.current.setFieldsValue({
                dimCode: currentRecord.dimCode,
                dimGroup: currentRecord.dimGroup,
                parentDimCode: currentRecord.parentDimCode,
                dimValue: currentRecord.dimValue,
                seq: currentRecord.seq,
                state: currentRecord.state,
            });
        }
    }, [editModalVisible, currentRecord]);

    // 初始化数据
    useEffect(() => {
        fetchTreeData();
        fetchTableData();
    }, []);

    // 提交新增表单
    const handleAddSubmit = async (values) => {
        try {
            if (values.parentDimCode instanceof Array && values.parentDimCode.length > 0) {
                values.parentDimCode = values.parentDimCode[values.parentDimCode.length - 1];
            }
            await addDimension(values);
            Message.success('新增成功');
            setAddModalVisible(false);
            addFormRef.current?.resetFields();
            fetchTableData();
            fetchTreeData();
        } catch (error) {
            Message.error('新增失败');
            console.error(error);
        }
    };

    // 提交编辑表单
    const handleEditSubmit = async (values) => {
        try {
            const targetParams = {...values};
            targetParams.id = currentRecord.id;
            await updateDimension(targetParams);
            Message.success('编辑成功');
            setEditModalVisible(false);
            editFormRef.current?.resetFields();
            fetchTableData();
            fetchTreeData();
        } catch (error) {
            Message.error('编辑失败');
        }
    };

    // 确认删除
    const handleDeleteConfirm = async () => {
        try {
            if (deleteType === 'cascade') {
                await cascadeDeleteDimension(currentRecord);
            } else {
                await safeDeleteDimension(currentRecord);
            }
            Message.success('删除成功');
            setDeleteModalVisible(false);
            fetchTableData();
            fetchTreeData();
        } catch (error) {
            Message.error('删除失败');
        }
    };

    // 验证维度编码唯一性
    const validateDimCodeUnique = async (value, callback) => {
        if (!value) {
            return callback();
        }
        try {
            const response = await validateDimCode(value, currentRecord?.id);
            if (response.data.exists) {
                callback('维度编码已存在');
            } else {
                callback();
            }
        } catch (error) {
            callback();
        }
    };

    // 处理导出
    const handleExport = () => {
        setExportModalVisible(true);
    };

    // 确认导出
    const handleExportConfirm = async () => {
        if (selectedGroups.length === 0) {
            Message.warning('请至少选择一个维度分组');
            return;
        }

        setExportLoading(true);
        try {
            const response = await exportDimensions(selectedGroups);

            // 创建下载链接
            const blob = new Blob([response.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dimensions_${new Date().getTime()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            Message.success('导出成功');
            setExportModalVisible(false);
            setSelectedGroups([]);
        } catch (error) {
            Message.error('导出失败');
        } finally {
            setExportLoading(false);
        }
    };

    // 处理导入
    const handleImport = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        setImportLoading(true);
        try {
            const response = await importDimensions(formData);
            if (response.data.success) {
                Message.success('导入成功');
                fetchTableData();
                fetchTreeData();
            } else {
                Message.error(response.data.message || '导入失败');
            }
        } catch (error) {
            Message.error('导入失败');
        } finally {
            setImportLoading(false);
        }

        return false; // 阻止默认上传行为
    };

    // 处理分组选择
    const handleGroupSelect = (group, checked) => {
        if (checked) {
            setSelectedGroups([...selectedGroups, group]);
        } else {
            setSelectedGroups(selectedGroups.filter(g => g !== group));
        }
    };

    // 全选/取消全选分组
    const handleSelectAllGroups = (checked) => {
        if (checked) {
            setSelectedGroups(groupOptions.map(option => option.value));
        } else {
            setSelectedGroups([]);
        }
    };

    return (
        <div className="dim-manager">
            <Layout style={{margin: '12px', height: '100%'}}>
                <Header style={{height: '34px'}}>
                    <div className="title">
                        <IconUserGroup style={{color: 'var(--color-arcoblue-6)'}}/>
                        <span>维度管理</span>
                    </div>
                </Header>
                <Content style={{overflow: 'auto'}}>
                    <Layout style={{height: '100%'}}>
                        {/* 左侧树形视图 */}
                        <Sider
                            resizeDirections={['right']}
                            style={{
                                marginRight: '12px',
                                borderRadius: '6px 0 0 6px',
                                minWidth: 200,
                                maxWidth: 500,
                                height: 'calc(100% - 20px)',
                            }}
                        >
                            <Layout style={{height: '100%'}}>
                                <Header>
                                    <Input.Search
                                        value={keyword}
                                        onChange={handleSearchChange}
                                        placeholder="搜索维度"
                                        suffix={isSearching && <Spin dot/>}
                                    />
                                </Header>
                                <Content style={{overflow: 'auto'}}>
                                    <Spin loading={loading} style={{width: '100%', height: '100%'}}>
                                        <Tree
                                            expandedKeys={expandedKeys}
                                            showLine
                                            fieldNames={{
                                                key: 'dimCode',
                                                title: 'dimValue',
                                            }}
                                            onSelect={handleTreeNodeSelect}
                                            treeData={treeData}
                                            onExpand={setExpandedKeys}
                                            renderTitle={({title}) => {
                                                if (keyword) {
                                                    const index = title.toLowerCase().indexOf(keyword.toLowerCase());
                                                    if (index === -1) {
                                                        return title;
                                                    }
                                                    const prefix = title.substr(0, index);
                                                    const suffix = title.substr(index + keyword.length);
                                                    return (
                                                        <span>
                              {prefix}
                                                            <span style={{color: 'var(--color-primary-light-4)'}}>
                                {title.substr(index, keyword.length)}
                              </span>
                                                            {suffix}
                            </span>
                                                    );
                                                }
                                                return title;
                                            }}
                                        />
                                    </Spin>
                                </Content>
                            </Layout>
                        </Sider>

                        {/* 右侧表格视图 */}
                        <Layout
                            style={{
                                background: 'var(--color-white)',
                                borderRadius: '6px',
                                padding: '16px',
                                overflow: 'hidden',
                                height: 'calc(100% - 20px)',
                                boxShadow: 'var(--modo-card-box-shadow)',
                                position: 'relative',
                            }}
                        >
                            <Header>
                                {/* 搜索栏 */}
                                <FilterForm
                                    ref={filterFormRef}
                                    fields={[
                                        {
                                            type: 'input',
                                            field: 'dimCode',
                                            label: '维度编码',
                                            options: {
                                                placeholder: '请输入维度编码',
                                            },
                                        },
                                        {
                                            type: 'select',
                                            field: 'dimGroup',
                                            label: '维度分组',
                                            options: {
                                                placeholder: '请选择维度分组',
                                                allowClear: true,
                                                options: groupOptions,
                                            },
                                        },
                                        {
                                            type: 'select',
                                            field: 'state',
                                            label: '状态',
                                            options: {
                                                placeholder: '请选择状态',
                                                allowClear: true,
                                                options: stateOptions,
                                            },
                                        },
                                    ]}
                                    search={searchTableData}
                                />

                                {/* 操作按钮 */}
                                <div className="action-buttons">
                                    <Space>
                                        <Button
                                            type="primary"
                                            icon={<IconPlus/>}
                                            onClick={handleAdd}
                                        >
                                            新增维度
                                        </Button>
                                        <Button
                                            icon={<IconDownload/>}
                                            onClick={handleExport}
                                        >
                                            导出
                                        </Button>
                                        <Upload
                                            accept=".xlsx,.xls"
                                            beforeUpload={handleImport}
                                            showUploadList={false}
                                        >
                                            <Button
                                                icon={<IconUpload/>}
                                                loading={importLoading}
                                            >
                                                导入
                                            </Button>
                                        </Upload>
                                    </Space>
                                </div>
                            </Header>

                            <Content style={{overflow: 'auto', paddingBottom: '60px'}}>
                                <Table
                                    loading={tableLoading}
                                    columns={columns}
                                    rowKey="id"
                                    data={tableData}
                                    pagination={false}
                                    scroll={{x: 1200}}
                                    border
                                    stripe
                                    hover
                                />
                            </Content>

                            {/* 固定在底部的分页组件 */}
                            <div className="pagination-wrapper">
                                <Pagination
                                    total={pagination.total}
                                    current={pagination.current}
                                    pageSize={pagination.pageSize}
                                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                                    showJumper
                                    showPageSize
                                    pageSizeOptions={[10, 20, 50, 100]}
                                    onChange={(current, pageSize) => {
                                        fetchTableData({}, pageSize, current);
                                    }}
                                />
                            </div>
                        </Layout>
                    </Layout>
                </Content>
            </Layout>

            {/* 新增维度对话框 */}
            <Modal
                title="新增维度"
                visible={addModalVisible}
                onCancel={() => {
                    setAddModalVisible(false);
                    addFormRef.current?.resetFields();
                }}
                onOk={() => {
                    addFormRef.current?.validate().then(handleAddSubmit);
                }}
                confirmLoading={loading}
            >
                <Form ref={addFormRef} className="modal-form" layout="vertical">
                    <Form.Item
                        field="dimCode"
                        label={<span className="required-label">维度编码</span>}
                        rules={[
                            {required: true, message: '请输入维度编码'},
                            {max: 64, message: '维度编码最多64个字符'},
                            {validator: validateDimCodeUnique},
                        ]}
                    >
                        <Input placeholder="请输入维度编码"/>
                    </Form.Item>

                    <Form.Item
                        field="dimGroup"
                        label="维度分组"
                        rules={[{max: 32, message: '维度分组最多32个字符'}]}
                    >
                        <Select
                            placeholder="请选择或输入维度分组"
                            allowCreate
                            allowClear
                            options={groupOptions}
                            onChange={(value) => {
                                // 当分组改变时，重新构建级联选择数据
                                const cascaderData = buildCascaderOptions(value);
                                setCascaderOptions(cascaderData);
                                // 清空父维度选择
                                addFormRef.current?.setFieldValue('parentDimCode', undefined);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        field="parentDimCode"
                        label="父维度"
                        rules={[
                            {max: 32, message: '父维度编码最多32个字符'},
                            {
                                validator: (value, callback) => {
                                    if (value) {
                                        const currentDimCode = addFormRef.current?.getFieldValue('dimCode');
                                        const currentGroup = addFormRef.current?.getFieldValue('dimGroup');
                                        if (currentDimCode && checkCircularReference(value, currentDimCode, currentGroup)) {
                                            callback('选择的父维度会造成循环引用，请重新选择');
                                            return;
                                        }
                                    }
                                    callback();
                                }
                            }
                        ]}
                    >
                        <Cascader
                            placeholder="请选择父维度"
                            allowClear
                            showSearch
                            options={cascaderOptions}
                            fieldNames={{
                                value: 'dimCode',
                                label: 'label'
                            }}
                            expandTrigger="hover"
                            changeOnSelect
                            renderFormat={(valueShow, selectedOptions) => {
                                if (selectedOptions && selectedOptions.length > 0) {
                                    const lastOption = selectedOptions[selectedOptions.length - 1];
                                    return lastOption.label;
                                }
                                return valueShow;
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        field="dimValue"
                        label="维度值"
                    >
                        <TextArea
                            placeholder="请输入维度值"
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item
                        field="seq"
                        label="排序"
                        rules={[{type: 'number', min: 0, message: '排序必须为非负整数'}]}
                    >
                        <InputNumber placeholder="请输入排序" min={0}/>
                    </Form.Item>

                    <Form.Item
                        field="state"
                        label={<span className="required-label">状态</span>}
                        rules={[{required: true, message: '请选择状态'}]}
                        initialValue="1"
                    >
                        <Radio.Group>
                            <Radio value="1">启用</Radio>
                            <Radio value="0">禁用</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑维度对话框 */}
            <Modal
                title="编辑维度"
                visible={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    editFormRef.current?.resetFields();
                }}
                onOk={() => {
                    editFormRef.current?.validate().then(handleEditSubmit);
                }}
                confirmLoading={loading}
            >
                <Form ref={editFormRef} className="modal-form" layout="vertical">
                    <Form.Item
                        field="dimCode"
                        label="维度编码"
                        initialValue={currentRecord?.dimCode}
                    >
                        <Input disabled placeholder="维度编码不可修改"/>
                    </Form.Item>

                    <Form.Item
                        field="dimGroup"
                        label="维度分组"
                        rules={[{max: 32, message: '维度分组最多32个字符'}]}
                        initialValue={currentRecord?.dimGroup}
                    >
                        <Select
                            placeholder="请选择或输入维度分组"
                            allowCreate
                            allowClear
                            options={groupOptions}
                            onChange={(value) => {
                                // 当分组改变时，重新构建级联选择数据
                                const cascaderData = buildCascaderOptions(value);
                                setCascaderOptions(cascaderData);
                                // 清空父维度选择
                                editFormRef.current?.setFieldValue('parentDimCode', undefined);
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        field="parentDimCode"
                        label="父维度"
                        rules={[
                            {max: 32, message: '父维度编码最多32个字符'},
                            {
                                validator: (value, callback) => {
                                    if (value) {
                                        const currentDimCode = currentRecord?.dimCode;
                                        const currentGroup = editFormRef.current?.getFieldValue('dimGroup');
                                        if (currentDimCode && checkCircularReference(value, currentDimCode, currentGroup)) {
                                            callback('选择的父维度会造成循环引用，请重新选择');
                                            return;
                                        }
                                    }
                                    callback();
                                }
                            }
                        ]}
                        initialValue={currentRecord?.parentDimCode}
                    >
                        <Cascader
                            placeholder="请选择父维度"
                            allowClear
                            showSearch
                            options={cascaderOptions}
                            fieldNames={{
                                value: 'dimCode',
                                label: 'label'
                            }}
                            expandTrigger="hover"
                            changeOnSelect
                            renderFormat={(valueShow, selectedOptions) => {
                                if (selectedOptions && selectedOptions.length > 0) {
                                    const lastOption = selectedOptions[selectedOptions.length - 1];
                                    return lastOption.label;
                                }
                                return valueShow;
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        field="dimValue"
                        label="维度值"
                        initialValue={currentRecord?.dimValue}
                    >
                        <TextArea
                            placeholder="请输入维度值"
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item
                        field="seq"
                        label="排序"
                        rules={[{type: 'number', min: 0, message: '排序必须为非负整数'}]}
                        initialValue={currentRecord?.seq}
                    >
                        <InputNumber placeholder="请输入排序" min={0}/>
                    </Form.Item>

                    <Form.Item
                        field="state"
                        label={<span className="required-label">状态</span>}
                        rules={[{required: true, message: '请选择状态'}]}
                        initialValue={currentRecord?.state}
                    >
                        <Radio.Group>
                            <Radio value="1">启用</Radio>
                            <Radio value="0">禁用</Radio>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 删除确认对话框 */}
            <Modal
                title={
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <IconExclamationCircleFill style={{marginRight: '8px', fontSize: '16px'}}/>
                        <span>删除确认</span>
                    </div>
                }
                visible={deleteModalVisible}
                onCancel={() => setDeleteModalVisible(false)}
                onOk={handleDeleteConfirm}
                confirmLoading={loading}
                okButtonProps={{
                    status: 'primary',
                    size: 'large'
                }}
                cancelButtonProps={{
                    size: 'large'
                }}
                width={480}
                className="delete-modal"
            >
                <div style={{padding: '16px 0'}}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '20px',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid #ffccc7'
                    }}>
                        <IconExclamationCircleFill
                            style={{
                                color: '#f53f3f',
                                fontSize: '20px',
                                marginRight: '12px',
                                marginTop: '2px',
                                flexShrink: 0
                            }}
                        />
                        <div>
                            <div style={{fontSize: '14px', fontWeight: 500, marginBottom: '8px'}}>
                                您即将删除维度：<span style={{fontWeight: 600}}>{currentRecord?.dimCode}</span>
                            </div>
                            <div style={{fontSize: '13px', lineHeight: '1.5'}}>
                                此操作不可恢复，请谨慎选择删除方式并确认是否继续。
                            </div>
                        </div>
                    </div>

                    <div style={{marginBottom: '8px'}}>
                        <div style={{fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#1d2129'}}>
                            删除方式：
                        </div>
                        <Radio.Group
                            value={deleteType}
                            onChange={setDeleteType}
                            style={{width: '100%'}}
                        >
                            <div style={{marginBottom: '12px'}}>
                                <Radio value="safe" style={{alignItems: 'flex-start'}}>
                                    <div>
                                        <div style={{fontWeight: 500, marginBottom: '4px'}}>安全删除</div>
                                        <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                                            仅删除当前节点，要求该节点无子节点
                                        </div>
                                    </div>
                                </Radio>
                            </div>
                            <div>
                                <Radio value="cascade" style={{alignItems: 'flex-start'}}>
                                    <div>
                                        <div style={{fontWeight: 500, marginBottom: '4px'}}>级联删除</div>
                                        <div style={{fontSize: '12px', lineHeight: '1.4'}}>
                                            删除当前节点及其所有子节点（危险操作）
                                        </div>
                                    </div>
                                </Radio>
                            </div>
                        </Radio.Group>
                    </div>
                </div>
            </Modal>

            {/* 导出对话框 */}
            <Modal
                title="导出维度数据"
                visible={exportModalVisible}
                onCancel={() => {
                    setExportModalVisible(false);
                    setSelectedGroups([]);
                }}
                onOk={handleExportConfirm}
                confirmLoading={exportLoading}
                okButtonProps={{
                    status: 'primary',
                    size: 'large'
                }}
                cancelButtonProps={{
                    size: 'large'
                }}
                width={520}
            >
                <div style={{padding: '16px 0'}}>
                    <div style={{marginBottom: '16px', fontSize: '14px', color: '#1d2129'}}>
                        请选择要导出的维度分组：
                    </div>

                    <div style={{marginBottom: '16px'}}>
                        <Button
                            type="text"
                            size="small"
                            icon={<IconCheckSquare/>}
                            onClick={() => handleSelectAllGroups(selectedGroups.length !== groupOptions.length)}
                        >
                            {selectedGroups.length === groupOptions.length ? '取消全选' : '全选'}
                        </Button>
                    </div>

                    <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border-2)',
                        borderRadius: '6px',
                        padding: '12px'
                    }}>
                        {groupOptions.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                color: '#86909c',
                                padding: '20px 0',
                                fontSize: '14px'
                            }}>
                                暂无维度分组数据
                            </div>
                        ) : (
                            <Space direction="vertical" style={{width: '100%'}}>
                                {groupOptions.map(option => (
                                    <div
                                        key={option.value}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedGroups.includes(option.value) ? 'var(--color-primary-light-1)' : 'transparent',
                                            border: selectedGroups.includes(option.value) ? '1px solid var(--color-primary-light-4)' : '1px solid transparent',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => handleGroupSelect(option.value, !selectedGroups.includes(option.value))}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.includes(option.value)}
                                            onChange={(e) => handleGroupSelect(option.value, e.target.checked)}
                                            style={{marginRight: '8px'}}
                                        />
                                        <span style={{fontSize: '14px'}}>{option.label}</span>
                                    </div>
                                ))}
                            </Space>
                        )}
                    </div>

                    <div style={{
                        marginTop: '16px',
                        fontSize: '13px',
                        color: '#86909c',
                        lineHeight: '1.5'
                    }}>
                        已选择 <span
                        style={{color: 'var(--color-primary-6)', fontWeight: 500}}>{selectedGroups.length}</span> 个分组
                        {selectedGroups.length > 0 && (
                            <div style={{marginTop: '4px'}}>
                                {selectedGroups.join('、')}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default DimensionManager;
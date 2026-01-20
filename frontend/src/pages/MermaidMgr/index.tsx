import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import UserAvatar from "@/components/UserAvatar";
import {
  Button,
  Dropdown,
  Form,
  Grid,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  Pagination,
  Space,
  Spin,
  Table,
  Tree,
  Select,
} from "@arco-design/web-react";
import "./style/index.less";
import {
  getAllSubjects,
  getMermaidList,
  getMermaidCategories,
  createMermaidCategory,
  updateMermaidCategory,
  deleteMermaidCategory,
  createMermaidDiagram,
  updateMermaidDiagram,
  deleteMermaidDiagram,
} from "./api";
import MermaidEditor from '@/pages/Mermaid';
import {
  IconDelete,
  IconEdit,
  IconEye,
  IconList,
  IconMindMapping,
  IconPlus,
  IconSearch,
} from "@arco-design/web-react/icon";
import Sider from "@arco-design/web-react/es/Layout/sider";
import renderDate from "@/utils/timeUtil";

const { Content } = Layout;
const { Row, Col } = Grid;

function QuestionManager() {
  const [deleteCategoryVisible, setDeleteCategoryVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adding, setAdding] = useState(false);

  // --- 分类操作相关状态 ---
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null); // 区分新增还是编辑
  const [categoryForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 状态管理
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableScrollHeight, setTableScrollHeight] = useState(200);

  // 对话框状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [showMermaidModal, setShowMermaidModal] = useState(false);
  const [mermaidModalCode, setMermaidModalCode] = useState<string | null>(null);

  // AI生成题目相关状态
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  // 流式生成过程中的内容展示
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreamingComplete, setIsStreamingComplete] = useState(false);
  // 控制生成日志是否在题目展示时可见（默认展示，生成结束后自动隐藏）
  const [showStreamLogVisible, setShowStreamLogVisible] = useState(true);
  const streamingContainerRef = useRef<HTMLDivElement | null>(null);
  const generatedListRef = useRef<HTMLDivElement | null>(null);

  // 当流式内容更新时，自动滚动到底部
  useEffect(() => {
    if (streamingContainerRef.current) {
      // 等待 DOM 更新
      setTimeout(() => {
        try {
          streamingContainerRef.current!.scrollTop =
            streamingContainerRef.current!.scrollHeight;
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [streamingContent]);

  // 当生成的题目列表更新时，自动滚动列表到底部
  useEffect(() => {
    if (generatedListRef.current) {
      setTimeout(() => {
        try {
          generatedListRef.current!.scrollTop =
            generatedListRef.current!.scrollHeight;
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [generatedQuestions]);

  // 当流式解析阶段完成并且已收到至少一道题目时，自动隐藏生成日志
  useEffect(() => {
    if (
      isStreamingComplete &&
      generatedQuestions &&
      generatedQuestions.length > 0
    ) {
      setShowStreamLogVisible(false);
    }
  }, [isStreamingComplete, generatedQuestions]);

  // 查看详情相关状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);

  // 学科和分类相关状态
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  // 知识点下拉选项（按学科/分类过滤）
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // 左侧树相关状态
  const [treeData, setTreeData] = useState<any[]>([]);
  const [filteredTreeData, setFilteredTreeData] = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<any>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [currentTreeNode, setCurrentTreeNode] = useState<any>(null);

  // 表单引用
  const filterFormRef = useRef<any>();
  const editFormRef = useRef<any>();
  const generateFormRef = useRef<any>();
  const generateEventSourceRef = useRef<EventSource | null>(null);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  // 处理分类提交 (API调用)
  const handleCategorySubmit = async () => {
    const values = await categoryForm.validate();
    try {
      if (editingCategory) {
        await updateMermaidCategory(editingCategory.categoryId, values);
        Message.success("更新成功");
      } else {
        await createMermaidCategory(values);
        Message.success("新增成功");
      }
      setCategoryModalVisible(false);
      setEditingCategory(null);
      fetchSubjectCategoryTree(); // 刷新树数据
    } catch (e) {
      Message.error("操作失败");
    }
  };

  // 打开新增对话框
  const openAddDiagram = () => {
    setCurrentRecord(null);
    editForm.resetFields();
    setEditModalVisible(true);
  };

  // 保存新增/编辑思维图
  const handleSaveDiagram = async () => {
    try {
      const values = await editForm.validate();
      if (currentRecord && currentRecord.id) {
        await updateMermaidDiagram(currentRecord.id, values);
        Message.success('更新成功');
      } else {
        await createMermaidDiagram(values);
        Message.success('创建成功');
      }
      setEditModalVisible(false);
      // 刷新表格
      fetchTableData(null, null, 1, null, null);
    } catch (e) {
      Message.error('保存失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteMermaidCategory(id);
      Message.success("删除成功");
      // 如果当前选中被删除的节点，清理选中状态
      if (selectedTreeNode === id) {
        setSelectedTreeNode(null);
        setCurrentTreeNode(null);
      }
      fetchSubjectCategoryTree();
    } catch (e) {
      Message.error("删除失败");
    }
  };

  const columns = [
    {
      title: "名称",
      dataIndex: "diagramName",
      minWidth: 200,
      ellipsis: true,
      render: (value, record) => (
        <a onClick={() => handleDetail(record)}>{value}</a>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      minWidth: 300,
      ellipsis: true,
    },
    {
      title: "分类",
      dataIndex: "categoryName",
      width: 160,
      ellipsis: true,
    },
    {
      title: "创建人",
      dataIndex: "createUser",
      width: 140,
      ellipsis: true,
      render: (name, record) => (
        <UserAvatar name={record.createUserName || name || ""} showName />
      ),
    },
    {
      title: "最后更新",
      dataIndex: "updateDate",
      width: 200,
      render: (value, record) => (
        renderDate(record.updateDate)
      ),
    },
    {
      title: "操作",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Dropdown
          position="bl"
          droplist={
            <Menu
              onClickMenuItem={(key, e) => {
                handleMenuClick(key, e, record);
              }}
              className="handle-dropdown-menu"
            >
              <Menu.Item key="draw">
                <IconMindMapping style={{ marginRight: "5px" }} />
                绘图
              </Menu.Item>
              <Menu.Item key="detail">
                <IconEye style={{ marginRight: "5px" }} />
                详情
              </Menu.Item>
              <Menu.Item key="edit">
                <IconEdit style={{ marginRight: "5px" }} />
                编辑
              </Menu.Item>
              <Menu.Item key="delete">
                <IconDelete style={{ marginRight: "5px" }} />
                删除
              </Menu.Item>
            </Menu>
          }
        >
          <Button
            type="text"
            className="more-btn"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <IconList />
          </Button>
        </Dropdown>
      ),
    },
  ];

  const renderTreeTitle = (nodeProps) => {
    const { title, categoryId, key } = nodeProps;

    // 根节点不显示右键菜单
    if (key === "all") {
      return <div style={{ width: "100%" }}>{title}</div>;
    }

    const dropList = (
      <Menu
        onClickMenuItem={(menuKey, e) => {
          // 核心：在此处阻止冒泡，Tree 节点就不会被选中
          e.stopPropagation();

          if (menuKey === "edit") {
            setEditingCategory(nodeProps);
            categoryForm.setFieldsValue({ categoryName: title });
            setCategoryModalVisible(true);
          } else if (menuKey === "delete") {
            // 仅打开确认弹窗，不执行删除
            setPendingDeleteId(categoryId);
            setDeleteCategoryVisible(true);
          }
        }}
      >
        <Menu.Item key="edit">
          <IconEdit /> 编辑名称
        </Menu.Item>
        <Menu.Item key="delete" style={{ color: "red" }}>
          <IconDelete /> 删除分类
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown droplist={dropList} trigger="contextMenu" position="bl">
        <div style={{ width: "100%", cursor: "context-menu" }}>{title}</div>
      </Dropdown>
    );
  };
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Message.warning("请输入分类名称");
      return;
    }
    setAdding(true);
    try {
      const payload = { categoryName: newCategoryName };
      await createMermaidCategory(payload);
      Message.success("新增分类成功");
      setAddCategoryVisible(false);
      setNewCategoryName("");
      fetchSubjectCategoryTree(); // 刷新树
    } catch (e) {
      Message.error("新增失败");
    } finally {
      setAdding(false);
    }
  };

  // 获取表格数据
  const fetchTableData = async (
    inParams,
    inPageSize,
    inPageNum,
    inSubjectId,
    inCategoryId
  ) => {
    const params = inParams || filterFormRef.current?.getFieldsValue?.();
    const pageSize = inPageSize || pagination.pageSize;
    const pageNum = inPageNum || pagination.current;
    const subjectId = inSubjectId || currentTreeNode?.subjectId;
    let categoryId = inCategoryId || currentTreeNode?.categoryId;
    if(categoryId === 'all') {
        categoryId = null;
    }
    setTableLoading(true);
    try {
      const targetParams: any = {
        ...params,
        subjectId,
        pageNum: pageNum - 1,
        pageSize: pageSize,
      };
      // 仅当 categoryId 有效时才传递，避免发送空的 categoryId
      if (categoryId != null && categoryId !== "") {
        targetParams.categoryId = categoryId;
      }

      const response = await getMermaidList(targetParams);
      if (response.data) {
        if (
          response.data.content.length === 0 &&
          response.data.totalElements > 0
        ) {
          fetchTableData(inParams, inPageSize, 1, inSubjectId, inCategoryId);
        } else {
          setTableData(response.data.content || []);
          setPagination((prev) => ({
            ...prev,
            current: pageNum,
            pageSize,
            total: response.data.totalElements || 0,
          }));
        }
      }
    } catch (error) {
      Message.error("获取题目数据失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 处理编辑
  const handleEdit = (record) => {
    setCurrentRecord(record);
    // 填充表单
    editForm.setFieldsValue({
      diagramName: record.diagramName,
      description: record.description,
      diagramData: record.diagramData,
      categoryId: record.categoryId,
    });
    setEditModalVisible(true);
  };

  // 处理删除
  const handleDelete = (record) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord || !currentRecord.id) return;
    try {
      await deleteMermaidDiagram(currentRecord.id);
      Message.success('思维图删除成功');
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (e) {
      Message.error('删除失败');
    }
  };

  // 处理AI生成题目
  const handleGenerate = () => {
    setGenerateModalVisible(true);
  };

  // 处理查看详情
  const handleDetail = (record) => {
    setDetailRecord(record);
    setDetailModalVisible(true);
  };

  // 处理菜单点击
  const handleMenuClick = (key, event, record) => {
    event.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "draw") {
      handleDraw(record);
    } else if (key === "delete") {
      handleDelete(record);
    } else if (key === "detail") {
      handleDetail(record);
    }
  };

  const navigate = useNavigate();

  const handleDraw = (record) => {
    if (!record) return;
    // 跳转到专属的全屏编辑路由
    try {
      navigate(`/frame/mermaid-mgr/${record.id}`);
    } catch (e) {
      // 回退：如果导航失败，仍然打开 Modal 预览
      setMermaidModalCode(record.diagramData || '');
      setShowMermaidModal(true);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTableData();
    fetchSubjects();
    fetchSubjectCategoryTree();
  }, []);

  // 组件卸载时关闭可能未关闭的 SSE 连接
  useEffect(() => {
    return () => {
      if (generateEventSourceRef.current) {
        try {
          generateEventSourceRef.current.close();
        } catch (e) {
          // ignore
        }
        generateEventSourceRef.current = null;
      }
    };
  }, []);

  const fetchSubjectCategoryTree = async () => {
    try {
      setTreeLoading(true);
      // 使用 mermaid 后端的 list 接口获取所有分类（请求大页容量以尽量返回全部）
      const response = await getMermaidCategories({ page: 0, size: 1000 });
      // 后端返回 Page<MermaidCategoryDTO>
      const content = response?.data?.content || response?.data || [];
      if (content && Array.isArray(content)) {
        // 将平铺的分类列表转换为 Tree 子节点（当前没有父子关系）
        const childNodes = content.map((cat) => ({
          key: cat.id,
          title: cat.categoryName || cat.name || "",
          categoryId: cat.id,
          children: [],
        }));
        // 添加根节点 “全部”，点击该节点不传 categoryId
        const rootNode = {
          key: "all",
          title: "全部",
          categoryId: 'all',
          children: childNodes,
        };
        setTreeData([rootNode]);
        setFilteredTreeData([rootNode]);
        setExpandedKeys(["all", ...childNodes.map((item) => item.key)]);
        // 同步 categories 用于表单下拉
        setCategories(content.map((cat) => ({ label: cat.categoryName || cat.name || '', value: cat.id })));
      }
    } catch (error) {
      console.error("获取 mermaid 分类树失败:", error);
      Message.error("获取分类数据失败");
    } finally {
      setTreeLoading(false);
    }
  };

  // 搜索过滤树数据
  const filterTreeData = (data, keyword) => {
    if (!keyword) return data;

    const filterNode = (node) => {
      const titleMatch = node.title
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];

      if (titleMatch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return data.map(filterNode).filter(Boolean);
  };

  // 处理搜索输入变化
  const handleSearchChange = (value) => {
    setSearchKeyword(value);
    const filtered = filterTreeData(treeData, value);
    setFilteredTreeData(filtered);

    // 如果有搜索关键字，展开所有匹配的节点
    if (value) {
      const getAllKeys = (nodes) => {
        let keys = [];
        nodes.forEach((node) => {
          keys.push(node.key);
          if (node.children && node.children.length > 0) {
            keys = keys.concat(getAllKeys(node.children));
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(filtered));
    } else {
      // 没有搜索关键字时，只展开第一级
      setExpandedKeys(treeData.map((item) => item.key));
    }
  };

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      setSubjectsLoading(true);
      const response = await getAllSubjects();
      if (response.data) {
        setSubjects(
          response.data.map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );
      }
    } catch (error) {
      console.error("获取学科列表失败:", error);
      Message.error("获取学科列表失败");
    } finally {
      setSubjectsLoading(false);
    }
  };

  // 监听窗口大小变化，动态调整表格高度
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      // 减去页面其他元素的高度，如头部、筛选区域、分页等
      // 这里可以根据实际页面布局调整计算逻辑
      const otherElementsHeight = 250; // 预估其他元素占用的高度
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };

    // 初始计算
    calculateTableHeight();

    // 监听窗口大小变化
    const handleResize = () => {
      calculateTableHeight();
    };

    window.addEventListener("resize", handleResize);

    // 清理事件监听器
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const findPathById = (tree, targetId, path = []) => {
    for (const node of tree) {
      const newPath = [...path, node.value];
      if (node.value === targetId) {
        return newPath;
      }
      if (node.children) {
        const result = findPathById(node.children, targetId, newPath);
        if (result) return result;
      }
    }
    return null;
  };

  const findNodeInTree = (treeData, key) => {
    for (const item of treeData) {
      if (item.key === key) {
        return item;
      }
      if (item.children) {
        const result = findNodeInTreeRecursive(item.children, key, item);
        if (result) return result;
      }
    }
    return null;
  };
  const findNodeInTreeRecursive = (children, key, parent) => {
    for (const child of children) {
      if (child.key === key) {
        return child;
      }
      if (child.children) {
        const result = findNodeInTreeRecursive(child.children, key, child);
        if (result) return result;
      }
    }
    return null;
  };

  return (
    <div className="mermaid-mgr-manager">
      <Layout>
        <Sider
          resizeDirections={["right"]}
          style={{
            minWidth: 200,
            maxWidth: 400,
            height: "100%",
            backgroundColor: "var(--color-bg-1)",
            borderRight: "1px solid #e5e6eb",
          }}
        >
          <div style={{ padding: "12px", borderBottom: "1px solid #e5e6eb" }}>
            <Space size={8} style={{ width: "100%" }}>
              <Input.Search
                placeholder="搜索分类"
                allowClear
                style={{ width: "100%" }}
                value={searchKeyword}
                onChange={(value) => {
                  handleSearchChange(value);
                }}
              />
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={() => setAddCategoryVisible(true)}
                title="新增分类"
              />
            </Space>
          </div>
          <div
            style={{
              padding: "12px",
              height: "calc(100% - 60px)",
              overflow: "auto",
            }}
          >
            <Spin loading={treeLoading}>
              {filteredTreeData.length > 0 ? (
                <Tree
                  blockNode
                  renderTitle={renderTreeTitle}
                  treeData={filteredTreeData}
                  expandedKeys={expandedKeys}
                  selectedKeys={selectedTreeNode ? [selectedTreeNode] : []}
                  onExpand={(expandedKeys) => {
                    setExpandedKeys(expandedKeys);
                  }}
                  onSelect={(selectedKeys, info) => {
                    if (selectedKeys.length > 0) {
                      setSelectedTreeNode(selectedKeys[0]);
                      const selectedKey = selectedKeys[0];
                      const nodeInfo = findNodeInTree(treeData, selectedKey);
                      const collectChildCategoryIds = (treeNode) => {
                        let categoryIds = [];
                        if (treeNode.children && treeNode.children.length > 0) {
                          treeNode.children.forEach((child) => {
                            if (child.categoryId) {
                              categoryIds.push(child.categoryId);
                              categoryIds = categoryIds.concat(
                                collectChildCategoryIds(child)
                              );
                            }
                          });
                        }
                        return categoryIds;
                      };
                      let categoryIds = [];
                      if (nodeInfo.categoryId) {
                        categoryIds.push(nodeInfo.categoryId);
                        categoryIds = categoryIds.concat(
                          collectChildCategoryIds(nodeInfo)
                        );
                      }
                      nodeInfo.categoryIds = categoryIds;
                      nodeInfo.categoryId =
                        nodeInfo.categoryId ||
                        (categoryIds && categoryIds.length > 0
                          ? categoryIds[0]
                          : null);
                      setCurrentTreeNode(nodeInfo);
                      if (nodeInfo) {
                        fetchTableData(
                          null,
                          null,
                          null,
                          nodeInfo.subjectId,
                          nodeInfo.categoryId
                        );
                      } else {
                        fetchTableData();
                      }
                    } else {
                      setSelectedTreeNode(null);
                      setCurrentTreeNode(null);
                      // 明确传入 null，避免使用尚未更新的 currentTreeNode 导致旧 categoryId 被发送
                      fetchTableData(null, null, null, null, null);
                    }
                  }}
                  showLine
                  style={{
                    backgroundColor: "transparent",
                  }}
                />
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--color-text-2)",
                    padding: "20px 0",
                    fontSize: "14px",
                  }}
                >
                  暂无数据
                </div>
              )}
            </Spin>
          </div>
        </Sider>
        <Content>
          {/* 筛选表单 */}
          <Form
            ref={filterFormRef}
            layout="horizontal"
            className="filter-form"
            style={{ marginTop: "10px" }}
            onValuesChange={(params) => {
              fetchTableData(params);
            }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item field="content" label="关键字">
                  <Input placeholder="请输入关键词" />
                </Form.Item>
              </Col>
              <Col
                span={8}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-end",
                  paddingBottom: "16px",
                }}
              >
                <Space>
                  <Button
                    type="primary"
                    icon={<IconSearch />}
                    onClick={(params) => {
                      fetchTableData();
                    }}
                  >
                    搜索
                  </Button>
                  <Button
                    type="primary"
                    status="success"
                    icon={<IconPlus />}
                    onClick={openAddDiagram}
                  >
                    新增
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
          <Table
            columns={columns}
            data={tableData}
            loading={tableLoading}
            pagination={false}
            scroll={{ y: tableScrollHeight }}
            rowKey="id"
          />

          {/* 新增/编辑 思维图对话框 */}
          <Modal
            title={currentRecord && currentRecord.id ? '编辑思维图' : '新增思维图'}
            visible={editModalVisible}
            onOk={handleSaveDiagram}
            onCancel={() => setEditModalVisible(false)}
            width={800}
          >
            <Form form={editForm} layout="vertical">
              <Form.Item
                label="名称"
                field="diagramName"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="分类" field="categoryId">
                <Select placeholder="请选择分类" options={categories} allowClear />
              </Form.Item>
              <Form.Item label="描述" field="description">
                <Input.TextArea />
              </Form.Item>
              {/* diagramData 字段已移除，后端若需该字段请在其他地方提供 */}
            </Form>
          </Modal>

          {/* 删除思维图确认弹窗 */}
          <Modal
            title="确认删除"
            visible={deleteModalVisible}
            onOk={handleDeleteConfirm}
            onCancel={() => setDeleteModalVisible(false)}
            okButtonProps={{ status: 'danger' }}
          >
            <div>
              <p>确定要删除该思维图吗？此操作不可恢复。</p>
              {currentRecord && (
                <p style={{ marginTop: 8 }}>名称：{currentRecord.diagramName}</p>
              )}
            </div>
          </Modal>

          {/* 绘图 Modal（通过组件渲染，不路由跳转） */}
          <Modal
            title="绘图"
            visible={showMermaidModal}
            onCancel={() => {
              setShowMermaidModal(false);
              setMermaidModalCode(null);
            }}
            footer={null}
            width={1000}
            style={{ maxWidth: '95%' }}
          >
            <div style={{ height: '70vh' }}>
              <MermaidEditor initialCode={mermaidModalCode} />
            </div>
          </Modal>

          {/* 分页 */}
          <div className="pagination-wrapper">
            <Pagination
              {...pagination}
              onChange={(current, pageSize) => {
                fetchTableData(null, pageSize, current);
              }}
            />
          </div>
        </Content>
      </Layout>
      {/* 新增分类对话框 */}
      <Modal
        title="新增分类"
        visible={addCategoryVisible}
        onOk={handleAddCategory}
        confirmLoading={adding}
        onCancel={() => {
          setAddCategoryVisible(false);
          setNewCategoryName("");
        }}
      >
        <Form layout="vertical">
          <Form.Item label="分类名称" required>
            <Input
              placeholder="请输入分类名称"
              value={newCategoryName}
              onChange={(val) => setNewCategoryName(val)}
              onPressEnter={handleAddCategory}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={editingCategory ? "编辑分类" : "新增分类"}
        visible={categoryModalVisible}
        onOk={handleCategorySubmit}
        onCancel={() => setCategoryModalVisible(false)}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item
            label="分类名称"
            field="categoryName"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
      {/* 删除分类确认弹窗 */}
      <Modal
        title="确认删除"
        visible={deleteCategoryVisible}
        onOk={() => {
          if (pendingDeleteId) {
            handleDeleteCategory(pendingDeleteId);
            setDeleteCategoryVisible(false);
          }
        }}
        onCancel={() => setDeleteCategoryVisible(false)}
        okButtonProps={{ status: "danger" }}
        okText="确定删除"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconDelete
            style={{ fontSize: 24, color: "var(--color-danger-light-4)" }}
          />
          <span>确定要删除该分类吗？此操作不可撤销。</span>
        </div>
      </Modal>
    </div>
  );
}

export default QuestionManager;

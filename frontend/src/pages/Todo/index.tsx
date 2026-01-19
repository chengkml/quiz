import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Menu,
  Message,
  Modal,
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import UserAvatar from "@/components/UserAvatar";
import {
  IconCheck,
  IconDelete,
  IconEdit,
  IconList,
  IconMindMapping,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import {
  completeTodo,
  createTodo,
  deleteTodo,
  getTodoList,
  initMindMap,
  updateTodo,
} from "./api";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

function TodoManager() {
  const navigate = useNavigate();

  // 表格数据与状态
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    title: null,
    status: null,
    priority: null,
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 状态与优先级选项
  const statusOptions = [
    { label: "待处理", value: "PENDING" },
    { label: "处理中", value: "IN_PROGRESS" },
    { label: "已完成", value: "COMPLETED" },
  ];
  const priorityOptions = [
    { label: "低", value: "LOW" },
    { label: "中", value: "MEDIUM" },
    { label: "高", value: "HIGH" },
  ];

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "title",
      label: "标题",
      type: "input",
      placeholder: "请输入标题关键字",
      span: 6,
    },
    {
      field: "status",
      label: "状态",
      type: "select",
      placeholder: "请选择状态",
      options: statusOptions,
      span: 6,
      allowClear: true,
    },
    {
      field: "priority",
      label: "优先级",
      type: "select",
      placeholder: "请选择优先级",
      options: priorityOptions,
      span: 8,
      allowClear: true,
    },
  ];

  // 获取表格数据
  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const targetParams = {
        ...params,
        pageNum: current - 1,
        pageSize: pageSize,
      };
      const response = await getTodoList(targetParams);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error("获取待办数据失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams((prev) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 分页变化
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => addFormRef.current?.resetFields?.(), 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        const payload = {
          ...values,
          // 统一转换为 LocalDateTime 可解析格式
          dueDate: values.dueDate
            ? dayjs(values.dueDate).format("YYYY-MM-DDTHH:mm:ss")
            : null,
        };
        await createTodo(payload);
        Message.success("待办创建成功");
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return; // 表单校验错误
      Message.error("待办创建失败");
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        title: record.title,
        descr: record.descr,
        status: record.status,
        priority: record.priority,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          id: currentRecord.id,
          title: values.title,
          descr: values.descr,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate
            ? dayjs(values.dueDate).format("YYYY-MM-DDTHH:mm:ss")
            : null,
        };
        await updateTodo(payload);
        Message.success("待办更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("待办更新失败");
    }
  };

  // 删除
  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    try {
      await deleteTodo(currentRecord.id);
      Message.success("待办删除成功");
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error("待办删除失败");
    }
  };

  // 分析待办，生成思维导图
  const handleAnalyze = async (record: any) => {
    setAnalyzeLoading(true);
    try {
      const response = await initMindMap(record.id);
      if (response.data) {
        const mindMap = response.data;
        // 导航到思维导图编辑页面
        navigate(`/frame/mindmap/edit/${mindMap.id}`);
      }
    } catch (error) {
      Message.error("思维导图初始化失败");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // 完成待办
  const handleComplete = async (record: any) => {
    try {
      await completeTodo(record.id);
      Message.success("待办已完成");
      fetchTableData();
    } catch (error) {
      Message.error("完成待办失败");
    }
  };

  // 菜单点击
  const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "delete") {
      handleDelete(record);
    } else if (key === "analyze") {
      handleAnalyze(record);
    } else if (key === "complete") {
      handleComplete(record);
    }
  };

  // 列配置
  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 120,
      render: (status: string) => {
        const map: Record<string, any> = {
          PENDING: { color: "gray", text: "待处理" },
          IN_PROGRESS: { color: "blue", text: "处理中" },
          COMPLETED: { color: "green", text: "已完成" },
        };
        const it = map[status] || { color: "arcoblue", text: status };
        return (
          <Tag color={it.color} bordered>
            {it.text}
          </Tag>
        );
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      align: "center",
      width: 120,
      render: (priority: string) => {
        const map: Record<string, any> = {
          LOW: { color: "green", text: "低" },
          MEDIUM: { color: "orange", text: "中" },
          HIGH: { color: "red", text: "高" },
        };
        const it = map[priority] || { color: "arcoblue", text: priority };
        return (
          <Tag color={it.color} bordered>
            {it.text}
          </Tag>
        );
      },
    },
    {
      title: "截止时间",
      dataIndex: "dueDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      width: 140,
      render: (_: any, record: any) => (
        <UserAvatar
          name={record.createUserName || record.createUser || ""}
          showName
        />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_: any, record: any) => (
        <Space size="large" className="table-btn-group">
          <Dropdown
            position="bl"
            droplist={
              <Menu
                onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                className="handle-dropdown-menu"
              >
                <Menu.Item key="analyze">
                  <IconMindMapping style={{ marginRight: 5 }} />
                  分析
                </Menu.Item>
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: 5 }} />
                  编辑
                </Menu.Item>
                {record.status !== "COMPLETED" && (
                  <Menu.Item key="complete">
                    <IconCheck style={{ marginRight: 5 }} />
                    完成
                  </Menu.Item>
                )}
                <Menu.Item key="delete">
                  <IconDelete style={{ marginRight: 5 }} />
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="text"
              className="more-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <IconList />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 计算表格高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);

      setTableScrollHeight((prev) => {
        if (prev === newHeight) return prev;
        return newHeight;
      });
    };

    calculateTableHeight();
  }, []);

  // 初始化获取数据
  useEffect(() => {
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, [searchParams, pagination.current, pagination.pageSize]);

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
    />
  );

  return (
    <div className="todo-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false,
          displayMode: "table",
          filterContent,
          tableColumns: columns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增对话框 */}
      <Modal
        title="新增待办"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      >
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="标题"
              field="title"
              rules={[{ required: true, message: "请输入标题" }]}
            >
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="详细描述" field="descr">
              <TextArea
                placeholder="请输入详细描述"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="状态" field="status">
              <Select placeholder="请选择状态" allowClear>
                {statusOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="优先级" field="priority">
              <Select placeholder="请选择优先级" allowClear>
                {priorityOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="截止时间" field="dueDate">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 编辑对话框 */}
      <Modal
        title="编辑待办"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
      >
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="标题"
              field="title"
              rules={[{ required: true, message: "请输入标题" }]}
            >
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="详细描述" field="descr">
              <TextArea
                placeholder="请输入详细描述"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
            <Form.Item label="状态" field="status">
              <Select placeholder="请选择状态" allowClear>
                {statusOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="优先级" field="priority">
              <Select placeholder="请选择优先级" allowClear>
                {priorityOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="截止时间" field="dueDate">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <div className="delete-modal">确定要删除该待办吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}

export default TodoManager;

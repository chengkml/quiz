import React, { useEffect, useRef, useState } from "react";
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
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import {
  IconCheckCircle,
  IconDelete,
  IconEdit,
  IconList,
  IconPlus,
  IconSearch,
  IconUndo,
} from "@arco-design/web-react/icon";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig, PaginationConfig } from "@/components/types/types";
import "./style/index.less";
import {
  checkQueueNameUniq,
  createQueue,
  deleteQueue,
  disableQueue,
  enableQueue,
  getQueueList,
  searchQueues,
  updateQueueSize,
} from "./api";

const { Content } = Layout;
const { Row, Col } = Grid;
const { Option } = Select;

function JobQueueManager() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    keyWord: "",
  });

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 队列状态映射（仅用于显示）
  const stateMap: Record<string, { color: string; text: string }> = {
    ENABLED: { color: "green", text: "启用" },
    DISABLED: { color: "gray", text: "禁用" },
  };

  // 队列状态选项（用于新增对话框）
  const stateOptions = [
    { value: "ENABLED", label: "启用" },
    { value: "DISABLED", label: "禁用" },
  ];

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "keyWord",
      label: "关键词",
      type: "input",
      placeholder: "请输入队列名称或中文名",
    },
  ];

  // 时间格式化（与其它页面一致的相对/绝对展示）
  const formatDateTime = (value?: string | Date) => {
    if (!value) return "-";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffSeconds < 60) return `${diffSeconds}秒前`;
      if (diffMinutes < 60) return `${diffMinutes}分钟前`;
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `昨天 ${hours}:${minutes}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  };

  // 获取表格数据
  const fetchTableData = async (
    params: any = {},
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const targetParams = {
        limit: pageSize,
        offset: (current - 1) * pageSize,
        keyWord: params.keyWord || searchParams.keyWord || "",
      };
      const response = await searchQueues(targetParams);
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
      Message.error("获取队列数据失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    // 过滤空值
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams((prev) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  // 分页变化
  const handlePageChange = (current: number, pageSize: number) => {
    fetchTableData(searchParams, pageSize, current);
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
        // 先检查队列名唯一性
        const checkResult = await checkQueueNameUniq(
          undefined,
          values.queueName
        );
        if (!checkResult.data) {
          Message.error("队列名称已存在");
          return;
        }

        const payload = {
          ...values,
          queueSize: parseInt(values.queueSize) || 100,
          state: values.state || "ENABLED",
        };
        await createQueue(payload);
        Message.success("队列创建成功");
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: unknown) {
      if ((error as any)?.fields) return; // 表单校验错误
      Message.error("队列创建失败");
    }
  };

  // 编辑（更新队列大小）
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        queueSize: record.queueSize || 100,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = parseInt(values.queueSize) || 100;
        await updateQueueSize(currentRecord.id, payload);
        Message.success("队列大小更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: unknown) {
      if ((error as any)?.fields) return;
      Message.error("队列大小更新失败");
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
      await deleteQueue(currentRecord.id);
      Message.success("队列删除成功");
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error("队列删除失败");
    }
  };

  // 启用/禁用队列
  const handleStateChange = async (record: any, newState: string) => {
    try {
      if (newState === "ENABLED") {
        await enableQueue(record.id);
        Message.success("队列已启用");
      } else {
        await disableQueue(record.id);
        Message.success("队列已禁用");
      }
      fetchTableData();
    } catch (error) {
      Message.error("队列状态更新失败");
    }
  };

  // 菜单点击
  const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "delete") {
      handleDelete(record);
    } else if (key === "enable" && record.state !== "ENABLED") {
      handleStateChange(record, "ENABLED");
    } else if (key === "disable" && record.state !== "DISABLED") {
      handleStateChange(record, "DISABLED");
    }
  };

  // 列配置
  const columns = [
    {
      title: "队列名称",
      dataIndex: "queueName",
      ellipsis: true,
    },
    {
      title: "队列中文名",
      dataIndex: "queueLabel",
      ellipsis: true,
    },
    {
      title: "队列大小",
      dataIndex: "queueSize",
      width: 120,
      render: (size: number) => size || 0,
    },
    {
      title: "状态",
      dataIndex: "state",
      width: 120,
      render: (state: string) => {
        const it = stateMap[state] || { color: "arcoblue", text: state };
        return (
          <Tag color={it.color} bordered>
            {it.text}
          </Tag>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createTime",
      width: 180,
      render: (value: string | Date) => formatDateTime(value),
    },
    {
      title: "操作",
      width: 100,
      align: "center",
      fixed: "right" as any,
      render: (_: any, record: any) => (
        <Space size="large" className="table-btn-group">
          <Dropdown
            position="bl"
            droplist={
              <Menu
                onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                className="handle-dropdown-menu"
              >
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: 5 }} />
                  编辑
                </Menu.Item>
                {record.state !== "ENABLED" && (
                  <Menu.Item key="enable">
                    <IconCheckCircle style={{ marginRight: 5 }} />
                    启用
                  </Menu.Item>
                )}
                {record.state !== "DISABLED" && (
                  <Menu.Item key="disable">
                    <IconUndo style={{ marginRight: 5 }} />
                    禁用
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

  // 初始化与高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 240;
      const newHeight = Math.max(200, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };
    calculateTableHeight();
    fetchTableData();
    const handleResize = () => calculateTableHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 表单校验规则
  const formRules = {
    queueName: [{ required: true, message: "请输入队列名称" }],
    queueLabel: [{ required: true, message: "请输入队列中文名" }],
    queueSize: [
      { required: true, message: "请输入队列大小" },
      { type: "number", min: 1, message: "队列大小必须大于0" },
    ],
  };

  return (
    <div className="job-queue-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={(next) => {
          setPagination(next);
          fetchTableData(searchParams, next.pageSize, next.current);
        }}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          displayMode: "table",
          showModeToggle: false,
          filterContent: (
            <FilterForm
              ref={filterFormRef}
              initialValues={searchParams}
              formFields={searchFormFields}
              onSearch={handleSearch}
              onReset={() => {
                const resetParams = { keyWord: "" };
                setSearchParams(resetParams);
                setPagination((prev) => ({ ...prev, current: 1 }));
                fetchTableData(resetParams);
                Message.info("已重置筛选条件");
              }}
              min={1}
            />
          ),
          tableColumns: columns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增对话框 */}
      <Modal
        title="新增队列"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="队列名称"
              field="queueName"
              rules={formRules.queueName}
            >
              <Input placeholder="请输入队列名称" />
            </Form.Item>
            <Form.Item
              label="队列中文名"
              field="queueLabel"
              rules={formRules.queueLabel}
            >
              <Input placeholder="请输入队列中文名" />
            </Form.Item>
            <Form.Item
              label="队列大小"
              field="queueSize"
              rules={formRules.queueSize}
            >
              <Input
                type="number"
                placeholder="请输入队列大小"
                min="1"
              />
            </Form.Item>
            <Form.Item label="状态" field="state">
              <Select placeholder="请选择状态" defaultValue="ENABLED">
                {stateOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 编辑对话框 */}
      <Modal
        title="编辑队列大小"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item label="队列名称" field="queueName">
              <Input disabled value={currentRecord?.queueName || ""} />
            </Form.Item>
            <Form.Item label="队列中文名" field="queueLabel">
              <Input disabled value={currentRecord?.queueLabel || ""} />
            </Form.Item>
            <Form.Item
              label="队列大小"
              field="queueSize"
              rules={formRules.queueSize}
            >
              <Input type="number" placeholder="请输入队列大小" min={1} />
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
        <div className="delete-modal">确定要删除该队列吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}

export default JobQueueManager;

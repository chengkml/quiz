import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Link,
  Message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import {
  IconCheck,
  IconDelete,
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
    status: 'SCHEDULED',  // 默认查询待处理状态
    priority: null,
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);



  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 状态与优先级选项
  const statusOptions = [
    { label: "已计划", value: "SCHEDULED" },
    { label: "处理中", value: "IN_PROGRESS" },
    { label: "已完成", value: "COMPLETED" },
    { label: "已取消", value: "CANCELLED" },
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
      initialValue: "SCHEDULED",
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
    // 过滤掉空值，确保清空输入框时对应字段被移除
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
    );
    // 直接替换 searchParams，而不是合并，这样可以去掉未包含在 filterValues 中的旧字段
    setSearchParams(filterValues as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 重置处理
  const handleReset = () => {
    // 重置为默认状态：待处理
    const defaultParams = { status: 'SCHEDULED' };
    setSearchParams(defaultParams as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(defaultParams, pagination.pageSize, 1);
    
    // 确保 FilterForm UI 也重置
    filterFormRef.current?.setFieldsValue?.(defaultParams);
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
          startTime: values.startTime
            ? dayjs(values.startTime).format("YYYY-MM-DDTHH:mm:ss")
            : null,
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
        startTime: record.startTime ? dayjs(record.startTime) : null,
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
          startTime: values.startTime
            ? dayjs(values.startTime).format("YYYY-MM-DDTHH:mm:ss")
            : null,
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

  // 详情查看
  const handleDetail = (record: any) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  // 删除
  const handleDelete = async (record: any) => {
    try {
      await deleteTodo(record.id);
      Message.success("待办删除成功");
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





  // 列配置
  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      render: (text: string, record: any) => (
        <Link 
          onClick={() => {
            if (record.status === 'COMPLETED') {
              handleDetail(record);
            } else {
              handleEdit(record);
            }
          }}
          style={{ textDecoration: 'underline' }}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      align: "center",
      width: 120,
      render: (status: string) => {
        const map: Record<string, any> = {
          SCHEDULED: { color: "gray", text: "已计划" },
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
      title: "创建时间",
      dataIndex: "createDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      width: 160,
      align: "center",
      fixed: "right",
      render: (_: any, record: any) => (
        <div className="table-btn-group" style={{ display: "flex", gap: 24 }}>
          <Tooltip content="分析">
            <Button
              type="text"
              size="small"
              icon={<IconMindMapping />}
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyze(record);
              }}
            />
          </Tooltip>

          {record.status === "COMPLETED" ? (
            <Tooltip content="待办已完成">
              <Button
                type="text"
                size="small"
                status="success"
                icon={<IconCheck />}
                disabled
              />
            </Tooltip>
          ) : (
            <Tooltip content="完成">
              <Popconfirm
                title="确认完成该待办吗？"
                onOk={() => {
                  handleComplete(record);
                }}
                onCancel={(e) => {
                  e.stopPropagation();
                }}
              >
                <Button
                  type="text"
                  size="small"
                  status="success"
                  icon={<IconCheck />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip content="删除">
            <Popconfirm
              title="确认删除该待办吗？"
              onOk={() => handleDelete(record)}
              onCancel={(e) => e.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        </div>
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
      onReset={handleReset}
      initialValues={{
        status: 'SCHEDULED',  // 初始显示待处理
      }}
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
          tableProps: {}
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
            <Form.Item label="开始时间" field="startTime">
              <DatePicker showTime style={{ width: "100%" }} />
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
            <Form.Item label="开始时间" field="startTime">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="截止时间" field="dueDate">
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>



      {/* 详情查看对话框 */}
      <Modal
        title="待办详情"
        visible={detailModalVisible}
        onOk={() => setDetailModalVisible(false)}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
      >
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          {currentRecord && (
            <Descriptions
              column={1}
              data={[
                { label: "标题", value: currentRecord.title },
                { label: "详细描述", value: currentRecord.descr || "-" },
                {
                  label: "状态",
                  value: (() => {
                    const status = currentRecord.status;
                    const map: Record<string, any> = {
                      SCHEDULED: { color: "gray", text: "已计划" },
                      IN_PROGRESS: { color: "blue", text: "处理中" },
                      COMPLETED: { color: "green", text: "已完成" },
                      CANCELLED: { color: "red", text: "已取消" },
                    };
                    const it = map[status] || {
                      color: "arcoblue",
                      text: status,
                    };
                    return <Tag color={it.color} bordered>{it.text}</Tag>;
                  })(),
                },
                {
                  label: "优先级",
                  value: (() => {
                    const priority = currentRecord.priority;
                    const map: Record<string, any> = {
                      LOW: { color: "green", text: "低" },
                      MEDIUM: { color: "orange", text: "中" },
                      HIGH: { color: "red", text: "高" },
                    };
                    const it = map[priority] || {
                      color: "arcoblue",
                      text: priority,
                    };
                    return <Tag color={it.color} bordered>{it.text}</Tag>;
                  })(),
                },
                {
                  label: "开始时间",
                  value: currentRecord.startTime
                    ? renderDate(currentRecord.startTime)
                    : "-",
                },
                {
                  label: "截止时间",
                  value: currentRecord.dueDate
                    ? renderDate(currentRecord.dueDate)
                    : "-",
                },
              ]}
              labelStyle={{ width: 100, paddingRight: 20 }}
            />
          )}
        </div>
      </Modal>

    </div>
  );
}

export default TodoManager;

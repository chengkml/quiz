import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import {
  IconCheckCircle,
  IconCloseCircle,
  IconClockCircle,
  IconDelete,
  IconEdit,
  IconLoading,
} from "@arco-design/web-react/icon";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import {
  createRequirement,
  deleteRequirement,
  getRequirementHistoryOptions,
  getRequirementList,
  updateRequirement,
} from "./api";

const { Option } = Select;

function Requirement() {
  const DEFAULT_BRANCH = "main";

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

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    title: null,
    status: null,
    projectName: null,
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addDescr, setAddDescr] = useState("");
  const [editDescr, setEditDescr] = useState("");
  const [historyOptions, setHistoryOptions] = useState<{
    projectNames: string[];
    gitUrls: string[];
    branches: string[];
  }>({
    projectNames: [],
    gitUrls: [],
    branches: [],
  });

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 状态选项
  const statusOptions = [
    { label: "待处理", value: "OPEN" },
    { label: "处理中", value: "IN_PROGRESS" },
    { label: "已完成", value: "COMPLETED" },
    { label: "已关闭", value: "CLOSED" },
  ];

  const normalizeProgressPercent = (
    status: string | undefined,
    progressPercent: number | undefined,
    fallbackPercent = 0
  ) => {
    if (status === "OPEN") {
      return 0;
    }
    if (status === "COMPLETED") {
      return 100;
    }
    const raw = progressPercent ?? fallbackPercent;
    const normalized = Number.isFinite(raw) ? Number(raw) : 0;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  };

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "title",
      label: "标题",
      type: "input",
      placeholder: "请输入标题",
      span: 6,
    },
    {
      field: "projectName",
      label: "项目名",
      type: "input",
      placeholder: "请输入项目名",
      span: 7,
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
        pageNum: current, // 后端通常需要 1-based 或 0-based，根据 Todo 示例，这里传 current 即可，BaseServiceImpl 会处理
        // 注意：BaseServiceImpl 中 page = queryDto.getPageNum() - 1。
        // 如果前端传 1，后端 -1 = 0。符合预期。
        pageSize: pageSize,
      };
      const response = await getRequirementList(targetParams);
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
      Message.error("获取需求列表失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
    );
    setSearchParams(filterValues as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  // 重置处理
  const handleReset = () => {
    const defaultParams = {};
    setSearchParams(defaultParams as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(defaultParams, pagination.pageSize, 1);
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
    setAddDescr("");
    fetchHistoryOptions();
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.resetFields?.();
      addFormRef.current?.setFieldsValue?.({ descr: "" });
    }, 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        const payload = {
          ...values,
          progressPercent: normalizeProgressPercent(values.status, values.progressPercent),
        };
        await createRequirement(payload);
        Message.success("需求创建成功");
        setAddModalVisible(false);
        setAddDescr("");
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("需求创建失败");
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditDescr(record?.descr || "");
    fetchHistoryOptions();
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        ...record,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          ...values,
          progressPercent: normalizeProgressPercent(
            values.status,
            values.progressPercent,
            currentRecord.progressPercent
          ),
          id: currentRecord.id,
        };
        await updateRequirement(payload);
        Message.success("需求更新成功");
        setEditModalVisible(false);
        setEditDescr("");
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("需求更新失败");
    }
  };

  // 删除
  const handleDelete = async (record: any) => {
    try {
      await deleteRequirement(record.id);
      Message.success("需求删除成功");
      fetchTableData();
    } catch (error) {
      Message.error("需求删除失败");
    }
  };

  const fetchHistoryOptions = async () => {
    try {
      const response = await getRequirementHistoryOptions();
      const data = (response as any)?.data || {};
      setHistoryOptions({
        projectNames: Array.isArray(data.projectNames) ? data.projectNames : [],
        gitUrls: Array.isArray(data.gitUrls) ? data.gitUrls : [],
        branches: Array.isArray(data.branches) ? data.branches : [],
      });
    } catch {
      setHistoryOptions({ projectNames: [], gitUrls: [], branches: [] });
    }
  };

  const renderSelectOptions = (values: string[]) =>
    values.map((item) => (
      <Option key={item} value={item}>
        {item}
      </Option>
    ));

  const branchOptions = historyOptions.branches.includes(DEFAULT_BRANCH)
    ? historyOptions.branches
    : [DEFAULT_BRANCH, ...historyOptions.branches];

  // 列配置
  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      width: 200,
    },
    {
      title: "项目名称",
      dataIndex: "projectName",
      width: 150,
    },
    {
      title: "分支",
      dataIndex: "branch",
      width: 100,
    },
    {
      title: "需求描述",
      dataIndex: "descr",
      width: 300,
      render: (value: string) =>
        value ? (
          <div className="requirement-markdown-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        ) : (
          "-"
        ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status: string) => {
        const map: Record<string, any> = {
          OPEN: {
            color: "blue",
            text: "待处理",
            icon: <IconClockCircle />,
          },
          IN_PROGRESS: {
            color: "orange",
            text: "处理中",
            icon: <IconLoading />,
          },
          COMPLETED: {
            color: "green",
            text: "已完成",
            icon: <IconCheckCircle />,
          },
          CLOSED: {
            color: "gray",
            text: "已关闭",
            icon: <IconCloseCircle />,
          },
        };
        const it = map[status] || { color: "gray", text: status };
        return (
          <Tag color={it.color} className="requirement-status-tag">
            {it.icon}
            <span>{it.text}</span>
          </Tag>
        );
      },
    },
    {
      title: "开发进度",
      dataIndex: "progressPercent",
      width: 160,
      render: (value: number, record: any) => {
        const percent = normalizeProgressPercent(
          record?.status,
          value,
          record?.status === "COMPLETED" ? 100 : 0
        );
        return (
          <div className="requirement-progress-cell">
            <Progress
              percent={percent}
              size="small"
              status={record?.status === "COMPLETED" ? "success" : "normal"}
            />
          </div>
        );
      },
    },
    {
      title: "处理结果",
      dataIndex: "resultMsg",
      ellipsis: true,
      width: 150,
      render: (text: string) =>
        text ? (
          <Tooltip content={text}>
            <span>{text}</span>
          </Tooltip>
        ) : (
          "-"
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
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 10 }}>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该需求吗？"
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  useEffect(() => {
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, []);

  return (
    <div className="requirement-page">
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
          tableProps: {
            scroll: { x: 1600, y: tableScrollHeight },
          },
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增/编辑 表单配置 */}
      {[
        {
          visible: addModalVisible,
          title: "新增需求",
          onOk: handleAddConfirm,
          onCancel: () => {
            setAddModalVisible(false);
            setAddDescr("");
          },
          ref: addFormRef,
        },
        {
          visible: editModalVisible,
          title: "编辑需求",
          onOk: handleEditConfirm,
          onCancel: () => {
            setEditModalVisible(false);
            setEditDescr("");
          },
          ref: editFormRef,
        },
      ].map((modal, index) => (
        <Modal
          key={index}
          title={modal.title}
          visible={modal.visible}
          onOk={modal.onOk}
          onCancel={modal.onCancel}
          mountOnEnter
          style={{ width: 900 }}
        >
          <Form ref={modal.ref} layout="vertical">
            <Form.Item label="标题" field="title" rules={[{ required: true }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="项目名称" field="projectName">
              <Select
                placeholder="请选择或输入项目名称"
                showSearch
                allowClear
                allowCreate
              >
                {renderSelectOptions(historyOptions.projectNames)}
              </Select>
            </Form.Item>
            <Form.Item label="Git 仓库地址" field="gitUrl">
              <Select
                placeholder="请选择或输入 Git 仓库地址"
                showSearch
                allowClear
                allowCreate
              >
                {renderSelectOptions(historyOptions.gitUrls)}
              </Select>
            </Form.Item>
            <Form.Item label="分支名称" field="branch" initialValue={DEFAULT_BRANCH}>
              <Select
                placeholder="请选择或输入分支名称"
                showSearch
                allowClear
                allowCreate
              >
                {renderSelectOptions(branchOptions)}
              </Select>
            </Form.Item>
            <Form.Item label="描述 (Markdown)" field="descr">
              <div data-color-mode="light" className="requirement-md-editor">
                <MDEditor
                  value={index === 0 ? addDescr : editDescr}
                  onChange={(val) => {
                    const nextValue = val || "";
                    if (index === 0) {
                      setAddDescr(nextValue);
                      addFormRef.current?.setFieldsValue?.({ descr: nextValue });
                    } else {
                      setEditDescr(nextValue);
                      editFormRef.current?.setFieldsValue?.({ descr: nextValue });
                    }
                  }}
                  height={260}
                  preview="edit"
                />
              </div>
            </Form.Item>
            {index === 0 && (
              <>
                <Form.Item label="状态" field="status" initialValue="OPEN">
                  <Select placeholder="请选择状态">
                    {statusOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="开发进度(%)" field="progressPercent" initialValue={0}>
                  <InputNumber min={0} max={100} precision={0} placeholder="0-100" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="优先级" field="priority" initialValue="MEDIUM">
                  <Select placeholder="请选择优先级">
                    <Option value="LOW">低</Option>
                    <Option value="MEDIUM">中</Option>
                    <Option value="HIGH">高</Option>
                  </Select>
                </Form.Item>
              </>
            )}
            {index === 1 && (
              <>
                <Form.Item label="状态" field="status">
                  <Select placeholder="请选择状态">
                    {statusOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="开发进度(%)" field="progressPercent">
                  <InputNumber min={0} max={100} precision={0} placeholder="0-100" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item label="优先级" field="priority">
                  <Select placeholder="请选择优先级">
                    <Option value="LOW">低</Option>
                    <Option value="MEDIUM">中</Option>
                    <Option value="HIGH">高</Option>
                  </Select>
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      ))}
    </div>
  );
}

export default Requirement;

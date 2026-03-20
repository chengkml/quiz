import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Empty,
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
  IconSearch,
} from "@arco-design/web-react/icon";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import {
  analyzeRequirement,
  createRequirement,
  deleteRequirement,
  getRequirementHistoryOptions,
  getRequirementLifecycle,
  getRequirementList,
  reviewRequirement,
  updateRequirement,
} from "./api";

const { Option } = Select;

type RequirementStatus =
  | "PENDING_ANALYSIS"
  | "PENDING_REVIEW"
  | "PENDING_REVISION"
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED";

type RequirementPriority = "LOW" | "MEDIUM" | "HIGH";

interface RequirementLifecycleLog {
  id: string;
  requirementId: string;
  eventType: "CREATE" | "EDIT" | "STATUS_CHANGE" | "ANALYZE" | "REVIEW";
  fromStatus?: RequirementStatus;
  toStatus?: RequirementStatus;
  beforeDescr?: string;
  afterDescr?: string;
  remark?: string;
  createDate?: string;
  createUser?: string;
  createUserName?: string;
}

const STATUS_OPTIONS: Array<{ label: string; value: RequirementStatus }> = [
  { label: "待分析", value: "PENDING_ANALYSIS" },
  { label: "待评审", value: "PENDING_REVIEW" },
  { label: "待修订", value: "PENDING_REVISION" },
  { label: "待处理", value: "OPEN" },
  { label: "处理中", value: "IN_PROGRESS" },
  { label: "已完成", value: "COMPLETED" },
  { label: "已关闭", value: "CLOSED" },
];

const STATUS_TEXT_MAP: Record<string, string> = STATUS_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {} as Record<string, string>
);

const EVENT_TEXT_MAP: Record<string, string> = {
  CREATE: "创建需求",
  EDIT: "更新需求",
  STATUS_CHANGE: "状态变更",
  ANALYZE: "需求分析",
  REVIEW: "需求评审",
};

const PRIORITY_TEXT_MAP: Record<RequirementPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
};

function Requirement() {
  const DEFAULT_BRANCH = "main";
  const pageRef = useRef<HTMLDivElement | null>(null);

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

  const [searchParams, setSearchParams] = useState({
    title: null,
    status: null,
    projectName: null,
  });

  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [historyOptions, setHistoryOptions] = useState<{
    projectNames: string[];
    gitUrls: string[];
    branches: string[];
  }>({
    projectNames: [],
    gitUrls: [],
    branches: [],
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [lifecycleVisible, setLifecycleVisible] = useState(false);

  const [addDescr, setAddDescr] = useState("");
  const [editDescr, setEditDescr] = useState("");
  const [analyzeDescr, setAnalyzeDescr] = useState("");
  const [reviewDescr, setReviewDescr] = useState("");
  const [addStatus, setAddStatus] = useState<RequirementStatus>("PENDING_ANALYSIS");
  const [editStatus, setEditStatus] = useState<RequirementStatus>("PENDING_ANALYSIS");

  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleLogs, setLifecycleLogs] = useState<RequirementLifecycleLog[]>([]);

  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const analyzeFormRef = useRef<any>(null);
  const reviewFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  const normalizeProgressPercent = (
    status: string | undefined,
    progressPercent: number | undefined,
    fallbackPercent = 0
  ) => {
    if (
      status === "PENDING_ANALYSIS" ||
      status === "PENDING_REVIEW" ||
      status === "PENDING_REVISION" ||
      status === "OPEN"
    ) {
      return 0;
    }
    if (status === "COMPLETED") {
      return 100;
    }
    const raw = progressPercent ?? fallbackPercent;
    const normalized = Number.isFinite(raw) ? Number(raw) : 0;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  };

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
      options: STATUS_OPTIONS,
      span: 6,
      allowClear: true,
    },
  ];

  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const targetParams = {
        ...params,
        pageNum: current,
        pageSize,
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

  const fetchLifecycle = async (record: any) => {
    setLifecycleLoading(true);
    try {
      const response = await getRequirementLifecycle(record.id);
      const logs = ((response as any)?.data || []) as RequirementLifecycleLog[];
      setLifecycleLogs(logs);
    } catch {
      Message.error("获取生命周期日志失败");
      setLifecycleLogs([]);
    } finally {
      setLifecycleLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(
        ([_, v]) => v !== "" && v !== undefined && v !== null
      )
    );
    setSearchParams(filterValues as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  const handleReset = () => {
    const defaultParams = {};
    setSearchParams(defaultParams as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(defaultParams, pagination.pageSize, 1);
  };

  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current);
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    setAddDescr("");
    setAddStatus("PENDING_ANALYSIS");
    fetchHistoryOptions();
    setAddModalVisible(true);
    setTimeout(() => {
      addFormRef.current?.resetFields?.();
      addFormRef.current?.setFieldsValue?.({
        status: "PENDING_ANALYSIS",
        priority: "MEDIUM",
        progressPercent: 0,
        branch: DEFAULT_BRANCH,
        descr: "",
      });
    }, 50);
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditDescr(record?.descr || "");
    setEditStatus((record?.status as RequirementStatus) || "PENDING_ANALYSIS");
    fetchHistoryOptions();
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        ...record,
      });
    }, 50);
  };

  const handleAnalyze = (record: any) => {
    setCurrentRecord(record);
    setAnalyzeDescr(record?.descr || "");
    setAnalyzeModalVisible(true);
    setTimeout(() => {
      analyzeFormRef.current?.setFieldsValue?.({
        descr: record?.descr || "",
      });
    }, 50);
  };

  const handleReview = (record: any) => {
    setCurrentRecord(record);
    setReviewDescr(record?.descr || "");
    setReviewModalVisible(true);
    setTimeout(() => {
      reviewFormRef.current?.setFieldsValue?.({
        descr: record?.descr || "",
        comment: "",
        decision: "TO_OPEN",
      });
    }, 50);
  };

  const handleViewLifecycle = async (record: any) => {
    setCurrentRecord(record);
    setLifecycleVisible(true);
    await fetchLifecycle(record);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        const payload = {
          ...values,
          descr: addDescr,
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
      if (error?.fields) {
        return;
      }
      Message.error("需求创建失败");
    }
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          ...values,
          descr: editDescr,
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
      if (error?.fields) {
        return;
      }
      Message.error("需求更新失败");
    }
  };

  const handleAnalyzeConfirm = async () => {
    try {
      const values = await analyzeFormRef.current?.validate?.();
      if (values && currentRecord) {
        await analyzeRequirement(currentRecord.id, {
          descr: analyzeDescr,
        });
        Message.success("需求分析完成，已流转到待评审");
        setAnalyzeModalVisible(false);
        setAnalyzeDescr("");
        analyzeFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      Message.error("需求分析失败");
    }
  };

  const handleReviewConfirm = async () => {
    try {
      const values = await reviewFormRef.current?.validate?.();
      if (values && currentRecord) {
        await reviewRequirement(currentRecord.id, {
          descr: reviewDescr,
          comment: values.comment,
          decision: values.decision,
        });
        Message.success("需求评审完成");
        setReviewModalVisible(false);
        setReviewDescr("");
        reviewFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      Message.error("需求评审失败");
    }
  };

  const handleDelete = async (record: any) => {
    try {
      await deleteRequirement(record.id);
      Message.success("需求删除成功");
      fetchTableData();
    } catch (error) {
      Message.error("需求删除失败");
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

  const statusTag = (status: RequirementStatus) => {
    const map: Record<string, any> = {
      PENDING_ANALYSIS: {
        color: "arcoblue",
        text: "待分析",
        icon: <IconClockCircle />,
      },
      PENDING_REVIEW: {
        color: "purple",
        text: "待评审",
        icon: <IconClockCircle />,
      },
      PENDING_REVISION: {
        color: "gold",
        text: "待修订",
        icon: <IconClockCircle />,
      },
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
  };

  const priorityTag = (priority?: RequirementPriority) => {
    if (!priority) {
      return "-";
    }
    const map: Record<RequirementPriority, { color: string; text: string }> = {
      LOW: { color: "green", text: PRIORITY_TEXT_MAP.LOW },
      MEDIUM: { color: "orange", text: PRIORITY_TEXT_MAP.MEDIUM },
      HIGH: { color: "red", text: PRIORITY_TEXT_MAP.HIGH },
    };
    const it = map[priority] || { color: "gray", text: priority };
    return <Tag color={it.color}>{it.text}</Tag>;
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      width: 180,
    },
    {
      title: "项目名称",
      dataIndex: "projectName",
      width: 120,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (status: RequirementStatus) => statusTag(status),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 100,
      render: (priority: RequirementPriority | undefined) => priorityTag(priority),
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
      width: 180,
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
      title: "操作",
      width: 220,
      fixed: "right",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Tooltip content="编辑">
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip content="分析">
            <Button type="text" size="small" icon={<IconSearch />} onClick={() => handleAnalyze(record)} />
          </Tooltip>
          <Tooltip content="评审">
            <Button type="text" size="small" icon={<IconCheckCircle />} onClick={() => handleReview(record)} />
          </Tooltip>
          <Tooltip content="生命周期">
            <Button type="text" size="small" icon={<IconClockCircle />} onClick={() => handleViewLifecycle(record)} />
          </Tooltip>
          <Popconfirm title="确认删除该需求吗？" onOk={() => handleDelete(record)}>
            <Tooltip content="删除">
              <Button type="text" size="small" status="danger" icon={<IconDelete />} />
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

  const calculateTableScrollHeight = useCallback(() => {
    const container = pageRef.current;
    if (!container) {
      return;
    }
    const header = container.querySelector(".data-manager-header") as HTMLElement | null;
    const footer = container.querySelector(".data-manager-footer") as HTMLElement | null;
    const occupiedHeight = (header?.offsetHeight || 0) + (footer?.offsetHeight || 0) + 28;
    const nextHeight = Math.max(260, container.clientHeight - occupiedHeight);
    setTableScrollHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
    const onResize = () => calculateTableScrollHeight();
    window.addEventListener("resize", onResize);

    let observer: ResizeObserver | null = null;
    if (pageRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => calculateTableScrollHeight());
      observer.observe(pageRef.current);
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [calculateTableScrollHeight]);

  useEffect(() => {
    const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
    return () => window.clearTimeout(timer);
  }, [tableData.length, pagination.current, pagination.pageSize, calculateTableScrollHeight]);

  return (
    <div className="requirement-page" ref={pageRef}>
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
            scroll: { x: 1380, y: tableScrollHeight },
          },
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <Modal
        title="新增需求"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => {
          setAddModalVisible(false);
          setAddDescr("");
          setAddStatus("PENDING_ANALYSIS");
        }}
        mountOnEnter
        style={{ width: 900 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <Form ref={addFormRef} layout="vertical">
          <Form.Item label="标题" field="title" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="项目名称" field="projectName">
            <Select placeholder="请选择或输入项目名称" showSearch allowClear allowCreate>
              {renderSelectOptions(historyOptions.projectNames)}
            </Select>
          </Form.Item>
          <Form.Item label="Git 仓库地址" field="gitUrl">
            <Select placeholder="请选择或输入 Git 仓库地址" showSearch allowClear allowCreate>
              {renderSelectOptions(historyOptions.gitUrls)}
            </Select>
          </Form.Item>
          <Form.Item label="分支名称" field="branch" initialValue={DEFAULT_BRANCH}>
            <Select placeholder="请选择或输入分支名称" showSearch allowClear allowCreate>
              {renderSelectOptions(branchOptions)}
            </Select>
          </Form.Item>
          <Form.Item label="描述 (Markdown)" field="descr">
            <div data-color-mode="light" className="requirement-md-editor">
              <MDEditor
                value={addDescr}
                onChange={(val) => {
                  const nextValue = val || "";
                  setAddDescr(nextValue);
                  addFormRef.current?.setFieldsValue?.({ descr: nextValue });
                }}
                height={260}
                preview="edit"
              />
            </div>
          </Form.Item>
          <Form.Item label="状态" field="status" initialValue="PENDING_ANALYSIS">
            <Select
              placeholder="请选择状态"
              onChange={(value) => setAddStatus((value as RequirementStatus) || "PENDING_ANALYSIS")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {addStatus === "IN_PROGRESS" && (
            <Form.Item label="开发进度(%)" field="progressPercent" initialValue={0}>
              <InputNumber min={0} max={100} precision={0} placeholder="0-100" style={{ width: "100%" }} />
            </Form.Item>
          )}
          <Form.Item label="优先级" field="priority" initialValue="MEDIUM">
            <Select placeholder="请选择优先级">
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑需求"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => {
          setEditModalVisible(false);
          setEditDescr("");
          setEditStatus("PENDING_ANALYSIS");
        }}
        mountOnEnter
        style={{ width: 900 }}
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <Form ref={editFormRef} layout="vertical">
          <Form.Item label="标题" field="title" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item label="项目名称" field="projectName">
            <Select placeholder="请选择或输入项目名称" showSearch allowClear allowCreate>
              {renderSelectOptions(historyOptions.projectNames)}
            </Select>
          </Form.Item>
          <Form.Item label="Git 仓库地址" field="gitUrl">
            <Select placeholder="请选择或输入 Git 仓库地址" showSearch allowClear allowCreate>
              {renderSelectOptions(historyOptions.gitUrls)}
            </Select>
          </Form.Item>
          <Form.Item label="分支名称" field="branch">
            <Select placeholder="请选择或输入分支名称" showSearch allowClear allowCreate>
              {renderSelectOptions(branchOptions)}
            </Select>
          </Form.Item>
          <Form.Item label="描述 (Markdown)" field="descr">
            <div data-color-mode="light" className="requirement-md-editor">
              <MDEditor
                value={editDescr}
                onChange={(val) => {
                  const nextValue = val || "";
                  setEditDescr(nextValue);
                  editFormRef.current?.setFieldsValue?.({ descr: nextValue });
                }}
                height={260}
                preview="edit"
              />
            </div>
          </Form.Item>
          <Form.Item label="状态" field="status">
            <Select
              placeholder="请选择状态"
              onChange={(value) => setEditStatus((value as RequirementStatus) || "PENDING_ANALYSIS")}
            >
              {STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {editStatus === "IN_PROGRESS" && (
            <Form.Item label="开发进度(%)" field="progressPercent">
              <InputNumber min={0} max={100} precision={0} placeholder="0-100" style={{ width: "100%" }} />
            </Form.Item>
          )}
          <Form.Item label="优先级" field="priority">
            <Select placeholder="请选择优先级">
              <Option value="LOW">低</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="HIGH">高</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="需求分析"
        visible={analyzeModalVisible}
        onOk={handleAnalyzeConfirm}
        onCancel={() => {
          setAnalyzeModalVisible(false);
          setAnalyzeDescr("");
        }}
        mountOnEnter
        style={{ width: 900 }}
      >
        <Form ref={analyzeFormRef} layout="vertical">
          <Form.Item label="需求描述 (Markdown)" field="descr">
            <div data-color-mode="light" className="requirement-md-editor">
              <MDEditor
                value={analyzeDescr}
                onChange={(val) => {
                  const nextValue = val || "";
                  setAnalyzeDescr(nextValue);
                  analyzeFormRef.current?.setFieldsValue?.({ descr: nextValue });
                }}
                height={280}
                preview="edit"
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="需求评审"
        visible={reviewModalVisible}
        onOk={handleReviewConfirm}
        onCancel={() => {
          setReviewModalVisible(false);
          setReviewDescr("");
        }}
        mountOnEnter
        style={{ width: 900 }}
      >
        <Form ref={reviewFormRef} layout="vertical">
          <Form.Item label="评审结论" field="decision" rules={[{ required: true }]} initialValue="TO_OPEN">
            <Select placeholder="请选择评审结论">
              <Option value="TO_OPEN">通过，转待处理</Option>
              <Option value="TO_REVISION">打回，转待修订</Option>
            </Select>
          </Form.Item>
          <Form.Item label="需求描述 (Markdown)" field="descr">
            <div data-color-mode="light" className="requirement-md-editor">
              <MDEditor
                value={reviewDescr}
                onChange={(val) => {
                  const nextValue = val || "";
                  setReviewDescr(nextValue);
                  reviewFormRef.current?.setFieldsValue?.({ descr: nextValue });
                }}
                height={280}
                preview="edit"
              />
            </div>
          </Form.Item>
          <Form.Item label="评审备注" field="comment">
            <Input.TextArea placeholder="可选：记录评审意见" autoSize={{ minRows: 2 }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`需求生命周期${currentRecord?.title ? ` - ${currentRecord.title}` : ""}`}
        visible={lifecycleVisible}
        footer={null}
        onCancel={() => {
          setLifecycleVisible(false);
          setLifecycleLogs([]);
        }}
        style={{ width: 920 }}
      >
        <div className="requirement-lifecycle-wrap">
          {lifecycleLoading ? (
            <div className="requirement-lifecycle-loading">加载中...</div>
          ) : lifecycleLogs.length === 0 ? (
            <Empty description="暂无生命周期日志" />
          ) : (
            <div className="requirement-lifecycle-list">
              {lifecycleLogs.map((log, idx) => (
                <div key={log.id || `${log.createDate}-${idx}`} className="requirement-lifecycle-item">
                  <div className="requirement-lifecycle-axis">
                    <span className="requirement-lifecycle-dot" />
                    {idx !== lifecycleLogs.length - 1 && <span className="requirement-lifecycle-line" />}
                  </div>
                  <div className="requirement-lifecycle-content">
                    <div className="requirement-lifecycle-head">
                      <span className="requirement-lifecycle-event">
                        {EVENT_TEXT_MAP[log.eventType] || log.eventType}
                      </span>
                      <span className="requirement-lifecycle-meta">
                        {(log.createUserName || log.createUser || "-") + " · " + (log.createDate ? renderDate(log.createDate) : "-")}
                      </span>
                    </div>
                    {(log.fromStatus || log.toStatus) && (
                      <div className="requirement-lifecycle-status">
                        {log.fromStatus ? STATUS_TEXT_MAP[log.fromStatus] || log.fromStatus : "-"}
                        <span className="arrow"> -> </span>
                        {log.toStatus ? STATUS_TEXT_MAP[log.toStatus] || log.toStatus : "-"}
                      </div>
                    )}
                    {log.remark && <div className="requirement-lifecycle-remark">备注：{log.remark}</div>}
                    {log.afterDescr && log.afterDescr !== log.beforeDescr && (
                      <div className="requirement-lifecycle-descr">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.afterDescr}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Requirement;

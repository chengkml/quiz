import React, { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import {
  Button,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Menu,
  Message,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconInfo,
  IconList,
  IconLock,
  IconPlayArrow,
  IconStop,
  IconUnlock,
} from "@arco-design/web-react/icon";
import "./style/index.less";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import {
  createScriptInfo,
  deleteScriptInfo,
  execScript,
  getScriptInfoList,
  searchJobs,
  updateScriptInfo,
  deleteJob,
} from "./api";
import { getQueueList } from "@/pages/JobQueue/api";
import { retryJob, stopJob } from "@/pages/Job/api";
import LogDetails from "@/pages/Job/components/logDetails";


function ScriptManager() {
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
  const [isRemoteAdd, setIsRemoteAdd] = useState(true);
  const [isRemoteEdit, setIsRemoteEdit] = useState(true);
  const [searchParams, setSearchParams] = useState<any>({});

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [execModalVisible, setExecModalVisible] = useState(false);
  const [jobsModalVisible, setJobsModalVisible] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [retryModalVisible, setRetryModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [jobDeleteModalVisible, setJobDeleteModalVisible] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string>("");
  // 当前作业列表对应的脚本ID
  const [currentScriptId, setCurrentScriptId] = useState<string>("");

  // 作业表格数据与状态
  const [jobsTableData, setJobsTableData] = useState<any[]>([]);
  const [jobsTableLoading, setJobsTableLoading] = useState(false);
  const [jobsPagination, setJobsPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  // 表单引用
  const execFormRef = useRef<any>(null);
  // 队列选项
  const [queueOptions, setQueueOptions] = useState<any[]>([]);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 脚本状态选项
  const stateOptions = [
    { label: "启用", value: "ENABLED" },
    { label: "禁用", value: "DISABLED" },
  ];

  // 时间格式化
  const formatDateTime = (value?: string) => {
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

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "scriptName",
      label: "名称",
      type: "input",
      placeholder: "请输入脚本名称关键字",
      span: 6,
    },

  ];

  // 执行脚本确认
  const handleExecConfirm = async () => {
    if (!currentRecord || !execFormRef.current) return;
    try {
      const formValues = execFormRef.current.getFieldsValue() || {};
      const res = await execScript(currentRecord.id, formValues.queueName);
      Message.success("脚本执行成功，任务已加入队列");
      setExecModalVisible(false);
    } catch (error) {
      Message.error("脚本执行失败");
    }
  };

  // 获取作业数据
  const fetchJobsData = async (
    params: any = {},
    pageSize: number = jobsPagination.pageSize,
    current: number = jobsPagination.current,
  ) => {
    setJobsTableLoading(true);
    try {
      const targetParams = {
        ...params,
        offset: (current - 1) * pageSize,
        limit: pageSize,
      };
      const response = await searchJobs(targetParams);
      if (response.data) {
        setJobsTableData(response.data.content || []);
        setJobsPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error("获取作业数据失败");
    } finally {
      setJobsTableLoading(false);
    }
  };

  // 作业分页变化
  const handleJobsPageChange = (current: number, pageSize: number) => {
    fetchJobsData({}, pageSize, current);
  };

  // 作业表格列配置
  const jobsColumns = [
    {
      title: "作业ID",
      dataIndex: "id",
      ellipsis: true,
    },
    {
      title: "任务类名",
      dataIndex: "taskClass",
      ellipsis: true,
    },
    {
      title: "队列名称",
      dataIndex: "queueLabel",
      width: 120,
      ellipsis: true,
    },
    {
      title: "触发类型",
      dataIndex: "triggerType",
      width: 120,
      align: "center",
      render: (triggerType: string) => {
        const map: Record<string, string> = {
          HAND: "手工触发",
          CRON: "定时触发",
          QUEUE_CRON: "定时队列触发",
        };
        return map[triggerType] || triggerType;
      },
    },
    {
      title: "开始时间",
      dataIndex: "startTime",
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "状态",
      dataIndex: "state",
      width: 120,
      align: "center",
      render: (state: string) => {
        const map: Record<string, any> = {
          RUNNING: { color: "blue", text: "运行中" },
          SUCCESS: { color: "green", text: "成功" },
          FAILED: { color: "red", text: "失败" },
          STOPPED: { color: "gold", text: "已终止" },
          PENDING: { color: "gray", text: "待执行" },
        };
        const it = map[state] || { color: "arcoblue", text: state };
        return (
          <Tag color={it.color} bordered>
            {it.text}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      width: 100,
      align: "center",
      fixed: "right" as any,
      render: (_: any, record: any) => (
        <Space size="large" className="table-btn-group">
          {record.state !== "SUCCESS" &&
            record.state !== "STOPPED" &&
            record.state !== "FAILED" && (
              <Tooltip content="停止">
                <Button
                  type="text"
                  size="small"
                  status="warning"
                  icon={<IconStop />}
                  onClick={() => setStopModalVisible(true)}
                />
              </Tooltip>
            )}
          <Tooltip content="日志">
            <Button
              type="text"
              size="small"
              icon={<IconInfo />}
              onClick={() => {
                setCurrentJobId(record.id);
                setLogModalVisible(true);
              }}
            />
          </Tooltip>
          {["RUNNING"].indexOf(record.state) === -1 && (
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={() => setJobDeleteModalVisible(true)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // 获取表格数据
  const fetchTableData = async (
    params: any = {},
    pageSize: number = pagination.pageSize,
    current: number = pagination.current,
  ) => {
    setTableLoading(true);
    try {
      // 后端搜索仅支持 keyWord + 分页
      const keyWord =
        params?.scriptName || params?.code || params?.scriptCode || "";
      const targetBody = {
        keyWord,
        pageNum: current - 1,
        pageSize: pageSize,
      };
      const response = await getScriptInfoList(targetBody);
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
      Message.error("获取脚本数据失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索
  const searchTableData = (params: any) => {
    fetchTableData(params, pagination.pageSize, 1);
  };

  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined),
    );
    setSearchParams((prev: any) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  // 分页变化
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current,
    );
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setIsRemoteAdd(true);
    setTimeout(() => {
      addFormRef.current?.resetFields?.();
      addFormRef.current?.setFieldsValue?.({ remoteScript: true });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        // 仅提交后端 UpdateDto 支持的字段
        const payload = {
          id: currentRecord.id,
          scriptName: values.name || "",
          execCmd: values.execCmd || "",
          remoteScript: values.remoteScript ? "true" : "false",
          host: values.host,
          port: values.port,
          username: values.username,
          password: values.password,
        };
        await updateScriptInfo(payload);
        Message.success("更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        // 重新加载数据，保持筛选条件
        const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
        fetchTableData(filterParams);
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("更新失败");
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      const formValues: any = {
        id: record.id,
        code: record.scriptCode || record.code || "",
        name: record.scriptName || record.name || "",
        type: record.scriptType || record.type || "",
        content: record.content || "",
        execEntry: record.execEntry || "",
        filePath: record.filePath || "",
        execCmd: record.execCmd || "",
        remoteScript:
          !!record.remoteScript &&
          record.remoteScript !== "false" &&
          record.remoteScript !== "0",
        host: record.host || "",
        port: record.port || 22,
        username: record.username || "",
        password: record.password || "",
      };
      const { content, ...otherValues } = formValues;
      editFormRef.current?.setFieldsValue?.(otherValues);
      setIsRemoteEdit(otherValues.remoteScript);
    }, 50);
  };

  // 新增确认
  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        const formData = {
          ...values,
          remoteScript: values.remoteScript ? "true" : "false",
        };
        const response = await createScriptInfo(formData);
        if (response?.data) {
          Message.success("添加成功");
          setAddModalVisible(false);
          setIsRemoteAdd(true);
          addFormRef.current?.resetFields?.();
          const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
          fetchTableData(filterParams);
        }
      }
    } catch (error: any) {
      if (error?.fields) return; // 表单校验错误
      Message.error("添加失败");
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
      await deleteScriptInfo(currentRecord.id);
      Message.success("脚本删除成功");
      setDeleteModalVisible(false);
      // 重新加载数据，保持筛选条件
      const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
      fetchTableData(filterParams);
    } catch (error) {
      Message.error("脚本删除失败");
    }
  };

  // 启用脚本
  const handleEnable = async (record: any) => {
    try {
      await updateScriptInfo({ id: record.id, state: "ENABLED" });
      Message.success("脚本启用成功");
      const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
      fetchTableData(filterParams);
    } catch (error) {
      Message.error("脚本启用失败");
    }
  };

  // 执行脚本
  const handleExec = (record: any) => {
    setCurrentRecord(record);
    setExecModalVisible(true);
  };

  // 禁用脚本
  const handleDisable = async (record: any) => {
    try {
      await updateScriptInfo({ id: record.id, state: "DISABLED" });
      Message.success("脚本禁用成功");
      const filterParams = filterFormRef.current?.getFieldsValue?.() || {};
      fetchTableData(filterParams);
    } catch (error) {
      Message.error("脚本禁用失败");
    }
  };

  // 菜单点击
  const handleMenuClick = (key: string, e: React.MouseEvent, record: any) => {
    e.stopPropagation();
    switch (key) {
      case "edit":
        handleEdit(record);
        break;
      case "delete":
        handleDelete(record);
        break;
      case "enable":
        handleEnable(record);
        break;
      case "disable":
        handleDisable(record);
        break;
      case "exec":
        handleExec(record);
        break;
      case "jobs":
        handleJobs(record);
        break;
      default:
        break;
    }
  };

  // 作业菜单点击
  const handleJobsMenuClick = (key: string, _: any, record: any) => {
    setCurrentRecord(record);
    switch (key) {
      case "stop":
        setStopModalVisible(true);
        break;
      case "retry":
        setRetryModalVisible(true);
        break;
      case "log":
        setCurrentJobId(record.id);
        setLogModalVisible(true);
        break;
      case "delete":
        setJobDeleteModalVisible(true);
        break;
      default:
        break;
    }
  };

  // 停止作业确认
  const handleStopJobConfirm = async () => {
    try {
      await stopJob(currentRecord?.id || "");
      Message.success("停止作业成功");
      setStopModalVisible(false);
      // 刷新作业表格
      fetchJobsData({ scriptId: currentScriptId || "" });
    } catch (error) {
      Message.error("停止作业失败");
    }
  };

  // 重试作业确认
  const handleRetryJobConfirm = async () => {
    try {
      await retryJob(currentRecord?.id || "");
      Message.success("重试作业成功");
      setRetryModalVisible(false);
      // 刷新作业表格
      fetchJobsData({ scriptId: currentScriptId || "" });
    } catch (error) {
      Message.error("重试作业失败");
    }
  };

  // 删除作业确认
  const handleDeleteJobConfirm = async () => {
    try {
      await deleteJob(currentRecord?.id || "");
      Message.success("删除作业成功");
      setJobDeleteModalVisible(false);
      // 刷新作业表格
      fetchJobsData({ scriptId: currentScriptId || "" });
    } catch (error) {
      Message.error("删除作业失败");
    }
  };

  // 作业日志模态框确认
  const handleLogJobConfirm = () => {
    setLogModalVisible(false);
  };

  // 查看作业
  const handleJobs = (record: any) => {
    setCurrentRecord(record);
    setCurrentScriptId(record.id);
    setJobsModalVisible(true);
    setTimeout(() => {
      fetchJobsData({ scriptId: record.id });
    }, 50);
  };

  // 列配置
  const columns = [

    {
      title: "脚本名称",
      dataIndex: "scriptName",
      ellipsis: true,
      render: (text: string, record: any) => (
        <span
          className="script-name-link"
          onClick={() => handleJobs(record)}
          style={{ color: "rgb(22,93,255)", cursor: "pointer" }}
        >
          {record.scriptName || record.name || "-"}
        </span>
      ),
    },

    {
      title: "是否远程脚本",
      dataIndex: "remoteScript",
      align: "center",
      width: 100,
      render: (remoteScript: any) => {
        const isRemote = remoteScript === true || remoteScript === "true";
        return isRemote ? (
          <Tag color="blue" bordered>是</Tag>
        ) : (
          <Tag color="gray" bordered>否</Tag>
        );
      },
    },


    {
      title: "创建时间",
      dataIndex: "createDate",
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: "操作",
      width: 200,
      align: "center",
      fixed: "right" as any,
      render: (_: any, record: any) => (
        <Space size="large" className="table-btn-group">
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>

          <Tooltip content="执行">
            <Button
              type="text"
              size="small"
              icon={<IconPlayArrow />}
              onClick={() => handleExec(record)}
            />
          </Tooltip>

          <Tooltip content="删除">
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 初始化与高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330; // 与待办页面一致的占位高度，避免视图溢出
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);
      setTableScrollHeight((prev) => (prev === newHeight ? prev : newHeight));
    };
    calculateTableHeight();
    // 默认查询所有脚本
    fetchTableData({});
    // 获取队列列表
    const fetchQueues = async () => {
      try {
        const response = await getQueueList();
        if (response.data) {
          setQueueOptions(response.data || []);
        }
      } catch (error) {
        Message.error("获取队列列表失败");
      }
    };
    fetchQueues();
    const handleResize = () => calculateTableHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="script-manager">
      {(() => {
        const filterContent = (
          <FilterForm
            ref={filterFormRef}
            formFields={searchFormFields}
            onSearch={handleSearch}
          />
        );
        return (
          <DataManager
            data={tableData}
            loading={tableLoading}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            actions={{ onAdd: handleAdd }}
            config={{
              showModeToggle: false,
              displayMode: "table",
              filterContent,
              tableColumns: columns,
            }}
            tableScrollHeight={tableScrollHeight}
          />
        );
      })()}

      {/* 作业停止模态框 */}
      <Modal
        title="确认停止作业"
        visible={stopModalVisible}
        onOk={handleStopJobConfirm}
        onCancel={() => setStopModalVisible(false)}
      >
        <div className="delete-modal">确定要停止该作业吗？</div>
      </Modal>

      {/* 作业重试模态框 */}
      <Modal
        title="确认重试作业"
        visible={retryModalVisible}
        onOk={handleRetryJobConfirm}
        onCancel={() => setRetryModalVisible(false)}
      >
        <div className="delete-modal">确定要重试该作业吗？</div>
      </Modal>

      {/* 作业日志模态框 */}
      <Drawer
        title="作业日志"
        visible={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        width={800}
        placement="right"
        footer={null}
      >
        <div style={{ height: "100%" }}>
          <LogDetails jobId={currentJobId} />
        </div>
      </Drawer>

      {/* 作业删除模态框 */}
      <Modal
        title="确认删除作业"
        visible={jobDeleteModalVisible}
        onOk={handleDeleteJobConfirm}
        onCancel={() => setJobDeleteModalVisible(false)}
      >
        <div className="delete-modal">确定要删除该作业吗？</div>
      </Modal>

      {/* 新增对话框 */}
      <Modal
        title="新增脚本"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
        okButtonProps={{ loading: tableLoading }}
        footer={
          <>
            <Button onClick={() => setAddModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleAddConfirm}
              loading={tableLoading}
            >
              确定
            </Button>
          </>
        }
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form
            ref={addFormRef}
            layout="vertical"
            className="modal-form"
            initialValues={{ remoteScript: true }}
          >
            <Form.Item
              label="脚本编码"
              field="scriptCode"
              rules={[{ required: true, message: "请输入脚本编码" }]}
            >
              <Input placeholder="请输入脚本编码" />
            </Form.Item>
            <Form.Item
              label="脚本名称"
              field="scriptName"
              rules={[{ required: true, message: "请输入脚本名称" }]}
            >
              <Input placeholder="请输入脚本名称" />
            </Form.Item>

            <Form.Item
              label="是否远程脚本"
              field="remoteScript"
              valuePropName="checked"
              rules={[{ required: true, message: "请选择是否为远程脚本" }]}
            >
              <Switch
                checked={isRemoteAdd}
                onChange={(checked) => {
                  setIsRemoteAdd(checked);
                  addFormRef.current?.setFieldsValue?.({
                    remoteScript: checked,
                  });
                }}
              />
            </Form.Item>
            {isRemoteAdd && (
              <>
                <Form.Item
                  label="远程主机"
                  field="host"
                  rules={[{ required: true, message: "请输入远程主机地址" }]}
                >
                  <Input placeholder="请输入远程主机地址" />
                </Form.Item>
                <Form.Item
                  label="端口"
                  field="port"
                  initialValue={22}
                  rules={[{ required: true, message: "请输入端口" }]}
                >
                  <InputNumber min={1} max={65535} />
                </Form.Item>
                <Form.Item
                  label="用户名"
                  field="username"
                  rules={[{ required: true, message: "请输入远程用户名" }]}
                >
                  <Input placeholder="请输入远程用户名" />
                </Form.Item>
                <Form.Item
                  label="密码"
                  field="password"
                  rules={[{ required: true, message: "请输入远程密码" }]}
                >
                  <Input.Password placeholder="请输入远程密码" />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="执行命令"
              field="execCmd"
              rules={[{ required: true, message: "请输入执行命令" }]}
            >
              <Input.TextArea placeholder="示例：python {entry} --config={file_path}/config.yaml" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 编辑对话框 */}
      <Modal
        title="编辑脚本"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
        okButtonProps={{ loading: tableLoading }}
        footer={
          <>
            <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleEditConfirm}
              loading={tableLoading}
            >
              确定
            </Button>
          </>
        }
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="脚本编码"
              field="code"
              rules={[{ required: true, message: "请输入脚本编码" }]}
            >
              <Input placeholder="请输入脚本编码" />
            </Form.Item>
            <Form.Item
              label="脚本名称"
              field="name"
              rules={[{ required: true, message: "请输入脚本名称" }]}
            >
              <Input placeholder="请输入脚本名称" />
            </Form.Item>
            <Form.Item
              label="是否远程脚本"
              field="remoteScript"
              valuePropName="checked"
              rules={[{ required: true, message: "请选择是否为远程脚本" }]}
            >
              <Switch
                checked={isRemoteEdit}
                onChange={(checked) => {
                  setIsRemoteEdit(checked);
                  editFormRef.current?.setFieldsValue?.({
                    remoteScript: checked,
                  });
                }}
              />
            </Form.Item>
            {isRemoteEdit && (
              <>
                <Form.Item
                  label="远程主机"
                  field="host"
                  rules={[{ required: true, message: "请输入远程主机地址" }]}
                >
                  <Input placeholder="请输入远程主机地址" />
                </Form.Item>
                <Form.Item
                  label="端口"
                  field="port"
                  initialValue={22}
                  rules={[{ required: true, message: "请输入端口" }]}
                >
                  <InputNumber min={1} max={65535} />
                </Form.Item>
                <Form.Item
                  label="用户名"
                  field="username"
                  rules={[{ required: true, message: "请输入远程用户名" }]}
                >
                  <Input placeholder="请输入远程用户名" />
                </Form.Item>
                <Form.Item
                  label="密码"
                  field="password"
                  rules={[{ required: true, message: "请输入远程密码" }]}
                >
                  <Input.Password placeholder="请输入远程密码" />
                </Form.Item>
              </>
            )}

            <Form.Item
              label="执行命令"
              field="execCmd"
              rules={[{ required: true, message: "请输入执行命令" }]}
            >
              <Input.TextArea placeholder="示例：python {entry} --config={file_path}/config.yaml" autoSize={{ minRows: 3, maxRows: 6 }} />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 执行脚本 */}
      <Modal
        title="执行脚本"
        visible={execModalVisible}
        onOk={handleExecConfirm}
        onCancel={() => setExecModalVisible(false)}
        okButtonProps={{ loading: tableLoading }}
        footer={
          <>
            <Button onClick={() => setExecModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleExecConfirm}
              loading={tableLoading}
            >
              执行
            </Button>
          </>
        }
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form ref={execFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="执行队列"
              field="queueName"
              rules={[{ required: true, message: "请选择执行队列" }]}
            >
              <Select
                placeholder="请选择执行队列"
                style={{ width: "100%" }}
                onChange={() => {}}
              >
                {queueOptions.map((option) => (
                  <Select.Option key={option.id} value={option.queueName}>
                    {option.queueLabel || option.queueName}
                  </Select.Option>
                ))}
              </Select>
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
        okButtonProps={{ loading: tableLoading }}
      >
        <div className="delete-modal">确定要删除该脚本吗？此操作不可恢复。</div>
      </Modal>

      {/* 作业查看 */}
      <Modal
        title="脚本作业列表"
        visible={jobsModalVisible}
        onCancel={() => setJobsModalVisible(false)}
        footer={null}
        style={{ width: "80%" }}
      >
        <Table
          columns={jobsColumns}
          data={jobsTableData}
          loading={jobsTableLoading}
          pagination={false}
          scroll={{ y: tableScrollHeight }}
          rowKey="id"
        />

        {/* 作业分页 */}
        <div style={{ marginTop: "10px" }}>
          <Pagination {...jobsPagination} onChange={handleJobsPageChange} />
        </div>
      </Modal>
    </div>
  );
}

// 导出组件作为默认导出
export default ScriptManager;

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Form,
  Input,
  Menu,
  Message,
  Modal,
  Space,
  Tag,
  Select,
} from "@arco-design/web-react";
import {
  IconEdit,
  IconEye,
  IconPlayArrow,
  IconList,
  IconPlus,
} from "@arco-design/web-react/icon";
import "./index.less";
import { DataManager } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import {
  OrchestrationWorkflowDto,
  OrchestrationWorkflowCreateParams,
  OrchestrationWorkflowUpdateParams,
  OrchestrationWorkflowQueryParams,
  WorkflowStatus,
} from "@/types/orchestration";
import {
  createWorkflow,
  updateWorkflow,
  searchInstances,
  searchWorkflows,
  startInstance,
} from "./api";
import { useNavigate } from "react-router-dom";
import renderDate from "@/utils/timeUtil";

const { TextArea } = Input;
const { Option } = Select;

const statusColorMap: Record<WorkflowStatus, string> = {
  DRAFT: "gray",
  PENDING: "orangered",
  PUBLISHED: "green",
  DISABLED: "red",
};

const statusOptions = [
  { label: "草稿", value: "DRAFT" },
  { label: "待发布", value: "PENDING" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已停用", value: "DISABLED" },
];

function OrchestrationManager() {
  const [data, setData] = useState<OrchestrationWorkflowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [10, 20, 50, 100],
  });

  const [searchParams, setSearchParams] = useState({
    keyWord: "",
    status: undefined as WorkflowStatus | undefined,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OrchestrationWorkflowDto | null>(null);

  const formRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);
  const navigate = useNavigate();

  const handleMenuClick = (key: string, e: React.MouseEvent, record: OrchestrationWorkflowDto) => {
    e.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "canvas") {
      navigate(`/frame/orchestration/edit/${record.id}`);
    } else if (key === "run") {
      handleStart(record);
    }
  };

  const columns = [
    {
      title: "编码",
      dataIndex: "code",
      key: "code",
      width: 160,
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: WorkflowStatus) => (
        <Tag className="status-tag" color={statusColorMap[status] || "default"} bordered>
          {status}
        </Tag>
      ),
    },
    {
      title: "当前版本",
      dataIndex: "currentVersionId",
      key: "currentVersionId",
      width: 180,
      render: (value: string | undefined) => value || "-",
    },
    {
      title: "创建人",
      dataIndex: "createUser",
      key: "createUser",
      width: 120,
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      fixed: "right",
      align: "center",
      render: (_: any, record: OrchestrationWorkflowDto) => (
        <Space size="large">
          <Dropdown
            position="bl"
            droplist={
              <Menu onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}>
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: 5 }} />
                  编辑
                </Menu.Item>
                <Menu.Item key="canvas">
                  <IconEye style={{ marginRight: 5 }} />
                  画布
                </Menu.Item>
                <Menu.Item key="run">
                  <IconPlayArrow style={{ marginRight: 5 }} />
                  运行
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="text"
              icon={<IconList />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const searchFormFields: FormFieldConfig[] = [
    {
      field: "keyWord",
      label: "关键词",
      type: "input",
      placeholder: "名称或编码",
      span: 6,
    },
    {
      field: "status",
      label: "状态",
      type: "select",
      placeholder: "状态",
      options: statusOptions,
      span: 6,
      allowClear: true,
    },
  ];

  const fetchWorkflows = async (extra?: Partial<typeof searchParams>) => {
    setLoading(true);
    try {
      const merged = { ...searchParams, ...(extra || {}) };
      const params: OrchestrationWorkflowQueryParams = {
        keyWord: merged.keyWord || "",
        status: merged.status,
        pageNum: pagination.current - 1,
        pageSize: pagination.pageSize,
      };
      const res = await searchWorkflows(params);
      const { content, totalElements } = res.data;
      setData(content || []);
      setPagination((prev) => ({
        ...prev,
        total: totalElements || 0,
      }));
    } catch (e) {
      Message.error("获取编排列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    const merged = { ...searchParams, ...filtered };
    setSearchParams(merged);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchWorkflows(merged);
  };

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={searchParams}
      formFields={searchFormFields}
      onSearch={handleSearch}
    />
  );

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setModalVisible(true);
    setTimeout(() => formRef.current?.resetFields(), 50);
  };

  const handleEdit = (record: OrchestrationWorkflowDto) => {
    setCurrentRecord(record);
    setIsEdit(true);
    setModalVisible(true);
    setTimeout(() => {
      formRef.current?.setFieldsValue({
        code: record.code,
        name: record.name,
        description: record.description,
      });
    }, 50);
  };

  const handleStart = async (record: OrchestrationWorkflowDto) => {
    try {
      const res = await startInstance(record.id, {
        triggerType: "MANUAL",
      });
      if (res.status === 200) {
        Message.success("已启动执行实例");
        await searchInstances({
          workflowId: record.id,
          pageNum: 0,
          pageSize: 1,
        });
      } else {
        Message.error("启动失败");
      }
    } catch (e) {
      Message.error("启动工作流失败");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await formRef.current?.validate();
      if (!values) return;

      const payload: OrchestrationWorkflowCreateParams | OrchestrationWorkflowUpdateParams =
        isEdit && currentRecord
          ? {
              id: currentRecord.id,
              name: values.name,
              description: values.description,
            }
          : {
              code: values.code,
              name: values.name,
              description: values.description,
            };

      if (isEdit) {
        await updateWorkflow(payload as OrchestrationWorkflowUpdateParams);
        Message.success("更新成功");
      } else {
        await createWorkflow(payload as OrchestrationWorkflowCreateParams);
        Message.success("创建成功");
      }
      setModalVisible(false);
      fetchWorkflows();
    } catch (e: any) {
      if (e?.fields) return; // Validation error
      const msg = e?.response?.data?.message || (isEdit ? "更新失败" : "创建失败");
      Message.error(msg);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div className="orchestration-manager">
      <DataManager
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={(nextPagination: any) =>
          setPagination((prev) => ({ ...prev, ...nextPagination }))
        }
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false,
          displayMode: "table",
          filterContent,
          tableColumns: columns,
        }}
        tableScrollHeight={500}
      />

      <Modal
        title={isEdit ? "编辑编排" : "新增编排"}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        unmountOnExit
      >
        <Form ref={formRef} layout="vertical">
          <Form.Item
            field="code"
            label="编码"
            rules={[{ required: true, message: "请输入编码" }]}
            disabled={isEdit}
          >
            <Input placeholder="唯一编码" disabled={isEdit} />
          </Form.Item>
          <Form.Item
            field="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <TextArea placeholder="编排说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrchestrationManager;


import React, { useEffect, useRef, useState } from "react";
import { Button, Message, Space, Tag } from "@arco-design/web-react";
import { IconEdit, IconEye, IconPlayArrow } from "@arco-design/web-react/icon";
import "./index.less";
import { DataManager, AddEditModal } from "@/components/DataManager";
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

const statusColorMap: Record<WorkflowStatus, string> = {
  DRAFT: "default",
  PENDING: "orangered",
  PUBLISHED: "green",
  DISABLED: "red",
};

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

  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OrchestrationWorkflowDto | null>(null);

  const filterFormRef = useRef<any>(null);
  const navigate = useNavigate();

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
      title: "业务域",
      dataIndex: "bizDomain",
      key: "bizDomain",
      width: 160,
      render: (value: string | undefined) => value || "-",
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
    },
    {
      title: "操作",
      key: "action",
      width: 220,
      fixed: "right",
      render: (_: any, record: OrchestrationWorkflowDto) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            编辑
          </Button>
          <Button
            type="text"
            size="small"
            icon={<IconEye />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/frame/orchestration/edit/${record.id}`);
            }}
          >
            画布
          </Button>
          <Button
            type="text"
            size="small"
            icon={<IconPlayArrow />}
            onClick={(e) => {
              e.stopPropagation();
              handleStart(record);
            }}
          >
            运行
          </Button>
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
  ];

  const getFormConfig = (edit: boolean): FormFieldConfig[] => [
    {
      field: "code",
      label: "编码",
      type: "input",
      required: true,
      disabled: edit,
      placeholder: "唯一编码",
      rules: [{ required: true, message: "请输入编码" }],
    },
    {
      field: "name",
      label: "名称",
      type: "input",
      required: true,
      placeholder: "请输入名称",
      rules: [{ required: true, message: "请输入名称" }],
    },
    {
      field: "bizDomain",
      label: "业务域",
      type: "input",
      placeholder: "所属业务域",
    },
    {
      field: "description",
      label: "描述",
      type: "textarea",
      placeholder: "编排说明",
    },
  ];

  const fetchWorkflows = async (extra?: Partial<typeof searchParams>) => {
    setLoading(true);
    try {
      const merged = { ...searchParams, ...(extra || {}) };
      const params: OrchestrationWorkflowQueryParams = {
        keyWord: merged.keyWord || "",
        bizDomain: undefined,
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
      onReset={() => {
        const reset = { keyWord: "", status: undefined as WorkflowStatus | undefined };
        setSearchParams(reset);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchWorkflows(reset);
        Message.info("已重置筛选条件");
      }}
      min={3}
    />
  );

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setAddEditVisible(true);
  };

  const handleEdit = (record: OrchestrationWorkflowDto) => {
    setCurrentRecord(record);
    setIsEdit(true);
    setAddEditVisible(true);
  };

  const handleStart = async (record: OrchestrationWorkflowDto) => {
    try {
      const res = await startInstance(record.id, {
        triggerType: "MANUAL",
      });
      if (res.status === 200) {
        Message.success("已启动执行实例");
        // 如果需要查看实例列表，应该在这里处理逻辑，目前仅搜索无后续操作
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

  const handleAddEditSubmit = async (values: any) => {
    const payload: OrchestrationWorkflowCreateParams | OrchestrationWorkflowUpdateParams =
      isEdit && currentRecord
        ? {
            id: currentRecord.id,
            name: values.name,
            description: values.description,
            bizDomain: values.bizDomain,
          }
        : {
            code: values.code,
            name: values.name,
            description: values.description,
            bizDomain: values.bizDomain,
          };
    try {
      if (isEdit) {
        await updateWorkflow(payload as OrchestrationWorkflowUpdateParams);
        Message.success("更新成功");
      } else {
        await createWorkflow(payload as OrchestrationWorkflowCreateParams);
        Message.success("创建成功");
      }
      setAddEditVisible(false);
      fetchWorkflows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || (isEdit ? "更新失败" : "创建失败");
      throw new Error(msg);
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
        onPaginationChange={setPagination}
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

      <AddEditModal
        visible={addEditVisible}
        isEdit={isEdit}
        record={currentRecord || undefined}
        title={isEdit ? "编辑编排" : "新增编排"}
        formConfig={getFormConfig(isEdit)}
        onOk={handleAddEditSubmit}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentRecord(null);
        }}
      />
    </div>
  );
}

export default OrchestrationManager;


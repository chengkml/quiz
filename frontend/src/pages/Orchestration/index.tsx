import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  Message,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Typography,
} from "@arco-design/web-react";
import { IconEdit, IconEye, IconPlayArrow, IconPlus } from "@arco-design/web-react/icon";
import "./index.less";
import {
  OrchestrationWorkflowCreateParams,
  OrchestrationWorkflowDto,
  OrchestrationWorkflowQueryParams,
  OrchestrationWorkflowUpdateParams,
  WorkflowStatus,
} from "@/types/orchestration";
import {
  createWorkflow,
  searchInstances,
  searchWorkflows,
  startInstance,
  updateWorkflow,
} from "./api";
import { useNavigate } from "react-router-dom";
import renderDate from "@/utils/timeUtil";
import { WORKFLOW_STATUS_META } from "./statusMeta";

const { TextArea } = Input;

const statusOptions = [
  { label: "草稿", value: "DRAFT" },
  { label: "待发布", value: "PENDING" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已停用", value: "DISABLED" },
];

const buildDefaultSearchParams = () => ({
  keyWord: "",
  status: undefined as WorkflowStatus | undefined,
});

function OrchestrationManager() {
  const navigate = useNavigate();
  const formRef = useRef<any>(null);

  const [data, setData] = useState<OrchestrationWorkflowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [12, 24, 48],
  });
  const [filters, setFilters] = useState(buildDefaultSearchParams);
  const [searchParams, setSearchParams] = useState(buildDefaultSearchParams);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<OrchestrationWorkflowDto | null>(null);

  const fetchWorkflows = async (
    params: typeof searchParams = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setLoading(true);
    try {
      const requestParams: OrchestrationWorkflowQueryParams = {
        keyWord: params.keyWord || "",
        status: params.status,
        pageNum: current - 1,
        pageSize,
      };
      const res = await searchWorkflows(requestParams);
      const { content, totalElements } = res.data;
      setData(content || []);
      setPagination((prev) => ({
        ...prev,
        current,
        pageSize,
        total: totalElements || 0,
      }));
    } catch (error) {
      console.error(error);
      Message.error("获取编排列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySearch = () => {
    setSearchParams({
      keyWord: filters.keyWord.trim(),
      status: filters.status,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    const nextParams = buildDefaultSearchParams();
    setFilters(nextParams);
    setSearchParams(nextParams);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

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
    } catch (error) {
      console.error(error);
      Message.error("启动工作流失败");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await formRef.current?.validate();
      if (!values) {
        return;
      }

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
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      const message = error?.response?.data?.message || (isEdit ? "更新失败" : "创建失败");
      Message.error(message);
    }
  };

  useEffect(() => {
    fetchWorkflows(searchParams, pagination.pageSize, pagination.current);
  }, [searchParams, pagination.current, pagination.pageSize]);

  const pageStatusSummary = Object.entries(WORKFLOW_STATUS_META).map(([status, meta]) => ({
    status,
    label: meta.label,
    className: meta.className,
    count: data.filter((item) => item.status === status).length,
  }));

  return (
    <div className="orchestration-manager">
      <section className="orchestration-manager__hero">
        <div className="orchestration-manager__hero-main">
          <div className="orchestration-manager__eyebrow">编排工作台</div>
          <Typography.Title heading={4} style={{ margin: 0 }}>
            以工作流方式组织模型、知识库与技能
          </Typography.Title>
          <Typography.Text type="secondary">
            参考 Dify 的工作流工作台交互，将当前系统的编排能力收口为更清晰的卡片视图和画布入口。
          </Typography.Text>

          <div className="orchestration-manager__summary">
            <div className="orchestration-summary-card">
              <span className="orchestration-summary-card__label">工作流总数</span>
              <span className="orchestration-summary-card__value">{pagination.total}</span>
            </div>
            {pageStatusSummary.map((item) => (
              <div key={item.status} className="orchestration-summary-card">
                <span className="orchestration-summary-card__label">当前页{item.label}</span>
                <span className="orchestration-summary-card__value">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="orchestration-manager__hero-actions">
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新建工作流
          </Button>
        </div>
      </section>

      <section className="orchestration-manager__filters">
        <Input.Search
          allowClear
          value={filters.keyWord}
          onChange={(value) => setFilters((prev) => ({ ...prev, keyWord: value }))}
          onSearch={handleApplySearch}
          placeholder="按名称或编码搜索工作流"
          className="orchestration-manager__search"
        />

        <Select
          placeholder="筛选状态"
          value={filters.status}
          allowClear
          options={statusOptions}
          onChange={(value) =>
            setFilters((prev) => ({ ...prev, status: value as WorkflowStatus | undefined }))
          }
          style={{ width: 180 }}
        />

        <Space size={12}>
          <Button type="primary" onClick={handleApplySearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </section>

      <section className="orchestration-manager__content">
        <Spin loading={loading}>
          {data.length === 0 ? (
            <div className="orchestration-manager__empty">
              <Empty description="暂无工作流，先创建一个新的编排吧" />
              <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
                新建工作流
              </Button>
            </div>
          ) : (
            <div className="orchestration-manager__grid">
              {data.map((record) => {
                const statusMeta = WORKFLOW_STATUS_META[record.status];
                return (
                  <article
                    key={record.id}
                    className="workflow-card"
                    onClick={() => navigate(`/frame/orchestration/edit/${record.id}`)}
                  >
                    <div className="workflow-card__header">
                      <span className={statusMeta.className}>{statusMeta.label}</span>
                      <span className="workflow-card__code">{record.code}</span>
                    </div>

                    <div className="workflow-card__body">
                      <div className="workflow-card__title-row">
                        <Typography.Title heading={6} style={{ margin: 0 }}>
                          {record.name}
                        </Typography.Title>
                        <Button
                          type="text"
                          size="small"
                          icon={<IconEdit />}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(record);
                          }}
                        />
                      </div>

                      <div className="workflow-card__description">
                        {record.description || "暂无描述，建议补充这个工作流的执行目标和产出。"}
                      </div>
                    </div>

                    <div className="workflow-card__meta">
                      <div className="workflow-card__meta-item">
                        <span className="workflow-card__meta-label">当前版本</span>
                        <span className="workflow-card__meta-value">
                          {record.currentVersionId || "未发布"}
                        </span>
                      </div>
                      <div className="workflow-card__meta-item">
                        <span className="workflow-card__meta-label">创建人</span>
                        <span className="workflow-card__meta-value">
                          {record.createUserName || record.createUser || "--"}
                        </span>
                      </div>
                      <div className="workflow-card__meta-item">
                        <span className="workflow-card__meta-label">创建时间</span>
                        <span className="workflow-card__meta-value">
                          {record.createDate ? renderDate(record.createDate) : "--"}
                        </span>
                      </div>
                    </div>

                    <div className="workflow-card__footer">
                      <Button
                        type="outline"
                        icon={<IconEye />}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/frame/orchestration/edit/${record.id}`);
                        }}
                      >
                        进入画布
                      </Button>
                      <Button
                        type="text"
                        icon={<IconPlayArrow />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStart(record);
                        }}
                      >
                        运行
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Spin>
      </section>

      <div className="orchestration-manager__pagination">
        <Pagination
          {...pagination}
          onChange={(current, pageSize) =>
            setPagination((prev) => ({
              ...prev,
              current,
              pageSize: pageSize || prev.pageSize,
            }))
          }
          onPageSizeChange={(pageSize: number, current?: number) =>
            setPagination((prev) => ({
              ...prev,
              current: current || 1,
              pageSize,
            }))
          }
        />
      </div>

      <Modal
        title={isEdit ? "编辑工作流" : "新建工作流"}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText={isEdit ? "保存修改" : "创建工作流"}
        cancelText="取消"
        unmountOnExit
      >
        <Form ref={formRef} layout="vertical">
          <Form.Item
            field="code"
            label="编码"
            rules={[{ required: true, message: "请输入编码" }]}
            disabled={isEdit}
          >
            <Input placeholder="请输入唯一编码" disabled={isEdit} />
          </Form.Item>
          <Form.Item
            field="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <TextArea placeholder="补充工作流的目标和用途" autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrchestrationManager;

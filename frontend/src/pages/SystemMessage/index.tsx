import React, { useCallback, useEffect, useRef, useState } from "react";
import { Layout, Message, Modal, Tag, Button } from "@arco-design/web-react";
import {
  IconCheck,
  IconCheckCircleFill,
  IconNotification,
} from "@arco-design/web-react/icon";
import "./style/index.less";
import {
  getMessageList,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  deleteAllMessages,
} from "./api";
import FilterForm from "@/components/FilterForm";
import { DataManager, DetailModal } from "@/components/DataManager";
import type {
  DetailFieldConfig,
  FormFieldConfig,
  PaginationConfig,
} from "@/components/DataManager";
import { formatRelativeTime } from "@/components/DataManager";

const { Content } = Layout;

interface SystemMessageItem {
  id: string;
  title: string;
  content: string;
  type: string;
  createDate: string;
  isRead?: boolean;
  read?: boolean;
  readDate?: string;
}

const MESSAGE_TYPE_META: Record<string, { color: string; text: string }> = {
  NOTIFICATION: { color: "blue", text: "通知" },
  WARNING: { color: "orange", text: "警告" },
  SYSTEM: { color: "gray", text: "系统" },
  SUCCESS: { color: "green", text: "成功" },
  ERROR: { color: "red", text: "错误" },
  INFO: { color: "arcoblue", text: "信息" },
};

const getMessageTypeMeta = (type: string) =>
  MESSAGE_TYPE_META[type] || { color: "arcoblue", text: type };

function SystemMessageManager() {
  const filterFormRef = useRef<any>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<SystemMessageItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SystemMessageItem | null>(
    null
  );

  const messageTypeOptions = Object.entries(MESSAGE_TYPE_META).map(
    ([value, meta]) => ({ label: meta.text, value })
  );

  const readStatusOptions = [
    { label: "全部", value: "all" },
    { label: "未读", value: "unread" },
    { label: "已读", value: "read" },
  ];

  const fetchMessages = useCallback(
    async (params?: any) => {
      setSearchLoading(true);
      try {
        const current = params?.page ?? pagination.current - 1;
        const size = params?.size ?? pagination.pageSize;
        const baseParams: any = { page: current, size };
        if (params) {
          if (params.unread !== undefined) {
            if (params.unread === "all" || params.unread === "") {
              delete baseParams.state;
            } else if (params.unread === "unread" || params.unread === true) {
              baseParams.state = "unread";
            } else if (params.unread === "read" || params.unread === false) {
              baseParams.state = "read";
            }
          }
          if (params.type) {
            baseParams.type = params.type;
          }
        }
        const resp = await getMessageList(baseParams);
        const data = (resp as any).data || resp;
        setItems(data.content || []);
        setPagination((prev) => ({
          ...prev,
          total: data.totalElements || 0,
          current: current + 1,
          pageSize: size,
        }));
      } catch (e) {
        Message.error("获取消息列表失败");
      } finally {
        setSearchLoading(false);
      }
    },
    [pagination.current, pagination.pageSize]
  );

  useEffect(() => {
    fetchMessages({ page: 0, size: pagination.pageSize });
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
  }, [items.length, pagination.current, pagination.pageSize, calculateTableScrollHeight]);

  const searchFormFields: FormFieldConfig[] = [
    {
      field: "unread",
      label: "状态",
      type: "select",
      initialValue: "all",
      options: readStatusOptions,
      span: 8,
    },
    {
      field: "type",
      label: "类型",
      type: "select",
      allowClear: true,
      options: messageTypeOptions,
      span: 8,
    },
  ];

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={{ unread: "all", type: "" }}
      formFields={searchFormFields}
      onSearch={(values) => {
        const cleaned = Object.fromEntries(
          Object.entries(values).filter(([_, v]) => v !== undefined)
        );
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchMessages({ ...cleaned, page: 0, size: pagination.pageSize });
      }}
      onReset={() => {
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchMessages({ page: 0, size: pagination.pageSize });
        Message.info("已重置筛选条件");
      }}
      min={2}
      labelWidth={80}
    />
  );

  const tableColumns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      render: (title: string, record: SystemMessageItem) => (
        <div
          style={{
            fontWeight: record.isRead || record.read ? "normal" : "bold",
          }}
        >
          {title}
        </div>
      ),
    },
    {
      title: "内容",
      dataIndex: "content",
      ellipsis: true,
      render: (content: string) => (
        <div className="message-content">{content}</div>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 120,
      render: (type: string) => {
        const it = getMessageTypeMeta(type);
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
      render: (value: string) => formatRelativeTime(value),
    },
    {
      title: "状态",
      dataIndex: "isRead",
      width: 80,
      render: (_: any, record: SystemMessageItem) => {
        const flag = record.isRead ?? record.read;
        return (
          <Tag color={flag ? "green" : "red"} bordered>{flag ? "已读" : "未读"}</Tag>
        );
      },
    },
  ];

  const detailFields: DetailFieldConfig[] = [
    { key: "title", label: "标题", dataIndex: "title" },
    { key: "content", label: "内容", dataIndex: "content" },
    {
      key: "type",
      label: "类型",
      dataIndex: "type",
      render: (type: string) => getMessageTypeMeta(type).text,
    },
    {
      key: "createDate",
      label: "创建时间",
      dataIndex: "createDate",
      render: (value: string) => formatRelativeTime(value),
    },
    {
      key: "status",
      label: "状态",
      dataIndex: "isRead",
      type: "tag",
      render: (_: any, record: SystemMessageItem) => {
        const flag = record.isRead ?? record.read;
        return (
          <Tag color={flag ? "green" : "red"} bordered>{flag ? "已读" : "未读"}</Tag>
        );
      },
    },
    {
      key: "readDate",
      label: "已读时间",
      dataIndex: "readDate",
      render: (value?: string) => (value ? formatRelativeTime(value) : "-"),
    },
  ];

  const handleView = async (record: SystemMessageItem) => {
    setCurrentRecord(record);
    setDetailVisible(true);
    const flag = record.isRead ?? record.read;
    if (!flag) {
      try {
        await markAsRead(record.id);
        setItems((prev) =>
          prev.map((item) =>
            item.id === record.id ? { ...item, isRead: true, read: true } : item
          )
        );
        setCurrentRecord({ ...record, isRead: true, read: true });
      } catch {
        Message.error("标记已读失败");
      }
    }
  };

  const handleDelete = (record: SystemMessageItem) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除该消息吗？此操作不可恢复。",
      onOk: async () => {
        try {
          await deleteMessage(record.id);
          Message.success("消息删除成功");
          const values = filterFormRef.current?.getFilterValues?.() || {};
          fetchMessages({
            ...values,
            page: pagination.current - 1,
            size: pagination.pageSize,
          });
        } catch {
          Message.error("删除失败");
        }
      },
    });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      Message.success("已标记所有消息为已读");
      const values = filterFormRef.current?.getFilterValues?.() || {};
      fetchMessages({
        ...values,
        page: pagination.current - 1,
        size: pagination.pageSize,
      });
    } catch {
      Message.error("操作失败");
    }
  };

  return (
    <div className="system-message-manager" ref={pageRef}>
      <DataManager
        data={items}
        loading={searchLoading}
        pagination={pagination}
        onPaginationChange={(p) => {
          setPagination(p);
          const values = filterFormRef.current?.getFilterValues?.() || {};
          fetchMessages({ ...values, page: p.current - 1, size: p.pageSize });
        }}
        actions={{
          onView: handleView,
          onDelete: handleDelete,
        }}
        actionButtons={
          <Button
            type="primary"
            status="success"
            icon={<IconCheck />}
            onClick={handleMarkAllAsRead}
          >
            全部标为已读
          </Button>
        }
        config={{
          showModeToggle: false,
          displayMode: "table",
          filterContent,
          tableColumns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <DetailModal
        visible={detailVisible}
        record={currentRecord || undefined}
        title={null as any}
        detailFields={detailFields}
        onCancel={() => {
          setDetailVisible(false);
          setCurrentRecord(null);
        }}
      >
        {currentRecord && (
          <div className="message-detail" style={{ paddingTop: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              {(() => {
                const typeIconMap: Record<string, JSX.Element> = {
                  SUCCESS: (
                    <IconCheckCircleFill
                      style={{ color: "#52c41a", fontSize: 22 }}
                    />
                  ),
                  ERROR: (
                    <IconNotification
                      style={{ color: "#ff4d4f", fontSize: 22 }}
                    />
                  ),
                  WARNING: (
                    <IconNotification
                      style={{ color: "#faad14", fontSize: 22 }}
                    />
                  ),
                  INFO: (
                    <IconNotification
                      style={{ color: "#1890ff", fontSize: 22 }}
                    />
                  ),
                  SYSTEM: (
                    <IconNotification style={{ color: "#888", fontSize: 22 }} />
                  ),
                  NOTIFICATION: (
                    <IconNotification
                      style={{ color: "#3578e5", fontSize: 22 }}
                    />
                  ),
                };
                return (
                  typeIconMap[currentRecord.type] || (
                    <IconNotification
                      style={{ color: "#3578e5", fontSize: 22 }}
                    />
                  )
                );
              })()}
              <span style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>
                {currentRecord.title}
              </span>
              <span style={{ color: "#b0b0b0", fontSize: 14 }}>
                {formatRelativeTime(currentRecord.createDate)}
              </span>
              {!(currentRecord.isRead ?? currentRecord.read) && (
                <Button
                  size="small"
                  type="primary"
                  style={{ marginLeft: 8 }}
                  onClick={async () => {
                    try {
                      await markAsRead(currentRecord.id);
                      setCurrentRecord({
                        ...currentRecord,
                        isRead: true,
                        read: true,
                      });
                      setItems((prev) =>
                        prev.map((item) =>
                          item.id === currentRecord.id
                            ? { ...item, isRead: true, read: true }
                            : item
                        )
                      );
                      Message.success("已标记为已读");
                    } catch {
                      Message.error("标记已读失败");
                    }
                  }}
                >
                  标记已读
                </Button>
              )}
            </div>
            <div
              className="content-text"
              style={{
                margin: "12px 0 0 0",
                fontSize: 16,
                lineHeight: 1.9,
                background: "#fafdff",
                borderRadius: 12,
                padding: "18px 20px",
                boxShadow: "0 2px 12px 0 rgba(79,140,255,0.07)",
              }}
            >
              {currentRecord.content}
            </div>
            <div style={{ marginTop: 18 }}>
              <span style={{ color: "#888", fontSize: 13 }}>状态：</span>
              <Tag
                color={
                  currentRecord.isRead || currentRecord.read ? "green" : "red"
                }
              >
                {currentRecord.isRead || currentRecord.read ? "已读" : "未读"}
              </Tag>
              {currentRecord.readDate && (
                <span style={{ marginLeft: 16, color: "#888", fontSize: 13 }}>
                  已读时间：{formatRelativeTime(currentRecord.readDate)}
                </span>
              )}
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

export default SystemMessageManager;

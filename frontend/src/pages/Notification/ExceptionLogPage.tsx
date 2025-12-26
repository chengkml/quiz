import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Layout,
  Message,
  Modal,
  Pagination,
  Space,
  Table,
  Tag,
} from "@arco-design/web-react";
import { IconSearch, IconRedo } from "@arco-design/web-react/icon";
import "./style/index.less";
import { getErrorLogs, retryErrorLog } from "./api";

const {Content} = Layout;

const columns = [
  {
    title: "渠道类型",
    dataIndex: "channelType",
    width: 120,
    render: (v: string) => <Tag color="arcoblue">{v}</Tag>,
  },
  {
    title: "内容",
    dataIndex: "messageContent",
    ellipsis: true,
    width: 300,
  },
  {
    title: "异常信息",
    dataIndex: "errorMessage",
    ellipsis: true,
    width: 300,
  },
  {
    title: "时间",
    dataIndex: "createdAt",
    width: 180,
    render: (v: string) => v?.replace("T", " ") || "-",
  },
  {
    title: "操作",
    width: 100,
    align: "center" as any,
    render: (_: any, record: any) => (
      <Space>
        <Button
          type="primary"
          size="mini"
          icon={<IconRedo />}
          onClick={() => record.onRetry(record)}
        >
          重试
        </Button>
      </Space>
    ),
  },
];

const ExceptionLogPage: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [keyWord, setKeyWord] = useState("");

  const fetchTableData = async (page = 1, pageSize = 10, kw = "") => {
    setTableLoading(true);
    try {
      const res = await getErrorLogs({
        page: page - 1,
        size: pageSize,
        keyWord: kw,
      });
      const { content = [], totalElements = 0 } = res.data || {};
      setTableData(
        content.map((item: any) => ({
          ...item,
          onRetry: handleRetry,
        }))
      );
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: totalElements,
      }));
    } catch {
      Message.error("获取异常日志失败");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const handleSearch = () => {
    fetchTableData(1, pagination.pageSize, keyWord);
  };

  const handlePageChange = (current: number, pageSize: number) => {
    fetchTableData(current, pageSize, keyWord);
  };

  const handleRetry = async (record: any) => {
    Modal.confirm({
      title: "重试通知发送",
      content: "确定要重试该异常通知吗？",
      onOk: async () => {
        try {
          const res = await retryErrorLog(record.id);
          if (res === "重试成功" || res?.data === "重试成功") {
            Message.success("重试成功");
            fetchTableData(pagination.current, pagination.pageSize, keyWord);
          } else {
            Message.error(res || "重试失败");
          }
        } catch {
          Message.error("重试失败");
        }
      },
    });
  };

  return (
    <div className="exception-log-page">
      <Layout>
        <Content>
          {/* 筛选表单 */}
          <Form
            layout="inline"
            className="filter-form"
            style={{ marginBottom: 16 }}
          >
            <Form.Item label="关键字">
              <Input
                placeholder="渠道/内容/异常信息"
                value={keyWord}
                onChange={setKeyWord}
                allowClear
                style={{ width: 240 }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<IconSearch />}
                onClick={handleSearch}
              >
                搜索
              </Button>
            </Form.Item>
          </Form>

          {/* 表格 */}
          <Table
            columns={columns}
            data={tableData}
            loading={tableLoading}
            pagination={false}
            scroll={{ y: 420 }}
            rowKey="id"
          />

          {/* 分页 */}
          <div className="pagination-wrapper">
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showTotal
              showJumper
              showPageSize
            />
          </div>
        </Content>
      </Layout>
    </div>
  );
};

export default ExceptionLogPage;

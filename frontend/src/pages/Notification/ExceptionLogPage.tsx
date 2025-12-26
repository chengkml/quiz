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
  Pagination,
  Space,
  Table,
  Tag,
} from "@arco-design/web-react";
import { IconSearch, IconRedo, IconList } from "@arco-design/web-react/icon";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import { getErrorLogs, retryErrorLog } from "./api";

const { Content } = Layout;
const { Row, Col } = Grid;

// 解析内容JSON
const parseMsg = (msg: string) => {
  try {
    return JSON.parse(msg);
  } catch {
    return {};
  }
};

const columns = [
  {
    title: "渠道类型",
    dataIndex: "channelType",
    width: 100,
    render: (v: string) => <Tag color="arcoblue">{v}</Tag>,
  },
  {
    title: "发送人",
    width: 120,
    render: (_: any, record: any) => {
      const obj = parseMsg(record.messageContent);
      return obj.senderId || '-';
    },
  },
  {
    title: "接收人",
    width: 180,
    render: (_: any, record: any) => {
      const obj = parseMsg(record.messageContent);
      return obj.to || '-';
    },
  },
  {
    title: "标题",
    width: 200,
    render: (_: any, record: any) => {
      const obj = parseMsg(record.messageContent);
      return obj.title || '-';
    },
  },
  {
    title: "异常信息",
    dataIndex: "errorMessage",
    ellipsis: true,
    width: 300,
  },
  {
    title: "发送时间",
    dataIndex: "createdAt",
    width: 180,
    render: (v: string) => renderDate(v),
  },
  {
    title: "操作",
    width: 100,
    align: "center" as const,
    fixed: "right" as const,
    render: (_: any, record: any) => (
      <Space size="large" className="table-btn-group">
        <Dropdown
          position="bl"
          droplist={
            <Menu onClickMenuItem={(key, e) => {
              e.stopPropagation();
              if (key === 'retry') record.onRetry(record);
            }} className="handle-dropdown-menu">
              <Menu.Item key="retry">
                <IconRedo style={{ marginRight: 5 }} />重试
              </Menu.Item>
            </Menu>
          }
        >
          <Button type="text" className="more-btn" onClick={e => e.stopPropagation()}>
            <IconList />
          </Button>
        </Dropdown>
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
            layout="horizontal"
            className="filter-form"
            style={{ marginTop: "10px" }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="关键字">
                  <Input
                    placeholder="渠道/内容/异常信息"
                    value={keyWord}
                    onChange={setKeyWord}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col
                span={6}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "flex-end",
                  paddingBottom: "16px",
                }}
              >
                <Space>
                  <Button
                    type="primary"
                    icon={<IconSearch />}
                    onClick={handleSearch}
                  >
                    搜索
                  </Button>
                </Space>
              </Col>
            </Row>
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

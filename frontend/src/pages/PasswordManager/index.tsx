import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Space,
  Tag,
  Typography,
  Tooltip,
  Statistic
} from "@arco-design/web-react";
import {
  IconCopy,
  IconDelete,
  IconEdit,
  IconEye,
  IconPlus,
} from "@arco-design/web-react/icon";
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";

import { FormFieldConfig } from "@/components/types/types";
import renderDate from "@/utils/timeUtil";
import {
  searchPassword,
  createPassword,
  updatePassword,
  deletePassword,
  getDecryptedPassword,
  sendSalt,
  PasswordDto,
} from "./api";
import { getGroupList } from "../Group/api";
import "./style/index.less";
import copy from "copy-to-clipboard";

const { Countdown } = Statistic;

const PasswordManager: React.FC = () => {
  const [tableData, setTableData] = useState<PasswordDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  
  // Search params
  const [searchParams, setSearchParams] = useState({
    keyWord: "",
    category: "",
  });


  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<PasswordDto | null>(null);

  // Verification Modal
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verifyPendingRecord, setVerifyPendingRecord] = useState<PasswordDto | null>(null);

  // Group options for select dropdown
  const [groupOptions, setGroupOptions] = useState<{ label: string; value: string }[]>([]);

  // Fetch group list for dropdown
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getGroupList({ type: 'password', pageSize: 1000 });
        const list = res.data?.content || [];
        const options = list.map((g: any) => ({ label: g.name, value: g.name }));
        setGroupOptions(options);
      } catch (e) {
        console.error("Failed to load group list", e);
      }
    };
    fetchGroups();
  }, []);

  // Forms
  const editFormRef = useRef<any>(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const targetParams: any = {
        ...searchParams,
        pageNum: pagination.current - 1,
        pageSize: pagination.pageSize,
      };

      const res = await searchPassword(targetParams);
      const data = res.data;
      setTableData(data.content || []);
      setPagination((prev) => ({
        ...prev,
        total: data.totalElements || 0,
      }));
    } catch (err) {
      Message.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, searchParams]);

  // Actions
  const handleSearch = (values: any) => {
    setSearchParams((prev) => ({ ...prev, ...values }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
  };

  const handleEdit = (record: PasswordDto) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
  };

  const handleDelete = (record: PasswordDto) => {
    Modal.confirm({
        title: "确认删除",
        content: `确认删除密码条目 "${record.title}" 吗？`,
        onOk: async () => {
            try {
                await deletePassword(record.id);
                Message.success("删除成功");
                fetchData();
            } catch (e) {
                Message.error("删除失败");
            }
        }
    });
  };

  // Verification Logic
  const handleShowPasswordClick = (record: PasswordDto) => {
      setVerifyPendingRecord(record);
      setVerifyCode("");
      setVerifyModalVisible(true);
  };

  const handleSendCode = async () => {
      try {
          await sendSalt();
          Message.success("验证码已发送至您的邮箱");
          setCountdown(Date.now() + 60 * 1000);
      } catch (e) {
          Message.error("验证码发送失败，请检查邮箱配置");
      }
  };

  const handleVerifyConfirm = async () => {
      if (!verifyPendingRecord) return;
      if (!verifyCode) {
          Message.warning("请输入验证码");
          return;
      }
      try {
          const res = await getDecryptedPassword(verifyPendingRecord.id, verifyCode);
          const pwd = res.data;
          setVerifyModalVisible(false);
          Modal.info({
              title: "查看密码",
              content: (
                  <div style={{ marginTop: 10 }}>
                      <Typography.Text>明文密码：</Typography.Text>
                      <div style={{ display: 'flex', marginTop: 8 }}>
                          <Input value={pwd} readOnly />
                          <Button 
                            icon={<IconCopy/>} 
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                                copy(pwd);
                                Message.success("已复制");
                            }}
                          >
                            复制
                          </Button>
                      </div>
                  </div>
              )
          });
      } catch (e) {
          Message.error("验证失败或验证码已过期");
      }
  };


  const handleSave = async (values: any) => {
      try {
          const payload = { ...values };

          if (currentRecord) {
              await updatePassword({ ...payload, id: currentRecord.id });
              Message.success("更新成功");
              setEditModalVisible(false);
          } else {
              await createPassword(payload);
              Message.success("创建成功");
              setAddModalVisible(false);
          }
          fetchData();
      } catch (e) {
          Message.error("保存失败");
      }
  };

  // Configs
  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      width: 150,
    },
    {
      title: "用户名",
      dataIndex: "username",
      width: 150,
      render: (col: any) => (
          <Space>
             <span>{col}</span>
             <IconCopy style={{ cursor: 'pointer', color: '#888' }} onClick={() => { copy(col); Message.success("用户名已复制"); }} />
          </Space>
      )
    },
    {
      title: "密码",
      dataIndex: "password",
      width: 120,
      render: (_: any, record: PasswordDto) => (
          <Space>
              <span className="password-hidden">******</span>
              <Tooltip content="验证查看">
                <Button size="mini" type="text" icon={<IconEye />} onClick={() => handleShowPasswordClick(record)} />
              </Tooltip>
          </Space>
      )
    },
    {
       title: "网址",
       dataIndex: "url",
       ellipsis: true,
       render: (url: string) => url ? <a href={url.startsWith('http') ? url : `http://${url}`} target="_blank" rel="noreferrer">{url}</a> : '-'
    },
    {
        title: "分组",
        dataIndex: "category",
        width: 120,
        render: (cat: string) => cat ? <Tag color="arcoblue">{cat}</Tag> : '-'
    },
    {
        title: "备注",
        dataIndex: "remark",
        ellipsis: true
    },
    {
        title: "更新时间",
        dataIndex: "updateDate",
        width: 180,
        render: renderDate
    },
    {
        title: "操作",
        key: "action",
        width: 150,
        fixed: "right" as const,
        render: (_: any, record: PasswordDto) => (
            <Space>
                <Tooltip content="编辑">
                    <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)} />
                </Tooltip>
                <Tooltip content="删除">
                    <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)} />
                </Tooltip>
            </Space>
        )
    }
  ];

  const searchFormFields: FormFieldConfig[] = [
    {
       field: "keyWord",
       label: "关键字",
       type: "input",
       placeholder: "搜标题/用户名/备注"
    }
  ];

  const formConfig: FormFieldConfig[] = [
      {
          field: "title",
          label: "标题",
          type: "input",
          required: true,
          rules: [{ required: true, message: "请输入标题" }]
      },
      {
          field: "username",
          label: "用户名",
          type: "input",
          placeholder: "登录用户名/手机号/邮箱"
      },
      {
          field: "password",
          label: "密码",
          type: "password", 
          placeholder: currentRecord ? "留空则不修改" : "请输入密码或密钥",
          required: !currentRecord
      },
      {
          field: "url",
          label: "网址",
          type: "input",
      },
      {
          field: "category",
          label: "分组",
          type: "select",
          options: groupOptions,
          placeholder: "请选择分组",
          allowClear: true
      },
      {
          field: "remark",
          label: "备注",
          type: "textarea"
      }
  ];

  // Table Config
  const filterContent = <FilterForm formFields={searchFormFields} onSearch={handleSearch} />;

  return (
    <div className="password-manager-page">
      <DataManager
        data={tableData}
        loading={loading}
        pagination={pagination}
        onPaginationChange={(p) => setPagination(prev => ({ ...prev, ...p }))}
        actions={{
            onAdd: handleAdd
        }}
        config={{
            displayMode: "table",
            filterContent,
            tableColumns: columns
        }}
      />
      
      {/* Verify Modal */}
      <Modal
        title="安全验证"
        visible={verifyModalVisible}
        onOk={handleVerifyConfirm}
        onCancel={() => setVerifyModalVisible(false)}
      >
          <div style={{ marginBottom: 16 }}>
              <Typography.Text>为了确保您的账户安全，查看密码前需要进行邮箱验证。</Typography.Text>
          </div>
          <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                  <Button 
                    type="primary" 
                    disabled={Date.now() < countdown}
                    onClick={handleSendCode}
                  >
                      {Date.now() < countdown ? <Countdown value={countdown} format="s 秒后重发" onFinish={() => setCountdown(0)} now={Date.now()} /> : "发送验证码"}
                  </Button>
              </Space>
              <Input 
                placeholder="请输入邮箱收到的验证码" 
                value={verifyCode} 
                onChange={v => setVerifyCode(v)} 
                maxLength={6}
              />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>验证码有效期5分钟</Typography.Text>
          </Space>
      </Modal>

      {/* Add Modal */}
      <AddEditModal
         visible={addModalVisible}
         title="新增密码"
         isEdit={false}
         formConfig={formConfig}
         onOk={handleSave}
         onCancel={() => setAddModalVisible(false)}
      />

      {/* Edit Modal */}
      <AddEditModal
         visible={editModalVisible}
         title="编辑密码"
         isEdit={true}
         record={currentRecord || undefined}
         formConfig={formConfig}
         onOk={handleSave}
         onCancel={() => setEditModalVisible(false)}
      />
    </div>
  );
};
export default PasswordManager;

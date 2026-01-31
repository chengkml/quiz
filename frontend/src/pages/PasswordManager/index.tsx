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
  Tooltip
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
  PasswordDto,
} from "./api";
import "./style/index.less";
import copy from "copy-to-clipboard";

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

  // Forms
  const editFormRef = useRef<any>(null); // For custom edit modal if needed, or stick to AddEditModal logic
  // Since AddEditModal handles "isEdit" logic well for simple forms, we might need a custom one if we want "Password" field behavior to be specific (e.g. empty means no change)

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await searchPassword({
        ...searchParams,
        pageNum: pagination.current - 1,
        pageSize: pagination.pageSize,
      });
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

  const handleShowPassword = async (record: PasswordDto) => {
      try {
          const pwd = await getDecryptedPassword(record.id);
          Modal.info({
              title: "查看密码",
              content: (
                  <div style={{ marginTop: 10 }}>
                      <Typography.Text>该条目的明文密码为：</Typography.Text>
                      <div style={{ display: 'flex', marginTop: 8 }}>
                          <Input value={pwd} readOnly />
                          <Button 
                            icon={<IconCopy/>} 
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                                copy(pwd);
                                Message.success("密码已复制到剪贴板");
                            }}
                          >
                            复制
                          </Button>
                      </div>
                  </div>
              )
          });
      } catch (e) {
          Message.error("获取密码失败，可能是权限不足");
      }
  };

  const handleSave = async (values: any) => {
      try {
          if (currentRecord) {
              await updatePassword({ ...values, id: currentRecord.id });
              Message.success("更新成功");
              setEditModalVisible(false);
          } else {
              await createPassword(values);
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
              <Tooltip content="查看/复制密码">
                <Button size="mini" type="text" icon={<IconEye />} onClick={() => handleShowPassword(record)} />
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
                <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleEdit(record)}>编辑</Button>
                <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)}>删除</Button>
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
    },
    {
        field: "category",
        label: "分组",
        type: "input",
        placeholder: "输入分组名"
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
          type: "input"
      },
      {
          field: "remark",
          label: "备注",
          type: "textarea"
      }
  ];

  // Form Config End
  
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
            filterContent: <FilterForm formFields={searchFormFields} onSearch={handleSearch} />,
            tableColumns: columns
        }}
      />
      
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

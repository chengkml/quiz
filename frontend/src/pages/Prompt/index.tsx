import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Menu,
  Message,
  Modal,
  Space,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconList,
  IconPlus,
} from "@arco-design/web-react/icon";
import {
  createPromptTemplate,
  deletePromptTemplate,
  getPromptTemplateList,
  updatePromptTemplate,
} from "./api";
import UserAvatar from "@/components/UserAvatar";
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import "./style/index.less";

function PromptTemplateManagement() {
  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // DataManager 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [10, 20, 50, 100],
  });

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    name: "",
  });

  // 对话框状态
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 当前操作的记录
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  // 表单引用
  const filterFormRef = useRef<any>(null);

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

  // 表格列定义
  const columns = [
    {
      title: "模板名称",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      tooltip: true,
    },
    {
      title: "模板内容",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      tooltip: true,
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      key: "createUserName",
      width: 120,
      render: (name, record) => (
        <UserAvatar name={name || (record?.createUser ?? "")} showName />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 180,
      render: (value) => formatDateTime(value),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="large" className="dropdown-demo table-btn-group">
          <Dropdown
            position="bl"
            droplist={
              <Menu
                onClickMenuItem={(key, e) => handleMenuClick(key, e, record)}
                className="handle-dropdown-menu"
              >
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: 5 }} />
                  编辑
                </Menu.Item>
                <Menu.Item key="delete">
                  <IconDelete style={{ marginRight: 5 }} />
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="text"
              className="more-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <IconList />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "name",
      label: "名称",
      type: "input",
      placeholder: "请输入模板名称",
      span: 6,
    },
  ];

  // 新增/编辑表单配置
  const getFormConfig = (isEditMode: boolean): FormFieldConfig[] => {
    return [
      {
        field: "name",
        label: "模板名称",
        type: "input",
        required: true,
        placeholder: "请输入模板名称",
        rules: [
          { required: true, message: "请输入模板名称" },
          { max: 100, message: "模板名称不能超过100个字符" },
        ],
      },
      {
        field: "content",
        label: "模板内容",
        type: "textarea",
        required: true,
        placeholder: "请输入模板内容",
        rules: [{ required: true, message: "请输入模板内容" }],
        props: {
          autoSize: { minRows: 6, maxRows: 10 },
        },
      },
      {
        field: "description",
        label: "模板描述",
        type: "textarea",
        placeholder: "请输入模板描述",
        rules: [{ max: 500, message: "模板描述不能超过500个字符" }],
        props: {
          autoSize: { minRows: 3, maxRows: 6 },
        },
      },
      {
        field: "variables",
        label: "变量列表",
        type: "input",
        placeholder: "例如：question,context,options",
        description: "请输入模板中使用的变量，以逗号分隔",
        rules: [{ max: 500, message: "变量列表不能超过500个字符" }],
      },
    ];
  };

  // 获取数据
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        name: searchParams.name || params.name,
        page: pagination.current - 1,
        pageSize: pagination.pageSize,
      };

      const response = await getPromptTemplateList(queryParams);
      // 兼容 Page 对象结构
      const content = response.data?.content || response.data?.items || [];
      const total = response.data?.totalElements || response.data?.total || 0;

      setData(content);
      setPagination((prev) => ({
        ...prev,
        total: total,
      }));
    } catch (error) {
      Message.error("获取提示词模板列表失败");
      console.error("获取提示词模板列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams((prev) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchData({ ...searchParams, ...filterValues });
  };

  // 菜单点击
  const handleMenuClick = (key, event, record) => {
    event.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "delete") {
      handleDelete(record);
    }
  };

  // 编辑
  const handleEdit = (record) => {
    setCurrentRecord(record);
    setIsEdit(true);
    setAddEditVisible(true);
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setIsEdit(false);
    setAddEditVisible(true);
  };

  // 删除
  const handleDelete = (record) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    try {
      await deletePromptTemplate(currentRecord.id);
      Message.success("删除成功");
      setDeleteModalVisible(false);
      fetchData();
    } catch (error) {
      Message.error("删除失败");
      console.error("删除失败:", error);
    }
  };

  // 提交新增/编辑
  const handleAddEditSubmit = async (values) => {
    try {
      if (isEdit) {
        await updatePromptTemplate({ ...values, id: currentRecord.id });
        Message.success("提示词模板更新成功");
      } else {
        await createPromptTemplate(values);
        Message.success("提示词模板创建成功");
      }
      fetchData();
    } catch (error) {
      console.error(isEdit ? "更新失败" : "创建失败", error);
      Message.error(isEdit ? "更新提示词模板失败" : "创建提示词模板失败");
      throw error;
    }
  };

  // 初始化
  useEffect(() => {
    fetchData();
  }, []);

  // 分页变化
  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  // 搜索栏内容
  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={searchParams}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={() => {
        const resetParams = { name: "" };
        setSearchParams(resetParams);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchData(resetParams);
        Message.info("已重置筛选条件");
      }}
    />
  );

  return (
    <div className="prompt-template-manager">
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
        title={isEdit ? "编辑提示词模板" : "新增提示词模板"}
        formConfig={getFormConfig(isEdit)}
        onOk={handleAddEditSubmit}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentRecord(null);
        }}
        width={700}
      />

      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <p>确定要删除提示词模板 "{currentRecord?.name}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}

export default PromptTemplateManagement;
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dropdown,
  Form,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  Select,
  Space,
  Spin,
  Tooltip,
} from "@arco-design/web-react";
import "./style/index.less";
import {
  deleteUser,
  getActiveRoles,
  getUserRoles,
  registerUser,
  replaceUserRoles,
  resetPassword,
  searchUsers,
  updateUser,
} from "./api";
import {
  IconDelete,
  IconEdit,
  IconList,
  IconMenu,
  IconRefresh,
} from "@arco-design/web-react/icon";
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import renderDate from "@/utils/timeUtil";

function UserManager() {
  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableScrollHeight, setTableScrollHeight] = useState(200);

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
    state: "",
  });

  // 对话框状态
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] =
    useState(false);

  // 当前操作的用户
  const [currentUser, setCurrentUser] = useState(null);

  // 表单引用
  const [resetPasswordForm] = Form.useForm();
  const filterFormRef = useRef<any>(null);

  // 角色分配 Drawer 与数据
  const [assignRoleVisible, setAssignRoleVisible] = useState(false);
  const [assignRoleLoading, setAssignRoleLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // 表格列定义
  const columns = [
    {
      title: "用户ID",
      dataIndex: "userId",
      key: "userId",
      width: 120,
      fixed: "left",
    },
    {
      title: "用户姓名",
      dataIndex: "userName",
      key: "userName",
      width: 120,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 180,
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 160,
      render: (value) => renderDate(value),
    },
    {
      title: "操作",
      key: "action",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="large" className="table-btn-group">
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip content="重置密码">
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          <Tooltip content="分配角色">
            <Button
              type="text"
              size="small"
              icon={<IconMenu />}
              onClick={() => openAssignRoles(record)}
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

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "name",
      label: "用户名",
      type: "input",
      placeholder: "请输入用户名关键词",
      span: 8,
    },
    {
      field: "state",
      label: "状态",
      type: "select",
      placeholder: "请选择状态",
      options: [
        { label: "启用", value: "ENABLED" },
        { label: "禁用", value: "DISABLED" },
      ],
      span: 8,
      allowClear: true,
      onChange: (value, allValues) => {
        // 状态改变时自动触发查询
        handleSearch(allValues);
      },
    },
  ];

  // 新增/编辑表单配置
  const getFormConfig = (isEditMode: boolean): FormFieldConfig[] => {
    const commonFields: FormFieldConfig[] = [
      {
        field: "userId",
        label: "用户ID",
        type: "input",
        required: !isEditMode,
        disabled: isEditMode,
        rules: isEditMode
          ? undefined
          : [
              { required: true, message: "请输入用户ID" },
              { max: 32, message: "用户ID长度不能超过32个字符" },
            ],
      },
      {
        field: "userName",
        label: "用户姓名",
        type: "input",
        required: true,
        rules: [
          { required: true, message: "请输入用户姓名" },
          { max: 128, message: "用户姓名长度不能超过128个字符" },
        ],
      },
    ];

    const passwordField: FormFieldConfig = {
      field: "password",
      label: "密码",
      type: "input", 
      render: () => <Input.Password placeholder="请输入密码" />,
      required: true,
      rules: [
        { required: true, message: "请输入密码" },
        { minLength: 6, message: "密码长度至少6个字符" },
        { maxLength: 20, message: "密码长度不能超过20个字符" },
      ],
    };

    const otherFields: FormFieldConfig[] = [
      {
        field: "email",
        label: "邮箱",
        type: "input",
        rules: [
          { type: "email", message: "请输入正确的邮箱格式" },
          { max: 64, message: "邮箱长度不能超过64个字符" },
        ],
      },
      {
        field: "phone",
        label: "手机号",
        type: "input",
        rules: [{ max: 16, message: "手机号长度不能超过16个字符" }],
      },
      {
        field: "logo",
        label: "头像URL",
        type: "input",
        rules: [{ max: 256, message: "头像URL长度不能超过256个字符" }],
      },
    ];

    if (isEditMode) {
      return [...commonFields, ...otherFields];
    } else {
      // Insert password after userName
      return [...commonFields, passwordField, ...otherFields];
    }
  };

  // 获取用户列表
  const fetchUsers = React.useCallback(
    async (pageNum: number = 0, filters: Record<string, any> = searchParams) => {
      setLoading(true);
      try {
        const queryParams = {
          ...filters,
          page: pageNum,
          size: pagination.pageSize,
          sortBy: "create_date",
          sortDir: "desc",
        };

        const response = await searchUsers(queryParams);
        const { content, totalElements } = response.data;

        setData(content || []);

        setPagination((prev) => ({
          ...prev,
          total: totalElements || 0,
        }));
      } catch (error) {
        Message.error("获取用户列表失败");
        console.error("获取用户列表失败:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  // 搜索处理
  const handleSearch = React.useCallback((values) => {
    // 过滤空值
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams(filterValues);
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  // 搜索表单内容
  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={searchParams}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={() => {
        setSearchParams({ name: "", state: "" });
        setPagination((prev) => ({ ...prev, current: 1 }));
      }}
      min={3}
    />
  );

  // 添加用户
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentUser(null);
    setAddEditVisible(true);
  };

  // 编辑用户
  const handleEdit = (record) => {
    setCurrentUser(record);
    setIsEdit(true);
    setAddEditVisible(true);
  };

  // 删除用户
  const handleDelete = (record) => {
    setCurrentUser(record);
    setDeleteModalVisible(true);
  };

  // 重置密码
  const handleResetPassword = (record) => {
    setCurrentUser(record);
    setResetPasswordModalVisible(true);
    resetPasswordForm.resetFields();
  };

  // 打开角色分配抽屉并加载数据
  const openAssignRoles = async (record) => {
    setCurrentUser(record);
    setAssignRoleVisible(true);
    setAssignRoleLoading(true);
    try {
      const [activeResp, userResp] = await Promise.all([
        getActiveRoles(),
        getUserRoles(record.userId),
      ]);
      const activeRoles = activeResp.data || [];
      const userRoles = userResp.data || [];
      setRoleOptions(activeRoles);
      setSelectedRoleIds(userRoles.map((r) => r.id));
    } catch (error) {
      Message.error("加载角色数据失败");
      console.error("加载角色数据失败:", error);
    } finally {
      setAssignRoleLoading(false);
    }
  };

  // 保存角色分配
  const handleAssignRolesSave = async () => {
    if (!currentUser) return;
    setAssignRoleLoading(true);
    try {
      await replaceUserRoles(currentUser.userId, selectedRoleIds);
      Message.success("角色分配已保存");
      setAssignRoleVisible(false);
      setPagination((prev) => ({ ...prev, current: 1 }));
    } catch (error) {
      if (error.response?.data?.message) {
        Message.error(error.response.data.message);
      } else {
        Message.error("保存角色分配失败");
      }
      console.error("保存角色分配失败:", error);
    } finally {
      setAssignRoleLoading(false);
    }
  };

  // 处理菜单点击
  const handleMenuClick = (key, event, record) => {
    event.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "resetPassword") {
      handleResetPassword(record);
    } else if (key === "assignRoles") {
      openAssignRoles(record);
    } else if (key === "delete") {
      handleDelete(record);
    }
  };

  // 确认添加/编辑用户
  const handleAddEditSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateUser(values);
        Message.success("用户信息更新成功");
      } else {
        await registerUser(values);
        Message.success("用户创建成功");
      }
      setAddEditVisible(false);
      setCurrentUser(null);
      // 刷新列表数据
      await fetchUsers(0, searchParams);
    } catch (error) {
      let msg = isEdit ? "更新用户信息失败" : "创建用户失败";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      throw new Error(msg);
    }
  };

  // 确认删除用户
  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(currentUser.userId);
      Message.success("用户删除成功");
      setDeleteModalVisible(false);
      // 刷新列表数据
      await fetchUsers(0, searchParams);
    } catch (error) {
      Message.error("删除用户失败");
      console.error("删除用户失败:", error);
    }
  };

  // 确认重置密码
  const handleResetPasswordConfirm = async () => {
    try {
      const values = await resetPasswordForm.validate();
      await resetPassword(currentUser.userId, values.newPassword);
      Message.success("密码重置成功");
      setResetPasswordModalVisible(false);
    } catch (error) {
      Message.error("重置密码失败");
      console.error("重置密码失败:", error);
    }
  };

  // 分页或搜索条件变化时获取数据
  useEffect(() => {
    fetchUsers(pagination.current - 1, searchParams);
  }, [pagination.current, fetchUsers, searchParams]);

  // 计算表格高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);

      setTableScrollHeight((prev) => {
        if (prev === newHeight) return prev;
        return newHeight;
      });
    };

    calculateTableHeight();
  }, []);

  // 分页改变处理
  const handlePaginationChange = React.useCallback((newPagination) => {
    setPagination((prev) => ({
      ...prev,
      ...newPagination,
    }));
  }, []);

  return (
    <div className="user-manager">
      <DataManager
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false, // 暂时只支持表格模式
          displayMode: "table",
          filterContent,
          tableColumns: columns, // 使用自定义列配置（包含操作列）
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增/编辑用户对话框 (统一使用 AddEditModal) */}
      <AddEditModal
        visible={addEditVisible}
        isEdit={isEdit}
        record={currentUser || undefined}
        title={isEdit ? "编辑用户" : "新增用户"}
        formConfig={getFormConfig(isEdit)}
        onOk={handleAddEditSubmit}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentUser(null);
        }}
      />

      {/* 分配角色对话框 */}
      <Modal
        title={`分配角色${
          currentUser ? ` - ${currentUser.userName || currentUser.userId}` : ""
        }`}
        visible={assignRoleVisible}
        onCancel={() => setAssignRoleVisible(false)}
        onOk={handleAssignRolesSave}
        okButtonProps={{ loading: assignRoleLoading }}
        okText="确定"
        cancelText="取消"
      >
        <Spin
          loading={assignRoleLoading}
          tip="加载中..."
          style={{ width: "100%" }}
        >
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: "10px",
            }}
          >
            <Form layout="vertical">
              <Form.Item
                label="选择角色"
                field="roles"
                rules={[{ required: true, message: "请选择至少一个角色" }]}
              >
                <Select
                  mode="multiple"
                  value={selectedRoleIds}
                  onChange={(vals) => setSelectedRoleIds(vals)}
                  placeholder="请选择要分配的角色"
                  style={{ width: "100%" }}
                >
                  {roleOptions && roleOptions.length > 0 ? (
                    roleOptions.map((role) => (
                      <Select.Option key={role.id} value={role.id}>
                        <Space>
                          <span>{role.name}</span>
                          <span style={{ color: "var(--color-text-3)" }}>
                            （{role.id}）
                          </span>
                        </Space>
                      </Select.Option>
                    ))
                  ) : (
                    <Select.Option disabled value="">
                      暂无启用角色
                    </Select.Option>
                  )}
                </Select>
              </Form.Item>
            </Form>
          </div>
        </Spin>
      </Modal>

      {/* 删除确认对话框 */}
      <Modal
        title="删除用户"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <p>确定要删除用户 "{currentUser?.userName}" 吗？此操作不可恢复。</p>
      </Modal>

      {/* 重置密码对话框 */}
      <Modal
        title="重置密码"
        visible={resetPasswordModalVisible}
        onOk={handleResetPasswordConfirm}
        onCancel={() => setResetPasswordModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={resetPasswordForm} layout="vertical">
          <Form.Item
            label="新密码"
            field="newPassword"
            rules={[
              { required: true, message: "请输入新密码" },
              { minLength: 6, message: "密码长度至少6个字符" },
              { maxLength: 20, message: "密码长度不能超过20个字符" },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
        <p style={{ color: "var(--color-text-3)", fontSize: "12px" }}>
          为用户 "{currentUser?.userName}" 重置密码
        </p>
      </Modal>
    </div>
  );
}

export default UserManager;

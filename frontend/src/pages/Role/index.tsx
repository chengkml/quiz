import React, { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import {
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Message,
  Modal,
  Space,
  Tag,
  Tree,
} from "@arco-design/web-react";
import "./style/index.less";
import {
  checkRoleId,
  checkRoleName,
  createRole,
  deleteRole,
  disableRole,
  enableRole,
  getRoleById,
  getRoleMenuTree,
  getRoles,
  replaceRoleMenus,
  updateRole,
} from "./api";
import {
  IconDelete,
  IconEdit,
  IconList,
  IconMenu,
  IconUser,
} from "@arco-design/web-react/icon";
import { getMenuTree } from "@/pages/Menu/api";
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import renderDate from "@/utils/timeUtil";

const { Content } = Layout;

function RoleManager() {
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
    roleName: "",
    state: "",
  });

  // 对话框状态
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 当前操作的角色
  const [currentRole, setCurrentRole] = useState(null);

  // 分配菜单：抽屉、加载、树数据与选中项
  const [assignVisible, setAssignVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [menuTreeData, setMenuTreeData] = useState([]);
  const [checkedMenuKeys, setCheckedMenuKeys] = useState([]);

  // 表单引用
  const filterFormRef = useRef<any>(null);

  // 验证角色ID唯一性
  const validateRoleId = async (value, callback) => {
    if (!value) {
      return callback();
    }

    try {
      // 使用check/id接口校验角色ID是否唯一
      const response = await checkRoleId(value);
      // 接口返回true表示ID唯一(不存在)，false表示ID已存在
      if (response?.data === false) {
        callback("角色ID已存在");
      } else {
        callback();
      }
    } catch (error) {
      console.error("验证角色ID失败:", error);
      callback();
    }
  };

  // 验证角色名称唯一性
  const validateRoleName = async (value, callback) => {
    if (!value) {
      return callback();
    }

    try {
      const excludeRoleId = currentRole?.id || null;
      const response = await checkRoleName(value, excludeRoleId);
      if (!response.data) {
        callback("角色名称已存在");
      } else {
        callback();
      }
    } catch (error) {
      console.error("验证角色名称失败:", error);
      callback();
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "角色ID",
      dataIndex: "id",
      key: "id",
      width: 120,
      fixed: "left",
    },
    {
      title: "角色名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "角色描述",
      dataIndex: "descr",
      key: "descr",
      render: (descr) => descr || "-",
    },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      align: "center",
      width: 80,
      render: (state) => (
        <Tag color={state === "ENABLED" ? "green" : "red"} bordered>
          {state === "ENABLED" ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 170,
      render: (value) => renderDate(value),
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      key: "createUserName",
      width: 140,
      render: (name, record) => (
        <UserAvatar name={name || (record?.createUser ?? "")} showName />
      ),
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
                onClickMenuItem={(key, e) => {
                  handleMenuClick(key, e, record);
                }}
                className="handle-dropdown-menu"
              >
                <Menu.Item key="assign">
                  <IconMenu style={{ marginRight: "5px" }} />
                  分配菜单
                </Menu.Item>
                <Menu.Item key="edit">
                  <IconEdit style={{ marginRight: "5px" }} />
                  编辑
                </Menu.Item>
                <Menu.Item key="toggle">
                  <IconUser style={{ marginRight: "5px" }} />
                  {record.state === "ENABLED" ? "禁用" : "启用"}
                </Menu.Item>
                <Menu.Item key="delete">
                  <IconDelete style={{ marginRight: "5px" }} />
                  删除
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="text"
              className="more-btn"
              onClick={(e) => {
                e.stopPropagation();
              }}
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
      field: "roleName",
      label: "名称",
      type: "input",
      placeholder: "请输入角色名称",
      span: 6,
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
      span: 6,
    },
  ];

  // 新增/编辑表单配置
  const getFormConfig = (isEditMode: boolean): FormFieldConfig[] => {
    return [
      {
        field: "id",
        label: "角色ID",
        type: "input",
        disabled: isEditMode,
        required: !isEditMode,
        placeholder: "请输入角色ID（如：admin、user等）",
        rules: isEditMode
          ? []
          : [
              { required: true, message: "请输入角色ID" },
              { max: 32, message: "角色ID长度不能超过32个字符" },
              {
                pattern: /^[a-zA-Z0-9_-]+$/,
                message: "角色ID只能包含字母、数字、下划线和连字符",
              },
              { validator: validateRoleId },
            ],
      },
      {
        field: "name",
        label: "角色名称",
        type: "input",
        required: true,
        placeholder: "请输入角色名称",
        rules: [
          { required: true, message: "请输入角色名称" },
          { max: 64, message: "角色名称长度不能超过64个字符" },
          { validator: validateRoleName },
        ],
      },
      {
        field: "descr",
        label: "角色描述",
        type: "textarea",
        placeholder: "请输入角色描述",
        rules: [{ max: 128, message: "角色描述长度不能超过128个字符" }],
      },
    ];
  };

  // 获取角色列表
  const fetchRoles = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        keyWord: searchParams.roleName || params.roleName || "",
        state: searchParams.state || params.state || "",
        pageNum: pagination.current - 1,
        pageSize: pagination.pageSize,
      };

      const response = await getRoles(queryParams);
      const { content, totalElements } = response.data;

      setData(content || []);
      setPagination((prev) => ({
        ...prev,
        total: totalElements || 0,
      }));
    } catch (error) {
      Message.error("获取角色列表失败");
      console.error("获取角色列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values) => {
    // 过滤空值
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams((prev) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchRoles({ ...searchParams, ...filterValues });
  };

  // 搜索表单内容
  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={searchParams}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={() => {
        const resetParams = { roleName: "", state: "" };
        setSearchParams(resetParams);
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchRoles(resetParams);
        Message.info("已重置筛选条件");
      }}
      min={3}
    />
  );

  // 切换角色状态
  const handleToggleState = async (record) => {
    try {
      if (record.state === "ENABLED") {
        await disableRole(record.id);
        Message.success("角色已禁用");
      } else {
        await enableRole(record.id);
        Message.success("角色已启用");
      }
      fetchRoles();
    } catch (error) {
      Message.error("操作失败");
      console.error("切换角色状态失败:", error);
    }
  };

  // 处理菜单点击
  const handleMenuClick = (key, event, record) => {
    event.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "delete") {
      handleDelete(record);
    } else if (key === "assign") {
      handleAssignMenus(record);
    } else if (key === "toggle") {
      handleToggleState(record);
    }
  };

  // 将后端MenuDto转换为Tree组件数据结构
  const convertToTreeNodes = (nodes = []) => {
    return (nodes || []).map((n) => ({
      key: n.menuId,
      title: n.menuLabel || n.menuName || n.menuId,
      children: convertToTreeNodes(n.children || []),
    }));
  };

  // 提取树中的所有key
  const extractKeys = (allTree, nodes = []) => {
    const keys = [];
    const walk = (list) => {
      (list || []).forEach((n) => {
        keys.push(n.menuId || n.key);
        if (n.children && n.children.length) {
          walk(n.children);
        }
      });
    };
    walk(nodes);
    return keys;
  };

  const removeCheckParents = (allTree, assignedKeys) => {
    // 创建一个 Set 便于快速查找
    const assignedSet = new Set(assignedKeys);

    // 判断一个节点是否所有子节点都被选中
    const isAllChildrenChecked = (node) => {
      if (!node.children || node.children.length === 0) return true;
      return node.children.every(
        (child) => assignedSet.has(child.key) && isAllChildrenChecked(child)
      );
    };

    // 遍历树，移除不满足条件的父节点
    const filterKeys = (node) => {
      if (node.children && node.children.length) {
        node.children.forEach(filterKeys); // 先处理子节点
      }

      // 如果当前节点有子节点，且不是所有子节点都选中，则移除自己
      if (
        node.children &&
        node.children.length &&
        !isAllChildrenChecked(node)
      ) {
        assignedSet.delete(node.key);
      }
    };

    allTree.forEach(filterKeys);

    return Array.from(assignedSet);
  };

  // 打开分配菜单抽屉并加载数据
  const handleAssignMenus = async (record) => {
    setCurrentRole(record);
    setAssignVisible(true);
    setAssignLoading(true);
    try {
      const [allResp, assignedResp] = await Promise.all([
        getMenuTree(),
        getRoleMenuTree(record.id),
      ]);
      const allTree = convertToTreeNodes(allResp.data || []);
      const assignedTree = assignedResp.data || [];
      let assignedKeys = extractKeys(allTree, assignedTree);
      assignedKeys = removeCheckParents(allTree, assignedKeys);
      setMenuTreeData(allTree);
      setCheckedMenuKeys(assignedKeys);
    } catch (e) {
      Message.error("加载菜单数据失败");
      console.error("加载菜单数据失败:", e);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignCancel = () => {
    setAssignVisible(false);
    setCheckedMenuKeys([]);
  };

  const handleAssignSave = async () => {
    if (!currentRole) return;
    setAssignLoading(true);
    try {
      await replaceRoleMenus(currentRole.id, checkedMenuKeys);
      Message.success("菜单分配已保存");
      setAssignVisible(false);
    } catch (e) {
      Message.error("保存菜单分配失败");
      console.error("保存菜单分配失败:", e);
    } finally {
      setAssignLoading(false);
    }
  };

  // 添加角色
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRole(null);
    setAddEditVisible(true);
  };

  // 编辑角色
  const handleEdit = (record) => {
    setCurrentRole(record);
    setIsEdit(true);
    setAddEditVisible(true);
  };

  // 删除角色
  const handleDelete = (record) => {
    setCurrentRole(record);
    setDeleteModalVisible(true);
  };

  // 确认添加/编辑角色
  const handleAddEditSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateRole(values);
        Message.success("角色信息更新成功");
      } else {
        await createRole(values);
        Message.success("角色创建成功");
      }
      fetchRoles();
    } catch (error) {
      let msg = isEdit ? "更新角色信息失败" : "创建角色失败";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      }
      throw new Error(msg);
    }
  };

  // 确认删除角色
  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(currentRole.id);
      Message.success("角色删除成功");
      setDeleteModalVisible(false);
      fetchRoles();
    } catch (error) {
      Message.error("删除角色失败");
      console.error("删除角色失败:", error);
    }
  };

  // 初始化
  useEffect(() => {
    fetchRoles();
  }, []);

  // 分页变化时重新获取数据
  useEffect(() => {
    fetchRoles();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div className="role-manager">
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

      {/* 新增/编辑角色对话框 */}
      <AddEditModal
        visible={addEditVisible}
        isEdit={isEdit}
        record={currentRole || undefined}
        title={isEdit ? "编辑角色" : "新增角色"}
        formConfig={getFormConfig(isEdit)}
        onOk={handleAddEditSubmit}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentRole(null);
        }}
      />

      {/* 分配菜单抽屉 */}
      <Drawer
        title={`分配菜单 - ${currentRole?.name || ""}`}
        visible={assignVisible}
        width={520}
        maskClosable={false}
        onCancel={handleAssignCancel}
        footer={
          <Space>
            <Button onClick={handleAssignCancel} disabled={assignLoading}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleAssignSave}
              loading={assignLoading}
            >
              保存
            </Button>
          </Space>
        }
      >
        <div style={{ maxHeight: 420, overflow: "auto" }}>
          <Tree
            checkable
            treeData={menuTreeData}
            checkedKeys={checkedMenuKeys}
            onCheck={(keys) => setCheckedMenuKeys(keys)}
          />
        </div>
      </Drawer>

      {/* 删除确认对话框 */}
      <Modal
        title="删除角色"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <p>确定要删除角色 "{currentRole?.name}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}

export default RoleManager;

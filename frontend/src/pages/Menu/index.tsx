import React, { useEffect, useRef, useState } from "react";
import {
  Cascader,
  Form,
  Grid,
  Input,
  InputNumber,
  Layout,
  Message,
  Modal,
  Select,
  Space,
  Tag,
} from "@arco-design/web-react";
import "./style/index.less";
import {
  createMenu,
  deleteMenu,
  disableMenu,
  enableMenu,
  getMenuList,
  getMenuTree,
  updateMenu,
} from "./api";
import { DataManager } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import * as ArcoIcons from "@arco-design/web-react/icon";
import {
  IconApps,
  IconArchive,
  IconBook,
  IconBug,
  IconBulb,
  IconCalendar,
  IconCamera,
  IconCheckCircle,
  IconClockCircle,
  IconCloud,
  IconCloudDownload,
  IconCode,
  IconCommand,
  IconCompass,
  IconCopy,
  IconCustomerService,
  IconDashboard,
  IconDelete,
  IconDesktop,
  IconDice,
  IconDownload,
  IconDriveFile,
  IconEar,
  IconEdit,
  IconEmail,
  IconExclamation,
  IconEye,
  IconEyeInvisible,
  IconFaceSmileFill,
  IconFile,
  IconFire,
  IconFolder,
  IconGift,
  IconHeart,
  IconHistory,
  IconHome,
  IconIdcard,
  IconImage,
  IconInfo,
  IconInteraction,
  IconLanguage,
  IconLink,
  IconList,
  IconLoading,
  IconLocation,
  IconLock,
  IconMenu,
  IconMindMapping,
  IconMobile,
  IconMusic,
  IconNav,
  IconNotification,
  IconPalette,
  IconPhone,
  IconPlayArrow,
  IconPlus,
  IconPoweroff,
  IconPrinter,
  IconPushpin,
  IconQrcode,
  IconQuestionCircle,
  IconRecord,
  IconRefresh,
  IconReply,
  IconRobot,
  IconSafe,
  IconSave,
  IconScan,
  IconSchedule,
  IconSearch,
  IconSelectAll,
  IconSend,
  IconSettings,
  IconShake,
  IconShareAlt,
  IconSound,
  IconStar,
  IconStorage,
  IconSync,
  IconTag,
  IconThumbUp,
  IconThunderbolt,
  IconTiktokColor,
  IconTool,
  IconTranslate,
  IconTrophy,
  IconUndo,
  IconUpload,
  IconUser,
  IconUserGroup,
  IconVideoCamera,
  IconVoice,
  IconWechat,
  IconWifi,
  IconZoomIn,
  IconZoomOut,
} from "@arco-design/web-react/icon";

const { TextArea } = Input;
const { Content } = Layout;
const { Row, Col } = Grid;

function MenuManager() {
  // 状态管理
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableScrollHeight, setTableScrollHeight] = useState(200);
  const [menuTree, setMenuTree] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 对话框状态
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(null);

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [10, 20, 50, 100],
  });

  // 查询条件
  const [searchParams, setSearchParams] = useState({
    state: "",
    parentId: "",
  });

  // 表单引用
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const filterFormRef = useRef<any>(null);

  // 菜单类型选项
  const menuTypeOptions = [
    { label: "目录", value: "DIRECTORY" },
    { label: "菜单", value: "MENU" },
    { label: "按钮", value: "BUTTON" },
  ];

  // 菜单状态选项
  const menuStateOptions = [
    { label: "启用", value: "ENABLED" },
    { label: "禁用", value: "DISABLED" },
  ];

  // 菜单图标选项
  const menuIconOptions = [
    // 基础功能图标
    { label: "仪表盘", value: "IconDashboard", icon: <IconDashboard /> },
    { label: "菜单", value: "IconMenu", icon: <IconMenu /> },
    { label: "首页", value: "IconHome", icon: <IconHome /> },
    { label: "应用", value: "IconApps", icon: <IconApps /> },
    { label: "桌面", value: "IconDesktop", icon: <IconDesktop /> },
    { label: "导航", value: "IconNav", icon: <IconNav /> },

    // 文件和文档图标
    { label: "文件", value: "IconFile", icon: <IconFile /> },
    { label: "文件夹", value: "IconFolder", icon: <IconFolder /> },
    { label: "书籍", value: "IconBook", icon: <IconBook /> },
    { label: "驱动文件", value: "IconDriveFile", icon: <IconDriveFile /> },
    { label: "复制", value: "IconCopy", icon: <IconCopy /> },
    { label: "列表", value: "IconList", icon: <IconList /> },
    { label: "归档", value: "IconArchive", icon: <IconArchive /> },
    { label: "保存", value: "IconSave", icon: <IconSave /> },
    { label: "下载", value: "IconDownload", icon: <IconDownload /> },
    { label: "上传", value: "IconUpload", icon: <IconUpload /> },

    // 用户和权限图标
    { label: "用户", value: "IconUser", icon: <IconUser /> },
    { label: "用户组", value: "IconUserGroup", icon: <IconUserGroup /> },
    { label: "身份证", value: "IconIdcard", icon: <IconIdcard /> },
    { label: "锁定", value: "IconLock", icon: <IconLock /> },
    { label: "安全", value: "IconSafe", icon: <IconSafe /> },

    // 系统和设置图标
    { label: "设置", value: "IconSettings", icon: <IconSettings /> },
    { label: "存储", value: "IconStorage", icon: <IconStorage /> },
    { label: "工具", value: "IconTool", icon: <IconTool /> },
    { label: "命令", value: "IconCommand", icon: <IconCommand /> },
    { label: "代码", value: "IconCode", icon: <IconCode /> },
    { label: "调试", value: "IconBug", icon: <IconBug /> },
    { label: "刷新", value: "IconRefresh", icon: <IconRefresh /> },
    { label: "同步", value: "IconSync", icon: <IconSync /> },
    { label: "电源", value: "IconPoweroff", icon: <IconPoweroff /> },

    // 通信和联系图标
    { label: "邮件", value: "IconEmail", icon: <IconEmail /> },
    { label: "电话", value: "IconPhone", icon: <IconPhone /> },
    { label: "手机", value: "IconMobile", icon: <IconMobile /> },
    { label: "发送", value: "IconSend", icon: <IconSend /> },
    { label: "通知", value: "IconNotification", icon: <IconNotification /> },
    {
      label: "客服",
      value: "IconCustomerService",
      icon: <IconCustomerService />,
    },
    { label: "微信", value: "IconWechat", icon: <IconWechat /> },
    { label: "分享", value: "IconShareAlt", icon: <IconShareAlt /> },
    { label: "回复", value: "IconReply", icon: <IconReply /> },

    // 媒体和娱乐图标
    { label: "图片", value: "IconImage", icon: <IconImage /> },
    { label: "相机", value: "IconCamera", icon: <IconCamera /> },
    { label: "摄像头", value: "IconVideoCamera", icon: <IconVideoCamera /> },
    { label: "调色板", value: "IconPalette", icon: <IconPalette /> },
    { label: "笑脸", value: "IconFaceSmileFill", icon: <IconFaceSmileFill /> },
    { label: "心形", value: "IconHeart", icon: <IconHeart /> },
    { label: "星星", value: "IconStar", icon: <IconStar /> },
    { label: "奖杯", value: "IconTrophy", icon: <IconTrophy /> },
    { label: "礼物", value: "IconGift", icon: <IconGift /> },
    { label: "音乐", value: "IconMusic", icon: <IconMusic /> },
    { label: "声音", value: "IconSound", icon: <IconSound /> },
    { label: "语音", value: "IconVoice", icon: <IconVoice /> },
    { label: "播放", value: "IconPlayArrow", icon: <IconPlayArrow /> },
    { label: "录制", value: "IconRecord", icon: <IconRecord /> },
    { label: "点赞", value: "IconThumbUp", icon: <IconThumbUp /> },

    // 导航和位置图标
    { label: "搜索", value: "IconSearch", icon: <IconSearch /> },
    { label: "指南针", value: "IconCompass", icon: <IconCompass /> },
    { label: "位置", value: "IconLocation", icon: <IconLocation /> },
    { label: "链接", value: "IconLink", icon: <IconLink /> },
    { label: "放大", value: "IconZoomIn", icon: <IconZoomIn /> },
    { label: "缩小", value: "IconZoomOut", icon: <IconZoomOut /> },
    { label: "全选", value: "IconSelectAll", icon: <IconSelectAll /> },

    // 时间和日程图标
    { label: "日历", value: "IconCalendar", icon: <IconCalendar /> },
    { label: "日程", value: "IconSchedule", icon: <IconSchedule /> },
    { label: "历史", value: "IconHistory", icon: <IconHistory /> },
    { label: "时钟", value: "IconClockCircle", icon: <IconClockCircle /> },
    { label: "撤销", value: "IconUndo", icon: <IconUndo /> },

    // 网络和云服务图标
    { label: "云", value: "IconCloud", icon: <IconCloud /> },
    {
      label: "云下载",
      value: "IconCloudDownload",
      icon: <IconCloudDownload />,
    },
    { label: "WiFi", value: "IconWifi", icon: <IconWifi /> },
    { label: "加载", value: "IconLoading", icon: <IconLoading /> },

    // 商业和购物图标
    { label: "标签", value: "IconTag", icon: <IconTag /> },

    // 工作流程图标
    { label: "检查", value: "IconCheckCircle", icon: <IconCheckCircle /> },
    { label: "图钉", value: "IconPushpin", icon: <IconPushpin /> },
    { label: "交互", value: "IconInteraction", icon: <IconInteraction /> },
    { label: "思维导图", value: "IconMindMapping", icon: <IconMindMapping /> },
    { label: "火焰", value: "IconFire", icon: <IconFire /> },
    { label: "灯泡", value: "IconBulb", icon: <IconBulb /> },

    // 其他功能图标
    { label: "打印机", value: "IconPrinter", icon: <IconPrinter /> },
    { label: "机器人", value: "IconRobot", icon: <IconRobot /> },
    { label: "闪电", value: "IconThunderbolt", icon: <IconThunderbolt /> },
    { label: "语言", value: "IconLanguage", icon: <IconLanguage /> },
    { label: "翻译", value: "IconTranslate", icon: <IconTranslate /> },
    { label: "信息", value: "IconInfo", icon: <IconInfo /> },
    {
      label: "问号",
      value: "IconQuestionCircle",
      icon: <IconQuestionCircle />,
    },
    { label: "感叹号", value: "IconExclamation", icon: <IconExclamation /> },
    { label: "二维码", value: "IconQrcode", icon: <IconQrcode /> },
    { label: "扫描", value: "IconScan", icon: <IconScan /> },
    { label: "眼睛", value: "IconEye", icon: <IconEye /> },
    { label: "隐藏", value: "IconEyeInvisible", icon: <IconEyeInvisible /> },
    { label: "耳朵", value: "IconEar", icon: <IconEar /> },
    { label: "骰子", value: "IconDice", icon: <IconDice /> },
    { label: "震动", value: "IconShake", icon: <IconShake /> },
    { label: "抖音", value: "IconTiktokColor", icon: <IconTiktokColor /> },
  ];

  // 转换菜单树为级联选择器数据
  const convertMenuTreeToCascaderData = (menuTree) => {
    return menuTree.map((menu) => ({
      value: menu.menuId,
      label: menu.menuLabel,
      children:
        menu.children && menu.children.length > 0
          ? convertMenuTreeToCascaderData(menu.children)
          : undefined,
    }));
  };

  // 查找菜单在树中的完整路径
  const findMenuPath = (menuTree, targetId, path = []) => {
    for (const menu of menuTree) {
      const currentPath = [...path, menu.menuId];

      if (menu.menuId === targetId) {
        return currentPath;
      }

      if (menu.children && menu.children.length > 0) {
        const result = findMenuPath(menu.children, targetId, currentPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  // 获取菜单树数据
  const fetchMenuTree = async () => {
    try {
      const response = await getMenuTree();
      setMenuTree(response.data || []);
    } catch (error) {
      console.error("获取菜单树失败:", error);
    }
  };

  useEffect(() => {
    if (menuTree.length > 0) {
      setExpandedKeys(menuTree.map((item: any) => String(item.menuId)));
    }
  }, [menuTree]);

  // 根据英文编码渲染图标组件（用于列表与详情展示）
  const renderIconByName = (iconName?: string) => {
    if (!iconName) return null;
    const IconComp = (ArcoIcons as any)[iconName];
    if (IconComp) return <IconComp />;
    const fallback = menuIconOptions.find((opt) => opt.value === iconName);
    return fallback ? fallback.icon : null;
  };

  // 表格列定义
  const tableColumns = [
    {
      title: "菜单编码",
      dataIndex: "menuName",
      key: "menuName",
      width: 150,
    },
    {
      title: "菜单名称",
      dataIndex: "menuLabel",
      key: "menuLabel",
      width: 150,
    },
    {
      title: "菜单类型",
      dataIndex: "menuType",
      key: "menuType",
      width: 100,
      render: (type) => {
        const typeMap = {
          DIRECTORY: { color: "blue", text: "目录" },
          MENU: { color: "green", text: "菜单" },
          BUTTON: { color: "orange", text: "按钮" },
        };
        const config = typeMap[type] || { color: "gray", text: type };
        return <Tag color={config.color} bordered>{config.text}</Tag>;
      },
    },
    {
      title: "路由地址",
      dataIndex: "url",
      key: "url",
      width: 200,
      ellipsis: true,
    },
    {
      title: "图标",
      dataIndex: "menuIcon",
      key: "menuIcon",
      width: 80,
      render: (iconName) => {
        const iconEl = renderIconByName(iconName);
        return iconEl ? iconEl : "-";
      },
    },
    {
      title: "排序",
      dataIndex: "seq",
      key: "seq",
      width: 80,
    },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      width: 80,
      render: (state) => {
        const stateMap = {
          ENABLED: { color: "green", text: "启用" },
          DISABLED: { color: "red", text: "禁用" },
        };
        const config = stateMap[state] || { color: "gray", text: state };
        return <Tag color={config.color} bordered>{config.text}</Tag>;
      },
    },
  ];

  // 获取菜单列表
  const fetchMenuList = async (
    params = {},
    page?: number,
    pageSize?: number
  ) => {
    setTableLoading(true);
    try {
      const queryParams = {
        pageNum: (page ?? pagination.current) - 1,
        pageSize: pageSize ?? pagination.pageSize,
        ...params,
      };
      const response = await getMenuList(queryParams);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination((prev) => ({
          ...prev,
          current: (queryParams.pageNum || 0) + 1,
          pageSize: queryParams.pageSize || prev.pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error("获取菜单列表失败");
      console.error("获取菜单列表失败:", error);
    } finally {
      setTableLoading(false);
    }
  };

  // 防抖函数
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const handleSearch = () => {
    const values = filterFormRef.current?.getFilterValues?.() || {};
    fetchMenuList(values, 1, pagination.pageSize);
  };

  // 创建防抖版本的搜索函数
  const debouncedSearch = React.useMemo(
    () => debounce(handleSearch, 300),
    [pagination.pageSize]
  );

  const handlePaginationChange = (p) => {
    setPagination(p);
    const values = filterFormRef.current?.getFilterValues?.() || {};
    fetchMenuList(values, p.current, p.pageSize);
  };

  // 处理新增
  const handleAdd = () => {
    setCurrentMenu(null);
    addForm.resetFields();
    setAddModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record) => {
    setCurrentMenu(record);

    // 处理父菜单路径回显
    const formValues = { ...record };
    if (record.parentId && menuTree.length > 0) {
      const parentPath = findMenuPath(menuTree, record.parentId);
      if (parentPath) {
        formValues.parentId = parentPath;
      }
    }

    editForm.setFieldsValue(formValues);
    setEditModalVisible(true);
  };

  // 处理删除
  const handleDelete = (record) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除菜单"${record.menuName || record.menuName}"吗？`,
      onOk: async () => {
        try {
          await deleteMenu(record.menuId);
          Message.success("删除成功");
          const values = filterFormRef.current?.getFilterValues?.() || {};
          fetchMenuList(values, pagination.current, pagination.pageSize);
        } catch (error) {
          Message.error("删除失败");
          console.error("删除菜单失败:", error);
        }
      },
    });
  };

  // 处理状态切换
  const handleToggleState = async (record) => {
    try {
      if (record.state === "ENABLED") {
        await disableMenu(record.menuId);
        Message.success("禁用成功");
      } else {
        await enableMenu(record.menuId);
        Message.success("启用成功");
      }
      const values = filterFormRef.current?.getFilterValues?.() || {};
      fetchMenuList(values, pagination.current, pagination.pageSize);
    } catch (error) {
      Message.error("操作失败");
      console.error("切换菜单状态失败:", error);
    }
  };

  // 处理菜单点击
  const handleMenuClick = (key, event, record) => {
    event.stopPropagation();
    if (key === "edit") {
      handleEdit(record);
    } else if (key === "toggle") {
      handleToggleState(record);
    } else if (key === "delete") {
      handleDelete(record);
    }
  };

  // 处理新增提交
  const handleAddSubmit = async (values) => {
    try {
      // 处理级联选择器的值，取最后一个作为父菜单ID
      const submitValues = { ...values };
      if (values.parentId && Array.isArray(values.parentId) && values.parentId.length > 0) {
        submitValues.parentId = values.parentId[values.parentId.length - 1];
      } else {
        // 如果父菜单为空数组、undefined 或 null，显式设置为 null
        submitValues.parentId = null;
      }

      await createMenu(submitValues);
      Message.success("创建成功");
      setAddModalVisible(false);
      fetchMenuList();
    } catch (error) {
      Message.error("创建失败");
      console.error("创建菜单失败:", error);
    }
  };

  // 处理编辑提交
  const handleEditSubmit = async (values) => {
    try {
      // 处理级联选择器的值，取最后一个作为父菜单ID
      const submitValues = { ...values };
      if (values.parentId && Array.isArray(values.parentId) && values.parentId.length > 0) {
        submitValues.parentId = values.parentId[values.parentId.length - 1];
      } else {
        // 如果父菜单为空数组、undefined 或 null，显式设置为 null
        submitValues.parentId = null;
      }

      await updateMenu(currentMenu.menuId, submitValues);
      Message.success("更新成功");
      setEditModalVisible(false);
      fetchMenuList();
    } catch (error) {
      Message.error("更新失败");
      console.error("更新菜单失败:", error);
    }
  };

  useEffect(() => {
  const calculateTableHeight = () => {
    const windowHeight = window.innerHeight;
    const otherElementsHeight = 330;
    const newHeight = Math.max(100, windowHeight - otherElementsHeight);

    setTableScrollHeight((prev) => {
      if (prev === newHeight) return prev; // ⭐ 防止重复 set
      return newHeight;
    });
  };

  calculateTableHeight();
}, []);

  // 初始化
  useEffect(() => {
    fetchMenuList();
    fetchMenuTree();
  }, []);

  return (
    <div className="menu-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
        config={{
          displayMode: "table",
          filterContent: (
            <FilterForm
              ref={filterFormRef}
              initialValues={{ menuName: "", state: undefined }}
              formFields={
                [
                  {
                    field: "menuName",
                    label: "名称",
                    type: "input",
                    placeholder: "请输入菜单名称",
                    span: 8,
                  },
                  {
                    field: "state",
                    label: "状态",
                    type: "select",
                    placeholder: "请选择状态",
                    allowClear: true,
                    options: menuStateOptions,
                    span: 8,
                  },
                ] as FormFieldConfig[]
              }
              onSearch={handleSearch}
              onReset={() => fetchMenuList({}, 1, pagination.pageSize)}
              min={3}
            />
          ),
          tableColumns: tableColumns,
          showModeToggle: false,
          showTree: true,
          showTreeFilter: true,
          treeData: menuTree.map((m: any) => ({
            title: m.menuLabel,
            key: String(m.menuId),
            children: (m.children || []).length
              ? (m.children || []).map((c: any) => ({
                  title: c.menuLabel,
                  key: String(c.menuId),
                  children: (c.children || []).length
                    ? (c.children || []).map((cc: any) => ({
                        title: cc.menuLabel,
                        key: String(cc.menuId),
                      }))
                    : undefined,
                }))
              : undefined,
          })),
          expandedKeys,
          onTreeExpand: (keys) => setExpandedKeys(keys as string[]),
          onTreeSelect: (keys: string[]) => {
            const key = keys?.[0];
            const values = filterFormRef.current?.getFilterValues?.() || {};
            const next = { ...values, parentId: key ? key : undefined };
            fetchMenuList(next, 1, pagination.pageSize);
          },
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增菜单对话框 */}
      <Modal
        title="新增菜单"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => addForm.submit()}
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form form={addForm} layout="vertical" onSubmit={handleAddSubmit}>
            <Form.Item
              label="菜单编码"
              field="menuName"
              rules={[{ required: true, message: "请输入菜单编码" }]}
            >
              <Input placeholder="请输入菜单编码" />
            </Form.Item>
            <Form.Item
              label="菜单名称"
              field="menuLabel"
              rules={[{ required: true, message: "请输入菜单名称" }]}
            >
              <Input placeholder="请输入菜单名称" />
            </Form.Item>
            <Form.Item
              label="菜单类型"
              field="menuType"
              rules={[{ required: true, message: "请选择菜单类型" }]}
            >
              <Select placeholder="请选择菜单类型">
                {menuTypeOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="父菜单" field="parentId">
              <Cascader
                placeholder="请选择父菜单（可选）"
                options={convertMenuTreeToCascaderData(menuTree)}
                allowClear
                changeOnSelect
              />
            </Form.Item>
            <Form.Item label="路由地址" field="url">
              <Input placeholder="请输入路由地址" />
            </Form.Item>
            <Form.Item label="菜单图标" field="menuIcon">
              <Select
                placeholder="请选择菜单图标"
                allowClear
                showSearch
                filterOption={(inputValue, option) =>
                  option.props.value
                    .toLowerCase()
                    .indexOf(inputValue.toLowerCase()) >= 0
                }
              >
                {menuIconOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      {option.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="排序号" field="seq">
              <InputNumber
                placeholder="请输入排序号"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item label="菜单描述" field="menuDescr">
              <TextArea placeholder="请输入菜单描述" rows={3} />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 编辑菜单对话框 */}
      <Modal
        title="编辑菜单"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => editForm.submit()}
      >
        <div
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}
        >
          <Form form={editForm} layout="vertical" onSubmit={handleEditSubmit}>
            <Form.Item
              label="菜单编码"
              field="menuName"
              rules={[{ required: true, message: "请输入菜单编码" }]}
            >
              <Input placeholder="请输入菜单编码" />
            </Form.Item>
            <Form.Item
              label="菜单名称"
              field="menuLabel"
              rules={[{ required: true, message: "请输入菜单名称" }]}
            >
              <Input placeholder="请输入菜单名称" />
            </Form.Item>
            <Form.Item
              label="菜单类型"
              field="menuType"
              rules={[{ required: true, message: "请选择菜单类型" }]}
            >
              <Select placeholder="请选择菜单类型">
                {menuTypeOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="父菜单" field="parentId">
              <Cascader
                placeholder="请选择父菜单（可选）"
                options={convertMenuTreeToCascaderData(menuTree)}
                allowClear
                changeOnSelect
              />
            </Form.Item>
            <Form.Item label="路由地址" field="url">
              <Input placeholder="请输入路由地址" />
            </Form.Item>
            <Form.Item label="菜单图标" field="menuIcon">
              <Select placeholder="请选择菜单图标" allowClear>
                {menuIconOptions.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      {option.label}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="排序号" field="seq">
              <InputNumber
                placeholder="请输入排序号"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item label="菜单描述" field="menuDescr">
              <TextArea placeholder="请输入菜单描述" rows={3} />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
}

export default MenuManager;

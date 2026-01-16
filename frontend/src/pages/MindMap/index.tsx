import React, { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useNavigate } from "react-router-dom";
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
  Space,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconList,
  IconPlus,
  IconMindMapping,
} from "@arco-design/web-react/icon";
import "./style/index.less";
import {
  createMindMap,
  deleteMindMap,
  getMindMapList,
  updateMindMapBasicInfo,
} from "./api/mindMapService";
import { DataManager, AddEditModal } from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import renderDate from "@/utils/timeUtil";
import { MindMapDto, PaginationConfig } from "./types";

const { Content } = Layout;
const { Row, Col } = Grid;

const MindMapListPage: React.FC = () => {
  const navigate = useNavigate();

  // 表格数据与状态
  const [tableData, setTableData] = useState<MindMapDto[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState<number>(420);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    mapName: "",
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<MindMapDto | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 获取表格数据
  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const targetParams = {
        ...params,
        pageNum: current - 1,
        pageSize: pageSize,
      };
      const response = await getMindMapList(targetParams);
      if (response.data) {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.content || [];
        setTableData(data);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: Array.isArray(response.data)
            ? response.data.length
            : response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error("加载思维导图列表失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
    );
    setSearchParams((prev) => ({ ...prev, ...filterValues }));
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  // 分页变化
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  // 初始化与高度自适应
  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 250;
      const newHeight = Math.max(200, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };
    calculateTableHeight();
    // 使用searchParams（默认为空）获取数据
    fetchTableData(searchParams);
    const handleResize = () => calculateTableHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 处理新增
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => addFormRef.current?.resetFields?.(), 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        await createMindMap(values);
        Message.success("思维导图创建成功");
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("思维导图创建失败");
    }
  };

  // 处理编辑
  const handleEdit = (record: MindMapDto) => {
    setIsEdit(true);
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        mapName: record.mapName,
        description: record.description || "",
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        await updateMindMapBasicInfo({
          id: currentRecord.id,
          ...values,
        });
        Message.success("思维导图更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("思维导图更新失败");
    }
  };

  // 处理删除
  const handleDelete = (record: MindMapDto) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除思维导图"${record.mapName}"吗？`,
      onOk: async () => {
        try {
          await deleteMindMap(record.id);
          Message.success("思维导图删除成功");
          fetchTableData(
            searchParams,
            pagination.pageSize,
            Math.max(1, pagination.current - 1)
          );
        } catch (error) {
          Message.error("思维导图删除失败");
        }
      },
    });
  };

  // 处理绘图
  const handleDraw = (record: MindMapDto) => {
    navigate(`/frame/mindmap/edit/${record.id}`);
  };

  // 表格列配置
  const columns = [
    {
      title: "思维导图名称",
      dataIndex: "mapName",
      key: "mapName",
      ellipsis: true,
      width: 150,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      key: "createUserName",
      width: 120,
      render: (name: string, record: MindMapDto) => (
        <UserAvatar name={name || record?.createUser || ""} showName />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      width: 120,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: MindMapDto) => (
        <Dropdown
          position="bl"
          droplist={
            <Menu
              onClickMenuItem={(key) => {
                switch (key) {
                  case "draw":
                    handleDraw(record);
                    break;
                  case "edit":
                    handleEdit(record);
                    break;
                  case "delete":
                    handleDelete(record);
                    break;
                }
              }}
              className="handle-dropdown-menu"
            >
              <Menu.Item key="draw">
                <IconMindMapping style={{ marginRight: 5 }} />
                绘图
              </Menu.Item>
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
      ),
    },
  ];

  // 搜索表单字段配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "mapName",
      label: "导图名称",
      type: "input",
      placeholder: "请输入名称关键字",
      span: 9,
    },
  ];

  // 新增/编辑表单字段配置
  const formConfig: FormFieldConfig[] = [
    {
      field: "mapName",
      label: "思维导图名称",
      type: "input",
      required: true,
      placeholder: "请输入思维导图名称",
      rules: [{ required: true, message: "请输入思维导图名称" }],
    },
    {
      field: "description",
      label: "描述",
      type: "textarea",
      placeholder: "请输入描述（可选）",
    },
  ];

  // 搜索表单
  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
    />
  );

  return (
    <div className="mindmap-list-page">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: handleAdd,
        }}
        config={{
          showModeToggle: false,
          displayMode: "table",
          filterContent,
          tableColumns: columns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      {/* 新增对话框 */}
      <AddEditModal
        visible={addModalVisible}
        isEdit={false}
        record={currentRecord || undefined}
        loading={tableLoading}
        title="创建思维导图"
        formConfig={formConfig}
        onOk={handleAddConfirm}
        onCancel={() => {
          setAddModalVisible(false);
          addFormRef.current?.resetFields?.();
        }}
      />

      {/* 编辑对话框 */}
      <Modal
        title="编辑思维导图信息"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
        okText="确定"
        cancelText="取消"
        confirmLoading={tableLoading}
      >
        <Form ref={editFormRef} layout="vertical" autoComplete="off">
          {formConfig.map((field) => (
            <Form.Item
              key={field.field}
              field={field.field}
              label={field.label}
              rules={field.rules}
            >
              {field.type === "textarea" ? (
                <Input.TextArea placeholder={field.placeholder} rows={4} />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default MindMapListPage;

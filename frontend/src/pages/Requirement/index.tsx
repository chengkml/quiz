import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from "@arco-design/web-react";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import { IconDelete, IconEdit } from "@arco-design/web-react/icon";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import {
  createRequirement,
  deleteRequirement,
  getRequirementList,
  updateRequirement,
} from "./api";

const { TextArea } = Input;
const { Option } = Select;

function Requirement() {
  // 表格数据与状态
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  // 搜索条件
  const [searchParams, setSearchParams] = useState({
    title: null,
    status: null,
    projectName: null,
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 状态选项
  const statusOptions = [
    { label: "待处理", value: "OPEN" },
    { label: "处理中", value: "IN_PROGRESS" },
    { label: "已完成", value: "COMPLETED" },
    { label: "已关闭", value: "CLOSED" },
  ];

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "title",
      label: "标题",
      type: "input",
      placeholder: "请输入标题",
      span: 6,
    },
    {
      field: "projectName",
      label: "项目名称",
      type: "input",
      placeholder: "请输入项目名称",
      span: 6,
    },
    {
      field: "status",
      label: "状态",
      type: "select",
      placeholder: "请选择状态",
      options: statusOptions,
      span: 6,
      allowClear: true,
    },
  ];

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
        pageNum: current, // 后端通常需要 1-based 或 0-based，根据 Todo 示例，这里传 current 即可，BaseServiceImpl 会处理
        // 注意：BaseServiceImpl 中 page = queryDto.getPageNum() - 1。
        // 如果前端传 1，后端 -1 = 0。符合预期。
        pageSize: pageSize,
      };
      const response = await getRequirementList(targetParams);
      if (response.data) {
        setTableData(response.data.content || []);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: response.data.totalElements || 0,
        }));
      }
    } catch (error) {
      Message.error("获取需求列表失败");
    } finally {
      setTableLoading(false);
    }
  };

  // 搜索处理
  const handleSearch = (values: any) => {
    const filterValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined && v !== null)
    );
    setSearchParams(filterValues as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(filterValues, pagination.pageSize, 1);
  };

  // 重置处理
  const handleReset = () => {
    const defaultParams = {};
    setSearchParams(defaultParams as any);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(defaultParams, pagination.pageSize, 1);
  };

  // 分页变化
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  // 新增
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
    setTimeout(() => addFormRef.current?.resetFields?.(), 50);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (values) {
        await createRequirement(values);
        Message.success("需求创建成功");
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("需求创建失败");
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        ...record,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          ...values,
          id: currentRecord.id,
        };
        await updateRequirement(payload);
        Message.success("需求更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("需求更新失败");
    }
  };

  // 删除
  const handleDelete = async (record: any) => {
    try {
      await deleteRequirement(record.id);
      Message.success("需求删除成功");
      fetchTableData();
    } catch (error) {
      Message.error("需求删除失败");
    }
  };

  // 列配置
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 180,
      ellipsis: true,
    },
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      width: 200,
    },
    {
      title: "项目名称",
      dataIndex: "projectName",
      width: 150,
    },
    {
      title: "分支",
      dataIndex: "branch",
      width: 100,
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status: string) => {
        const map: Record<string, any> = {
          OPEN: { color: "blue", text: "待处理" },
          IN_PROGRESS: { color: "orange", text: "处理中" },
          COMPLETED: { color: "green", text: "已完成" },
          CLOSED: { color: "gray", text: "已关闭" },
        };
        const it = map[status] || { color: "gray", text: status };
        return <Tag color={it.color}>{it.text}</Tag>;
      },
    },
    {
      title: "处理结果",
      dataIndex: "resultMsg",
      ellipsis: true,
      width: 150,
      render: (text: string) =>
        text ? (
          <Tooltip content={text}>
            <span>{text}</span>
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      width: 120,
      fixed: "right",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", gap: 10 }}>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该需求吗？"
            onOk={() => handleDelete(record)}
          >
            <Tooltip content="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  useEffect(() => {
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, []);

  return (
    <div className="requirement-page">
      <div className="requirement-content">
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
            tableProps: {
              scroll: { x: 1200, y: tableScrollHeight },
            },
          }}
          tableScrollHeight={tableScrollHeight}
        />
      </div>

      {/* 新增/编辑 表单配置 */}
      {[
        {
          visible: addModalVisible,
          title: "新增需求",
          onOk: handleAddConfirm,
          onCancel: () => setAddModalVisible(false),
          ref: addFormRef,
        },
        {
          visible: editModalVisible,
          title: "编辑需求",
          onOk: handleEditConfirm,
          onCancel: () => setEditModalVisible(false),
          ref: editFormRef,
        },
      ].map((modal, index) => (
        <Modal
          key={index}
          title={modal.title}
          visible={modal.visible}
          onOk={modal.onOk}
          onCancel={modal.onCancel}
          mountOnEnter
        >
          <Form ref={modal.ref} layout="vertical">
            <Form.Item label="标题" field="title" rules={[{ required: true }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>
            <Form.Item label="项目名称" field="projectName">
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item label="Git 仓库地址" field="gitUrl">
              <Input placeholder="请输入 Git 仓库地址" />
            </Form.Item>
            <Form.Item label="分支名称" field="branch" initialValue="main">
              <Input placeholder="请输入分支名称" />
            </Form.Item>
            <Form.Item label="描述" field="descr">
              <TextArea placeholder="请输入详细描述" autoSize={{ minRows: 3 }} />
            </Form.Item>
            {index === 1 && (
              <Form.Item label="状态" field="status">
                <Select placeholder="请选择状态">
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Form>
        </Modal>
      ))}
    </div>
  );
}

export default Requirement;

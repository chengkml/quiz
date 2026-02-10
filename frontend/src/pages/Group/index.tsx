import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Form,
  Input,
  Message,
  Modal,
  Popconfirm,
  Space,
  Tooltip,
} from "@arco-design/web-react";
import DataManager from "@/components/DataManager";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import UserAvatar from "@/components/UserAvatar";
import {
  IconDelete,
  IconEdit,
} from "@arco-design/web-react/icon";
import renderDate from "@/utils/timeUtil";
import "./style/index.less";
import {
  createGroup,
  deleteGroup,
  getGroupList,
  updateGroup,
  checkGroupName,
} from "./api";

const { TextArea } = Input;

function GroupManager() {
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
    name: null,
    label: null,
    type: null,
  });

  // 当前记录与弹窗
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 表单引用
  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "name",
      label: "英文名",
      type: "input",
      placeholder: "请输入英文名",
      span: 7,
    },
    {
      field: "label",
      label: "中文名",
      type: "input",
      placeholder: "请输入中文名",
      span: 7,
    },
    {
      field: "type",
      label: "类型",
      type: "input",
      placeholder: "请输入类型",
      span: 6,
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
        pageNum: current - 1,
        pageSize: pageSize,
      };
      const response = await getGroupList(targetParams);
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
      Message.error("获取分组数据失败");
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
  };

  // 分页变化
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  // 校验名称唯一性
  const validateNameUnique = async (value, recordId = null) => {
      if (!value) return;
      try {
          const res = await checkGroupName(value, recordId);
          if (!res.data) {
              return Promise.reject("分组名称已存在");
          }
      } catch (e) {
         // ignore error
      }
      return Promise.resolve();
  }

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
        await createGroup(values);
        Message.success("分组创建成功");
        setAddModalVisible(false);
        addFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return; // 表单校验错误
      Message.error("分组创建失败");
    }
  };

  // 编辑
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        id: record.id,
        name: record.name,
        label: record.label,
        type: record.type,
        descr: record.descr,
      });
    }, 50);
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (values && currentRecord) {
        const payload = {
          id: currentRecord.id,
          ...values,
        };
        await updateGroup(payload);
        Message.success("分组更新成功");
        setEditModalVisible(false);
        editFormRef.current?.resetFields?.();
        fetchTableData();
      }
    } catch (error: any) {
      if (error?.fields) return;
      Message.error("分组更新失败");
    }
  };

  // 删除
  const handleDelete = (record: any) => {
    setCurrentRecord(record);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRecord) return;
    try {
      await deleteGroup(currentRecord.id);
      Message.success("分组删除成功");
      setDeleteModalVisible(false);
      fetchTableData();
    } catch (error) {
      Message.error("分组删除失败");
    }
  };

  // 菜单点击
  // 列配置
  const columns = [
    {
      title: "英文名",
      dataIndex: "name",
      ellipsis: true,
    },
    {
      title: "中文名",
      dataIndex: "label",
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 120,
    },
    {
      title: "描述",
      dataIndex: "descr",
      ellipsis: true,
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      width: 140,
      render: (_: any, record: any) => (
        <UserAvatar
          name={record.createUserName || record.createUser || ""}
          showName
        />
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
      width: 100,
      align: "center",
      fixed: "right",
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该分组吗？"
            onOk={() => handleDelete(record)}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

  // 初始化获取数据
  useEffect(() => {
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, [searchParams, pagination.current, pagination.pageSize]);

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
    />
  );

  return (
    <div className="group-manager">
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
      <Modal
        title="新增分组"
        visible={addModalVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      >
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <Form ref={addFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="英文名"
              field="name"
              rules={[
                  { required: true, message: "请输入英文名" },
                  { 
                      validator: (v, cb) => {
                          return validateNameUnique(v).catch(e => cb(e));
                      }
                  }
              ]}
            >
              <Input placeholder="请输入英文名" />
            </Form.Item>
            <Form.Item
              label="中文名"
              field="label"
              rules={[{ required: true, message: "请输入中文名" }]}
            >
              <Input placeholder="请输入中文名" />
            </Form.Item>
            <Form.Item label="类型" field="type">
               <Input placeholder="请输入类型" />
            </Form.Item>
            <Form.Item label="详细描述" field="descr">
              <TextArea
                placeholder="请输入详细描述"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 编辑对话框 */}
      <Modal
        title="编辑分组"
        visible={editModalVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
      >
        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "10px",
          }}
        >
          <Form ref={editFormRef} layout="vertical" className="modal-form">
            <Form.Item
              label="英文名"
              field="name"
              rules={[
                  { required: true, message: "请输入英文名" },
                   { 
                      validator: (v, cb) => {
                          if (currentRecord && v === currentRecord.name) return; // Name hasn't changed
                          return validateNameUnique(v, currentRecord?.id).catch(e => cb(e));
                      }
                  }
              ]}
            >
              <Input placeholder="请输入英文名" />
            </Form.Item>
            <Form.Item
                label="中文名"
                field="label"
                rules={[{ required: true, message: "请输入中文名" }]}
            >
                <Input placeholder="请输入中文名" />
            </Form.Item>
            <Form.Item label="类型" field="type">
                <Input placeholder="请输入类型" />
            </Form.Item>
            <Form.Item label="详细描述" field="descr">
              <TextArea
                placeholder="请输入详细描述"
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 删除确认 */}
      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      >
        <div className="delete-modal">确定要删除该分组吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}

export default GroupManager;

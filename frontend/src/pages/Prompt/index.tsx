import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Message,
  Modal,
  Popconfirm,
  Space,
  Tooltip,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
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
import { FormFieldConfig, PaginationConfig } from "@/components/types/types";
import renderDate from '@/utils/timeUtil';
import Editor from "@monaco-editor/react";
import "./style/index.less";

const MarkdownEditor = ({ value, onChange }: { value?: string, onChange?: (val: string | undefined) => void }) => {
  return (
    <div style={{ border: '1px solid var(--color-border-2)', borderRadius: 4, overflow: 'hidden' }}>
      <Editor
        height="400px"
        defaultLanguage="markdown"
        value={value || ''}
        theme="vs-dark" 
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          fontSize: 14,
        }}
        onChange={onChange}
      />
    </div>
  );
};

function PromptTemplateManagement() {
  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // DataManager 分页状态
  const [pagination, setPagination] = useState<PaginationConfig>({
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
      title: "创建时间",
      dataIndex: "createDate",
      key: "createDate",
      width: 180,
      render: (value) => renderDate(value),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Space size="small" className="table-btn-group">
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
            title="确认删除该提示词模板吗？"
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
        // type: "textarea", // using custom render instead
        required: true,
        placeholder: "请输入模板内容",
        rules: [{ required: true, message: "请输入模板内容" }],
        render: (value) => {
           // Form.Item will inject value and onChange to this component instance
           return <MarkdownEditor value={value} />;
         }
      },
      {
        field: "description",
        label: "模板描述",
        type: "textarea",
        placeholder: "请输入模板描述",
        rules: [{ max: 500, message: "模板描述不能超过500个字符" }],
      },
      {
        field: "variables",
        label: "变量列表",
        type: "input",
        placeholder: "例如：question,context,options",
        rules: [{ max: 500, message: "变量列表不能超过500个字符" }],
      },
    ];
  };

  // 获取数据
  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        keyWord: searchParams.name || params.name || "",
        pageNum: pagination.current - 1,
        pageSize: pagination.pageSize,
      };

      const response = await getPromptTemplateList(queryParams);
      // 兼容 Page 对象结构
      const content = response.data?.content || [];
      const total = response.data?.totalElements || 0;

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
  // 已移除 handleMenuClick，操作按钮已改为直接调用

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
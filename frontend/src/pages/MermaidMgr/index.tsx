import React, { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dropdown,
  Menu,
  Message,
  Modal,
  Tag,
} from "@arco-design/web-react";
import {
  IconDelete,
  IconEdit,
  IconList,
  IconMindMapping,
  IconEye,
} from "@arco-design/web-react/icon";
import "./style/index.less";
import GroupTree from "../MindMap/components/GroupTree";
import {
  createMermaidDiagram,
  deleteMermaidDiagram,
  getMermaidList,
  updateMermaidDiagram,
} from "./api";
import { DataManager, AddEditModal } from "@/components/DataManager";
import { getGroupList } from "../Group/api";
import FilterForm from "@/components/FilterForm";
import { FormFieldConfig } from "@/components/types/types";
import renderDate from "@/utils/timeUtil";

const MermaidMgrPage: React.FC = () => {
  const navigate = useNavigate();

  // Table data & state
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });
  const [tableScrollHeight, setTableScrollHeight] = useState<number>(420);

  // Search params
  const [searchParams, setSearchParams] = useState({
    keyWord: "",
    group: "", // Changed from categoryId
  });

  // Group data
  const [groupOptions, setGroupOptions] = useState<any[]>([]);
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<string[]>([]);

  // Current record & Modals
  const [currentRecord, setCurrentRecord] = useState<any | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Refs
  const filterFormRef = useRef<any>(null);

  // Fetch Table Data
  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const targetParams = {
        ...params,
        pageNum: current - 1, // API likely expects 0-indexed
        pageSize: pageSize,
      };
      
      // Handle Group filter
      if (selectedGroupKeys.length > 0 && !selectedGroupKeys.includes('all')) {
          targetParams.group = selectedGroupKeys[0]; // Assuming single select or first
      }

      const response = await getMermaidList(targetParams);
      if (response.data) {
        // Handle Spring Page response structure
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
      Message.error("加载列表失败");
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch Groups for Select Option
  const fetchGroups = async () => {
      try {
          const res = await getGroupList({ type: 'mermaid', pageSize: 1000 });
          const groups = res.data.content || [];
          setGroupOptions(groups.map((g: any) => ({
              label: g.label,
              value: g.name
          })));
      } catch (error) {
          console.error("Fetch groups failed", error);
      }
  };

  // Search Handler
  const handleSearch = (values: any) => {
    // Map mapName/diagramName if needed, but here we use keyWord
    setSearchParams((prev) => ({ ...prev, ...values }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Pagination Handler
  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(
      searchParams,
      nextPagination.pageSize,
      nextPagination.current
    );
  };

  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330;
      const newHeight = Math.max(100, windowHeight - otherElementsHeight);
      setTableScrollHeight(newHeight);
    };
    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    return () => window.removeEventListener('resize', calculateTableHeight);
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, [searchParams, pagination.current, pagination.pageSize]); 

  // Watch group selection
  useEffect(() => {
    // Reset page to 1 on group change
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchTableData(searchParams, pagination.pageSize, 1);
  }, [selectedGroupKeys]);

  // Actions
  const handleAdd = () => {
    setCurrentRecord(null);
    setAddModalVisible(true);
  };

  const handleAddConfirm = async (values: any) => {
    try {
      await createMermaidDiagram(values);
      Message.success("创建成功");
      setAddModalVisible(false);
      fetchTableData();
    } catch (error: any) {
      Message.error("创建失败");
    }
  };

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setEditModalVisible(true);
  };

  const handleEditConfirm = async (values: any) => {
    try {
      if (currentRecord) {
        await updateMermaidDiagram(currentRecord.id, values);
        Message.success("更新成功");
        setEditModalVisible(false);
        fetchTableData();
      }
    } catch (error: any) {
      Message.error("更新失败");
    }
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除 "${record.diagramName}" 吗？`,
      onOk: async () => {
        try {
          await deleteMermaidDiagram(record.id);
          Message.success("删除成功");
          fetchTableData();
        } catch (error) {
          Message.error("删除失败");
        }
      },
    });
  };

  const handleDraw = (record: any) => {
    navigate(`/frame/mermaid-mgr/${record.id}`);
  };

  const handleDetail = (record: any) => {
      // Simple detail handling or navigation
      Modal.info({
          title: record.diagramName,
          content: (
              <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <p>{record.description}</p>
                  <pre>{record.diagramData}</pre>
              </div>
          ),
          width: 800
      });
  };

  // Columns
  const columns = [
    {
      title: "名称",
      dataIndex: "diagramName",
      key: "diagramName",
      render: (text: string, record: any) => (
          <Button type="text" style={{padding: 0}} onClick={() => handleDetail(record)}>{text}</Button>
      )
    },
    {
      title: "分组",
      dataIndex: "groupLabel",
      key: "groupLabel",
      width: 120,
      align: 'center' as const,
      render: (text: string) => {
        const colors = ['red', 'orangered', 'orange', 'gold', 'lime',
                        'green', 'cyan', 'blue', 'arcoblue', 'purple',
                        'pinkpurple', 'magenta'];
        const colorIndex = text ? text.split('').reduce((acc, char) =>
                            acc + char.charCodeAt(0), 0) % colors.length : 0;
        return <Tag bordered color={colors[colorIndex]}>{text || '未分类'}</Tag>;
      }
    },
    {
      title: "创建人",
      dataIndex: "createUserName",
      key: "createUserName",
      width: 120,
      render: (name: string, record: any) => (
        <UserAvatar name={name || record?.createUser || ""} showName />
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updateDate",
      key: "updateDate",
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: "操作",
      width: 120,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Dropdown
          position="bl"
          droplist={
            <Menu
              onClickMenuItem={(key) => {
                switch (key) {
                  case "detail":
                    handleDetail(record);
                    break;
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
              <Menu.Item key="detail">
                <IconEye style={{ marginRight: 5 }} />
                详情
              </Menu.Item>
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

  // Forms
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "keyWord",
      label: "关键字",
      type: "input",
      placeholder: "搜索名称",
      span: 9,
    },
  ];

  const formConfig: FormFieldConfig[] = [
    {
      field: "diagramName",
      label: "名称",
      type: "input",
      required: true,
      rules: [{ required: true, message: "请输入名称" }],
    },
    {
      field: "group",
      label: "分组",
      type: "select",
      placeholder: "请选择分组",
      options: groupOptions,
      allowClear: true,
    },
    {
      field: "description", 
      label: "描述",
      type: "textarea",
    },
  ];

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      formFields={searchFormFields}
      onSearch={handleSearch}
    />
  );

  return (
    <div className="mermaid-mgr-page">
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
          showTree: true,
          treeContent: (
             <GroupTree 
                type="mermaid"
                selectedKeys={selectedGroupKeys} 
                onSelect={(keys) => {
                   if (keys.includes('all')) setSelectedGroupKeys([]);
                   else setSelectedGroupKeys(keys);
                }} 
             />
          ),
          tableProps: {
              onRow: (record: any) => ({
                  onDoubleClick: () => handleDetail(record)
              })
          }
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <AddEditModal
        visible={addModalVisible}
        isEdit={false}
        record={currentRecord || undefined}
        loading={tableLoading}
        title="创建思维图"
        formConfig={formConfig}
        onOk={handleAddConfirm}
        onCancel={() => setAddModalVisible(false)}
      />

      <AddEditModal
        visible={editModalVisible}
        isEdit={true}
        record={currentRecord || undefined}
        loading={tableLoading}
        title="编辑思维图"
        formConfig={formConfig}
        onOk={handleEditConfirm}
        onCancel={() => setEditModalVisible(false)}
      />
    </div>
  );
};

export default MermaidMgrPage;

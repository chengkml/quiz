/**
 * DataManager 高级示例
 * 展示：
 * - 复杂的表单验证
 * - 选项卡编辑
 * - 自定义卡片渲染
 * - 后端 API 集成
 * - 高级搜索过滤
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Layout,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Message,
  Modal,
  Grid,
  Card as ArcoCard,
  Badge,
  Tag,
  Avatar,
  Tree,
} from "@arco-design/web-react";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconDelete,
  IconEye,
} from "@arco-design/web-react/icon";
import FilterForm from "../../FilterForm";
import {
  CardActions,
  DetailFieldConfig,
  FormFieldConfig,
  PaginationConfig,
  TabConfig,
} from "../../types/types";
import { formatDate, formatRelativeTime } from "../../utils/utils";
import { AddEditModal, DataManager, DetailModal } from "../index";

const { Content } = Layout;
const { Row, Col } = Grid;

const treeData = [
  {
    title: "所有产品",
    key: "all",
    children: [
      {
        title: "电子产品",
        key: "electronics",
      },
      {
        title: "配件",
        key: "accessories",
      },
      {
        title: "软件",
        key: "software",
      },
    ],
  },
];

/**
 * 产品管理系统 - 完整示例
 */

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "discontinued";
  image: string;
  tags: string[];
  supplier: string;
  createDate: string;
  updateDate: string;
  creator: string;
  details?: {
    specifications?: string;
    warranty?: string;
    reviews?: number;
  };
}

const mockProducts: Product[] = [
  {
    id: 1,
    name: "笔记本电脑",
    sku: "LAPTOP-001",
    description: "高性能商务笔记本，配备最新处理器",
    category: "electronics",
    price: 5999,
    stock: 50,
    status: "active",
    image: "https://via.placeholder.com/150",
    tags: ["电子产品", "热销"],
    supplier: "供应商A",
    createDate: "2024-01-10",
    updateDate: "2024-01-18",
    creator: "张三",
    details: {
      specifications: "Intel i7, 16GB RAM, 512GB SSD",
      warranty: "2年",
      reviews: 156,
    },
  },
  {
    id: 2,
    name: "无线鼠标",
    sku: "MOUSE-001",
    description: "精准定位，舒适手感",
    category: "accessories",
    price: 199,
    stock: 200,
    status: "active",
    image: "https://via.placeholder.com/150",
    tags: ["配件", "新品"],
    supplier: "供应商B",
    createDate: "2024-01-15",
    updateDate: "2024-01-18",
    creator: "李四",
  },
];

const AdvancedExample: React.FC = () => {
  const filterFormRef = useRef(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // 模态框状态
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Product | null>(null);
  const [selectedKeys, setSelectedKeys] = useState(["all"]);

  // 分页状态
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 6,
    total: mockProducts.length,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
    pageSizeOptions: [6, 12, 24],
  });

  // 模拟 API 调用
  const fetchProducts = useCallback(async (params?: any) => {
    setSearchLoading(true);
    try {
      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = [...mockProducts];

      if (params?.name) {
        filtered = filtered.filter((item) =>
          item.name.toLowerCase().includes(params.name.toLowerCase())
        );
      }
      if (params?.category && params.category !== "") {
        filtered = filtered.filter((item) => item.category === params.category);
      }
      if (params?.status && params.status !== "") {
        filtered = filtered.filter((item) => item.status === params.status);
      }
      if (params?.minPrice !== undefined) {
        filtered = filtered.filter((item) => item.price >= params.minPrice);
      }
      if (params?.maxPrice !== undefined) {
        filtered = filtered.filter((item) => item.price <= params.maxPrice);
      }

      setProducts(filtered);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filtered.length,
      }));
    } catch (error) {
      Message.error("搜索失败，请重试");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // 表单字段配置（带复杂验证）
  const formConfig: FormFieldConfig[] = [
    {
      field: "name",
      label: "产品名称",
      type: "input",
      required: true,
      placeholder: "请输入产品名称",
      rules: [
        { required: true, message: "请输入产品名称" },
        { min: 2, message: "产品名称至少2个字符" },
        { max: 100, message: "产品名称不超过100个字符" },
      ],
    },
    {
      field: "sku",
      label: "SKU",
      type: "input",
      required: true,
      rules: [
        { required: true, message: "请输入SKU" },
        {
          pattern: /^[A-Z0-9-]+$/,
          message: "SKU只能包含大写字母、数字和连字符",
        },
      ],
    },
    {
      field: "description",
      label: "产品描述",
      type: "textarea",
      required: true,
      rules: [
        { required: true, message: "请输入产品描述" },
        { min: 10, message: "产品描述至少10个字符" },
      ],
    },
    {
      field: "category",
      label: "产品分类",
      type: "select",
      required: true,
      options: [
        { label: "电子产品", value: "electronics" },
        { label: "配件", value: "accessories" },
        { label: "软件", value: "software" },
        { label: "其他", value: "other" },
      ],
    },
    {
      field: "price",
      label: "价格",
      type: "number",
      required: true,
      rules: [{ min: 0, message: "价格不能为负数" }],
    },
    {
      field: "stock",
      label: "库存",
      type: "number",
      required: true,
      rules: [{ min: 0, message: "库存不能为负数" }],
    },
    {
      field: "status",
      label: "状态",
      type: "select",
      options: [
        { label: "活跃", value: "active" },
        { label: "禁用", value: "inactive" },
        { label: "下架", value: "discontinued" },
      ],
    },
    {
      field: "supplier",
      label: "供应商",
      type: "input",
    },
  ];

  // 详情字段配置
  const detailFields: DetailFieldConfig[] = [
    { key: "name", label: "产品名称", dataIndex: "name" },
    { key: "sku", label: "SKU", dataIndex: "sku" },
    { key: "description", label: "产品描述", dataIndex: "description" },
    { key: "category", label: "分类", dataIndex: "category" },
    {
      key: "price",
      label: "价格",
      dataIndex: "price",
      render: (value) => `¥${value}`,
    },
    { key: "stock", label: "库存", dataIndex: "stock" },
    {
      key: "status",
      label: "状态",
      dataIndex: "status",
      type: "tag",
      render: (value) => {
        const statusMap: any = {
          active: "活跃",
          inactive: "禁用",
          discontinued: "下架",
        };
        return statusMap[value] || value;
      },
    },
    { key: "supplier", label: "供应商", dataIndex: "supplier" },
    { key: "creator", label: "创建者", dataIndex: "creator" },
    {
      key: "createDate",
      label: "创建时间",
      dataIndex: "createDate",
      render: (value) => formatDate(value),
    },
  ];

  // 选项卡配置
  const editTabs: TabConfig[] = [
    {
      key: "basic",
      title: "基本信息",
      content: (
        <Form form={Form.useForm()[0]} layout="vertical">
          {formConfig.slice(0, 4).map((field) => (
            <Form.Item
              key={field.field}
              field={field.field}
              label={field.label}
              required={field.required}
            >
              {field.type === "textarea" ? (
                <Input.TextArea placeholder={field.placeholder} rows={4} />
              ) : field.type === "select" ? (
                <Select
                  placeholder={field.placeholder}
                  options={field.options}
                />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}
        </Form>
      ),
    },
    {
      key: "inventory",
      title: "库存管理",
      content: (
        <Form form={Form.useForm()[0]} layout="vertical">
          {formConfig.slice(4, 6).map((field) => (
            <Form.Item
              key={field.field}
              field={field.field}
              label={field.label}
            >
              <InputNumber placeholder={field.placeholder} />
            </Form.Item>
          ))}
        </Form>
      ),
    },
    {
      key: "other",
      title: "其他信息",
      content: (
        <Form form={Form.useForm()[0]} layout="vertical">
          {formConfig.slice(6).map((field) => (
            <Form.Item
              key={field.field}
              field={field.field}
              label={field.label}
            >
              {field.type === "select" ? (
                <Select
                  placeholder={field.placeholder}
                  options={field.options}
                />
              ) : (
                <Input placeholder={field.placeholder} />
              )}
            </Form.Item>
          ))}
        </Form>
      ),
    },
  ];

  // 表格列配置
  const tableColumns = [
    {
      title: "产品名称",
      dataIndex: "name",
      width: 150,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      width: 120,
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 100,
      render: (text: string) => {
        const categoryMap: any = {
          electronics: "电子产品",
          accessories: "配件",
          software: "软件",
        };
        return categoryMap[text] || text;
      },
    },
    {
      title: "价格",
      dataIndex: "price",
      width: 100,
      render: (value: number) => `¥${value}`,
    },
    {
      title: "库存",
      dataIndex: "stock",
      width: 80,
      render: (value: number) => (
        <Badge
          count={value}
          style={{
            backgroundColor:
              value > 50 ? "#52c41a" : value > 0 ? "#faad14" : "#f5222d",
          }}
        />
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (value: string) => {
        const statusColorMap: any = {
          active: "green",
          inactive: "orange",
          discontinued: "red",
        };
        const statusLabelMap: any = {
          active: "活跃",
          inactive: "禁用",
          discontinued: "下架",
        };
        return <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createDate",
      width: 120,
      render: (value: string) => formatRelativeTime(value),
    },
  ];

  // 搜索表单字段配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: "name",
      label: "产品名称",
      type: "input",
      placeholder: "搜索产品名称",
      span: 8,
    },
    {
      field: "category",
      label: "产品分类",
      type: "select",
      placeholder: "选择分类",
      options: [
        { label: "电子产品", value: "electronics" },
        { label: "配件", value: "accessories" },
        { label: "软件", value: "software" },
        { label: "其他", value: "other" },
      ],
      span: 8,
    },
    {
      field: "status",
      label: "产品状态",
      type: "select",
      placeholder: "选择状态",
      options: [
        { label: "活跃", value: "active" },
        { label: "禁用", value: "inactive" },
        { label: "下架", value: "discontinued" },
      ],
      span: 8,
    },
    {
      field: "minPrice",
      label: "最低价格",
      type: "number",
      placeholder: "输入最低价格",
      span: 8,
    },
    {
      field: "maxPrice",
      label: "最高价格",
      type: "number",
      placeholder: "输入最高价格",
      span: 8,
    },
  ];

  // 搜索表单
  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={{
        name: "",
        category: "",
        status: "",
        minPrice: undefined,
        maxPrice: undefined,
      }}
      formFields={searchFormFields}
      onSearch={(values) => {
        // 过滤掉空值
        const filterValues = Object.fromEntries(
          Object.entries(values).filter(([_, v]) => v !== "" && v !== undefined)
        );
        fetchProducts(filterValues);
      }}
      onReset={() => {
        setProducts(mockProducts);
        setPagination((prev) => ({
          ...prev,
          current: 1,
          total: mockProducts.length,
        }));
        Message.info("已重置筛选条件");
      }}
      fieldLabelMap={{
        name: "产品名称",
        category: "产品分类",
        status: "产品状态",
        minPrice: "最低价格",
        maxPrice: "最高价格",
      }}
      min={3}
    />
  );

  // 自定义卡片渲染
  const renderCustomCard = (
    item: Product,
    index: number,
    actions: CardActions
  ) => (
    <ArcoCard
      hoverable
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 8px 0" }}>{item.name}</h3>
          <p style={{ margin: "0 0 12px 0", color: "rgba(0,0,0,0.65)" }}>
            SKU: {item.sku}
          </p>
        </div>
        <Badge
          count={item.stock}
          style={{
            backgroundColor:
              item.stock > 50
                ? "#52c41a"
                : item.stock > 0
                ? "#faad14"
                : "#f5222d",
          }}
        />
      </div>

      <p style={{ margin: "0 0 12px 0", flex: 1, color: "rgba(0,0,0,0.65)" }}>
        {item.description}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <span
          style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}
        >
          ¥{item.price}
        </span>
        <Avatar size={32}>{item.creator.charAt(0)}</Avatar>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {item.tags?.map((tag) => (
          <Tag key={tag} size="small" color="blue">
            {tag}
          </Tag>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "flex-end",
          paddingTop: "12px",
          borderTop: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => actions.onView?.(item)}
        />
        <Button
          type="text"
          size="small"
          icon={<IconEdit />}
          onClick={() => actions.onEdit?.(item)}
        />
        <Button
          type="text"
          status="danger"
          size="small"
          icon={<IconDelete />}
          onClick={() => actions.onDelete?.(item)}
        />
      </div>
    </ArcoCard>
  );

  // 操作处理
  const handleAdd = () => {
    setIsEdit(false);
    setCurrentRecord(null);
    setAddEditVisible(true);
  };

  const handleEdit = (record: Product) => {
    setIsEdit(true);
    setCurrentRecord(record);
    setAddEditVisible(true);
  };

  const handleDelete = (record: Product) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除产品"${record.name}"吗？`,
      onOk: () => {
        setProducts((prev) => prev.filter((item) => item.id !== record.id));
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }));
        Message.success("删除成功");
      },
    });
  };

  const handleView = (record: Product) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isEdit && currentRecord) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === currentRecord.id ? { ...item, ...values } : item
          )
        );
        Message.success("编辑成功");
      } else {
        const newProduct: Product = {
          id: Math.max(...products.map((item) => item.id), 0) + 1,
          ...values,
          createDate: new Date().toISOString().split("T")[0],
          creator: "当前用户",
          image: "https://via.placeholder.com/150",
          tags: [],
        };
        setProducts((prev) => [newProduct, ...prev]);
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
        Message.success("新增成功");
      }

      setAddEditVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DataManager
          data={products.slice(
            (pagination.current - 1) * pagination.pageSize,
            pagination.current * pagination.pageSize
          )}
          loading={searchLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          actions={{
            onAdd: handleAdd,
            onEdit: handleEdit,
            onDelete: handleDelete,
            onView: handleView,
          }}
          config={{
            showModeToggle: true,
            displayMode: "shortCard",
            filterContent,
            showTree: true,
            showTreeFilter: true,
            treeData: treeData,
            selectedTreeKeys: selectedKeys,
            onTreeSelect: (keys) => {
              setSelectedKeys(keys);
              const key = keys[0];
              if (key === "all") {
                fetchProducts();
              } else {
                fetchProducts({ category: key });
              }
            },
            renderShortCard: renderCustomCard,
            tableColumns,
            longCardConfig: {
              title: (item: Product) => item.name,
              subtitle: (item: Product) => `¥${item.price}`,
              description: (item: Product) => item.description,
              image: (item: Product) => item.image,
              showFields: ["stock", "supplier"],
              fieldLabel: { stock: "库存", supplier: "供应商" },
            },
          }}
          tableScrollHeight={500}
          cardColumns={3}
          cardGutter={16}
          cardSize="medium"
        />

        <AddEditModal
          visible={addEditVisible}
          isEdit={isEdit}
          record={currentRecord || undefined}
          loading={loading}
          title={isEdit ? "编辑产品" : "新增产品"}
          formConfig={formConfig}
          onOk={handleSubmit}
          onCancel={() => {
            setAddEditVisible(false);
            setIsEdit(false);
            setCurrentRecord(null);
          }}
        />

        <DetailModal
          visible={detailVisible}
          record={currentRecord || undefined}
          title="产品详情"
          detailFields={detailFields}
          onCancel={() => {
            setDetailVisible(false);
            setCurrentRecord(null);
          }}
        />
    </>
  );
};

export default AdvancedExample;

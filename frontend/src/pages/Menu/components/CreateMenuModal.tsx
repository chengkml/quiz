import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  TreeSelect,
  Button,
  Message,
  Space,
} from '@arco-design/web-react';
import { MenuCreateDto, MenuTreeDto, MenuType, MenuExtConf } from '../../../types/menu';
import { menuService } from '../../../services/menuService';

const FormItem = Form.Item;
const Option = Select.Option;

interface CreateMenuModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateMenuModal: React.FC<CreateMenuModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [menuTree, setMenuTree] = useState<MenuTreeDto[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);

  // 菜单类型选项
  const menuTypeOptions = [
    { label: '目录', value: MenuType.DIRECTORY },
    { label: '菜单', value: MenuType.MENU },
    { label: '按钮', value: MenuType.BUTTON },
  ];

  // 状态选项
  const statusOptions = [
    { label: '生效', value: 1 },
    { label: '失效', value: 0 },
  ];

  // 获取菜单树数据
  const fetchMenuTree = async () => {
    try {
      const response = await menuService.getMenuTree();
      if (response.success) {
        setMenuTree(response.data);
        // 转换为TreeSelect需要的格式
        const convertToTreeData = (nodes: MenuTreeDto[]): any[] => {
          return nodes.map(node => ({
            key: node.menuName,
            value: node.menuName,
            title: node.menuLabel,
            children: node.children && node.children.length > 0 
              ? convertToTreeData(node.children) 
              : undefined,
          }));
        };
        const converted = convertToTreeData(response.data);
        // 添加根节点选项
        setTreeData([...converted]);
      }
    } catch (error) {
      console.error('获取菜单树失败:', error);
    }
  };

  // 检查菜单ID是否存在
  const checkMenuNameExists = async (menuName: string): Promise<boolean> => {
    try {
      const response = await menuService.checkMenuIdExists(menuName);
      return response.success && response.data.exists;
    } catch (error) {
      console.error('检查菜单ID失败:', error);
      return false;
    }
  };

  // 检查菜单名称是否存在
  const checkMenuLabelExists = async (menuLabel: string): Promise<boolean> => {
    try {
      const response = await menuService.checkMenuNameExists(menuLabel);
      return response.success && response.data.exists;
    } catch (error) {
      console.error('检查菜单名称失败:', error);
      return false;
    }
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      
      // 检查菜单ID是否重复
      const idExists = await checkMenuNameExists(values.menuName);
      if (idExists) {
        Message.error('菜单ID已存在，请使用其他ID');
        return;
      }

      // 检查菜单名称是否重复
      const nameExists = await checkMenuLabelExists(values.menuLabel);
      if (nameExists) {
        Message.error('菜单名称已存在，请使用其他名称');
        return;
      }

      setLoading(true);
      
      // 构建菜单扩展配置
      const menuExtConf: MenuExtConf = {};
      if (values.path) {
        menuExtConf.path = values.path;
      }

      const menuData: MenuCreateDto = {
        menuId: values.menuName,
        menuName: values.menuName,
        menuLabel: values.menuLabel,
        menuType: values.menuType,
        parentId: values.parentId || null,
        icon: values.icon || null,
        seq: values.seq || 999,
        visible: true,
        keepAlive: false,
        menuExtConf: Object.keys(menuExtConf).length > 0 ? JSON.stringify(menuExtConf) : undefined,
        menuDescr: values.menuDescr || null,
      };

      const response = await menuService.createMenu(menuData);
      if (response.success) {
        Message.success('创建菜单成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '创建菜单失败');
      }
    } catch (error) {
      console.error('创建菜单失败:', error);
      Message.error('创建菜单失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
  };

  // 监听visible变化，获取菜单树数据
  useEffect(() => {
    if (visible) {
      fetchMenuTree();
      // 设置默认值
      form.setFieldsValue({
        menuType: MenuType.MENU,
        seq: 999,
      });
    }
  }, [visible, form]);

  return (
    <Modal
      title="新增菜单"
      visible={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            确定
          </Button>
        </Space>
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
      >
        <FormItem
          field="menuName"
          label="菜单ID"
          rules={[
            { required: true, message: '请输入菜单ID' },
            { 
              pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, 
              message: '菜单ID必须以字母开头，只能包含字母、数字、下划线和横线' 
            },
          ]}
        >
          <Input placeholder="请输入菜单ID" />
        </FormItem>

        <FormItem
          field="menuLabel"
          label="菜单名称"
          rules={[{ required: true, message: '请输入菜单名称' }]}
        >
          <Input placeholder="请输入菜单名称" />
        </FormItem>

        <FormItem
          field="menuType"
          label="菜单类型"
          rules={[{ required: true, message: '请选择菜单类型' }]}
        >
          <Select placeholder="请选择菜单类型">
            {menuTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </FormItem>

        <FormItem
          field="parentId"
          label="父级菜单"
        >
          <TreeSelect
            placeholder="请选择父级菜单"
            treeData={treeData}
            allowClear
          />
        </FormItem>

        <FormItem
          field="path"
          label="路由路径"
          tooltip="菜单类型为'菜单'时必填"
        >
          <Input placeholder="请输入路由路径，如：/system/user" />
        </FormItem>



        <FormItem
          field="icon"
          label="图标"
        >
          <Input placeholder="请输入图标名称" />
        </FormItem>

        <FormItem
          field="seq"
          label="排序号"
          rules={[{ required: true, message: '请输入排序号' }]}
        >
          <InputNumber
            placeholder="请输入排序号"
            min={0}
            max={9999}
            style={{ width: '100%' }}
          />
        </FormItem>



        <FormItem
          field="menuDescr"
          label="备注"
        >
          <Input.TextArea
            placeholder="请输入备注"
            rows={3}
            maxLength={500}
            showWordLimit
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default CreateMenuModal;
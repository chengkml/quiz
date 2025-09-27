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
import { MenuDto, MenuUpdateDto, MenuTreeDto, MenuType, MenuExtConf } from '../../../types/menu';
import { menuService } from '../../../services/menuService';

const FormItem = Form.Item;
const Option = Select.Option;

interface EditMenuModalProps {
  visible: boolean;
  menu: MenuDto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditMenuModal: React.FC<EditMenuModalProps> = ({
  visible,
  menu,
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
        // 转换为TreeSelect需要的格式，并过滤掉当前菜单及其子菜单
        const convertToTreeData = (nodes: MenuTreeDto[], excludeId?: string): any[] => {
          return nodes
            .filter(node => node.menuName !== excludeId)
            .map(node => ({
              key: node.menuName,
              value: node.menuName,
              title: node.menuLabel,
              children: node.children && node.children.length > 0 
                ? convertToTreeData(node.children, excludeId) 
                : undefined,
            }))
            .filter(node => node.children === undefined || node.children.length > 0);
        };
        const converted = convertToTreeData(response.data, menu?.menuName);
        // 添加根节点选项
        setTreeData([...converted]);
      }
    } catch (error) {
      console.error('获取菜单树失败:', error);
    }
  };

  // 检查菜单名称是否存在（排除当前菜单）
  const checkMenuLabelExists = async (menuLabel: string): Promise<boolean> => {
    try {
      if (menu && menuLabel === menu.menuLabel) {
        return false; // 名称未改变，不算重复
      }
      const response = await menuService.checkMenuNameExists(menuLabel);
      return response.success && response.data.exists;
    } catch (error) {
      console.error('检查菜单名称失败:', error);
      return false;
    }
  };

  // 表单提交
  const handleSubmit = async () => {
    if (!menu) return;
    
    try {
      const values = await form.validate();
      
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

      const menuData: MenuUpdateDto = {
        menuName: menu.menuName,
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

      const response = await menuService.updateMenu(menu.menuName, menuData);
      if (response.success) {
        Message.success('更新菜单成功');
        onSuccess();
      } else {
        Message.error(response.message || '更新菜单失败');
      }
    } catch (error) {
      console.error('更新菜单失败:', error);
      Message.error('更新菜单失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    if (menu) {
      let pathValue = '';
      if (menu.menuExtConf) {
        try {
          const extConf = typeof menu.menuExtConf === 'string' ? JSON.parse(menu.menuExtConf) : menu.menuExtConf;
          pathValue = extConf?.path || '';
        } catch (error) {
          console.error('解析menuExtConf失败:', error);
        }
      }
      
      form.setFieldsValue({
        menuLabel: menu.menuLabel,
        menuType: menu.menuType,
        parentId: menu.parentId || '',
        path: pathValue,
        icon: menu.icon || '',
        seq: menu.seq,
        status: menu.status,
        menuDescr: menu.menuDescr || '',
      });
    }
  };

  // 监听visible和menu变化，设置表单值
  useEffect(() => {
    if (visible && menu) {
      fetchMenuTree();
      
      let pathValue = '';
      if (menu.menuExtConf) {
        try {
          const extConf = typeof menu.menuExtConf === 'string' ? JSON.parse(menu.menuExtConf) : menu.menuExtConf;
          pathValue = extConf?.path || '';
        } catch (error) {
          console.error('解析menuExtConf失败:', error);
        }
      }
      
      form.setFieldsValue({
        menuLabel: menu.menuLabel,
        menuType: menu.menuType,
        parentId: menu.parentId || '',
        path: pathValue,
        icon: menu.icon || '',
        seq: menu.seq,
        status: menu.status,
        menuDescr: menu.menuDescr || '',
      });
    }
  }, [visible, menu, form]);

  return (
    <Modal
      title="编辑菜单"
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
        <FormItem label="菜单ID">
          <Input value={menu?.menuName} disabled />
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

export default EditMenuModal;
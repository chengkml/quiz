import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { updateCategory, getAllCategories } from '../api';
import { getAllSubjects } from '../../Subject/api';

interface EditCategoryModalProps {
  visible: boolean;
  record: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  visible,
  record,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [subjects, setSubjects] = React.useState([]);
  const [categories, setCategories] = React.useState([]);

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const response = await getAllSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('获取学科列表失败:', error);
    }
  };

  // 获取分类列表（用于父分类选择）
  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      // 过滤掉当前分类，避免选择自己作为父分类
      const filteredCategories = (response.data || []).filter((cat: any) => cat.id !== record?.id);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  useEffect(() => {
    if (visible && record) {
      fetchSubjects();
      fetchCategories();
      
      // 设置表单初始值
      form.setFieldsValue({
        id: record.id,
        name: record.name,
        subjectId: record.subjectId,
        parentId: record.parentId,
        level: record.level,
        description: record.description
      });
    }
  }, [visible, record]);

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      await updateCategory(values);
      Message.success('分类更新成功');
      onSuccess();
    } catch (error) {
      console.error('更新分类失败:', error);
      Message.error('更新分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="编辑分类"
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
    >
      <div style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
        <Form
            form={form}
            layout="vertical"
        >
          <Form.Item field="id" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          <Form.Item
              label="分类名称"
              field="name"
              rules={[
                { required: true, message: '请输入分类名称' },
                { maxLength: 50, message: '分类名称不能超过50个字符' }
              ]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
              label="所属学科"
              field="subjectId"
              rules={[{ required: true, message: '请选择所属学科' }]}
          >
            <Select placeholder="请选择所属学科">
              {subjects.map((subject: any) => (
                  <Select.Option key={subject.id} value={subject.id}>
                    {subject.name}
                  </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
              label="父分类"
              field="parentId"
          >
            <Select placeholder="请选择父分类（可选）" allowClear>
              {categories.map((category: any) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
              label="分类级别"
              field="level"
              rules={[
                { required: true, message: '请输入分类级别' },
                { type: 'number', min: 1, max: 10, message: '分类级别必须在1-10之间' }
              ]}
          >
            <InputNumber
                placeholder="请输入分类级别"
                min={1}
                max={10}
                style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
              label="分类描述"
              field="description"
              rules={[{ maxLength: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
                placeholder="请输入分类描述（可选）"
                rows={3}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default EditCategoryModal;
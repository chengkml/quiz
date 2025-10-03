import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { createCategory, getAllCategories } from '../api';
import { getAllSubjects } from '../../Subject/api';

interface AddCategoryModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  visible,
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
      setCategories(response.data || []);
    } catch (error) {
      console.error('获取分类列表失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      fetchCategories();
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      
      await createCategory(values);
      Message.success('分类创建成功');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('创建分类失败:', error);
      Message.error('创建分类失败');
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
      title="新增分类"
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          level: 1
        }}
      >
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
    </Modal>
  );
};

export default AddCategoryModal;
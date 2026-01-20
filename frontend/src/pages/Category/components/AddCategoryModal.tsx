import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { createCategory, getCategoryList } from '../api';
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
  const [categoryLoading, setCategoryLoading] = React.useState(false);

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const response = await getAllSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('获取学科列表失败:', error);
    }
  };

  // 根据学科ID获取分类列表（用于父分类选择）
  const fetchCategoriesBySubject = async (subjectId: string) => {
    if (!subjectId) {
      setCategories([]);
      return;
    }
    
    try {
      setCategoryLoading(true);
      const response = await getCategoryList({ subjectId, pageNum: 0, pageSize: 1000 });
      setCategories(response.data?.content || []);
      // 清空父分类选择，因为学科已经改变
      form.setFieldValue('parentId', undefined);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      Message.error('获取分类列表失败');
    } finally {
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchSubjects();
      // 清空表单和状态
      form.resetFields();
      setCategories([]);
    }
  }, [visible]);

  const handleSubjectChange = (subjectId: string) => {
    fetchCategoriesBySubject(subjectId);
  };

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
    setCategories([]);
    onCancel();
  };

  return (
    <Modal
      title="新增分类"
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
            <Select 
              placeholder="请选择所属学科" 
              showSearch 
              onChange={handleSubjectChange}
              filterOption={(inputValue, option) =>
                  option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                  option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
              }
            >
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
            <Select 
              placeholder="请先选择所属学科" 
              allowClear 
              showSearch 
              loading={categoryLoading}
              filterOption={(inputValue, option) =>
                  option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                  option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {categories.map((category: any) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
              ))}
            </Select>
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

export default AddCategoryModal;
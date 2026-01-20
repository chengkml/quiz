import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Message } from '@arco-design/web-react';
import { updateCategory, getCategoryList } from '../api';
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
  const [categoriesLoading, setCategoriesLoading] = React.useState(false);

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
      setCategoriesLoading(true);
      const response = await getCategoryList({ subjectId, pageNum: 0, pageSize: 1000 });
      // 过滤掉当前分类，避免选择自己作为父分类
      const filteredCategories = (response.data?.content || []).filter((cat: any) => cat.id !== record?.id);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('获取分类列表失败:', error);
      Message.error('获取分类列表失败');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 处理学科变化
  const handleSubjectChange = (subjectId: string) => {
    // 清空父分类选择
    form.setFieldValue('parentId', undefined);
    // 根据新的学科ID加载分类
    fetchCategoriesBySubject(subjectId);
  };

  useEffect(() => {
    if (visible && record) {
      fetchSubjects();
      
      // 设置表单初始值
      form.setFieldsValue({
        id: record.id,
        name: record.name,
        subjectId: record.subjectId,
        parentId: record.parentId,
        description: record.description
      });
      
      // 根据记录中的学科ID加载分类
      if (record.subjectId) {
        fetchCategoriesBySubject(record.subjectId);
      }
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
    setCategories([]);
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
            <Select placeholder="请选择所属学科" showSearch filterOption={(inputValue, option) =>
                option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
            } onChange={handleSubjectChange}>
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
            <Select placeholder="请先选择所属学科" allowClear showSearch filterOption={(inputValue, option) =>
                option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
            } loading={categoriesLoading}>
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

export default EditCategoryModal;
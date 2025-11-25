import React, { useEffect } from 'react';
import { Modal, Form, Input, Message } from '@arco-design/web-react';
import { updateDocInfo, getDocInfoById } from '../api';

interface EditDocInfoModalProps {
  visible: boolean;
  record: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditDocInfoModal: React.FC<EditDocInfoModalProps> = ({
  visible,
  record,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [docDetail, setDocDetail] = React.useState<any>(null);

  // 加载文档详情
  const fetchDocDetail = async (id: string) => {
    if (!id) return;
    try {
      const response = await getDocInfoById(id);
      setDocDetail(response.data);
      form.setFieldsValue({
        id: response.data.id,
        fileName: response.data.fileName,
        filePath: response.data.filePath,
        remark: response.data.remark
      });
    } catch (error) {
      console.error('获取文档详情失败:', error);
      Message.error('获取文档详情失败');
    }
  };

  useEffect(() => {
    if (visible && record?.id) {
      fetchDocDetail(record.id);
    }
  }, [visible, record?.id]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // 更新文档信息
      await updateDocInfo({
        id: values.id,
        fileName: values.fileName,
        filePath: values.filePath,
        remark: values.remark
      });

      Message.success('文档更新成功');
      onSuccess();
      handleCancel();
    } catch (error: any) {
      Message.error(error.message || '文档更新失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    form.resetFields();
    setDocDetail(null);
    onCancel();
  };

  return (
    <Modal
      title="编辑文档"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="确认"
      cancelText="取消"
      loading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="文档ID" field="id" hidden>
          <Input />
        </Form.Item>

        {/* 文件名 */}
        <Form.Item
          label="文件名"
          field="fileName"
          rules={[{ required: true, message: '请输入文件名' }]}
        >
          <Input placeholder="请输入文件名" />
        </Form.Item>

        {/* 文件路径 */}
        <Form.Item label="文件路径" field="filePath">
          <Input placeholder="请输入文件路径" />
        </Form.Item>

        {/* 文件MD5（只读显示） */}
        {docDetail && (
          <Form.Item label="文件MD5">
            <Input value={docDetail.fileMd5} disabled />
          </Form.Item>
        )}

        {/* 上传用户（只读显示） */}
        {docDetail && (
          <Form.Item label="上传用户">
            <Input value={docDetail.uploadUser || '--'} disabled />
          </Form.Item>
        )}

        {/* 上传时间（只读显示） */}
        {docDetail && (
          <Form.Item label="上传时间">
            <Input value={docDetail.uploadTime || '--'} disabled />
          </Form.Item>
        )}

        {/* 备注 */}
        <Form.Item label="备注" field="remark">
          <Input.TextArea placeholder="请输入备注信息" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditDocInfoModal;
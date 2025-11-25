import React, { useState } from 'react';
import { Modal, Upload, Message } from '@arco-design/web-react';
import {IconUpload, IconCloseCircle, IconFileImage} from '@arco-design/web-react/icon';
import { uploadDocFile } from '../api';

interface AddDocInfoModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddDocInfoModal: React.FC<AddDocInfoModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // 重置状态
  React.useEffect(() => {
    if (visible) {
      setFile(null);
    }
  }, [visible]);

  // 处理文件上传前的检查
  const beforeUpload = (file: File) => {
    console.log('选择的文件:', file);
    // 检查文件格式是否为docx
    if (!file.name.endsWith('.docx')) {
      Message.error('只支持.docx格式文件');
      return false;
    }
    // 手动保存文件对象
    setFile(file);
    return false; // 阻止自动上传
  };
  
  // 处理文件移除
  const handleRemove = () => {
    setFile(null);
    return true;
  };

  // 移除文件
  const handleRemoveFile = () => {
    setFile(null);
  };

  // 处理提交
  const handleSubmit = async () => {
    try {
      if (!file) {
        Message.error('请上传文件');
        return;
      }
      
      console.log('准备上传文件:', file);
      setLoading(true);
      
      // 上传文档文件
      const response = await uploadDocFile(file);
      console.log('上传响应:', response);

      Message.success('文档上传成功');
      onSuccess();
      handleCancel();
    } catch (error: any) {
      console.error('上传失败:', error);
      Message.error(error.message || '文档上传失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    setFile(null);
    onCancel();
  };

  return (
    <Modal
      title="添加文档"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="确认"
      cancelText="取消"
      loading={loading}
      width={600}
    >
      {/* 文件上传 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>上传文件</label>
          <Upload
            accept=".docx"
            multiple={false}
            beforeUpload={beforeUpload}
            showUploadList={false}
            onRemove={handleRemove}
            customRequest={() => {}}
          >
            {file ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '12px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}>
                <IconFileImage size={24} />
                <span style={{ flex: 1, marginLeft: '8px' }}>{file.name}</span>
                <IconCloseCircle onClick={() => setFile(null)} style={{ cursor: 'pointer' }} />
              </div>
            ) : (
              <div style={{ 
                border: '2px dashed #d9d9d9', 
                borderRadius: '4px', 
                padding: '32px 0', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4096ff';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
              }}>
                <IconUpload size={40} style={{ color: 'var(--color-text-secondary)' }} />
                <p style={{ marginTop: '12px' }}>点击或拖拽文件到此区域上传</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  仅支持 .docx 格式
                </p>
              </div>
            )}
          </Upload>
        </div>
    </Modal>
  );
};

export default AddDocInfoModal;
import React from 'react';
import { Modal } from '@arco-design/web-react';

interface DetailDocInfoModalProps {
  visible: boolean;
  record: any;
  onCancel: () => void;
}

const DetailDocInfoModal: React.FC<DetailDocInfoModalProps> = ({
  visible,
  record,
  onCancel
}) => {
  // 格式化时间显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Modal
      title="文档详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      {record && (
        <div className="detail-content">
          <div className="detail-item">
            <label>文档ID：</label>
            <span>{record.id}</span>
          </div>
          <div className="detail-item">
            <label>文件名：</label>
            <span>{record.fileName}</span>
          </div>
          <div className="detail-item">
            <label>文件路径：</label>
            <span>{record.filePath || '--'}</span>
          </div>
          <div className="detail-item">
            <label>文件MD5：</label>
            <span>{record.fileMd5}</span>
          </div>
          <div className="detail-item">
            <label>上传用户：</label>
            <span>{record.uploadUser || '--'}</span>
          </div>
          <div className="detail-item">
            <label>上传时间：</label>
            <span>{formatDate(record.uploadTime)}</span>
          </div>
          <div className="detail-item">
            <label>备注：</label>
            <span>{record.remark || '--'}</span>
          </div>
          <div className="detail-item">
            <label>创建用户：</label>
            <span>{record.createUser || '--'}</span>
          </div>
          <div className="detail-item">
            <label>创建时间：</label>
            <span>{formatDate(record.createDate)}</span>
          </div>
          <div className="detail-item">
            <label>更新用户：</label>
            <span>{record.updateUser || '--'}</span>
          </div>
          <div className="detail-item">
            <label>更新时间：</label>
            <span>{formatDate(record.updateDate)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DetailDocInfoModal;
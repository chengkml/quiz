import React from 'react';
import { Modal } from '@arco-design/web-react';

interface DetailCategoryModalProps {
  visible: boolean;
  record: any;
  onCancel: () => void;
}

const DetailCategoryModal: React.FC<DetailCategoryModalProps> = ({
  visible,
  record,
  onCancel
}) => {
  return (
    <Modal
      title="分类详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      {record && (
        <div className="detail-content">
          <div className="detail-item">
            <label>分类名称：</label>
            <span>{record.name}</span>
          </div>
          <div className="detail-item">
            <label>所属学科：</label>
            <span>{record.subjectName || '--'}</span>
          </div>
          <div className="detail-item">
            <label>父分类：</label>
            <span>{record.parentName || '--'}</span>
          </div>
          <div className="detail-item">
            <label>分类级别：</label>
            <span>{record.level}</span>
          </div>
          <div className="detail-item">
            <label>分类描述：</label>
            <span>{record.description || '--'}</span>
          </div>
          <div className="detail-item">
            <label>创建人：</label>
            <span>{record.createUser || '--'}</span>
          </div>
          <div className="detail-item">
            <label>创建时间：</label>
            <span>{record.createDate || '--'}</span>
          </div>
          <div className="detail-item">
            <label>更新人：</label>
            <span>{record.updateUser || '--'}</span>
          </div>
          <div className="detail-item">
            <label>更新时间：</label>
            <span>{record.updateDate || '--'}</span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DetailCategoryModal;
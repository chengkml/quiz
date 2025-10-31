import React from 'react';
import { Modal } from '@arco-design/web-react';

interface DetailPromptTemplateModalProps {
  visible: boolean;
  record: any;
  onCancel: () => void;
}

const DetailPromptTemplateModal: React.FC<DetailPromptTemplateModalProps> = ({
  visible,
  record,
  onCancel
}) => {
  return (
    <Modal
      title="提示词模板详情"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      {record && (
        <div className="detail-content">
          <div className="detail-item">
            <label>模板名称：</label>
            <span>{record.name}</span>
          </div>
          <div className="detail-item">
            <label>模板内容：</label>
            <div className="content-display">{record.content}</div>
          </div>
          <div className="detail-item">
            <label>模板描述：</label>
            <span>{record.description || '--'}</span>
          </div>
          <div className="detail-item">
            <label>变量列表：</label>
            <span>{record.variables || '--'}</span>
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

export default DetailPromptTemplateModal;
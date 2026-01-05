import React, { useMemo } from 'react';
import { Card, Grid, Button, Space, Tooltip, Empty } from '@arco-design/web-react';
import { IconEdit, IconDelete, IconEye } from '@arco-design/web-react/icon';
import { CardActions, CardConfig } from '../types';
import './card.less';

interface ShortCardListProps<T = any> {
  data: T[];
  loading?: boolean;
  config?: CardConfig;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  renderCard?: (item: T, index: number, actions: CardActions) => React.ReactNode;
  cardColumns?: number;
  cardGutter?: number;
  cardSize?: 'small' | 'medium' | 'large';
  rowKey?: string | ((record: T, index: number) => string);
}

const { Row, Col } = Grid;

/**
 * 短卡片列表组件
 * 展示为小卡片，适合快速浏览数据
 */
const ShortCardList: React.FC<ShortCardListProps> = ({
  data = [],
  loading = false,
  config = {},
  onEdit,
  onDelete,
  onView,
  renderCard,
  cardColumns = 4,
  cardGutter = 16,
  cardSize = 'small',
  rowKey = 'id',
}) => {
  const getRowKey = (record: any, index: number) => {
    return typeof rowKey === 'function' ? rowKey(record, index) : record[rowKey];
  };

  const cardActions: CardActions = {
    onEdit,
    onDelete,
    onView,
  };

  const cardColorMap = {
    small: 'rgba(15, 23, 42, 0.05)',
    medium: 'rgba(15, 23, 42, 0.08)',
    large: 'rgba(15, 23, 42, 0.1)',
  };

  const cardPaddingMap = {
    small: '12px',
    medium: '16px',
    large: '20px',
  };

  if (data.length === 0 && !loading) {
    return <Empty />;
  }

  const colSpan = 24 / cardColumns;

  return (
    <Row gutter={cardGutter} className="short-card-list">
      {data.map((item, index) => {
        const key = getRowKey(item, index);

        if (renderCard) {
          return (
            <Col key={key} span={colSpan}>
              {renderCard(item, index, cardActions)}
            </Col>
          );
        }

        const { title, subtitle, description, showFields = [] } = config;

        const titleNode = typeof title === 'function' ? title(item) : title || '--';
        const subtitleNode = typeof subtitle === 'function' ? subtitle(item) : subtitle;
        const descriptionNode =
          typeof description === 'function' ? description(item) : description;

        return (
          <Col key={key} span={colSpan}>
            <Card
              className={`short-card short-card-${cardSize}`}
              style={{
                padding: cardPaddingMap[cardSize],
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              hoverable
            >
              <div className="short-card-header">
                <div className="short-card-title">{titleNode}</div>
                {subtitleNode && <div className="short-card-subtitle">{subtitleNode}</div>}
              </div>

              {descriptionNode && (
                <div className="short-card-description">{descriptionNode}</div>
              )}

              {showFields.length > 0 && (
                <div className="short-card-fields">
                  {showFields.map((field) => (
                    <div key={field} className="field-item">
                      <span className="field-label">{config.fieldLabel?.[field] || field}:</span>
                      <span className="field-value">{item[field] || '--'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="short-card-actions">
                <Space>
                  {onView && (
                    <Tooltip content="查看">
                      <Button
                        type="text"
                        size="small"
                        icon={<IconEye />}
                        onClick={() => onView(item)}
                      />
                    </Tooltip>
                  )}
                  {onEdit && (
                    <Tooltip content="编辑">
                      <Button
                        type="text"
                        size="small"
                        icon={<IconEdit />}
                        onClick={() => onEdit(item)}
                      />
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip content="删除">
                      <Button
                        type="text"
                        status="danger"
                        size="small"
                        icon={<IconDelete />}
                        onClick={() => onDelete(item)}
                      />
                    </Tooltip>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default ShortCardList;

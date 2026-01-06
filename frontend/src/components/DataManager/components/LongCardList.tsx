import React from 'react';
import { Card, Grid, Button, Space, Tooltip, Empty, Image } from '@arco-design/web-react';
import { IconEdit, IconDelete, IconEye } from '@arco-design/web-react/icon';
import { CardActions, CardConfig } from '../../types/types';
import '../styles/card.less';

interface LongCardListProps<T = any> {
  data: T[];
  loading?: boolean;
  config?: CardConfig;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  onView?: (record: T) => void;
  renderCard?: (item: T, index: number, actions: CardActions) => React.ReactNode;
  cardGutter?: number;
  rowKey?: string | ((record: T, index: number) => string);
}

const { Row, Col } = Grid;

/**
 * 长卡片列表组件
 * 展示为长条卡片，适合展示更多信息
 */
const LongCardList: React.FC<LongCardListProps> = ({
  data = [],
  loading = false,
  config = {},
  onEdit,
  onDelete,
  onView,
  renderCard,
  cardGutter = 16,
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

  if (data.length === 0 && !loading) {
    return <Empty />;
  }

  const {
    title,
    subtitle,
    description,
    image,
    imagePosition = 'left',
    imageHeight = 120,
    imageWidth = 120,
    showFields = [],
  } = config;

  return (
    <Row gutter={cardGutter} className="long-card-list">
      {data.map((item, index) => {
        const key = getRowKey(item, index);

        if (renderCard) {
          return (
            <Col key={key} span={24}>
              {renderCard(item, index, cardActions)}
            </Col>
          );
        }

        const titleNode = typeof title === 'function' ? title(item) : title || '--';
        const subtitleNode = typeof subtitle === 'function' ? subtitle(item) : subtitle;
        const descriptionNode =
          typeof description === 'function' ? description(item) : description;
        const imageUrl = typeof image === 'function' ? image(item) : image;

        const cardContent = (
          <div
            className={`long-card-content long-card-${imagePosition}`}
            style={{
              display: 'flex',
              gap: '16px',
              flexDirection: imagePosition === 'top' ? 'column' : 'row',
            }}
          >
            {imageUrl && (
              <div
                className="long-card-image"
                style={{
                  flex: `0 0 ${imageWidth}px`,
                  height: imageHeight,
                  overflow: 'hidden',
                  borderRadius: '4px',
                }}
              >
                <Image
                  src={imageUrl}
                  alt="card-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  preview={false}
                />
              </div>
            )}

            <div
              className="long-card-info"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="long-card-title">{titleNode}</div>
                {subtitleNode && (
                  <div className="long-card-subtitle">{subtitleNode}</div>
                )}
                {descriptionNode && (
                  <div className="long-card-description">{descriptionNode}</div>
                )}
              </div>

              {showFields.length > 0 && (
                <div className="long-card-fields">
                  {showFields.map((field) => (
                    <div key={field} className="field-item">
                      <span className="field-label">{config.fieldLabel?.[field] || field}:</span>
                      <span className="field-value">{item[field] || '--'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

        return (
          <Col key={key} span={24}>
            <Card
              className="long-card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              hoverable
              extra={
                <Space>
                  {onView && (
                    <Tooltip content="查看">
                      <Button
                        type="text"
                        size="small"
                        icon={<IconEye />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(item);
                        }}
                      />
                    </Tooltip>
                  )}
                  {onEdit && (
                    <Tooltip content="编辑">
                      <Button
                        type="text"
                        size="small"
                        icon={<IconEdit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item);
                        }}
                      />
                    </Tooltip>
                  )}
                </Space>
              }
            >
              {cardContent}
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default LongCardList;

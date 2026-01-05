import React, { useMemo, useState } from 'react';
import { Button, Space, Layout, Row, Col, Empty, Pagination, Spin } from '@arco-design/web-react';
import {
  IconApps,
  IconList,
  IconPlus,
  IconAppStore,
} from '@arco-design/web-react/icon';
import ShortCardList from './ShortCardList';
import LongCardList from './LongCardList';
import TableList from './TableList';
import { DisplayMode, DataManagerProps } from './types';
import './index.less';

const { Content } = Layout;

/**
 * 通用数据管理组件
 * 支持卡片、表格等多种展示形式
 * 提供分页、新增、编辑、删除、查看等功能
 */
const DataManager: React.FC<DataManagerProps> = ({
  data = [],
  loading = false,
  pagination,
  onPaginationChange,
  actions = {},
  config = {},
  showActions = true,
  actionsPosition = 'top',
  actionButtons,
  tableScrollHeight = 400,
  cardColumns = 4,
  cardGutter = 16,
  cardSize = 'small',
}) => {
  const {
    displayMode: defaultDisplayMode = 'shortCard',
    showModeToggle = true,
    renderItem,
    renderShortCard,
    renderLongCard,
    columns = [],
    tableColumns = [],
    shortCardConfig = {},
    longCardConfig = {},
    showFilterForm = false,
    filterContent,
  } = config;

  const [displayMode, setDisplayMode] = useState<DisplayMode>(defaultDisplayMode);

  // 创建操作处理函数
  const cardActions = {
    onEdit: actions?.onEdit,
    onDelete: actions?.onDelete,
    onView: actions?.onView,
  };

  // 顶部操作栏
  const actionBar = showActions && (actionsPosition === 'top' || actionsPosition === 'both') && (
    <div className="data-manager-actions-bar" style={{ marginBottom: '16px' }}>
      <Row gutter={16} align="middle" justify="space-between">
        <Col>
          <Space>
            {showModeToggle && (
              <>
                <Button
                  size="small"
                  type={displayMode === 'shortCard' ? 'primary' : 'secondary'}
                  icon={<IconApps />}
                  onClick={() => setDisplayMode('shortCard')}
                  title="短卡片视图"
                />
                <Button
                  size="small"
                  type={displayMode === 'longCard' ? 'primary' : 'secondary'}
                  icon={<IconAppStore />}
                  onClick={() => setDisplayMode('longCard')}
                  title="长卡片视图"
                />
                <Button
                  size="small"
                  type={displayMode === 'table' ? 'primary' : 'secondary'}
                  icon={<IconList />}
                  onClick={() => setDisplayMode('table')}
                  title="表格视图"
                />
              </>
            )}
            {actionButtons}
          </Space>
        </Col>
        <Col>
          {actions?.onAdd && (
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={actions.onAdd}
            >
              新增
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );

  // 底部操作栏
  const bottomActionBar = showActions && (actionsPosition === 'bottom' || actionsPosition === 'both') && (
    <div className="data-manager-bottom-actions" style={{ marginTop: '16px' }}>
      <Row gutter={16} align="middle" justify="flex-end">
        <Col>
          {actions?.onAdd && (
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={actions.onAdd}
            >
              新增
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );

  // 分页组件
  const paginationBar = pagination && (
    <div className="data-manager-pagination" style={{ marginTop: '16px', textAlign: 'right' }}>
      <Pagination
        {...pagination}
        onChange={(page, pageSize) => {
          onPaginationChange?.({
            ...pagination,
            current: page,
            pageSize,
          });
        }}
      />
    </div>
  );

  // 内容为空时的处理
  if (data.length === 0 && !loading) {
    return (
      <div className="data-manager">
        {filterContent && <div className="data-manager-filter">{filterContent}</div>}
        {actionBar}
        <Empty />
        {paginationBar}
      </div>
    );
  }

  // 根据显示模式渲染列表
  const renderListContent = () => {
    const commonProps = {
      data,
      loading,
      onEdit: actions?.onEdit,
      onDelete: actions?.onDelete,
      onView: actions?.onView,
    };

    switch (displayMode) {
      case 'shortCard':
        return (
          <ShortCardList
            {...commonProps}
            config={shortCardConfig}
            renderCard={renderShortCard}
            cardColumns={cardColumns}
            cardGutter={cardGutter}
            cardSize={cardSize}
          />
        );

      case 'longCard':
        return (
          <LongCardList
            {...commonProps}
            config={longCardConfig}
            renderCard={renderLongCard}
            cardGutter={cardGutter}
          />
        );

      case 'table':
      default:
        return (
          <TableList
            {...commonProps}
            columns={tableColumns.length > 0 ? tableColumns : columns}
            scrollHeight={tableScrollHeight}
            pagination={false}
          />
        );
    }
  };

  return (
    <div className="data-manager">
      {filterContent && (
        <div className="data-manager-filter">{filterContent}</div>
      )}

      {actionBar}

      <Spin loading={loading} className="data-manager-content">
        {renderListContent()}
      </Spin>

      {paginationBar}

      {bottomActionBar}
    </div>
  );
};

export default DataManager;

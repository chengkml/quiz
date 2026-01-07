import React, { useMemo, useState } from "react";
import {
  Button,
  Space,
  Empty,
  Pagination,
  Spin,
  Radio,
  Layout,
} from "@arco-design/web-react";
import { IconApps, IconList, IconPlus } from "@arco-design/web-react/icon";
import ShortCardList from "../components/ShortCardList";
import LongCardList from "../components/LongCardList";
import TableList from "../components/TableList";
import { DisplayMode, DataManagerProps } from "../../types/types";
import "../styles/index.less";

const { Header, Content, Footer } = Layout;

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
  actionsPosition = "top",
  actionButtons,
  tableScrollHeight = 400,
  cardColumns = 4,
  cardGutter = 16,
  cardSize = "small",
}) => {
  const {
    displayMode: defaultDisplayMode = "shortCard",
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

  const [displayMode, setDisplayMode] =
    useState<DisplayMode>(defaultDisplayMode);

  // 顶部操作栏
  const actionBar = showActions &&
    (actionsPosition === "top" || actionsPosition === "both") && (
      <div className="data-manager-actions-bar">
        <Space>
          {actionButtons}
          {actions?.onAdd && (
            <Button type="primary" icon={<IconPlus />} onClick={actions.onAdd}>
              新增
            </Button>
          )}
        </Space>
        <Space>
          {showModeToggle && (
            <Radio.Group
              type="button"
              size="small"
              value={displayMode}
              onChange={setDisplayMode}
            >
              <Radio value="shortCard">
                <IconApps />
              </Radio>
              <Radio value="longCard">
                <IconApps />
              </Radio>
              <Radio value="table">
                <IconList />
              </Radio>
            </Radio.Group>
          )}
        </Space>
      </div>
    );

  // 分页组件
  const paginationBar = pagination && (
    <div className="data-manager-pagination">
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
      case "shortCard":
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

      case "longCard":
        return (
          <LongCardList
            {...commonProps}
            config={longCardConfig}
            renderCard={renderLongCard}
            cardGutter={cardGutter}
          />
        );

      case "table":
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

  // 内容展示
  const mainContent =
    data.length === 0 && !loading ? <Empty /> : renderListContent();

  return (
    <div className="data-manager">
      <Layout style={{ height: "100%" }}>
        {(filterContent || actionBar) && (
          <Header className="data-manager-header" style={{ flexShrink: 0 }}>
            {filterContent && (
              <div className="data-manager-filter">{filterContent}</div>
            )}
            {actionBar}
          </Header>
        )}

        <Content
          className="data-manager-content"
          style={{ flex: 1, overflow: "auto" }}
        >
          <Spin loading={loading}>{mainContent}</Spin>
        </Content>

        {paginationBar && (
          <Footer className="data-manager-footer">{paginationBar}</Footer>
        )}
      </Layout>
    </div>
  );
};

export default DataManager;

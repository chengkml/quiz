import React, { useMemo, useState } from "react";
import {
  Button,
  Space,
  Empty,
  Pagination,
  Spin,
  Radio,
  Layout,
  Tree,
  Input,
} from "@arco-design/web-react";
import { IconApps, IconList, IconPlus } from "@arco-design/web-react/icon";
import ShortCardList from "../components/ShortCardList";
import LongCardList from "../components/LongCardList";
import TableList from "../components/TableList";
import { DisplayMode, DataManagerProps } from "../../types/types";
import "../styles/index.less";

const { Header, Content, Footer, Sider } = Layout;

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
  tableScrollHeight = 100,
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
    showTree = false,
    treeContent,
    treeData = [],
    selectedTreeKeys,
    onTreeSelect,
    showTreeFilter = false,
  } = config;

  const [displayMode, setDisplayMode] =
    useState<DisplayMode>(defaultDisplayMode);

  const [treeKeyword, setTreeKeyword] = useState("");

  // 树数据过滤逻辑
  const filteredTreeData = useMemo(() => {
    if (!treeKeyword || !treeData.length) return treeData;

    const filter = (nodes: any[]): any[] => {
      return nodes
        .map((node) => {
          const match = node.title
            ?.toString()
            .toLowerCase()
            .includes(treeKeyword.toLowerCase());
          const filteredChildren = node.children
            ? filter(node.children)
            : undefined;

          if (match || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((node) => node !== null) as any[];
    };

    return filter(treeData);
  }, [treeData, treeKeyword]);

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
        {showTree && (
          <Sider className="data-manager-tree-sider">
            {showTreeFilter && (
              <div style={{ marginBottom: 12 }}>
                <Input.Search
                  placeholder="搜索关键字"
                  allowClear
                  onChange={setTreeKeyword}
                  onSearch={setTreeKeyword}
                />
              </div>
            )}
            {treeContent || (
              <Tree
                treeData={filteredTreeData}
                selectedKeys={selectedTreeKeys}
                onSelect={onTreeSelect}
                autoExpandParent={!!treeKeyword}
              />
            )}
          </Sider>
        )}
        <Layout>
          {(filterContent || actionBar) && (
            <Header className="data-manager-header" style={{ flexShrink: 0 }}>
              {filterContent && (
                <div className="data-manager-filter">{filterContent}</div>
              )}
              {actionBar}
            </Header>
          )}

          <Content className="data-manager-content">
            <Spin loading={loading}>{mainContent}</Spin>
          </Content>

          {paginationBar && (
            <Footer className="data-manager-footer">{paginationBar}</Footer>
          )}
        </Layout>
      </Layout>
    </div>
  );
};

export default DataManager;

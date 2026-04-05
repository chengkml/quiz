import React, { useState } from "react";
import { Input, Typography } from "@arco-design/web-react";
import { NODE_LIBRARY_GROUPS } from "./nodeMeta";

const { Text } = Typography;

const Sidebar: React.FC = () => {
  const [keyword, setKeyword] = useState("");

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const normalizedKeyword = keyword.trim().toLowerCase();
  const groups = NODE_LIBRARY_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      normalizedKeyword
        ? `${item.label} ${item.description} ${item.category}`
            .toLowerCase()
            .includes(normalizedKeyword)
        : true
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="flow-sidebar">
      <div className="flow-panel-header">
        <div>
          <div className="flow-panel-header__eyebrow">节点面板</div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            节点库
          </Typography.Title>
        </div>
        <Text type="secondary">拖拽到画布中即可创建节点</Text>
      </div>

      <Input.Search
        allowClear
        value={keyword}
        onChange={setKeyword}
        placeholder="搜索节点类型"
        className="flow-sidebar__search"
      />

      <div className="flow-sidebar__sections">
        {groups.map((group) => (
          <section key={group.key} className="flow-sidebar__section">
            <div className="flow-sidebar__section-header">
              <div className="flow-sidebar__section-title">{group.title}</div>
              <div className="flow-sidebar__section-desc">{group.description}</div>
            </div>

            <div className="flow-sidebar__list">
              {group.items.map((node) => (
                <button
                  key={node.type}
                  type="button"
                  className="flow-sidebar__item"
                  draggable
                  onDragStart={(event) => onDragStart(event, node.type, node.label)}
                  style={{
                    borderColor: `${node.accent}24`,
                    background: `linear-gradient(180deg, ${node.softColor} 0%, #ffffff 100%)`,
                  }}
                >
                  <span
                    className="flow-sidebar__item-icon"
                    style={{ color: node.accent, background: `${node.accent}14` }}
                  >
                    {node.icon}
                  </span>
                  <span className="flow-sidebar__item-content">
                    <span className="flow-sidebar__item-title">{node.label}</span>
                    <span className="flow-sidebar__item-desc">{node.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <div className="flow-sidebar__empty">
            <Typography.Text type="secondary">
              没有匹配的节点，试试更短的关键字。
            </Typography.Text>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

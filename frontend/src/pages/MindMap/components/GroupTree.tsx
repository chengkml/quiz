import React, { useEffect, useRef, useState } from "react";
import { Tree, Dropdown, Menu, Modal, Form, Input, Message, Button, Empty, Spin } from "@arco-design/web-react";
import { IconPlus, IconEdit, IconDelete, IconMoreVertical, IconFolder } from "@arco-design/web-react/icon";
import { getGroupList, createGroup, updateGroup, deleteGroup } from "../../Group/api";

interface GroupTreeProps {
  onSelect: (keys: string[]) => void;
  selectedKeys: string[];
}

const GroupTree: React.FC<GroupTreeProps> = ({ onSelect, selectedKeys }) => {
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [form] = Form.useForm();
  
  // Right-click context menu state
  const [popupVisible, setPopupVisible] = useState(false);
  const [contextNode, setContextNode] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await getGroupList({ type: 'mindmap', pageSize: 1000 });
      const groups = res.data.content || [];
      const tree = groups.map((g: any) => ({
        key: g.name,
        title: g.label,
        ...g
      }));
      setTreeData([{ 
        key: 'all', 
        title: '全部', 
        icon: <IconFolder />,
        children: tree 
      }]);
    } catch (error) {
      console.error("Fetch groups failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = () => {
    setEditingNode(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (node: any) => {
      // Prevent editing "All"
      if (node.key === 'all') return;
      
      setEditingNode(node);
      form.setFieldsValue({
          name: node.name,
          label: node.label,
          descr: node.descr
      });
      setModalVisible(true);
  };
  
  const handleDelete = (node: any) => {
      if (node.key === 'all') return;
      
      Modal.confirm({
          title: '确认删除',
          content: `确定要删除分组 "${node.title}" 吗？`,
          onOk: async () => {
              try {
                  await deleteGroup(node.id);
                  Message.success('删除成功');
                  fetchGroups();
                  // If selected was deleted, reset selection
                  if (selectedKeys.includes(node.key)) {
                      onSelect([]);
                  }
              } catch (error) {
                  Message.error('删除失败');
              }
          }
      });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      if (editingNode) {
        await updateGroup({ ...values, id: editingNode.id });
        Message.success("更新成功");
      } else {
        await createGroup({ ...values, type: 'mindmap' });
        Message.success("创建成功");
      }
      setModalVisible(false);
      fetchGroups();
    } catch (error) {
        // Form validation error or API error
        console.error(error);
    }
  };

  const renderExtra = (node: any) => {
      // Don't show actions for "All" node
      if (node.key === 'all') return null;
      
      return (
          <Dropdown
              trigger="click"
              droplist={
                  <Menu>
                      <Menu.Item key="edit" onClick={(e) => { e.stopPropagation(); handleEdit(node); }}>
                          <IconEdit style={{ marginRight: 8 }} />编辑
                      </Menu.Item>
                      <Menu.Item key="delete" onClick={(e) => { e.stopPropagation(); handleDelete(node); }}>
                          <IconDelete style={{ marginRight: 8 }} />删除
                      </Menu.Item>
                  </Menu>
              }
          >
              <IconMoreVertical 
                style={{ position: 'absolute', right: 8, top: 10, color: '#888' }} 
                onClick={(e) => e.stopPropagation()} 
              />
          </Dropdown>
      );
  };

  return (
    <div className="group-tree-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>分组管理</span>
            <Button size="mini" type="text" icon={<IconPlus />} onClick={handleCreate} />
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 0' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
            ) : (
                <Tree
                    blockNode
                    treeData={treeData}
                    selectedKeys={selectedKeys.length === 0 ? ['all'] : selectedKeys}
                    defaultExpandedKeys={['all']}
                    onSelect={(keys, extra) => {
                        const key = keys[0];
                        if (key === 'all') {
                            onSelect([]);
                        } else if (key) {
                            onSelect([key]);
                        } else {
                            // Deselect behavior
                            onSelect([]);
                        }
                    }}
                    renderExtra={renderExtra}
                />
            )}
        </div>

        <Modal
            title={editingNode ? "编辑分组" : "新建分组"}
            visible={modalVisible}
            onOk={handleSubmit}
            onCancel={() => setModalVisible(false)}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="分组标识 (英文)" field="name" rules={[{ required: true, message: '请输入英文标识' }]}>
                    <Input placeholder="例如: java_basic" disabled={!!editingNode} />
                </Form.Item>
                <Form.Item label="分组名称 (中文)" field="label" rules={[{ required: true, message: '请输入显示名称' }]}>
                    <Input placeholder="例如: Java基础" />
                </Form.Item>
                <Form.Item label="描述" field="descr">
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Modal>
    </div>
  );
};

export default GroupTree;

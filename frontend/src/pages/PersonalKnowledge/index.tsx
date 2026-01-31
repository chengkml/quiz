import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Empty, Input, Select, Space, Avatar, Typography, Message } from '@arco-design/web-react';
import { getMyCreatedKnowledgeSets, getMyJoinedKnowledgeSets } from '../KnowledgeSet/api';
import { 
  IconFolder, 
  IconUser, 
  IconShareAlt, 
  IconPlus, 
  IconSearch, 
  IconMenu, 
  IconRefresh, 
  IconMore, 
  IconImage, 
  IconScissor, 
  IconSend,
  IconStorage 
} from '@arco-design/web-react/icon';
import './style/index.less';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

const PersonalKnowledge = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('personal');

  const [createdItems, setCreatedItems] = useState<any[]>([]);
  const [joinedItems, setJoinedItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const createdRes = await getMyCreatedKnowledgeSets({ pageNum: 1, pageSize: 100 });
      setCreatedItems(createdRes.data.content || []);

      const joinedRes = await getMyJoinedKnowledgeSets({ pageNum: 1, pageSize: 100 });
      setJoinedItems(joinedRes.data.content || []);
    } catch (error) {
      console.error("Failed to fetch knowledge sets", error);
      Message.error("获取知识库列表失败");
    }
  };

  return (
    <Layout className="personal-knowledge-container">
      <Sider
        width={250}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        collapsible
        trigger={null}
        breakpoint="xl"
      >
        <div style={{ padding: '16px 12px 0' }}>
            <Button long style={{ justifyContent: 'flex-start', paddingLeft: 12, marginBottom: 8 }} icon={<IconUser />}>
                个人知识库
            </Button>
             <Button long type="text" style={{ justifyContent: 'flex-start', paddingLeft: 12, color: 'var(--color-text-2)' }} icon={<IconShareAlt />}>
                共享知识库
            </Button>
        </div>
        
        <Menu
          selectedKeys={[selectedKey]}
          onClickMenuItem={setSelectedKey}
          defaultOpenKeys={['created', 'joined']}
          style={{ width: '100%' }}
        >
          <SubMenu
            key="created"
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>我创建的</span>
                    <IconPlus style={{ fontSize: 12, color: 'var(--color-text-3)' }} />
                </div>
            }
          >
            {createdItems.map(item => (
              <Menu.Item key={item.id}>
                <Space>
                    <IconFolder />
                    {item.name}
                </Space>
              </Menu.Item>
            ))}
          </SubMenu>
          <SubMenu key="joined" title="我加入的">
            {joinedItems.map(item => (
              <Menu.Item key={item.id}>
                <Space>
                    <IconStorage />
                    {item.name}
                </Space>
              </Menu.Item>
            ))}
          </SubMenu>
        </Menu>
      </Sider>
      
      <Content className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
             <Typography.Title heading={5} style={{ margin: 0 }}>个人知识库</Typography.Title>
             <Space size={16}>
                <Button icon={<IconSearch />} shape="circle" type="text" />
                <Button icon={<IconMenu />} shape="circle" type="text" />
                <Button icon={<IconRefresh />} shape="circle" type="text" />
             </Space>
        </div>

        <div className="empty-container">
          <Empty 
            description="当前知识库内容为空" 
            icon={<div style={{ 
                width: 80, 
                height: 80, 
                background: 'var(--color-fill-2)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 16px'
            }}>
                <IconStorage style={{ fontSize: 32, color: 'var(--color-text-3)' }} /> 
            </div>}
          />
        </div>

        <div className="chat-input-wrapper">
            <div className="input-header">基于知识库提问</div>
            <Input.TextArea 
                placeholder="输入问题..." 
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ background: 'transparent', border: 'none', padding: 0 }}
            />
            <div className="input-actions">
                <Space>
                    <Select defaultValue="chat" triggerProps={{ autoAlignPopupWidth: false, position: 'bl' }} style={{ width: 100 }} bordered={false}>
                        <Select.Option value="chat">对话模式</Select.Option>
                    </Select>
                    <Select defaultValue="ds-v3.2" triggerProps={{ autoAlignPopupWidth: false, position: 'bl' }} style={{ width: 100 }} bordered={false}>
                        <Select.Option value="ds-v3.2">DS V3.2</Select.Option>
                    </Select>
                </Space>
                <Space>
                    <Button icon={<IconImage />} type="text" />
                    <Button icon={<IconScissor />} type="text" />
                    <Button icon={<IconSend />} type="primary" shape="circle" />
                </Space>
            </div>
        </div>
      </Content>
    </Layout>
  );
};

export default PersonalKnowledge;

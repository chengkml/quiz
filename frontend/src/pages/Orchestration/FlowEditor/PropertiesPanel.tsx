import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Typography, Empty } from '@arco-design/web-react';

const { Title } = Typography;
const { TextArea } = Input;
const FormItem = Form.Item;

interface PropertiesPanelProps {
  selectedNode: any;
  onChange: (nodeId: string, data: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, onChange }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedNode) {
      form.setFieldsValue({
        label: selectedNode.data?.label,
        description: selectedNode.data?.description,
        ...selectedNode.data
      });
    }
  }, [selectedNode, form]);

  const handleValuesChange = (_: any, values: any) => {
    if (selectedNode) {
      onChange(selectedNode.id, {
        ...selectedNode.data,
        ...values
      });
    }
  };

  if (!selectedNode) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#86909c' }}>
        <Empty description="请选择一个节点进行配置" />
      </div>
    );
  }

  const renderSpecificFields = () => {
    switch (selectedNode.type) {
      case 'llm':
        return (
          <>
            <FormItem label="模型名称" field="modelName">
              <Input placeholder="例如: gpt-4, deepseek-v3" />
            </FormItem>
            <FormItem label="系统提示词 (System Prompt)" field="systemPrompt">
              <TextArea placeholder="输入系统提示词..." autoSize={{ minRows: 3 }} />
            </FormItem>
            <FormItem label="温度 (Temperature)" field="temperature">
              <InputNumber min={0} max={2} step={0.1} />
            </FormItem>
          </>
        );
      case 'knowledge':
        return (
          <>
            <FormItem label="知识库 ID" field="knowledgeId">
              <Input placeholder="选择知识库..." />
            </FormItem>
            <FormItem label="检索数量 (Top K)" field="topK">
              <InputNumber min={1} max={10} />
            </FormItem>
          </>
        );
      case 'condition':
        return (
          <FormItem label="条件表达式" field="expression">
            <Input placeholder="例如: status == 'success'" />
          </FormItem>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100%', padding: '0 16px', borderLeft: '1px solid #e5e6eb', background: '#fff', overflowY: 'auto' }}>
      <div style={{ padding: '16px 0', borderBottom: '1px solid #e5e6eb', marginBottom: 16 }}>
        <Title heading={6} style={{ margin: 0 }}>节点属性</Title>
      </div>
      
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <FormItem label="节点名称" field="label">
          <Input />
        </FormItem>
        <FormItem label="描述" field="description">
          <TextArea autoSize={{ minRows: 2 }} />
        </FormItem>
        
        <div style={{ margin: '16px 0', height: 1, background: '#f2f3f5' }} />
        <Typography.Text bold style={{ marginBottom: 12, display: 'block' }}>参数配置</Typography.Text>
        
        {renderSpecificFields()}
      </Form>
    </div>
  );
};

export default PropertiesPanel;

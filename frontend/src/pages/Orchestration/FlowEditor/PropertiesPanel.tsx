import React, { useEffect } from "react";
import {
  Empty,
  Form,
  Input,
  InputNumber,
  Typography,
} from "@arco-design/web-react";
import { resolveNodeMeta } from "./nodeMeta";

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
      form.resetFields();
      form.setFieldsValue({
        label: selectedNode.data?.label,
        description: selectedNode.data?.description,
        ...selectedNode.data,
      });
      return;
    }
    form.resetFields();
  }, [selectedNode, form]);

  const handleValuesChange = (_: any, values: any) => {
    if (selectedNode) {
      onChange(selectedNode.id, {
        ...selectedNode.data,
        ...values,
      });
    }
  };

  if (!selectedNode) {
    return (
      <div className="flow-properties flow-properties--empty">
        <Empty description="请选择一个节点进行配置" />
      </div>
    );
  }

  const meta = resolveNodeMeta(selectedNode.type);

  const renderSpecificFields = () => {
    switch (selectedNode.type) {
      case "llm":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">模型参数</div>
            <FormItem label="模型名称" field="modelName">
              <Input placeholder="例如：gpt-4、deepseek-v3" />
            </FormItem>
            <FormItem label="系统提示词" field="systemPrompt">
              <TextArea
                placeholder="输入系统提示词，定义模型角色和约束"
                autoSize={{ minRows: 3 }}
              />
            </FormItem>
            <FormItem label="温度" field="temperature">
              <InputNumber min={0} max={2} step={0.1} />
            </FormItem>
          </div>
        );
      case "knowledge":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">检索参数</div>
            <FormItem label="知识库 ID" field="knowledgeId">
              <Input placeholder="请输入知识库 ID" />
            </FormItem>
            <FormItem label="检索数量 Top K" field="topK">
              <InputNumber min={1} max={10} />
            </FormItem>
          </div>
        );
      case "skill":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">工具调用</div>
            <FormItem label="技能编码" field="skillCode">
              <Input placeholder="例如：quiz-email-send" />
            </FormItem>
            <FormItem label="超时时间（秒）" field="timeoutSeconds">
              <InputNumber min={1} max={600} />
            </FormItem>
          </div>
        );
      case "condition":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">分支逻辑</div>
            <FormItem label="条件表达式" field="expression">
              <Input placeholder="例如：status == 'success'" />
            </FormItem>
          </div>
        );
      case "start":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">输入说明</div>
            <FormItem label="输入结构" field="inputSchema">
              <TextArea
                placeholder="描述这个工作流期望接收的输入结构"
                autoSize={{ minRows: 3 }}
              />
            </FormItem>
          </div>
        );
      case "end":
        return (
          <div className="flow-properties__section">
            <div className="flow-properties__section-title">输出说明</div>
            <FormItem label="输出模板" field="responseTemplate">
              <TextArea
                placeholder="描述结束节点应输出什么结果"
                autoSize={{ minRows: 3 }}
              />
            </FormItem>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flow-properties">
      <div className="flow-panel-header flow-panel-header--sticky">
        <div>
          <div className="flow-panel-header__eyebrow">配置面板</div>
          <Typography.Title heading={6} style={{ margin: 0 }}>
            节点配置
          </Typography.Title>
        </div>
        <Typography.Text type="secondary">修改会实时写入当前画布</Typography.Text>
      </div>

      <div className="flow-properties__summary">
        <span
          className="flow-properties__summary-icon"
          style={{ color: meta.accent, background: `${meta.accent}14` }}
        >
          {meta.icon}
        </span>
        <div className="flow-properties__summary-main">
          <div className="flow-properties__summary-title">{meta.label}</div>
          <div className="flow-properties__summary-desc">{meta.description}</div>
        </div>
        <span className="flow-properties__summary-badge">{meta.category}</span>
      </div>

      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <div className="flow-properties__section">
          <div className="flow-properties__section-title">基础信息</div>
          <FormItem label="节点名称" field="label">
            <Input placeholder="输入节点名称" />
          </FormItem>
          <FormItem label="描述" field="description">
            <TextArea
              placeholder="补充这个节点的职责说明"
              autoSize={{ minRows: 2 }}
            />
          </FormItem>
        </div>

        {renderSpecificFields()}
      </Form>
    </div>
  );
};

export default PropertiesPanel;

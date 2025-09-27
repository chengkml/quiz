import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Message,
  Grid,
} from '@arco-design/web-react';
import { TeamDto } from '../../../types/team';
import { teamService } from '../../../services/teamService';

const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;
const Option = Select.Option;
const TextArea = Input.TextArea;

interface CreateTeamModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  parentTeamId?: string;
  teamTree: TeamDto[];
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  parentTeamId,
  teamTree,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 根据团队ID查找团队名称
  const findTeamLabelById = (teamId: string, nodes: TeamDto[]): string => {
    for (const node of nodes) {
      if (node.teamId === teamId) {
        return node.label || node.teamName;
      }
      if (node.children && node.children.length > 0) {
        const found = findTeamLabelById(teamId, node.children);
        if (found) return found;
      }
    }
    return '';
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setLoading(true);

      const teamData: Partial<TeamDto> = {
        teamName: values.teamName,
        label: values.label,
        parentTeamId: parentTeamId || values.parentTeamId,
        descr: values.descr,
        state: values.state || '1',
      };

      const response = await teamService.createTeam(teamData);
      if (response.success) {
        Message.success('创建团队成功');
        form.resetFields();
        onSuccess();
      } else {
        Message.error(response.message || '创建团队失败');
      }
    } catch (error) {
      console.error('创建团队失败:', error);
      Message.error('创建团队失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增团队"
      visible={visible}
      onCancel={handleCancel}
      footer={
        <div>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            确定
          </Button>
        </div>
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          state: '1',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <FormItem
              field="teamName"
              label="团队编码"
              rules={[
                { required: true, message: '请输入团队编码' },
                { maxLength: 50, message: '团队编码不能超过50个字符' },
              ]}
            >
              <Input placeholder="请输入团队编码" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              field="label"
              label="团队名称"
              rules={[
                { required: true, message: '请输入团队名称' },
                { maxLength: 50, message: '团队名称不能超过50个字符' },
              ]}
            >
            <Input placeholder="请输入团队名称" />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <FormItem
              label="父团队"
            >
              <Input 
                placeholder="无父团队" 
                value={parentTeamId ? findTeamLabelById(parentTeamId, teamTree) : ''}
                readOnly
                style={{ backgroundColor: '#f7f8fa', cursor: 'not-allowed' }}
              />
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <FormItem
              field="state"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="1">生效</Option>
                <Option value="0">失效</Option>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <FormItem
              field="descr"
              label="团队描述"
              rules={[
                { maxLength: 200, message: '团队描述不能超过200个字符' },
              ]}
            >
              <TextArea
                placeholder="请输入团队描述"
                rows={4}
                maxLength={200}
                showWordLimit
              />
            </FormItem>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateTeamModal;
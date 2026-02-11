import React, { useCallback, useState, useEffect } from 'react';
import {
  Button,
  Card,
  Layout,
  Message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from '@arco-design/web-react';
import UserAvatar from '@/components/UserAvatar';
import './style/index.less';
import {
  createSubject,
  deleteSubject,
  getSubjectList,
  updateSubject,
  checkSubjectName
} from './api';
import renderDate from '@/utils/timeUtil';
import {
  IconDelete,
  IconEdit
} from '@arco-design/web-react/icon';
import { DataManager, AddEditModal } from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';

function SubjectManager() {
  // 状态管理
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [addEditVisible, setAddEditVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  // 初始化数据
  useEffect(() => {
    fetchData({}, 1, 20);
  }, []);

  // 获取数据
  const fetchData = useCallback(async (params = {}, page?: number, pageSize?: number) => {
    try {
      setLoading(true);
      const queryParams = {
        ...params,
        page: (page ?? pagination.current) - 1, // 后端 page 从 0 开始
        size: pageSize ?? pagination.pageSize
      };

      const response = await getSubjectList(queryParams);
      if (response.data) {
        setData(response.data.content || []);
        setPagination(prev => ({
          ...prev,
          current: (queryParams.page || 0) + 1,
          pageSize: queryParams.size || 20,
          total: response.data.totalElements || 0
        }));
      }
    } catch (error) {
      console.error('获取学科列表失败:', error);
      Message.error('获取学科列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  // 时间格式化
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderTimeText = (value) => {
    return renderDate(value);
  };

  // 搜索表单配置
  const searchFormFields: FormFieldConfig[] = [
    {
      field: 'name',
      label: '英文名称',
      type: 'input',
      placeholder: '请输入英文名称',
      span: 10,
    },
    {
      field: 'label',
      label: '中文名称',
      type: 'input',
      placeholder: '请输入中文名称',
      span: 10,
    }
  ];

  // 新增/编辑表单配置
  const getFormConfig = (isEditMode: boolean, record: any): FormFieldConfig[] => [
    {
      field: 'name',
      label: '英文名称',
      type: 'input',
      placeholder: '请输入英文名称 (例如: math)',
      rules: [
        { required: true, message: '请输入英文名称' },
        { maxLength: 64, message: '长度不能超过64个字符' },
        {
          pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
          message: '英文名称必须以字母开头，只能包含字母、数字和下划线'
        },
        {
          validator: async (value, callback) => {
            if (!value || value.length > 64) return;
            // 如果是编辑模式且名称未改变，跳过验证
            if (isEditMode && record?.name === value) {
              return;
            }
            try {
              const res = await checkSubjectName(value, isEditMode ? record?.id : null);
              if (!res.data) {
                callback('该英文名称已存在');
              }
            } catch (error) {
              console.error('名称验证失败:', error);
              // 验证失败不阻断提交，由后端兜底
            }
          }
        }
      ],
      span: 24,
    },
    {
      field: 'label',
      label: '中文名称',
      type: 'input',
      placeholder: '请输入中文名称 (例如: 数学)',
      rules: [
        { required: true, message: '请输入中文名称' },
        { maxLength: 128, message: '长度不能超过128个字符' }
      ],
      span: 24,
    },
    {
      field: 'descr',
      label: '描述',
      type: 'textarea',
      placeholder: '请输入描述',
      rules: [{ maxLength: 512, message: '长度不能超过512个字符' }],
      span: 24,
    }
  ];

  // 提交处理
  const handleSubmit = async (values: any) => {
    try {
      if (isEdit) {
        await updateSubject({ ...values, id: currentRecord.id });
        Message.success('更新学科成功');
      } else {
        await createSubject(values);
        Message.success('创建学科成功');
      }
      setAddEditVisible(false);
      setCurrentRecord(null);
      fetchData();
    } catch (error: any) {
      console.error(isEdit ? '更新失败:' : '创建失败:', error);
      const errorMsg = error?.response?.data?.message || error?.message || (isEdit ? '更新学科失败' : '创建学科失败');
      Message.error(errorMsg);
      throw error; // 抛出错误，防止modal关闭
    }
  };

  // 删除处理
  const handleDelete = async (record: any) => {
    try {
      await deleteSubject(record.id);
      Message.success('删除学科成功');
      fetchData();
    } catch (error) {
      console.error('删除失败:', error);
      Message.error('删除学科失败');
    }
  };

  // 渲染卡片
  const renderCustomCard = (item: any, index: number, actions: any) => (
    <Card
      hoverable
      className="subject-card"
      title={<Tag color="blue" bordered>{item.label || item.name}</Tag>}
      extra={
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={(e) => {
                e.stopPropagation();
                setIsEdit(true);
                setCurrentRecord(item);
                setAddEditVisible(true);
              }}
            />
          </Tooltip>
          
          <Popconfirm
            title="确认删除该学科吗？"
            onOk={() => actions.onDelete(item)}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      }
    >
      <div className="card-content">
        <Typography.Paragraph
          className="card-desc"
          ellipsis={{ rows: 3, showTooltip: true }}
        >
          {item.descr || item.description || '暂无描述'}
        </Typography.Paragraph>
        <div className="card-footer">
          <UserAvatar name={item.createUserName || (item?.createUser ?? '')} showName />
          <span className="time">{renderTimeText(item.createDate)}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <Layout className="subject-manager">
      <DataManager
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={(p) => fetchData({}, p.current, p.pageSize)}
        actions={{
          onAdd: () => {
            setIsEdit(false);
            setCurrentRecord(null);
            setAddEditVisible(true);
          },
          onEdit: (record) => {
            setIsEdit(true);
            setCurrentRecord(record);
            setAddEditVisible(true);
          },
          onDelete: handleDelete,
        }}
        config={{
          displayMode: 'shortCard',
          renderShortCard: renderCustomCard,
          filterContent: (
            <FilterForm
              formFields={searchFormFields}
              onSearch={(values) => fetchData(values, 1)}
              onReset={() => fetchData({}, 1)}
            />
          ),
          showModeToggle: false, // 暂时只支持卡片视图
        }}
      />

      <AddEditModal
        visible={addEditVisible}
        title={isEdit ? '编辑学科' : '新增学科'}
        onCancel={() => {
          setAddEditVisible(false);
          setCurrentRecord(null);
        }}
        onOk={handleSubmit}
        formConfig={getFormConfig(isEdit, currentRecord)}
        isEdit={isEdit}
        record={currentRecord}
        loading={loading}
      />
    </Layout>
  );
}

export default SubjectManager;

import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Link,
  Message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import { IconArchive, IconDelete, IconEdit } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import {
  archiveDiary,
  createDiary,
  deleteDiary,
  DiaryDto,
  DiaryMood,
  getDiaryList,
  updateDiary,
} from './api';
import './style/index.less';

const { TextArea } = Input;
const { Option } = Select;

const moodOptions = [
  { label: '开心', value: 'HAPPY' },
  { label: '平静', value: 'CALM' },
  { label: '难过', value: 'SAD' },
  { label: '生气', value: 'ANGRY' },
  { label: '疲惫', value: 'TIRED' },
  { label: '兴奋', value: 'EXCITED' },
];

const moodTagMap: Record<string, { color: string; text: string }> = {
  HAPPY: { color: 'green', text: '开心' },
  CALM: { color: 'arcoblue', text: '平静' },
  SAD: { color: 'purple', text: '难过' },
  ANGRY: { color: 'red', text: '生气' },
  TIRED: { color: 'gray', text: '疲惫' },
  EXCITED: { color: 'orange', text: '兴奋' },
};

function DiaryPage() {
  const [tableData, setTableData] = useState<DiaryDto[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableScrollHeight, setTableScrollHeight] = useState(420);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const buildDefaultSearchParams = () => ({});
  const [searchParams, setSearchParams] = useState<any>(buildDefaultSearchParams);

  const [currentRecord, setCurrentRecord] = useState<DiaryDto | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  const addFormRef = useRef<any>(null);
  const editFormRef = useRef<any>(null);
  const filterFormRef = useRef<any>(null);

  const searchFormFields: FormFieldConfig[] = [
    {
      field: 'title',
      label: '标题',
      type: 'input',
      placeholder: '请输入标题关键字',
      span: 6,
    },
    {
      field: 'mood',
      label: '心情',
      type: 'select',
      placeholder: '请选择心情',
      options: moodOptions,
      allowClear: true,
      span: 6,
    },
    {
      field: 'diaryDateStart',
      label: '开始日期',
      type: 'date',
      placeholder: '开始日期',
      span: 6,
    },
    {
      field: 'diaryDateEnd',
      label: '结束日期',
      type: 'date',
      placeholder: '结束日期',
      span: 6,
    },
    {
      field: 'archived',
      label: '状态',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '未归档', value: false },
        { label: '已归档', value: true },
      ],
      allowClear: true,
      span: 6,
    },
  ];

  const normalizeSearchParams = (values: any) => {
    const normalized = {
      ...values,
      diaryDateStart: values?.diaryDateStart
        ? dayjs(values.diaryDateStart).format('YYYY-MM-DD')
        : undefined,
      diaryDateEnd: values?.diaryDateEnd
        ? dayjs(values.diaryDateEnd).format('YYYY-MM-DD')
        : undefined,
    };

    return Object.fromEntries(
      Object.entries(normalized).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
    );
  };

  const fetchTableData = async (
    params: any = searchParams,
    pageSize: number = pagination.pageSize,
    current: number = pagination.current
  ) => {
    setTableLoading(true);
    try {
      const payload = {
        ...params,
        pageNum: current - 1,
        pageSize,
      };
      const response = await getDiaryList(payload);
      const data = response?.data;
      setTableData(data?.content || []);
      setPagination((prev) => ({
        ...prev,
        current,
        pageSize,
        total: data?.totalElements || 0,
      }));
    } catch (error) {
      Message.error('获取日记数据失败');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearch = (values: any) => {
    const normalized = normalizeSearchParams(values);
    setSearchParams(normalized);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    const nextParams = buildDefaultSearchParams();
    setSearchParams(nextParams);
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchTableData(nextParams, pagination.pageSize, 1);
    filterFormRef.current?.setFieldsValue?.(nextParams);
  };

  const handlePaginationChange = (nextPagination: any) => {
    fetchTableData(searchParams, nextPagination.pageSize, nextPagination.current);
  };

  const handleAdd = () => {
    setCurrentRecord(null);
    setAddVisible(true);
    setTimeout(() => {
      addFormRef.current?.setFieldsValue?.({
        diaryDate: dayjs(),
        mood: 'CALM',
      });
    }, 50);
  };

  const handleEdit = (record: DiaryDto) => {
    setCurrentRecord(record);
    setEditVisible(true);
    setTimeout(() => {
      editFormRef.current?.setFieldsValue?.({
        title: record.title,
        content: record.content,
        diaryDate: record.diaryDate ? dayjs(record.diaryDate) : dayjs(),
        mood: record.mood,
        weather: record.weather,
      });
    }, 50);
  };

  const handleDetail = (record: DiaryDto) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  const handleAddConfirm = async () => {
    try {
      const values = await addFormRef.current?.validate?.();
      if (!values) {
        return;
      }

      await createDiary({
        title: values.title,
        content: values.content,
        diaryDate: dayjs(values.diaryDate).format('YYYY-MM-DD'),
        mood: values.mood as DiaryMood,
        weather: values.weather,
      });

      Message.success('日记创建成功');
      setAddVisible(false);
      addFormRef.current?.resetFields?.();
      fetchTableData(searchParams, pagination.pageSize, pagination.current);
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      Message.error('日记创建失败');
    }
  };

  const handleEditConfirm = async () => {
    try {
      const values = await editFormRef.current?.validate?.();
      if (!values || !currentRecord) {
        return;
      }

      await updateDiary({
        id: currentRecord.id,
        title: values.title,
        content: values.content,
        diaryDate: dayjs(values.diaryDate).format('YYYY-MM-DD'),
        mood: values.mood as DiaryMood,
        weather: values.weather,
        archived: currentRecord.archived,
      });

      Message.success('日记更新成功');
      setEditVisible(false);
      fetchTableData(searchParams, pagination.pageSize, pagination.current);
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      Message.error('日记更新失败');
    }
  };

  const handleDelete = async (record: DiaryDto) => {
    try {
      await deleteDiary(record.id);
      Message.success('日记删除成功');
      fetchTableData(searchParams, pagination.pageSize, pagination.current);
    } catch (error) {
      Message.error('日记删除失败');
    }
  };

  const handleArchive = async (record: DiaryDto) => {
    try {
      await archiveDiary(record.id, !record.archived);
      Message.success(record.archived ? '已取消归档' : '已归档');
      fetchTableData(searchParams, pagination.pageSize, pagination.current);
    } catch (error) {
      Message.error('归档操作失败');
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'diaryDate',
      width: 140,
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (text: string, record: DiaryDto) => (
        <Link onClick={() => handleDetail(record)} style={{ textDecoration: 'underline' }}>
          {text}
        </Link>
      ),
    },
    {
      title: '心情',
      dataIndex: 'mood',
      width: 110,
      align: 'center' as const,
      render: (mood: string) => {
        const mapped = moodTagMap[mood] || { color: 'gray', text: mood };
        return (
          <Tag color={mapped.color} bordered>
            {mapped.text}
          </Tag>
        );
      },
    },
    {
      title: '天气',
      dataIndex: 'weather',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'archived',
      width: 110,
      align: 'center' as const,
      render: (archived: boolean) => (
        <Tag color={archived ? 'gray' : 'green'} bordered>
          {archived ? '已归档' : '使用中'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateDate',
      width: 180,
      render: (value: string) => renderDate(value),
    },
    {
      title: '操作',
      width: 170,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: DiaryDto) => (
        <div className="table-btn-group" style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              icon={<IconEdit />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(record);
              }}
            />
          </Tooltip>

          <Tooltip content={record.archived ? '取消归档' : '归档'}>
            <Popconfirm
              title={record.archived ? '确认取消归档吗？' : '确认归档这篇日记吗？'}
              onOk={() => handleArchive(record)}
              onCancel={(e) => e.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                icon={<IconArchive />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>

          <Tooltip content="删除">
            <Popconfirm
              title="确认删除这篇日记吗？"
              onOk={() => handleDelete(record)}
              onCancel={(e) => e.stopPropagation()}
            >
              <Button
                type="text"
                size="small"
                status="danger"
                icon={<IconDelete />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Tooltip>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const calculateTableHeight = () => {
      const windowHeight = window.innerHeight;
      const otherElementsHeight = 330;
      const newHeight = Math.max(120, windowHeight - otherElementsHeight);
      setTableScrollHeight((prev) => (prev === newHeight ? prev : newHeight));
    };

    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    return () => window.removeEventListener('resize', calculateTableHeight);
  }, []);

  useEffect(() => {
    fetchTableData(searchParams, pagination.pageSize, pagination.current);
  }, [searchParams, pagination.current, pagination.pageSize]);

  const filterContent = (
    <FilterForm
      ref={filterFormRef}
      initialValues={buildDefaultSearchParams()}
      formFields={searchFormFields}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  return (
    <div className="diary-manager">
      <DataManager
        data={tableData}
        loading={tableLoading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{ onAdd: handleAdd }}
        config={{
          showModeToggle: false,
          displayMode: 'table',
          filterContent,
          tableColumns: columns,
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <Modal
        title="新增日记"
        visible={addVisible}
        onOk={handleAddConfirm}
        onCancel={() => setAddVisible(false)}
      >
        <Form ref={addFormRef} layout="vertical" className="modal-form">
          <Form.Item label="标题" field="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="今天发生了什么？" />
          </Form.Item>
          <Form.Item label="正文" field="content" rules={[{ required: true, message: '请输入正文' }]}>
            <TextArea placeholder="记录今天的想法和经历" autoSize={{ minRows: 5, maxRows: 10 }} />
          </Form.Item>
          <Form.Item label="日期" field="diaryDate" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="心情" field="mood" rules={[{ required: true, message: '请选择心情' }]}>
            <Select placeholder="请选择心情">
              {moodOptions.map((it) => (
                <Option key={it.value} value={it.value}>
                  {it.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="天气" field="weather">
            <Input placeholder="例如：晴 / 多云 / 小雨" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑日记"
        visible={editVisible}
        onOk={handleEditConfirm}
        onCancel={() => setEditVisible(false)}
      >
        <Form ref={editFormRef} layout="vertical" className="modal-form">
          <Form.Item label="标题" field="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="今天发生了什么？" />
          </Form.Item>
          <Form.Item label="正文" field="content" rules={[{ required: true, message: '请输入正文' }]}>
            <TextArea placeholder="记录今天的想法和经历" autoSize={{ minRows: 5, maxRows: 10 }} />
          </Form.Item>
          <Form.Item label="日期" field="diaryDate" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="心情" field="mood" rules={[{ required: true, message: '请选择心情' }]}>
            <Select placeholder="请选择心情">
              {moodOptions.map((it) => (
                <Option key={it.value} value={it.value}>
                  {it.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="天气" field="weather">
            <Input placeholder="例如：晴 / 多云 / 小雨" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={currentRecord?.title ? `日记详情 - ${currentRecord.title}` : '日记详情'}
        visible={detailVisible}
        footer={null}
        onCancel={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <div className="diary-detail">
            <div className="diary-meta">
              <Tag bordered color="arcoblue">
                {currentRecord.diaryDate ? dayjs(currentRecord.diaryDate).format('YYYY-MM-DD') : '-'}
              </Tag>
              <Tag bordered color={moodTagMap[currentRecord.mood]?.color || 'gray'}>
                {moodTagMap[currentRecord.mood]?.text || currentRecord.mood}
              </Tag>
              <Tag bordered color={currentRecord.archived ? 'gray' : 'green'}>
                {currentRecord.archived ? '已归档' : '使用中'}
              </Tag>
            </div>
            <div className="diary-weather">天气：{currentRecord.weather || '-'}</div>
            <div className="diary-content">{currentRecord.content}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DiaryPage;

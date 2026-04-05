import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Upload,
} from '@arco-design/web-react';
import { IconDelete, IconEdit, IconRefresh, IconRobot } from '@arco-design/web-react/icon';
import DataManager from '@/components/DataManager';
import FilterForm from '@/components/FilterForm';
import { FormFieldConfig } from '@/components/types/types';
import renderDate from '@/utils/timeUtil';
import { getLLMModelsByType } from '@/services/llmModelService';
import {
  createWrongQuestion,
  deleteWrongQuestion,
  getAllSubjects,
  getCategoriesBySubjectId,
  getWrongQuestionList,
  updateWrongQuestion,
  uploadWrongQuestionImage,
  WrongQuestionCreateDto,
  WrongQuestionDto,
  WrongQuestionQueryDto,
  WrongQuestionUpdateDto,
} from './api';
import './style/index.less';

const { TextArea } = Input;
const Option = Select.Option;

const QUESTION_TYPE_OPTIONS = [
  { label: '单选题', value: 'SINGLE' },
  { label: '多选题', value: 'MULTIPLE' },
  { label: '填空题', value: 'BLANK' },
  { label: '简答题', value: 'SHORT_ANSWER' },
];

const DIFFICULTY_OPTIONS = [
  { label: '简单', value: 'EASY' },
  { label: '中等', value: 'MEDIUM' },
  { label: '困难', value: 'HARD' },
];

const getTypeLabel = (value?: string) =>
  QUESTION_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-';

const getDifficultyLabel = (value?: string) =>
  DIFFICULTY_OPTIONS.find((item) => item.value === value)?.label || value || '-';

const buildContentPreview = (content?: string) => {
  if (!content) return '-';
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
};

const WrongQuestionPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WrongQuestionDto[]>([]);
  const [tableScrollHeight, setTableScrollHeight] = useState(420);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showTotal: true,
    showJumper: true,
    showPageSize: true,
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);

  const [searchParams, setSearchParams] = useState<WrongQuestionQueryDto>({});

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<WrongQuestionDto | null>(null);
  const [saving, setSaving] = useState(false);

  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [uploadedFileMeta, setUploadedFileMeta] = useState<any>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrModel, setOcrModel] = useState('');

  const subjectOptions = useMemo(
    () => (subjects || []).map((item: any) => ({ label: item.name || item.label, value: item.id })),
    [subjects]
  );

  const categoryOptions = useMemo(
    () => (categories || []).map((item: any) => ({ label: item.name || item.label, value: item.id })),
    [categories]
  );

  const fetchData = useCallback(
    async (
      params: typeof searchParams = searchParams,
      pageSize: number = pagination.pageSize,
      current: number = pagination.current
    ) => {
      setLoading(true);
      try {
        const payload = {
          ...params,
          pageNum: current - 1,
          pageSize,
        };
        const res: any = await getWrongQuestionList(payload);
        const page = res?.data || res;
        setData(page?.content || []);
        setPagination((prev) => ({
          ...prev,
          current,
          pageSize,
          total: page?.totalElements || 0,
        }));
      } catch (e: any) {
        Message.error(e?.message || '加载错题列表失败');
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, searchParams]
  );

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const res: any = await getAllSubjects();
      const list = res?.data || res || [];
      setSubjects(list);
    } catch (e: any) {
      Message.error(e?.message || '加载学科失败');
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const res: any = await getLLMModelsByType('VISION');
      const list = res?.data || res || [];
      setModels(list);
      const defaultModel = list.find((item: any) => item.isDefault === '1' || item.isDefault === 1);
      if (defaultModel?.name) {
        setOcrModel(defaultModel.name);
      } else if (list[0]?.name) {
        setOcrModel(list[0].name);
      }
    } catch (e) {
      // OCR 模型列表失败不阻塞页面使用
    }
  }, []);

  const loadCategories = useCallback(async (subjectId?: string) => {
    if (!subjectId) {
      setCategories([]);
      return;
    }
    try {
      const res: any = await getCategoriesBySubjectId(subjectId);
      setCategories(res?.data || res || []);
    } catch (e: any) {
      setCategories([]);
      Message.error(e?.message || '加载分类失败');
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    loadModels();
    fetchData();
  }, []);

  const resetFormUploadState = () => {
    setPreviewImageUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return '';
    });
    setUploadedFileMeta(null);
    setOcrText('');
    setOcrLoading(false);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ type: 'SINGLE' });
    setCategories([]);
    resetFormUploadState();
    setEditModalVisible(true);
  };

  const openEditModal = async (record: WrongQuestionDto) => {
    setEditingItem(record);
    form.resetFields();
    await loadCategories(record.subjectId);
    form.setFieldsValue({
      subjectId: record.subjectId,
      categoryId: record.categoryId,
      type: record.type,
      content: record.content,
      answer: record.answer,
      difficulty: record.difficulty,
      remark: record.remark,
    });
    setPreviewImageUrl(record.originalImageUrl || '');
    setUploadedFileMeta(
      record.originalImageFileId
        ? {
            id: record.originalImageFileId,
            originalName: record.originalImageName,
          }
        : null
    );
    setOcrText(record.ocrText || '');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingItem(null);
    form.resetFields();
    setCategories([]);
    resetFormUploadState();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWrongQuestion(id);
      Message.success('删除成功');
      fetchData();
    } catch (e: any) {
      Message.error(e?.message || '删除失败');
    }
  };

  const parseOcrStream = async (file: File) => {
    setOcrLoading(true);
    setOcrText('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (ocrModel) {
        formData.append('model', ocrModel);
      }
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/ocr/recognize', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'text/event-stream',
          ...(token ? { Authorization: token } : {}),
        },
      });
      if (!resp.ok || !resp.body) {
        const text = await resp.text();
        throw new Error(text || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let done = false;
      let accumulated = '';
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (!result.value) continue;
        buffer += decoder.decode(result.value, { stream: true });
        let idx = -1;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const data = eventBlock
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');
          if (!data) continue;
          if (data.startsWith('[ERROR]')) {
            throw new Error(data.replace('[ERROR]', '').trim());
          }
          if (data.trim() === '[PARSE_RESULT]') {
            continue;
          }
          accumulated += data;
          setOcrText(accumulated);
          if (!form.getFieldValue('content')) {
            form.setFieldValue('content', accumulated.trim());
          }
        }
      }
      if (buffer.trim()) {
        const lastData = buffer
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (lastData && lastData !== '[PARSE_RESULT]') {
          accumulated += lastData;
          setOcrText(accumulated);
          if (!form.getFieldValue('content')) {
            form.setFieldValue('content', accumulated.trim());
          }
        }
      }
      if (accumulated.trim()) {
        Message.success('OCR识别完成，已回填题目内容');
      } else {
        Message.warning('OCR已执行，但未识别到有效文本');
      }
    } catch (e: any) {
      Message.error(e?.message || 'OCR识别失败');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCustomUpload = async (option: any) => {
    const file = option.file as File;
    try {
      const uploadRes: any = await uploadWrongQuestionImage(file);
      const fileMeta = uploadRes?.data || uploadRes;
      setUploadedFileMeta(fileMeta);
      setPreviewImageUrl((prev) => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });
      option.onSuccess?.(fileMeta);
      Message.success('图片上传成功，开始识别');
      await parseOcrStream(file);
    } catch (e: any) {
      option.onError?.(e);
      Message.error(e?.message || '图片上传失败');
    }
  };

  const handleSave = async () => {
    const values = await form.validate();
    setSaving(true);
    try {
      const payloadBase = {
        ...values,
        originalImageFileId: uploadedFileMeta?.id || undefined,
        originalImageName: uploadedFileMeta?.originalName || uploadedFileMeta?.name || undefined,
        ocrText: ocrText || undefined,
      };
      if (editingItem) {
        const payload: WrongQuestionUpdateDto = {
          id: editingItem.id,
          ...payloadBase,
        };
        await updateWrongQuestion(payload);
        Message.success('更新成功');
      } else {
        const payload: WrongQuestionCreateDto = payloadBase;
        await createWrongQuestion(payload);
        Message.success('创建成功');
      }
      closeEditModal();
      fetchData();
    } catch (e: any) {
      Message.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (values: any) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null)
    );
    setSearchParams(cleaned);
    fetchData(cleaned, pagination.pageSize, 1);
  };

  const handleReset = () => {
    const defaults = {};
    setSearchParams(defaults);
    fetchData(defaults, pagination.pageSize, 1);
  };

  const handlePaginationChange = (nextPagination: any) => {
    fetchData(searchParams, nextPagination.pageSize, nextPagination.current);
  };

  const searchFormFields: FormFieldConfig[] = [
    {
      field: 'subjectId',
      label: '科目',
      type: 'select',
      options: subjectOptions,
      placeholder: '请选择科目',
      span: 6,
      allowClear: true,
    },
    {
      field: 'categoryId',
      label: '分类',
      type: 'select',
      options: categoryOptions,
      placeholder: '请选择分类',
      span: 6,
      allowClear: true,
    },
    {
      field: 'type',
      label: '题型',
      type: 'select',
      options: QUESTION_TYPE_OPTIONS,
      placeholder: '请选择题型',
      span: 4,
      allowClear: true,
    },
    {
      field: 'difficulty',
      label: '难度',
      type: 'select',
      options: DIFFICULTY_OPTIONS,
      placeholder: '请选择难度',
      span: 4,
      allowClear: true,
    },
    {
      field: 'content',
      label: '题目内容',
      type: 'input',
      placeholder: '输入题目关键词',
      span: 8,
    },
  ];

  const filterContent = (
    <FilterForm
      formFields={searchFormFields}
      initialValues={{ subjectId: '', categoryId: '', type: '', difficulty: '', content: '' }}
      onValuesChange={(changeValue, values) => {
        if (Object.prototype.hasOwnProperty.call(changeValue, 'subjectId')) {
          loadCategories(values?.subjectId);
        }
      }}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  );

  const columns = [
    {
      title: '题目内容',
      dataIndex: 'content',
      ellipsis: true,
      minWidth: 300,
      render: (value: string) => buildContentPreview(value),
    },
    {
      title: '科目',
      dataIndex: 'subjectName',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '题型',
      dataIndex: 'type',
      width: 100,
      render: (value: string) => <Tag color="blue">{getTypeLabel(value)}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 100,
      render: (value: string) => (value ? <Tag color="arcoblue">{getDifficultyLabel(value)}</Tag> : '-'),
    },
    {
      title: '原图',
      dataIndex: 'originalImageUrl',
      width: 90,
      render: (_: any, record: WrongQuestionDto) =>
        record.originalImageUrl ? (
          <Image src={record.originalImageUrl} width={44} height={44} fit="cover" preview />
        ) : (
          '-'
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createDate',
      width: 160,
      render: (value: string) => renderDate(value),
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: WrongQuestionDto) => (
        <Space>
          <Tooltip content="编辑">
            <Button type="text" size="small" icon={<IconEdit />} onClick={() => openEditModal(record)} />
          </Tooltip>
          <Tooltip content="删除">
            <Popconfirm title="确认删除该错题吗？" onOk={() => handleDelete(record.id)}>
              <Button type="text" size="small" status="danger" icon={<IconDelete />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const calculateTableScrollHeight = useCallback(() => {
    const container = pageRef.current;
    if (!container) return;
    const content = container.querySelector('.data-manager-content') as HTMLElement | null;
    let nextHeight = 420;
    if (content && content.clientHeight > 0) {
      nextHeight = Math.max(260, content.clientHeight - 20);
    } else {
      const header = container.querySelector('.data-manager-header') as HTMLElement | null;
      const footer = container.querySelector('.data-manager-footer') as HTMLElement | null;
      const occupiedHeight = (header?.offsetHeight || 0) + (footer?.offsetHeight || 0) + 28;
      nextHeight = Math.max(260, container.clientHeight - occupiedHeight);
    }
    setTableScrollHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
    const onResize = () => calculateTableScrollHeight();
    window.addEventListener('resize', onResize);
    let observer: ResizeObserver | null = null;
    if (pageRef.current && 'ResizeObserver' in window) {
      observer = new ResizeObserver(() => calculateTableScrollHeight());
      observer.observe(pageRef.current);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [calculateTableScrollHeight]);

  useEffect(() => {
    const timer = window.setTimeout(() => calculateTableScrollHeight(), 0);
    return () => window.clearTimeout(timer);
  }, [data.length, pagination.current, pagination.pageSize, calculateTableScrollHeight]);

  return (
    <div className="wrong-question-page" ref={pageRef}>
      <DataManager
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={{
          onAdd: openCreateModal,
        }}
        config={{
          showModeToggle: false,
          displayMode: 'table',
          filterContent,
          tableColumns: columns,
          tableProps: {
            scroll: { x: 1150, y: tableScrollHeight },
          },
        }}
        tableScrollHeight={tableScrollHeight}
      />

      <Modal
        title={editingItem ? '编辑错题' : '新增错题'}
        visible={editModalVisible}
        onCancel={closeEditModal}
        maskClosable={false}
        style={{ width: 820 }}
        footer={
          <Space>
            <Button onClick={closeEditModal}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="学科" field="subjectId" rules={[{ required: true, message: '请选择学科' }]}>
            <Select
              options={subjectOptions}
              placeholder="请选择学科"
              loading={subjectsLoading}
              onChange={(value) => {
                form.setFieldValue('categoryId', undefined);
                loadCategories(value);
              }}
            />
          </Form.Item>

          <Form.Item label="分类" field="categoryId">
            <Select options={categoryOptions} placeholder="请选择分类" allowClear />
          </Form.Item>

          <Form.Item label="题型" field="type" rules={[{ required: true, message: '请选择题型' }]}>
            <Select options={QUESTION_TYPE_OPTIONS} placeholder="请选择题型" />
          </Form.Item>

          <Form.Item label="难度" field="difficulty">
            <Select options={DIFFICULTY_OPTIONS} placeholder="请选择难度" allowClear />
          </Form.Item>

          <Form.Item label="题目内容" field="content" rules={[{ required: true, message: '请输入题目内容' }]}>
            <TextArea placeholder="请输入错题内容，上传图片识别后会自动回填" autoSize={{ minRows: 5, maxRows: 10 }} />
          </Form.Item>

          <Form.Item label="答案" field="answer">
            <TextArea placeholder="可选，记录参考答案" autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>

          <Form.Item label="解析 / 备注" field="remark">
            <TextArea placeholder="可选，记录解析或备注" autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>

          <Form.Item label="原始图片 / OCR识别">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Space wrap>
                <Upload showUploadList={false} customRequest={handleCustomUpload} accept="image/*">
                  <Button icon={<IconRobot />} loading={ocrLoading}>上传图片并识别</Button>
                </Upload>
                {previewImageUrl && (
                  <Button icon={<IconRefresh />} onClick={resetFormUploadState}>
                    清空图片与识别结果
                  </Button>
                )}
                <Select
                  style={{ width: 240 }}
                  value={ocrModel}
                  onChange={setOcrModel}
                  placeholder="选择OCR模型"
                  allowClear
                >
                  {models.map((model: any) => (
                    <Option key={model.name} value={model.name}>
                      {model.name}
                    </Option>
                  ))}
                </Select>
              </Space>

              <div className="wrong-question-form-upload-tip">
                上传图片后会先保存原图，再调用现有 OCR 接口识别，并自动回填到题目内容。
              </div>

              {previewImageUrl ? <img className="wrong-question-form-image-preview" src={previewImageUrl} alt="错题原图" /> : null}

              {(ocrText || uploadedFileMeta) && (
                <div className="wrong-question-form-ocr-box">
                  {uploadedFileMeta?.originalName || uploadedFileMeta?.name ? (
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>
                      原图文件：{uploadedFileMeta.originalName || uploadedFileMeta.name}
                    </div>
                  ) : null}
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>OCR识别结果</div>
                  <div className="wrong-question-form-ocr-text">{ocrText || '暂无识别结果'}</div>
                </div>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WrongQuestionPage;

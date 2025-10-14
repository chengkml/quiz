import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Button,
  Message,
  Spin,
  Form,
  Radio,
  Checkbox,
  Input,
  Space,
  Tag,
  Divider
} from '@arco-design/web-react';
import { getExamById, submitExam } from '../api';
import { ExamDto, ExamResultDto, ExamSubmitDto } from '../types';

const { Content } = Layout;
const { TextArea } = Input;

function parseOptions(options: any): Array<{ key: string; text: string }> {
  if (!options) return [];
  try {
    const obj = typeof options === 'string' ? JSON.parse(options) : options;
    if (Array.isArray(obj?.options)) {
      return obj.options.map((o: any) => ({ key: String(o.key ?? o.value ?? o.option ?? ''), text: String(o.text ?? o.label ?? '') }));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .filter(([k]) => k !== 'blanks' && k !== 'requirements')
        .map(([key, value]) => ({ key: String(key), text: String((value as any)?.text ?? value) }));
    }
  } catch (e) {
    if (typeof options === 'string') {
      const parts = options.split(';').map((s: string) => s.trim()).filter(Boolean);
      return parts.map((p, idx) => ({ key: String.fromCharCode(65 + idx), text: p }));
    }
  }
  return [];
}

function parseBlanks(options: any): string[] {
  if (!options) return [];
  try {
    const obj = typeof options === 'string' ? JSON.parse(options) : options;
    if (Array.isArray(obj?.blanks)) {
      return obj.blanks.map((b: any) => String(b));
    }
  } catch (e) {}
  return [];
}

const ExamTakePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [exam, setExam] = useState<ExamDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchExam = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const resp = await getExamById(id);
        setExam(resp.data);
      } catch (e) {
        Message.error('获取试卷详情失败');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id]);

  useEffect(() => {
    if (exam?.questions) {
      const init: Record<string, string[]> = {};
      for (const q of exam.questions) {
        const eqId = q.id as string;
        const type = (q.question as any)?.type;
        if (type === 'MULTIPLE') init[eqId] = [];
        else init[eqId] = [''];
      }
      setAnswers(init);
    }
  }, [exam?.questions]);

  const onSingleChange = (eqId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [eqId]: [value] }));
  };

  const onMultipleChange = (eqId: string, values: string[]) => {
    setAnswers(prev => ({ ...prev, [eqId]: values }));
  };

  const onBlankChange = (eqId: string, idx: number, value: string) => {
    setAnswers(prev => {
      const current = prev[eqId] || [];
      const next = [...current];
      next[idx] = value;
      return { ...prev, [eqId]: next };
    });
  };

  const onShortAnswerChange = (eqId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [eqId]: [value] }));
  };

  const handleSubmit = async () => {
    if (!exam || !id) return;
    try {
      setSubmitting(true);
      const userInfoStr = localStorage.getItem('userInfo');
      const userId = userInfoStr ? (JSON.parse(userInfoStr)?.userId || '') : '';

      const submitBody: ExamSubmitDto = {
        userId,
        answers: (exam.questions || []).map(q => ({
          examQuestionId: q.id as string,
          answers: (answers[q.id as string] || []).filter(v => v !== undefined && v !== null).map(v => String(v))
        }))
      };

      const resp = await submitExam(id, submitBody);
      const result: ExamResultDto = resp.data;
      Message.success(`提交成功，得分：${result.totalScore}`);
      navigate('/quiz/frame/exam');
    } catch (e) {
      Message.error('提交考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  const header = useMemo(() => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{exam?.name}</div>
        <div style={{ color: '#666', marginTop: 4 }}>{exam?.description}</div>
      </div>
      <Space>
        <Tag color='blue'>总分：{exam?.totalScore}</Tag>
        {exam?.durationMinutes && <Tag color='orange'>时长：{exam?.durationMinutes} 分钟</Tag>}
      </Space>
    </div>
  ), [exam]);

  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ margin: 10, background: '#fff', borderRadius: 8, padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Spin />
          </div>
        ) : (
          <div>
            {header}
            <Divider />
            <Form layout='vertical'>
              {(exam?.questions || []).map((eq, idx) => {
                const q = eq.question as any;
                const eqId = eq.id as string;
                const type = q?.type;
                const opts = parseOptions(q?.options);
                const blanks = parseBlanks(q?.options);
                return (
                  <div key={eqId} style={{ padding: 12, border: '1px solid var(--color-border-2)', borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Space>
                        <Tag color='arcoblue'>第{idx + 1}题</Tag>
                        <Tag color={type === 'SINGLE' ? 'blue' : type === 'MULTIPLE' ? 'purple' : type === 'BLANK' ? 'green' : 'orange'}>
                          {type === 'SINGLE' ? '单选题' : type === 'MULTIPLE' ? '多选题' : type === 'BLANK' ? '填空题' : '简答题'}
                        </Tag>
                        <Tag>分值：{eq.score}</Tag>
                      </Space>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{q?.content}</div>

                    {type === 'SINGLE' && (
                      <Radio.Group
                        value={(answers[eqId] || [''])[0]}
                        onChange={(val) => onSingleChange(eqId, String(val))}
                      >
                        <Space direction='vertical'>
                          {opts.map(opt => (
                            <Radio key={opt.key} value={opt.key}>{opt.key}. {opt.text}</Radio>
                          ))}
                        </Space>
                      </Radio.Group>
                    )}

                    {type === 'MULTIPLE' && (
                      <Checkbox.Group
                        value={(answers[eqId] || [])}
                        onChange={(vals) => onMultipleChange(eqId, (vals as string[]).map(v => String(v)))}
                      >
                        <Space direction='vertical'>
                          {opts.map(opt => (
                            <Checkbox key={opt.key} value={opt.key}>{opt.key}. {opt.text}</Checkbox>
                          ))}
                        </Space>
                      </Checkbox.Group>
                    )}

                    {type === 'BLANK' && (
                      <Space direction='vertical' style={{ width: '100%' }}>
                        {(blanks.length > 0 ? blanks : ['']).map((placeholder, i) => (
                          <Input
                            key={i}
                            placeholder={placeholder ? `填空 ${i + 1}：${placeholder}` : `填空 ${i + 1}`}
                            value={(answers[eqId] || [''])[i] || ''}
                            onChange={(val) => onBlankChange(eqId, i, String(val))}
                          />
                        ))}
                      </Space>
                    )}

                    {type === 'SHORT_ANSWER' && (
                      <TextArea
                        placeholder='请输入你的答案'
                        value={(answers[eqId] || [''])[0] || ''}
                        onChange={(val) => onShortAnswerChange(eqId, String(val))}
                        rows={4}
                      />
                    )}
                  </div>
                );
              })}
            </Form>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => navigate('/quiz/frame/exam')}>取消</Button>
                <Button type='primary' loading={submitting} onClick={handleSubmit}>提交试卷</Button>
              </Space>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ExamTakePage;
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
  Divider,
  Modal,
  Tooltip
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
  const [markedMap, setMarkedMap] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const questionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = React.useRef<number | null>(null);
  const warnedRef = React.useRef<boolean>(false);
  const autoSubmittedRef = React.useRef<boolean>(false);

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

  // 初始化并运行倒计时
  useEffect(() => {
    if (!exam?.durationMinutes) {
      // 无时长则不启动倒计时
      return;
    }
    // 重置状态
    setRemainingSeconds(exam.durationMinutes * 60);
    warnedRef.current = false;
    autoSubmittedRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = (window.setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        if (next === 300 && !warnedRef.current) {
          warnedRef.current = true;
          Message.warning('考试剩余 5 分钟，请尽快提交');
        }
        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (!autoSubmittedRef.current && !submitting) {
            autoSubmittedRef.current = true;
            Message.info('考试时间到，正在自动提交');
            // 直接自动交卷，忽略未作答提示
            doSubmit();
          }
          return 0;
        }
        return next;
      });
    }, 1000) as any);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [exam?.durationMinutes]);

  useEffect(() => {
    if (exam?.questions) {
      const init: Record<string, string[]> = {};
      const initMarked: Record<string, boolean> = {};
      for (const q of exam.questions) {
        const eqId = q.id as string;
        const type = (q.question as any)?.type;
        if (type === 'MULTIPLE') init[eqId] = [];
        else init[eqId] = [''];
        initMarked[eqId] = false;
      }
      setAnswers(init);
      setMarkedMap(initMarked);
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

  const toggleMark = (eqId: string) => {
    setMarkedMap(prev => ({ ...prev, [eqId]: !prev[eqId] }));
  };

  const isAnswered = (eqId: string): boolean => {
    const a = answers[eqId];
    if (!a) return false;
    const q = (exam?.questions || []).find(x => String(x.id) === String(eqId)) as any;
    const type = q?.question?.type;
    if (type === 'MULTIPLE') return a.length > 0;
    if (type === 'BLANK') return a.some(v => v && String(v).trim() !== '');
    return !!(a[0] && String(a[0]).trim() !== '');
  };

  const scrollToIndex = (index: number) => {
    const list = exam?.questions || [];
    if (index < 0 || index >= list.length) return;
    setCurrentIndex(index);
    const targetId = String(list[index].id);
    const el = questionRefs.current[targetId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goPrev = () => scrollToIndex(currentIndex - 1);
  const goNext = () => scrollToIndex(currentIndex + 1);

  const doSubmit = async () => {
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
      // 跳转到结果详情页，而不是考试列表页
      navigate(`/quiz/frame/exam/result/${result.resultId}`);
    } catch (e) {
      Message.error('提交考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!exam || !id) return;
    const unanswered = (exam.questions || [])
      .map((q, idx) => ({ idx: idx + 1, id: String(q.id) }))
      .filter(({ id }) => !isAnswered(id))
      .map(({ idx }) => idx);

    if (unanswered.length > 0) {
      const listText = unanswered.slice(0, 20).join('、');
      Modal.confirm({
        title: '还有未作答的题目',
        content: `共有 ${unanswered.length} 题未作答：第 ${listText}${unanswered.length > 20 ? ' 等' : ''} 题。是否继续提交？`,
        okText: '继续提交',
        cancelText: '返回作答',
        onOk: () => {
          doSubmit();
        }
      });
      return;
    }
    await doSubmit();
  };

  const formatTime = (sec: number): string => {
    if (!sec || sec <= 0) return '00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const two = (n: number) => String(n).padStart(2, '0');
    if (h > 0) return `${two(h)}:${two(m)}:${two(s)}`;
    return `${two(m)}:${two(s)}`;
  };

  const header = useMemo(() => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{exam?.name}</div>
        <div style={{ color: '#666', marginTop: 4 }}>{exam?.description}</div>
      </div>
      <Space>
        <Tag color='blue'>总分：{exam?.totalScore}</Tag>
        {exam?.durationMinutes && (
          <Tag color={remainingSeconds <= 300 ? 'red' : 'orange'}>
            剩余时间：{formatTime(Math.max(0, remainingSeconds))}
          </Tag>
        )}
      </Space>
    </div>
  ), [exam, remainingSeconds]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ margin: 10, background: '#fff', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 20px)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Spin />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 顶部固定区域：试卷信息 + 题目导航 */}
            <div style={{ flex: '0 0 auto' }}>
              {header}
              <div style={{ background: '#fff', padding: '8px 0', borderBottom: '1px solid var(--color-border-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Space>
                    <Tag color='arcoblue'>题目导航</Tag>
                    <Tag>共 {exam?.questions?.length || 0} 题</Tag>
                  </Space>
                  <Space>
                    <Button size='small' onClick={goPrev} disabled={currentIndex <= 0}>上一题</Button>
                    <Button size='small' onClick={goNext} disabled={(exam?.questions?.length || 0) === 0 || currentIndex >= (exam?.questions?.length || 0) - 1}>下一题</Button>
                  </Space>
                </div>
                <Space wrap>
                  {(exam?.questions || []).map((eq, idx) => {
                    const eqId = String(eq.id);
                    const answered = isAnswered(eqId);
                    const marked = !!markedMap[eqId];
                    const type = (eq.question as any)?.type;
                    return (
                      <Tooltip key={eqId} content={`第${idx + 1}题（${type || '未知类型'}）${answered ? ' - 已作答' : ' - 未作答'}${marked ? ' - 已标记' : ''}`}>
                        <Button
                          size='mini'
                          type={answered ? 'primary' : 'outline'}
                          onClick={() => scrollToIndex(idx)}
                          style={{
                            minWidth: 32,
                            borderColor: marked ? '#faad14' : undefined,
                            color: marked ? '#faad14' : undefined,
                          }}
                        >
                          {idx + 1}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Space>
              </div>
            </div>

            {/* 中间滚动区域：题目列表 */}
            <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingTop: 12 }}>
              <Divider style={{ margin: '12px 0' }} />
              <Form layout='vertical'>
                {(exam?.questions || []).map((eq, idx) => {
                  const q = eq.question as any;
                  const eqId = eq.id as string;
                  const type = q?.type;
                  const opts = parseOptions(q?.options);
                  const blanks = parseBlanks(q?.options);
                  return (
                    <div
                      key={eqId}
                      ref={(el) => { questionRefs.current[String(eqId)] = el; }}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 16,
                        border: (markedMap[String(eqId)]
                          ? '2px solid #faad14'
                          : (isAnswered(String(eqId)) ? '2px solid #52c41a' : '1px solid var(--color-border-2)')),
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Space>
                          <span style={{ fontWeight: 600 }}>{idx + 1}.</span>
                          <Tag color={type === 'SINGLE' ? 'blue' : type === 'MULTIPLE' ? 'purple' : type === 'BLANK' ? 'green' : 'orange'}>
                            {type === 'SINGLE' ? '单选题' : type === 'MULTIPLE' ? '多选题' : type === 'BLANK' ? '填空题' : '简答题'}
                          </Tag>
                          <Tag>分值：{eq.score}</Tag>
                        </Space>
                        <Space>
                          <Button
                            size='mini'
                            type='outline'
                            onClick={() => toggleMark(String(eqId))}
                            style={{
                              borderColor: markedMap[String(eqId)] ? '#faad14' : undefined,
                            }}
                          >
                            {markedMap[String(eqId)] ? '取消标记' : '标记'}
                          </Button>
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
                              <Radio key={opt.key} value={opt.key}>{opt.text}</Radio>
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
                              <Checkbox key={opt.key} value={opt.key}>{opt.text}</Checkbox>
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
            </div>

            {/* 底部固定区域：提交操作 */}
            <div style={{ flex: '0 0 auto', textAlign: 'right', borderTop: '1px solid var(--color-border-2)', paddingTop: 12 }}>
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
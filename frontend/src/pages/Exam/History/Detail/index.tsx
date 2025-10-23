import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Button, Checkbox, Form, Input, Layout, Message, Radio, Space, Spin, Tag, Tooltip} from '@arco-design/web-react';
import {getExamHistoryDetail} from '../api';
import {ExamResultDto} from '../types';

const {Content} = Layout;
const {TextArea} = Input;

function parseOptions(options: any): Array<{ key: string; text: string }> {
    if (!options) return [];
    try {
        const obj = typeof options === 'string' ? JSON.parse(options) : options;
        if (Array.isArray(obj?.options)) {
            return obj.options.map((o: any) => ({
                key: String(o.key ?? o.value ?? o.option ?? ''),
                text: String(o.text ?? o.label ?? '')
            }));
        }
        if (typeof obj === 'object' && obj !== null) {
            return Object.entries(obj)
                .filter(([k]) => k !== 'blanks' && k !== 'requirements')
                .map(([key, value]) => ({key: String(key), text: String((value as any)?.text ?? value)}));
        }
    } catch (e) {
        if (typeof options === 'string') {
            const parts = options.split(';').map((s: string) => s.trim()).filter(Boolean);
            return parts.map((p, idx) => ({key: String.fromCharCode(65 + idx), text: p}));
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
    } catch (e) {
    }
    return [];
}

const ExamHistoryDetailPage: React.FC = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [result, setResult] = useState<ExamResultDto | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const questionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        const fetchResult = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const resp = await getExamHistoryDetail(id);
                setResult(resp.data);
            } catch (e) {
                Message.error('获取答卷详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    const scrollToIndex = (index: number) => {
        const list = result?.questions || [];
        if (index < 0 || index >= list.length) return;
        setCurrentIndex(index);
        const targetId = String(list[index].id);
        const el = questionRefs.current[targetId];
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };

    const goPrev = () => scrollToIndex(currentIndex - 1);
    const goNext = () => scrollToIndex(currentIndex + 1);

    const header = useMemo(() => (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
                <div style={{fontSize: 18, fontWeight: 600}}>{result?.examName}</div>
                <div style={{color: '#666', marginTop: 4}}>提交时间：{result?.submitTime}</div>
            </div>
            <Space>
                <Tag color='blue' bordered>总分：{result?.totalScore}</Tag>
                <Tag color={result?.isPass ? 'green' : 'red'} bordered>
                    得分：{result?.userScore}
                </Tag>
                <Tag color='orange' bordered>
                    正确题数：{result?.correctCount}/{result?.totalCount}
                </Tag>
            </Space>
        </div>
    ), [result]);

    const isCorrect = (questionId: string): boolean => {
        const q = result?.questions?.find(x => String(x.id) === String(questionId));
        return q?.isCorrect || false;
    };

    const getUserAnswers = (questionId: string): string[] => {
        const q = result?.questions?.find(x => String(x.id) === String(questionId));
        return q?.userAnswers || [];
    };

    const getCorrectAnswers = (questionId: string): string[] => {
        const q = result?.questions?.find(x => String(x.id) === String(questionId));
        return q?.correctAnswers || [];
    };

    return (
        <Layout style={{height: '100vh'}}>
            <Content style={{
                margin: 10,
                background: '#fff',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                height: 'calc(100vh - 20px)'
            }}>
                {loading ? (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'}}>
                        <Spin/>
                    </div>
                ) : (
                    <>
                        {/* 左侧区域：试卷信息和题目内容 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            marginRight: 16,
                            overflow: 'hidden'
                        }}>
                            {/* 顶部固定区域：试卷信息 */}
                            <div style={{flex: '0 0 auto', marginBottom: 16}}>
                                {header}
                            </div>

                            {/* 中间滚动区域：题目列表 */}
                            <Form layout='vertical' style={{height: 'calc(100% - 60px)', overflow: 'auto'}}>
                                {(result?.answers || []).map((a, idx) => {
                                    const q = a.question;
                                    const eqId = q.id as string;
                                    const type = q.type;
                                    const opts = parseOptions(q.options);
                                    const blanks = parseBlanks(q.options);
                                    const userAnswers = getUserAnswers(eqId);
                                    const correctAnswers = getCorrectAnswers(eqId);
                                    const correct = isCorrect(eqId);

                                    return (
                                        <div
                                            key={eqId}
                                            ref={(el) => {
                                                questionRefs.current[String(eqId)] = el;
                                            }}
                                            style={{
                                                padding: 12,
                                                borderRadius: 8,
                                                marginBottom: 16,
                                                border: '1px solid var(--color-border-2)',
                                                transition: 'border-color 0.2s, box-shadow 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: 8
                                            }}>
                                                <Space>
                                                    <span style={{fontWeight: 600}}>{idx + 1}.</span>
                                                    <Tag bordered
                                                         color={type === 'SINGLE' ? 'blue' : type === 'MULTIPLE' ? 'purple' : type === 'BLANK' ? 'green' : 'orange'}>
                                                        {type === 'SINGLE' ? '单选题' : type === 'MULTIPLE' ? '多选题' : type === 'BLANK' ? '填空题' : '简答题'}
                                                    </Tag>
                                                    <Tag color={correct ? 'green' : 'red'} bordered>
                                                        {correct ? '正确' : '错误'}
                                                    </Tag>
                                                </Space>
                                            </div>
                                            <div style={{
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                marginBottom: 12
                                            }}>{q.content}</div>

                                            {type === 'SINGLE' && (
                                                <Radio.Group
                                                    value={userAnswers[0] || ''}
                                                >
                                                    <Space direction='vertical'>
                                                        {opts.map(opt => {
                                                            const isUserAnswer = userAnswers.includes(opt.key);
                                                            const isCorrectAnswer = correctAnswers.includes(opt.key);
                                                            let textStyle: React.CSSProperties = {};

                                                            if (isCorrectAnswer) {
                                                                textStyle = {
                                                                    color: '#52c41a',
                                                                    fontWeight: 600
                                                                };
                                                            } else if (isUserAnswer && !isCorrectAnswer) {
                                                                textStyle = {
                                                                    color: '#f5222d',
                                                                    fontWeight: 600
                                                                };
                                                            }

                                                            return (
                                                                <Radio key={opt.key} value={opt.key}>
                                                                    <span style={textStyle}>
                                                                        {opt.text}
                                                                    </span>
                                                                    {isCorrectAnswer && (
                                                                        <Tag color='success'
                                                                             style={{marginLeft: 8}}>正确答案</Tag>
                                                                    )}
                                                                    {isUserAnswer && !isCorrectAnswer && (
                                                                        <Tag color='error'
                                                                             style={{marginLeft: 8}}>你的答案</Tag>
                                                                    )}
                                                                </Radio>
                                                            );
                                                        })}
                                                    </Space>
                                                </Radio.Group>
                                            )}

                                            {type === 'MULTIPLE' && (
                                                <Checkbox.Group
                                                    value={userAnswers}
                                                >
                                                    <Space direction='vertical'>
                                                        {opts.map(opt => {
                                                            const isUserAnswer = userAnswers.includes(opt.key);
                                                            const isCorrectAnswer = correctAnswers.includes(opt.key);
                                                            let textStyle: React.CSSProperties = {};

                                                            if (isCorrectAnswer) {
                                                                textStyle = {
                                                                    color: '#52c41a',
                                                                    fontWeight: 600
                                                                };
                                                            } else if (isUserAnswer && !isCorrectAnswer) {
                                                                textStyle = {
                                                                    color: '#f5222d',
                                                                    fontWeight: 600
                                                                };
                                                            }

                                                            return (
                                                                <Checkbox key={opt.key} value={opt.key}>
                                                                    <span style={textStyle}>
                                                                        {opt.text}
                                                                    </span>
                                                                    {isCorrectAnswer && (
                                                                        <Tag color='success'
                                                                             style={{marginLeft: 8}}>正确答案</Tag>
                                                                    )}
                                                                    {isUserAnswer && !isCorrectAnswer && (
                                                                        <Tag color='error'
                                                                             style={{marginLeft: 8}}>你的答案</Tag>
                                                                    )}
                                                                </Checkbox>
                                                            );
                                                        })}
                                                    </Space>
                                                </Checkbox.Group>
                                            )}

                                            {type === 'BLANK' && (
                                                <Space direction='vertical' style={{width: '100%'}}>
                                                    {(userAnswers.length > 0 ? userAnswers : ['']).map((answer, i) => {
                                                        const correctAnswer = correctAnswers[i] || '';
                                                        const isBlankCorrect = answer === correctAnswer;

                                                        return (
                                                            <div key={i} style={{marginBottom: 8}}>
                                                                <div style={{
                                                                    marginBottom: 4,
                                                                    fontSize: 12,
                                                                    color: '#666'
                                                                }}>填空 {i + 1}：
                                                                </div>
                                                                <Input
                                                                    value={answer}
                                                                    disabled
                                                                    style={{
                                                                        backgroundColor: isBlankCorrect ? '#f0f9ff' : '#fff1f0',
                                                                        borderColor: isBlankCorrect ? '#52c41a' : '#f5222d'
                                                                    }}
                                                                />
                                                                {!isBlankCorrect && correctAnswer && (
                                                                    <div style={{marginTop: 4, fontSize: 12}}>
                                                                        <Tag color='success'
                                                                             style={{marginRight: 8}}>正确答案：</Tag>
                                                                        <span style={{
                                                                            color: '#52c41a',
                                                                            fontWeight: 600
                                                                        }}>{correctAnswer}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </Space>
                                            )}

                                            {type === 'SHORT_ANSWER' && (
                                                <>
                                                    <div
                                                        style={{marginBottom: 8, fontSize: 12, color: '#666'}}>你的答案：
                                                    </div>
                                                    <TextArea
                                                        value={userAnswers[0] || ''}
                                                        disabled
                                                        rows={4}
                                                        style={{
                                                            backgroundColor: correct ? '#f0f9ff' : '#fff1f0',
                                                            borderColor: correct ? '#52c41a' : '#f5222d'
                                                        }}
                                                    />
                                                    {!correct && correctAnswers[0] && (
                                                        <div style={{marginTop: 8}}>
                                                            <div style={{
                                                                marginBottom: 4,
                                                                fontSize: 12, color: '#666'
                                                            }}>正确答案：
                                                            </div>
                                                            <TextArea
                                                                value={correctAnswers[0]}
                                                                disabled
                                                                rows={4}
                                                                style={{
                                                                    backgroundColor: '#f0f9ff',
                                                                    borderColor: '#52c41a'
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* 题目解析 */}
                                            {(q?.explanation || '').trim() && (
                                                <div style={{
                                                    marginTop: 16,
                                                    padding: 12,
                                                    backgroundColor: '#f6ffed',
                                                    border: '1px solid #b7eb8f',
                                                    borderRadius: 4
                                                }}>
                                                    <div
                                                        style={{fontWeight: 600, color: '#389e0d', marginBottom: 4}}>解析：
                                                    </div>
                                                    <div style={{color: '#333', lineHeight: 1.6}}>{q.explanation}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </Form>
                        </div>

                        {/* 右侧区域：题目导航（固定位置） */}
                        <div
                            style={{flex: '0 0 240px', borderLeft: '1px solid var(--color-border-2)', paddingLeft: 16}}>
                            <div style={{position: 'sticky', top: 16}}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                    paddingBottom: 8,
                                    borderBottom: '1px solid var(--color-border-2)'
                                }}>
                                    <Space>
                                        <Tag color='arcoblue' bordered>题目导航</Tag>
                                        <Tag bordered>共 {result?.questions?.length || 0} 题</Tag>
                                    </Space>
                                </div>

                                <div style={{maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', marginBottom: 16}}>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px'}}>
                                        {(result?.answers || []).map((a, idx) => {
                                            const q = a.question;
                                            const eqId = String(q.id);
                                            const type = q.type;
                                            const correct = isCorrect(eqId);
                                            return (
                                                <Tooltip key={eqId}
                                                         content={`第${idx + 1}题（${type || '未知类型'}）${correct ? ' - 正确' : ' - 错误'}`}>
                                                    <Button
                                                        size='mini'
                                                        type={currentIndex === idx ? 'primary' : 'outline'}
                                                        onClick={() => scrollToIndex(idx)}
                                                        style={{
                                                            minWidth: '24px',
                                                            width: '100%',
                                                            height: '24px',
                                                            padding: '0',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        {idx + 1}
                                                    </Button>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 底部固定按钮：返回 */}
                                <div style={{
                                    borderTop: '1px solid var(--color-border-2)',
                                    paddingTop: 12,
                                    marginTop: 8
                                }}>
                                    <Space direction='vertical' style={{width: '100%'}}>
                                        <Button onClick={() => navigate('/quiz/frame/history')}
                                                style={{width: '100%'}}>返回列表</Button>
                                    </Space>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Content>
        </Layout>
    );
};

export default ExamHistoryDetailPage;
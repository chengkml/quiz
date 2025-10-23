import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Checkbox,
    Divider,
    Form,
    Layout,
    Message,
    Radio,
    Space,
    Spin,
    Tag,
    Tooltip,
    Input
} from '@arco-design/web-react';
import {getExamById} from '../api';
import {ExamDto} from '../types';

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

const ExamDetailPage: React.FC = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [exam, setExam] = useState<ExamDto | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const questionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

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

    const scrollToIndex = (index: number) => {
        const list = exam?.questions || [];
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
                <div style={{fontSize: 18, fontWeight: 600}}>{exam?.name}</div>
                <div style={{color: '#666', marginTop: 4}}>{exam?.description}</div>
            </div>
            <Space>
                <Tag color='blue' bordered>总分：{exam?.totalScore}</Tag>
                {exam?.durationMinutes && (
                    <Tag color='orange' bordered>
                        考试时长：{exam.durationMinutes}分钟
                    </Tag>
                )}
            </Space>
        </div>
    ), [exam]);

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
                        <div style={{flex: 1, display: 'flex', flexDirection: 'column', marginRight: 16, overflow: 'hidden'}}>
                            {/* 顶部固定区域：试卷信息 */}
                            <div style={{flex: '0 0 auto', marginBottom: 16}}>
                                {header}
                            </div>

                            {/* 中间滚动区域：题目列表 */}
                            <Form layout='vertical' style={{height: 'calc(100% - 60px)', overflow: 'auto'}}>
                                {(exam?.questions || []).map((eq, idx) => {
                                    const q = eq.question as any;
                                    const eqId = eq.id as string;
                                    const type = q?.type;
                                    const opts = parseOptions(q?.options);
                                    const blanks = parseBlanks(q?.options);
                                    // 获取正确答案
                                    const correctAnswer = q?.answer || '';
                                    
                                    // 解析正确答案
                                    const getCorrectAnswers = () => {
                                        if (type === 'MULTIPLE') {
                                            // 多选题可能是数组或逗号分隔的字符串
                                            if (Array.isArray(correctAnswer)) return correctAnswer;
                                            if (typeof correctAnswer === 'string') {
                                                return correctAnswer.split(',').map(a => a.trim());
                                            }
                                            return [];
                                        } else if (type === 'BLANK') {
                                            // 填空题答案
                                            if (Array.isArray(correctAnswer)) return correctAnswer;
                                            if (typeof correctAnswer === 'string') {
                                                // 尝试解析JSON
                                                try {
                                                    const parsed = JSON.parse(correctAnswer);
                                                    if (Array.isArray(parsed)) return parsed;
                                                } catch (e) {
                                                    // 尝试按分号分隔
                                                    return correctAnswer.split(';').map(a => a.trim());
                                                }
                                            }
                                            return [correctAnswer];
                                        }
                                        // 单选题或简答题
                                        return [correctAnswer];
                                    };
                                    
                                    const correctAnswers = getCorrectAnswers();

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
                                                    <Tag bordered>分值：{eq.score}</Tag>
                                                </Space>
                                            </div>
                                            <div style={{
                                                fontSize: 14,
                                                lineHeight: 1.6,
                                                marginBottom: 12
                                            }}>{q?.content}</div>

                                            {type === 'SINGLE' && (
                                                <Radio.Group
                                                    value={correctAnswers[0] || ''}
                                                >
                                                    <Space direction='vertical'>
                                                        {opts.map(opt => (
                                                            <Radio key={opt.key} value={opt.key}>
                                                                <span style={{
                                                                    color: correctAnswers.includes(opt.key) ? '#52c41a' : 'inherit',
                                                                    fontWeight: correctAnswers.includes(opt.key) ? 600 : 'normal'
                                                                }}>
                                                                    {opt.text}
                                                                </span>
                                                            </Radio>
                                                        ))}
                                                    </Space>
                                                </Radio.Group>
                                            )}

                                            {type === 'MULTIPLE' && (
                                                <Checkbox.Group
                                                    value={correctAnswers}
                                                >
                                                    <Space direction='vertical'>
                                                        {opts.map(opt => (
                                                            <Checkbox key={opt.key} value={opt.key}>
                                                                <span style={{
                                                                    color: correctAnswers.includes(opt.key) ? '#52c41a' : 'inherit',
                                                                    fontWeight: correctAnswers.includes(opt.key) ? 600 : 'normal'
                                                                }}>
                                                                    {opt.text}
                                                                </span>
                                                            </Checkbox>
                                                        ))}
                                                    </Space>
                                                </Checkbox.Group>
                                            )}

                                            {type === 'BLANK' && (
                                                <Space direction='vertical' style={{width: '100%'}}>
                                                    {(correctAnswers.length > 0 ? correctAnswers : ['']).map((answer, i) => (
                                                        <Input
                                                            key={i}
                                                            placeholder={`填空 ${i + 1}`}
                                                            value={answer}
                                                            disabled
                                                            style={{
                                                                backgroundColor: '#f0f9ff',
                                                                fontWeight: 600,
                                                                color: '#1890ff'
                                                            }}
                                                        />
                                                    ))}
                                                </Space>
                                            )}

                                            {type === 'SHORT_ANSWER' && (
                                                <TextArea
                                                    placeholder='正确答案'
                                                    value={correctAnswers[0] || ''}
                                                    disabled
                                                    rows={4}
                                                    style={{
                                                        backgroundColor: '#f0f9ff',
                                                        fontWeight: 600,
                                                        color: '#1890ff'
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </Form>
                        </div>

                        {/* 右侧区域：题目导航（固定位置） */}
                        <div style={{flex: '0 0 240px', borderLeft: '1px solid var(--color-border-2)', paddingLeft: 16}}>
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
                                        <Tag bordered>共 {exam?.questions?.length || 0} 题</Tag>
                                    </Space>
                                </div>
                                
                                <div style={{maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', marginBottom: 16}}>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px'}}>
                                        {(exam?.questions || []).map((eq, idx) => {
                                            const eqId = String(eq.id);
                                            const type = (eq.question as any)?.type;
                                            return (
                                                <Tooltip key={eqId}
                                                         content={`第${idx + 1}题（${type || '未知类型'}）`}>
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
                                        <Button onClick={() => navigate('/quiz/frame/exam')} style={{width: '100%'}}>返回列表</Button>
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



export default ExamDetailPage;
import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Button,
    Card,
    Checkbox,
    Grid,
    Input,
    Layout,
    Message,
    Radio,
    Space,
    Tag,
    Typography
} from '@arco-design/web-react';
import {getExamById, getExamResultDetail} from '@/pages/Exam/api';
import {ExamQuestionDto, ExamResultDto} from '@/pages/Exam/types';
import '../style/index.less';

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

const {Text, Paragraph} = Typography;
const {Row, Col} = Grid;
const {Content} = Layout;

interface ExamResultDetailPageProps {
    resultId?: string | null;
    onBackToHistory?: () => void;
}

const ExamResultDetailPage: React.FC<ExamResultDetailPageProps> = ({resultId, onBackToHistory}) => {
    const {id: urlId} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string[]>>({});
    const [resultHeight, setResultHeight] = useState(200);
    const [detail, setDetail] = useState<ExamResultDto | null>(null);
    const [questionMap, setQuestionMap] = useState<Record<string, ExamQuestionDto>>({});
    const [examName, setExamName] = useState<string>('');
    const [examTotalScore, setExamTotalScore] = useState<number>(0);
    const [showExplanations, setShowExplanations] = useState(true); // 默认显示答案解析
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [showOnlyWrong, setShowOnlyWrong] = useState(false); // 控制是否只显示错题
    const questionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    // 使用传入的resultId或URL中的id
    const currentResultId = resultId || urlId;

    // 获取要显示的题目列表（根据是否只看错题进行过滤）
    const getDisplayAnswers = () => {
        const list = detail?.answers || [];
        if (showOnlyWrong) {
            return list.filter(answer => !answer.correct);
        }
        return list;
    };

    // 滚动到指定题目
    const scrollToIndex = (index: number) => {
        const list = getDisplayAnswers();
        if (index < 0 || index >= list.length) return;
        setCurrentIndex(index);
        const targetId = list[index].examQuestionId;
        const el = questionRefs.current[targetId];
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    };

    const goPrev = () => scrollToIndex(currentIndex - 1);
    const goNext = () => scrollToIndex(currentIndex + 1);

    // 格式化时间显示
    const formatTime = (time: string): string => {
        if (!time) return '--';

        const now = new Date();
        const date = new Date(time);
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        // 今天
        if (diffDays === 0) {
            if (diffSeconds < 60) {
                return `${diffSeconds}秒前`;
            } else if (diffMinutes < 60) {
                return `${diffMinutes}分钟前`;
            } else {
                return `${diffHours}小时前`;
            }
        }
        // 昨天
        else if (diffDays === 1) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `昨天 ${hours}:${minutes}`;
        }
        // 昨天之前
        else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
    }

    const fetchDetail = async (targetResultId: string) => {
        setLoading(true);
        try {
            const res = await getExamResultDetail(targetResultId);
            const d: ExamResultDto = res.data;
            setDetail(d);
            if (d?.examId) {
                try {
                    const er = await getExamById(d.examId);
                    const exam = er.data;
                    setExamName(exam?.name || '');
                    setExamTotalScore(exam?.totalScore || 0);
                    const map: Record<string, ExamQuestionDto> = {};
                    (exam?.questions || []).forEach((q: ExamQuestionDto) => {
                        if (q.id) map[q.id] = q.question;
                    });
                    setQuestionMap(map);
                } catch (e) {
                    console.warn('加载试卷详情失败，题目内容将不展示');
                }
            }
        } catch (e) {
            console.error('加载答卷详情失败', e);
            Message.error('加载答卷详情失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentResultId) fetchDetail(currentResultId);
        setResultHeight(window.innerHeight - 360);
    }, [currentResultId]);

    // 计算得分百分比
    const scorePercentage = detail && examTotalScore > 0
        ? Math.round((detail.totalScore / examTotalScore) * 100)
        : 0;

    // 根据得分获取评价
    const getScoreEvaluation = (percentage: number) => {
        if (percentage >= 90) return {text: '优秀', color: 'success'};
        if (percentage >= 80) return {text: '良好', color: 'green'};
        if (percentage >= 60) return {text: '及格', color: 'orange'};
        return {text: '不及格', color: 'red'};
    };

    const evaluation = getScoreEvaluation(scorePercentage);

    return (
        <div style={{height: '100%'}}>
            <Card style={{marginBottom: 20}}>
                <Row style={{marginBottom: 16}}>
                    <Col span={24}>
                        <div style={{fontSize: 18, fontWeight: 600}}>{examName || '试卷'}</div>
                    </Col>
                </Row>

                {/* 考试详情信息 */}
                <Row style={{marginTop: 16}}>
                    <Col span={24}>
                        <Space size={24}>
                            <Text>
                                得分：<Text strong style={{color: '#52c41a'}}>{detail?.totalScore || 0}</Text>
                            </Text>
                            <Text>
                                正确题数：<Text strong style={{color: '#52c41a'}}>{detail?.correctCount || 0}</Text>
                            </Text>
                            <Text>
                                错误题数：<Text strong style={{color: '#ff4d4f'}}>
                                {detail?.answers?.length ? detail.answers.length - (detail.correctCount || 0) : 0}
                            </Text>
                            </Text>
                            <Text>
                                提交时间：<Text>{detail?.submitTime ? formatTime(detail.submitTime) : '-'}</Text>
                            </Text>
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Card
                title={
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span>答题详情与解析</span>
                        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                            <Button
                                type={showOnlyWrong ? 'primary' : 'default'}
                                size="small"
                                onClick={() => {
                                    setShowOnlyWrong(!showOnlyWrong);
                                    setCurrentIndex(0); // 切换时重置到第一题
                                }}
                            >
                                {showOnlyWrong ? '显示全部题目' : '只看错题'}
                            </Button>
                        </div>
                    </div>
                }
                style={{marginBottom: 20}}
            >
                {loading ? (
                    <div style={{textAlign: 'center', padding: 40}}>
                        <Text>正在加载答案解析...</Text>
                    </div>
                ) : detail?.answers && detail.answers.length > 0 ? (
                    <>
                        {/* 题目导航 */}
                        <div style={{
                            marginBottom: 20,
                            padding: 12,
                            backgroundColor: '#fafafa',
                            borderRadius: 4,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            maxHeight: 150,
                            overflow: 'auto'
                        }}>
                            <Button
                                type={currentIndex > 0 ? 'default' : 'text'}
                                disabled={currentIndex === 0}
                                onClick={goPrev}
                                style={{marginRight: 8}}
                            >
                                上一题
                            </Button>
                            {getDisplayAnswers().map((answer, index) => {
                                // 找到在原始列表中的索引，用于显示正确的题目编号
                                const originalIndex = detail?.answers.findIndex(a => a.examQuestionId === answer.examQuestionId) || 0;
                                return (
                                    <Button
                                        key={answer.examQuestionId}
                                        size="small"
                                        type={currentIndex === index ? 'primary' : 'default'}
                                        onClick={() => scrollToIndex(index)}
                                        style={{
                                            minWidth: 32,
                                            padding: '0 8px',
                                            backgroundColor: !answer.correct ?
                                                (currentIndex === index ? '#1677ff' : '#fff2f0') :
                                                (currentIndex === index ? '#1677ff' : '#f6ffed')
                                        }}
                                    >
                                        {originalIndex + 1}
                                    </Button>
                                );
                            })}
                            <Button
                                type={currentIndex < (getDisplayAnswers().length - 1) ? 'default' : 'text'}
                                disabled={currentIndex === getDisplayAnswers().length - 1}
                                onClick={goNext}
                                style={{marginLeft: 8}}
                            >
                                下一题
                            </Button>
                        </div>
                        <div style={{height: resultHeight, overflow: 'auto'}}>
                            {getDisplayAnswers().map((answer, idx) => {
                                const originalIndex = detail?.answers.findIndex(a => a.examQuestionId === answer.examQuestionId) || 0;
                                const isCorrect = answer.correct;
                                const q = questionMap[answer.examQuestionId];
                                const eqId = q.id as string;
                                const type = q?.type;
                                const opts = parseOptions(q?.options);
                                const blanks = parseBlanks(q?.options);
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
                                                <Tag
                                                    color={type === 'SINGLE' ? 'blue' : type === 'MULTIPLE' ? 'purple' : type === 'BLANK' ? 'green' : 'orange'}>
                                                    {type === 'SINGLE' ? '单选题' : type === 'MULTIPLE' ? '多选题' : type === 'BLANK' ? '填空题' : '简答题'}
                                                </Tag>
                                            </Space>
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            lineHeight: 1.6,
                                            marginBottom: 12
                                        }}>{q?.content}</div>

                                        {type === 'SINGLE' && (
                                            <Radio.Group
                                                value={(answers[eqId] || [''])[0]}
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
                                            >
                                                <Space direction='vertical'>
                                                    {opts.map(opt => (
                                                        <Checkbox key={opt.key}
                                                                  value={opt.key}>{opt.text}</Checkbox>
                                                    ))}
                                                </Space>
                                            </Checkbox.Group>
                                        )}

                                        {type === 'BLANK' && (
                                            <Space direction='vertical' style={{width: '100%'}}>
                                                {(blanks.length > 0 ? blanks : ['']).map((placeholder, i) => (
                                                    <Input
                                                        key={i}
                                                        placeholder={placeholder ? `填空 ${i + 1}：${placeholder}` : `填空 ${i + 1}`}
                                                        value={(answers[eqId] || [''])[i] || ''}
                                                    />
                                                ))}
                                            </Space>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <Text style={{textAlign: 'center', display: 'block', padding: 40}}>暂无答案解析数据</Text>
                )}
            </Card>
            <div style={{marginTop: 20, textAlign: 'center'}}>
                <Space>
                    <Button onClick={() => navigate('/quiz/frame/exam')}>返回考试列表</Button>
                    <Button type="primary"
                            onClick={() => navigate(`/quiz/frame/exam/take/${detail?.examId}`)}>重新测试</Button>
                    <Button onClick={() => {
                        if (onBackToHistory) {
                            onBackToHistory();
                        } else {
                            navigate('/quiz/frame/history');
                        }
                    }}>查看历史记录</Button>
                </Space>
            </div>
        </div>
    );
};


export default ExamResultDetailPage;
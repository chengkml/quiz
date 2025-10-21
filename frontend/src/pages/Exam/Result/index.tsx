import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Button, Card, Grid, Layout, Message, Space, Tag, Typography} from '@arco-design/web-react';
import {IconCheckCircle, IconCloseCircle} from '@arco-design/web-react/icon';
import {getExamById, getExamResultDetail} from '@/pages/Exam/api';
import {ExamQuestionDto, ExamResultDto} from '@/pages/Exam/types';
import '../style/index.less';

const { Text, Paragraph } = Typography;
const {Row, Col} = Grid;
const {Content} = Layout;

const ExamResultDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultHeight, setResultHeight] = useState(200);
  const [detail, setDetail] = useState<ExamResultDto | null>(null);
  const [questionMap, setQuestionMap] = useState<Record<string, ExamQuestionDto>>({});
  const [examName, setExamName] = useState<string>('');
  const [examTotalScore, setExamTotalScore] = useState<number>(0);
  const [showExplanations, setShowExplanations] = useState(true); // 默认显示答案解析

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

  const fetchDetail = async (resultId: string) => {
    setLoading(true);
    try {
      const res = await getExamResultDetail(resultId);
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
            if (q.questionId) map[q.questionId] = q;
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
    if (id) fetchDetail(id);
    setResultHeight(window.innerHeight - 300);
  }, [id]);

  // 计算得分百分比
  const scorePercentage = detail && examTotalScore > 0 
    ? Math.round((detail.totalScore / examTotalScore) * 100) 
    : 0;

  // 根据得分获取评价
  const getScoreEvaluation = (percentage: number) => {
    if (percentage >= 90) return { text: '优秀', color: 'success' };
    if (percentage >= 80) return { text: '良好', color: 'green' };
    if (percentage >= 60) return { text: '及格', color: 'orange' };
    return { text: '不及格', color: 'red' };
  };

  const evaluation = getScoreEvaluation(scorePercentage);

  return (
    <Layout className="exam-manager">
      <Content>
        <Card style={{ marginBottom: 20 }}>
          <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{examName || '试卷'}</div>
            </Col>
          </Row>

          {/* 考试详情信息 */}
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Space size={24}>
                <Text>
                  得分：<Text strong style={{ color: '#52c41a' }}>{detail?.totalScore || 0}</Text>
                </Text>
                <Text>
                  正确题数：<Text strong style={{ color: '#52c41a' }}>{detail?.correctCount || 0}</Text>
                </Text>
                <Text>
                  错误题数：<Text strong style={{ color: '#ff4d4f' }}>
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
        <Card title="答题详情与解析" style={{ marginBottom: 20 }}>
          {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text>正在加载答案解析...</Text>
              </div>
          ) : detail?.answers && detail.answers.length > 0 ? (
              <div style={{height:resultHeight, overflow: 'auto'}}>
                {detail.answers.map((answer, index) => {
                  const isCorrect = answer.correct;
                  const q = questionMap[answer.examQuestionId];
                  return (
                      <div key={answer.examQuestionId} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, marginRight: 12 }}>第 {index + 1} 题</span>
                          {isCorrect ? (
                              <Tag color="green" icon={<IconCheckCircle />}>正确</Tag>
                          ) : (
                              <Tag color="red" icon={<IconCloseCircle />}>错误</Tag>
                          )}
                          <span style={{ marginLeft: 12 }}>得分：{answer.score}</span>
                        </div>

                        <Paragraph style={{ marginBottom: 12 }}>{q?.questionContent || '题目内容缺失'}</Paragraph>

                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary">你的答案：</Text>
                          <Text>{Array.isArray(answer.userAnswers) ? answer.userAnswers.join('、') : '-'}</Text>
                        </div>

                        <div>
                          <Text type="secondary">标准答案：</Text>
                          <Text strong>{Array.isArray(answer.standardAnswers) ? answer.standardAnswers.join('、') : '-'}</Text>
                        </div>

                        {!isCorrect && (
                            <div style={{ marginTop: 12, padding: 12, backgroundColor: '#fff2f0', borderRadius: 4 }}>
                              <Text type="danger">
                                答题小贴士：请仔细检查你的答案与标准答案的差异，理解正确解法。
                              </Text>
                            </div>
                        )}
                      </div>
                  );
                })}
              </div>
          ) : (
              <Text style={{ textAlign: 'center', display: 'block', padding: 40 }}>暂无答案解析数据</Text>
          )}
        </Card>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Space>
            <Button onClick={() => navigate('/quiz/frame/exam')}>返回考试列表</Button>
            <Button type="primary" onClick={() => navigate('/quiz/frame/exam/results')}>查看历史记录</Button>
          </Space>
        </div>
      </Content>
    </Layout>
  );
};

export default ExamResultDetailPage;
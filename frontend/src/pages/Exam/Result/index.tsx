import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Space, Tag, Divider, Message, Table, Button } from '@arco-design/web-react';
import { IconArrowLeft } from '@arco-design/web-react/icon';
import { getExamResultDetail, getExamById } from '@/pages/Exam/api';
import { ExamResultDto, ExamQuestionDto } from '@/pages/Exam/types';

const { Title, Text } = Typography;

const ExamResultDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<ExamResultDto | null>(null);
  const [questionMap, setQuestionMap] = useState<Record<string, ExamQuestionDto>>({});
  const [examName, setExamName] = useState<string>('');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const columns = useMemo(() => [
    {
      title: '题目',
      dataIndex: 'examQuestionId',
      key: 'examQuestionId',
      ellipsis: true,
      render: (qid: string) => {
        const q = questionMap[qid];
        return q?.questionContent || qid;
      }
    },
    { title: '得分', dataIndex: 'score', key: 'score', width: 90 },
    {
      title: '是否正确', dataIndex: 'correct', key: 'correct', width: 110,
      render: (v: boolean) => v ? <Tag color="green">正确</Tag> : <Tag color="red">错误</Tag>
    },
    {
      title: '我的答案', dataIndex: 'userAnswers', key: 'userAnswers',
      render: (arr: string[]) => Array.isArray(arr) ? arr.join('、') : '-' 
    },
    {
      title: '标准答案', dataIndex: 'standardAnswers', key: 'standardAnswers',
      render: (arr?: string[]) => Array.isArray(arr) ? arr.join('、') : '-'
    }
  ], [questionMap]);

  return (
    <div style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate(-1)} icon={<IconArrowLeft />}>返回</Button>
        <Tag color="arcoblue">答卷详情</Tag>
      </Space>
      <Divider style={{ marginTop: 8 }} />
      <Space direction="vertical" size={6} style={{ marginBottom: 12 }}>
        <Title heading={5}>{examName || '试卷'}</Title>
        {detail && (
          <Text>
            总分：<Text strong>{detail.totalScore}</Text>；
            正确题数：<Text strong>{detail.correctCount}</Text>；
            提交时间：<Text>{detail.submitTime}</Text>
          </Text>
        )}
      </Space>
      <Table
        rowKey={(r) => r.examQuestionId}
        loading={loading}
        columns={columns}
        data={detail?.answers || []}
        pagination={false}
        border
      />
    </div>
  );
};

export default ExamResultDetailPage;
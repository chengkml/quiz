import React, {useEffect, useMemo, useState} from 'react';
import {Button, Message, Space, Table, Tag} from '@arco-design/web-react';
import {IconEye} from '@arco-design/web-react/icon';
import {useNavigate} from 'react-router-dom';
import {useUser} from '@/contexts/UserContext';
import {getExamResultsByUser} from '@/pages/Exam/api';
import {ExamHistoryItemDto} from '@/pages/Exam/types';

const ExamHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const {user} = useUser();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ExamHistoryItemDto[]>([]);

    const fetchData = async () => {
        if (!user?.userId) {
            Message.warning('未获取到用户信息');
            return;
        }
        setLoading(true);
        try {
            const res = await getExamResultsByUser(user.userId);
            setData(res.data || []);
        } catch (e) {
            console.error('加载历史答卷失败', e);
            Message.error('加载历史答卷失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.userId]);

    const columns = useMemo(() => [
        {title: '试卷名称', dataIndex: 'examName', key: 'examName', ellipsis: true},
        {title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 100},
        {title: '正确题数', dataIndex: 'correctCount', key: 'correctCount', width: 120},
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            key: 'submitTime',
            width: 200,
            render: (value: string) => {
                if (!value) return '-';
                const d = new Date(value);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const ss = String(d.getSeconds()).padStart(2, '0');
                return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
            }
        },
        {
            title: '操作',
            dataIndex: 'actions',
            key: 'actions',
            width: 140,
            render: (_: any, record: ExamHistoryItemDto) => (
                <Space>
                    <Button type="primary" size="small" icon={<IconEye/>}
                            onClick={() => navigate(`/quiz/frame/exam/result/${record.resultId}`)}>查看详情</Button>
                </Space>
            )
        }
    ], [navigate]);

    return (
        <div style={{padding: 16}}>
            <Space style={{marginBottom: 12}}>
                <Tag color="arcoblue">历史答卷</Tag>
            </Space>
            <Table
                rowKey="resultId"
                loading={loading}
                columns={columns}
                data={data}
                pagination={false}
                border
            />
        </div>
    );
};

export default ExamHistoryPage;
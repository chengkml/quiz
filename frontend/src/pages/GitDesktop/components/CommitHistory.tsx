import React, { useState } from 'react';
import { Table, Typography, Space, Tooltip } from '@arco-design/web-react';
import { GitCommitDto } from '../api';
import renderDate from '@/utils/timeUtil';

const { Text } = Typography;

interface CommitHistoryProps {
    commits: GitCommitDto[];
    loading: boolean;
    onViewDetail: (commitId: string) => void;
}

const CommitHistory: React.FC<CommitHistoryProps> = ({ commits, loading, onViewDetail }) => {

    const columns = [
        {
            title: 'Message',
            dataIndex: 'message',
            render: (msg: string, record: GitCommitDto) => (
                <Text
                    style={{ cursor: 'pointer', color: 'rgb(var(--primary-6))' }}
                    ellipsis={{ showTooltip: true }}
                    onClick={() => onViewDetail(record.commitId)}
                >
                    {msg}
                </Text>
            ),
            width: 300,
        },
        {
            title: 'Commit',
            dataIndex: 'shortId',
            width: 100,
            render: (id: string) => <Text code>{id}</Text>
        },
        {
            title: 'Author',
            dataIndex: 'author',
            width: 120,
            render: (author: string, record: GitCommitDto) => (
                <Tooltip content={record.authorEmail}>
                    <Text>{author}</Text>
                </Tooltip>
            )
        },
        {
            title: 'Date',
            dataIndex: 'date',
            width: 160,
            render: (date: string) => renderDate(date)
        }
    ];

    return (
        <div className="commit-history" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Table
                size="small"
                loading={loading}
                columns={columns}
                data={commits}
                rowKey="commitId"
                pagination={{ pageSize: 50, showTotal: true }}
                scroll={{ y: '100%', x: 600 }}
                style={{ flex: 1 }}
            />
        </div>
    );
};

export default CommitHistory;

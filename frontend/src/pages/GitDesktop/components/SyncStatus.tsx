import React from 'react';
import { Button, Space, Tooltip } from '@arco-design/web-react';
import { IconDownload, IconUpload, IconSync } from '@arco-design/web-react/icon';
import { GitPushPullResult } from '../api';

interface SyncStatusProps {
    ahead: number;
    behind: number;
    loading: boolean;
    onPush: () => Promise<GitPushPullResult | null>;
    onPull: () => Promise<GitPushPullResult | null>;
    onFetch: () => Promise<GitPushPullResult | null>;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ ahead, behind, loading, onPush, onPull, onFetch }) => {
    return (
        <Space size="medium">
            <Tooltip content="Fetch 远程更新">
                <Button
                    type="text"
                    icon={<IconSync />}
                    loading={loading}
                    onClick={onFetch}
                />
            </Tooltip>

            <Tooltip content={behind > 0 ? `需拉取 ${behind} 个提交` : '远程分支没有更多更新'}>
                <Button
                    type={behind > 0 ? 'primary' : 'secondary'}
                    status={behind > 0 ? 'warning' : 'default'}
                    icon={<IconDownload />}
                    loading={loading}
                    disabled={false}
                    onClick={onPull}
                >
                    Pull {behind > 0 && `(${behind})`}
                </Button>
            </Tooltip>

            <Tooltip content={ahead > 0 ? `需推送 ${ahead} 个提交` : '本地没有提交需要推送'}>
                <Button
                    type={ahead > 0 ? 'primary' : 'secondary'}
                    icon={<IconUpload />}
                    loading={loading}
                    disabled={ahead === 0}
                    onClick={onPush}
                >
                    Push {ahead > 0 && `(${ahead})`}
                </Button>
            </Tooltip>
        </Space>
    );
};

export default SyncStatus;

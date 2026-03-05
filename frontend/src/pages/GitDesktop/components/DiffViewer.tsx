import React, { useEffect, useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { Spin, Empty, Message } from '@arco-design/web-react';
import { getGitDiff, FileChangeDto } from '../api';

interface DiffViewerProps {
    repoId: string | null;
    activeFile: FileChangeDto | null;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ repoId, activeFile }) => {
    const [loading, setLoading] = useState(false);
    const [diffContent, setDiffContent] = useState<string>('');

    useEffect(() => {
        if (!repoId || !activeFile) {
            setDiffContent('');
            return;
        }

        const fetchDiff = async () => {
            setLoading(true);
            try {
                // If the file is untracked, it might not have a proper diff, but let's try
                const res = await getGitDiff(repoId, activeFile.filePath, activeFile.staged);
                setDiffContent(res.data.diffContent || '');
            } catch (error) {
                Message.error('获取 Diff 失败');
                setDiffContent('');
            } finally {
                setLoading(false);
            }
        };

        fetchDiff();
    }, [repoId, activeFile]);

    if (!activeFile) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="选择一个文件查看 Diff" />
            </div>
        );
    }

    return (
        <div style={{ height: '100%', position: 'relative' }}>
            <Spin loading={loading} style={{ display: 'block', height: '100%' }}>
                {!loading && diffContent ? (
                    // Using standard Editor as Monaco DiffEditor requires an originalal and modified model,
                    // but we are returning the unified diff string from JGit.
                    // To render unified diffs in Monaco, we can just use the standard editor with 'diff' language
                    // OR parse the diff to old/new.
                    // JGit provides raw diff string, so we'll just show it using simple markdown-like or diff syntax highlighting text block.
                    // Wait, Monaco doesn't have a good default unified diff viewer out of the box without original/modified texts.
                    // We'll just display the diffContent as text/plain with basic color coding, or 'diff' language.
                    <DiffTextRender diffContent={diffContent} />
                ) : (
                    !loading && <Empty description="无变更内容或为二进制文件" />
                )}
            </Spin>
        </div>
    );
};

// Simple component to render unified diff text
const DiffTextRender: React.FC<{ diffContent: string }> = ({ diffContent }) => {
    const lines = diffContent.split('\n');
    return (
        <div style={{
            height: '100%',
            overflow: 'auto',
            background: 'var(--color-fill-1)',
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6
        }}>
            {lines.map((line, idx) => {
                let color = 'inherit';
                let bg = 'transparent';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    color = 'rgb(var(--success-6))';
                    bg = 'rgba(var(--success-6), 0.1)';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    color = 'rgb(var(--danger-6))';
                    bg = 'rgba(var(--danger-6), 0.1)';
                } else if (line.startsWith('@@')) {
                    color = 'rgb(var(--primary-6))';
                    bg = 'rgba(var(--primary-6), 0.1)';
                }

                return (
                    <div key={idx} style={{ color, backgroundColor: bg, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {line || ' '}
                    </div>
                );
            })}
        </div>
    );
};

export default DiffViewer;

import React, { useMemo } from 'react';
import { List, Checkbox, Space, Typography, Button, Tooltip } from '@arco-design/web-react';
import { IconPlus, IconMinus, IconUndo } from '@arco-design/web-react/icon';
import { FileChangeDto } from '../api';

const { Text } = Typography;

interface FileChangeListProps {
    files: FileChangeDto[];
    staged: boolean;
    selectedFiles: string[];
    onSelectChange: (selected: string[]) => void;
    onStageFiles?: (files: string[]) => void;
    onUnstageFiles?: (files: string[]) => void;
    onDiscardFiles?: (files: string[]) => void;
    onFileClick: (file: FileChangeDto) => void;
    activeFile?: string;
}

const FileChangeList: React.FC<FileChangeListProps> = ({
    files,
    staged,
    selectedFiles,
    onSelectChange,
    onStageFiles,
    onUnstageFiles,
    onDiscardFiles,
    onFileClick,
    activeFile
}) => {
    const isAllSelected = useMemo(() => {
        return files.length > 0 && files.every(f => selectedFiles.includes(f.filePath));
    }, [files, selectedFiles]);

    const isIndeterminate = useMemo(() => {
        const selectedCount = files.filter(f => selectedFiles.includes(f.filePath)).length;
        return selectedCount > 0 && selectedCount < files.length;
    }, [files, selectedFiles]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSelected = Array.from(new Set([...selectedFiles, ...files.map(f => f.filePath)]));
            onSelectChange(newSelected);
        } else {
            const currentPaths = files.map(f => f.filePath);
            const newSelected = selectedFiles.filter(p => !currentPaths.includes(p));
            onSelectChange(newSelected);
        }
    };

    const handleSelect = (filePath: string, checked: boolean) => {
        if (checked) {
            onSelectChange([...selectedFiles, filePath]);
        } else {
            onSelectChange(selectedFiles.filter(p => p !== filePath));
        }
    };

    const getChangeColor = (type: string) => {
        switch (type) {
            case 'ADD':
            case 'UNTRACKED':
                return 'rgb(var(--success-6))';
            case 'DELETE':
                return 'rgb(var(--danger-6))';
            case 'MODIFY':
                return 'rgb(var(--warning-6))';
            case 'CONFLICT':
                return 'rgb(var(--danger-7))';
            default:
                return 'var(--color-text-2)';
        }
    };

    const getChangeInitial = (type: string) => {
        switch (type) {
            case 'ADD': return 'A';
            case 'MODIFY': return 'M';
            case 'DELETE': return 'D';
            case 'UNTRACKED': return 'U';
            case 'CONFLICT': return 'C';
            default: return '?';
        }
    };

    if (files.length === 0) {
        return null;
    }

    return (
        <div className="file-change-list" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 8px' }}>
                <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                >
                    <Text bold>{staged ? 'Staged Changes' : 'Changes'}</Text>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{files.length}</Text>
                </Checkbox>
                <Space size="small">
                    {staged ? (
                        <Tooltip content="Unstage Selected">
                            <Button
                                type="text"
                                size="mini"
                                icon={<IconMinus />}
                                disabled={selectedFiles.length === 0}
                                onClick={() => onUnstageFiles?.(selectedFiles)}
                            />
                        </Tooltip>
                    ) : (
                        <>
                            <Tooltip content="Discard Selected">
                                <Button
                                    type="text"
                                    size="mini"
                                    icon={<IconUndo />}
                                    disabled={selectedFiles.length === 0}
                                    onClick={() => onDiscardFiles?.(selectedFiles)}
                                />
                            </Tooltip>
                            <Tooltip content="Stage Selected">
                                <Button
                                    type="text"
                                    size="mini"
                                    icon={<IconPlus />}
                                    disabled={selectedFiles.length === 0}
                                    onClick={() => onStageFiles?.(selectedFiles)}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            </div>
            <List
                size="small"
                split={false}
                dataSource={files}
                render={(item: FileChangeDto) => {
                    const checked = selectedFiles.includes(item.filePath);
                    return (
                        <List.Item
                            key={item.filePath}
                            style={{
                                padding: '4px 8px',
                                cursor: 'pointer',
                                background: activeFile === item.filePath ? 'var(--color-fill-2)' : 'transparent',
                                borderRadius: 4
                            }}
                            onClick={() => onFileClick(item)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Checkbox
                                    checked={checked}
                                    onChange={(val) => handleSelect(item.filePath, val)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ marginRight: 8 }}
                                />
                                <span style={{
                                    color: getChangeColor(item.changeType),
                                    fontWeight: 'bold',
                                    marginRight: 8,
                                    width: 16,
                                    textAlign: 'center',
                                    fontSize: 12
                                }}>
                                    {getChangeInitial(item.changeType)}
                                </span>
                                <Text
                                    ellipsis={{ showTooltip: true }}
                                    style={{ flex: 1, fontSize: 13 }}
                                    delete={item.changeType === 'DELETE'}
                                >
                                    {item.filePath}
                                </Text>
                                <Space size="mini" onClick={(e) => e.stopPropagation()}>
                                    {staged ? (
                                        <Tooltip content="Unstage">
                                            <Button type="text" size="mini" icon={<IconMinus />} onClick={() => onUnstageFiles?.([item.filePath])} />
                                        </Tooltip>
                                    ) : (
                                        <>
                                            <Tooltip content="Discard">
                                                <Button type="text" size="mini" icon={<IconUndo />} onClick={() => onDiscardFiles?.([item.filePath])} />
                                            </Tooltip>
                                            <Tooltip content="Stage">
                                                <Button type="text" size="mini" icon={<IconPlus />} onClick={() => onStageFiles?.([item.filePath])} />
                                            </Tooltip>
                                        </>
                                    )}
                                </Space>
                            </div>
                        </List.Item>
                    );
                }}
            />
        </div>
    );
};

export default FileChangeList;

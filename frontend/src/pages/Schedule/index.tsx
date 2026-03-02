import React, {useEffect, useRef, useState} from 'react';
import {Button, DatePicker, Form, Input, Layout, Message, Modal, Select, Space, Spin, Switch, Tag, Tooltip,} from '@arco-design/web-react';
import {IconLeft, IconRight, IconPlus, IconClockCircle, IconCheckCircle, IconCloseCircle} from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import './style/index.less';
import {createSchedule, getSchedulesByDateRange, updateSchedule, streamGenerateEventUrl, completeSchedule, deleteSchedule} from './api';
import {formatLunarDate, getHolidays} from './utils/lunar';
import { getLLMModelsByType } from '@/services/llmModelService';

const {Content} = Layout;
const {Option} = Select;
const {TextArea} = Input;

// 视图类型枚举
type ViewType = 'month' | 'week' | 'year';

// 日程数据接口
interface ScheduleItem {
    id: string;
    title: string;
    descr: string;
    startTime: string;
    endTime: string;
    allDay?: boolean;
    color?: string;
    status: string;
    priority?: string;
    completedAt?: string;
}

const priorityOptions = [
  { label: "高", value: "HIGH" },
  { label: "中", value: "MEDIUM" },
  { label: "低", value: "LOW" },
];

const priorityColorMap: Record<string, string> = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "green",
};

const statusColorMap: Record<string, string> = {
    SCHEDULED: '#1677ff',
    IN_PROGRESS: '#165dff',
    COMPLETED: '#52c41a',
    CANCELLED: '#f5222d',
};

const statusLabelMap: Record<string, string> = {
    SCHEDULED: '计划',
    IN_PROGRESS: '处理中',
    COMPLETED: '完成',
    CANCELLED: '取消',
};

const statusBadgeColorMap: Record<string, 'blue' | 'green' | 'red' | 'arcoblue'> = {
    SCHEDULED: 'blue',
    IN_PROGRESS: 'arcoblue',
    COMPLETED: 'green',
    CANCELLED: 'red',
};

const toScheduleItem = (event: any): ScheduleItem => ({
    id: event.id,
    title: event.title,
    descr: event.descr,
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay,
    status: event.status,
    priority: event.priority || 'MEDIUM',
    completedAt: event.completedAt,
    color: statusColorMap[event.status] || '#165dff',
});

function ScheduleManager() {
    // 当前日期与视图状态
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completingSchedule, setCompletingSchedule] = useState<ScheduleItem | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);

    // 表单引用
    const formRef = React.useRef<any>(null);

    // AI 生成相关状态
    const [showGeneratePanel, setShowGeneratePanel] = useState(false);
    const [generateDescription, setGenerateDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [generatedEventData, setGeneratedEventData] = useState<any>(null);
    const [showStreamLog, setShowStreamLog] = useState(true);
    const [models, setModels] = useState<any[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [currentModel, setCurrentModel] = useState('');
    const streamingContainerRef = useRef<HTMLDivElement | null>(null);
    const generateEventSourceRef = useRef<EventSource | null>(null);

    // 加载日程数据
    const loadSchedules = async () => {
        setLoading(true);
        try {
            let startDate: string, endDate: string;
            const date = dayjs(currentDate);

            // 根据不同视图计算日期范围
            switch (viewType) {
                case 'month':
                    startDate = date.startOf('month').format('YYYY-MM-DD');
                    endDate = date.endOf('month').format('YYYY-MM-DD');
                    break;
                case 'week':
                    startDate = date.startOf('week').format('YYYY-MM-DD');
                    endDate = date.endOf('week').format('YYYY-MM-DD');
                    break;
                case 'year':
                    startDate = date.startOf('year').format('YYYY-MM-DD');
                    endDate = date.endOf('year').format('YYYY-MM-DD');
                    break;
                default:
                    startDate = date.startOf('month').format('YYYY-MM-DD');
                    endDate = date.endOf('month').format('YYYY-MM-DD');
            }

            const response = await getSchedulesByDateRange(startDate, endDate);
            const data = response?.data;
            const list = Array.isArray(data) ? data : data?.content || [];
            setSchedules(list.map(toScheduleItem));
        } catch (error) {
            Message.error('获取日程数据失败');
            // 模拟数据（如果API调用失败）
            setSchedules([
                {
                    id: '1',
                    title: '项目会议',
                    descr: '每周项目进度讨论',
                    startTime: dayjs(currentDate).format('YYYY-MM-DD') + 'T10:00:00',
                    endTime: dayjs(currentDate).format('YYYY-MM-DD') + 'T11:30:00',
                    status: 'COMPLETED',
                    color: statusColorMap.COMPLETED
                },
                {
                    id: '2',
                    title: '团队建设',
                    descr: '团队活动日',
                    startTime: dayjs(currentDate).add(2, 'day').format('YYYY-MM-DD') + 'T14:00:00',
                    endTime: dayjs(currentDate).add(2, 'day').format('YYYY-MM-DD') + 'T17:00:00',
                    status: 'SCHEDULED',
                    color: statusColorMap.SCHEDULED
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const res = await getLLMModelsByType('TEXT');
            if (res.data && Array.isArray(res.data)) {
                setModels(res.data);
                const defaultModel = res.data.find((m: any) => m.isDefault === '1' || m.isDefault === 1);
                if (defaultModel) setCurrentModel(defaultModel.name);
                else if (res.data.length > 0) setCurrentModel(res.data[0].name);
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            Message.error('获取模型列表失败');
        } finally {
            setModelsLoading(false);
        }
    };

    // 日期导航
    const navigateDate = (direction: 'prev' | 'next') => {
        const date = dayjs(currentDate);
        let newDate: dayjs.Dayjs;

        switch (viewType) {
            case 'month':
                newDate = direction === 'prev' ? date.subtract(1, 'month') : date.add(1, 'month');
                break;
            case 'week':
                newDate = direction === 'prev' ? date.subtract(1, 'week') : date.add(1, 'week');
                break;
            case 'year':
                newDate = direction === 'prev' ? date.subtract(1, 'year') : date.add(1, 'year');
                break;
            default:
                newDate = direction === 'prev' ? date.subtract(1, 'month') : date.add(1, 'month');
        }

        setCurrentDate(newDate.toDate());
    };

    // 处理视图切换
  const handleViewChange = (newView: ViewType) => {
    setViewType(newView);
  };

  // 计算月视图卡片高度
  const calculateCardHeight = () => {
    // 减去控制栏、日期导航、页边距等其他UI元素的高度
    const otherElementsHeight = 250; // 估计值，包括控制栏、页边距等
    const availableHeight = windowHeight - otherElementsHeight;
    
    // 月视图通常显示6行（最多6周）
    const cardHeight = Math.floor(availableHeight / 6) - 16; // 减去间距
    
    // 确保高度合理，不小于最小高度
    return Math.max(cardHeight, 110); // 最小高度从80px增加到100px
  };

    // 格式化当前日期显示
    const formatCurrentDate = () => {
        const date = dayjs(currentDate);
        switch (viewType) {
            case 'month':
                return date.format('YYYY年MM月');
            case 'week':
                return `${date.startOf('week').format('YYYY-MM-DD')} - ${date.endOf('week').format('YYYY-MM-DD')}`;
            case 'year':
                return date.format('YYYY年');
            default:
                return date.format('YYYY年MM月');
        }
    };

    // 当流式内容更新时，自动滚动到底部
    useEffect(() => {
        if (streamingContainerRef.current) {
            setTimeout(() => {
                try {
                    streamingContainerRef.current!.scrollTop = streamingContainerRef.current!.scrollHeight;
                } catch (e) {
                    // ignore
                }
            }, 0);
        }
    }, [streamingContent]);

    // 打开新增/编辑模态框
    const openModal = (schedule?: ScheduleItem) => {
        if (schedule) {
            setCurrentSchedule(schedule);
            setIsEditMode(true);
            setShowGeneratePanel(false);
            setShowEditForm(true);
            setTimeout(() => {
                formRef.current?.setFieldsValue?.({
                    title: schedule.title,
                    descr: schedule.descr,
                    startTime: dayjs(schedule.startTime),
                    endTime: dayjs(schedule.endTime),
                    status: schedule.status,
                    priority: schedule.priority || 'MEDIUM',
                    allDay: schedule.allDay ?? false,
                });
            }, 50);
        } else {
            setCurrentSchedule(null);
            setIsEditMode(false);
            setShowGeneratePanel(true);
            setShowEditForm(false);
            setGenerateDescription('');
            setGeneratedEventData(null);
            setStreamingContent('');
            // 生成模式下不展示表单，等待生成完成后再编辑
        }
        setModalVisible(true);
    };

    // 流式生成日程
    const handleStreamGenerateEvent = async () => {
        if (!generateDescription.trim()) {
            Message.error('请输入日程描述');
            return;
        }

        try {
            setIsGenerating(true);
            setStreamingContent('');
            setGeneratedEventData(null);
            setShowStreamLog(true);
            setShowEditForm(false);

            if (generateEventSourceRef.current) {
                generateEventSourceRef.current.close();
                generateEventSourceRef.current = null;
            }

            const url = streamGenerateEventUrl({
                descr: generateDescription,
                modelName: currentModel || undefined,
            });
            const es = new EventSource(url);
            generateEventSourceRef.current = es;

            let isParsingResult = false;

            es.onmessage = (event) => {
                const data = event.data;

                // 跳过初始连接消息
                if (data === 'connected') {
                    return;
                }

                if (!isParsingResult) {
                    if (data.includes('[PARSE_RESULT]')) {
                        isParsingResult = true;
                        const parseIndex = data.indexOf('[PARSE_RESULT]');
                        const afterSeparator = data.substring(parseIndex + '[PARSE_RESULT]'.length).trim();
                        if (afterSeparator && afterSeparator.startsWith('[EVENT]')) {
                            const jsonStr = afterSeparator.substring('[EVENT]'.length);
                            if (jsonStr) {
                                try {
                                    const eventData = JSON.parse(jsonStr);
                                    setGeneratedEventData(eventData);
                                    // 自动填充表单
                                    fillFormWithGeneratedData(eventData);
                                    setShowStreamLog(false);
                                    setIsGenerating(false);
                                    // 直接显示编辑表单，不显示预览
                                    setShowEditForm(true);
                                    setShowGeneratePanel(false);
                                    Message.success('日程生成成功，请确认并保存');
                                    // 成功接收到数据后关闭连接
                                    es.close();
                                    generateEventSourceRef.current = null;
                                } catch (e) {
                                    console.error('Failed to parse event JSON:', jsonStr, e);
                                    Message.error('解析生成结果失败，请重新生成');
                                }
                            }
                        }
                        return;
                    } else {
                        setStreamingContent(prev => prev + data);
                    }
                } else {
                    const trimmedData = data.trim();
                    if (trimmedData && trimmedData.startsWith('[EVENT]')) {
                        const jsonStr = trimmedData.substring('[EVENT]'.length);
                        try {
                            const eventData = JSON.parse(jsonStr);
                            setGeneratedEventData(eventData);
                            fillFormWithGeneratedData(eventData);
                            setShowStreamLog(false);
                            setIsGenerating(false);
                            // 直接显示编辑表单，不显示预览
                            setShowEditForm(true);
                            setShowGeneratePanel(false);
                            Message.success('日程生成成功，请确认并保存');
                            // 成功接收到数据后关闭连接
                            es.close();
                            generateEventSourceRef.current = null;
                        } catch (e) {
                            console.error('Failed to parse event JSON:', jsonStr, e);
                            Message.error('解析生成结果失败，请重新生成');
                        }
                    } else if (trimmedData && trimmedData.startsWith('[ERROR]')) {
                        const errorMsg = trimmedData.substring('[ERROR]'.length);
                        console.error('Backend error:', errorMsg);
                        Message.error('生成失败: ' + errorMsg);
                        setIsGenerating(false);
                    } else if (trimmedData && trimmedData.startsWith('[RETRY]')) {
                        const retryMsg = trimmedData.substring('[RETRY]'.length);
                        setStreamingContent(prev => prev + '\n' + retryMsg);
                    }
                }
            };

            es.onerror = (err) => {
                console.error('SSE error:', err);
                try {
                    es.close();
                } catch (e) {
                    // ignore
                }
                generateEventSourceRef.current = null;
                
                // 只有在没有成功生成数据的情况下才设置错误状态和显示错误消息
                if (!generatedEventData) {
                    setIsGenerating(false);
                    Message.error('生成日程失败');
                }
            };
        } catch (error) {
            console.error('开始生成失败:', error);
            Message.error('开始生成失败');
            setIsGenerating(false);
            if (generateEventSourceRef.current) {
                generateEventSourceRef.current.close();
                generateEventSourceRef.current = null;
            }
        }
    };

    // 使用生成的数据填充表单
    const fillFormWithGeneratedData = (eventData: any) => {
        const formData: any = {};

        if (eventData.title) {
            formData.title = eventData.title;
        }
        if (eventData.descr) {
            formData.descr = eventData.descr;
        }
        if (eventData.startTime) {
            formData.startTime = dayjs(eventData.startTime);
        }
        if (eventData.endTime) {
            formData.endTime = dayjs(eventData.endTime);
        }
        if (eventData.status) {
            formData.status = eventData.status;
        }
        if (eventData.allDay !== undefined) {
            formData.allDay = eventData.allDay;
        }
        if (eventData.priority) {
            formData.priority = eventData.priority;
        }

        setTimeout(() => {
            formRef.current?.setFieldsValue?.(formData);
        }, 50);
    };

    // 取消生成
    const handleCancelGenerate = () => {
        if (generateEventSourceRef.current) {
            generateEventSourceRef.current.close();
            generateEventSourceRef.current = null;
        }
        setIsGenerating(false);
        setShowGeneratePanel(false);
        setGenerateDescription('');
        setGeneratedEventData(null);
        setStreamingContent('');
        setShowEditForm(true);
    };

    // 删除日程
    const handleDelete = () => {
        if (!currentSchedule) return;

        Modal.confirm({
            title: '确认删除',
            content: `确定要删除日程 "${currentSchedule.title}" 吗？`,
            okText: '确认删除',
            cancelText: '取消',
            okButtonProps: { status: 'danger' },
            onOk: async () => {
                try {
                    await deleteSchedule(currentSchedule.id);
                    Message.success('日程删除成功');
                    setModalVisible(false);
                    loadSchedules();
                } catch (error) {
                    console.error('删除日程失败:', error);
                    Message.error('删除失败');
                }
            },
        });
    };

    // 保存日程
    const handleSave = async () => {
        if (!isEditMode && !showEditForm) {
            Message.warning('请先点击“编辑”后再保存');
            return;
        }
        try {
            const values = await formRef.current?.validate?.();
            console.log('表单验证结果:', values);
            if (values) {
                const payload = {
                    title: values.title,
                    descr: values.descr,
                    status: values.status,
                    priority: values.priority || 'MEDIUM',
                    startTime: dayjs(values.startTime).format('YYYY-MM-DDTHH:mm:ss'),
                    endTime: dayjs(values.endTime).format('YYYY-MM-DDTHH:mm:ss'),
                    allDay: values.allDay ?? false,
                };

                if (isEditMode && currentSchedule) {
                    await updateSchedule({...payload, id: currentSchedule.id});
                    Message.success('日程更新成功');
                } else {
                    await createSchedule(payload);
                    Message.success('日程创建成功');
                }
                setModalVisible(false);
                loadSchedules();
            }
        } catch (error) {
            console.error('保存日程出错:', error);
            if ((error as any)?.fields) return;
            Message.error('操作失败');
        }
    };

    // 打开完成日程对话框
    const openCompleteModal = (schedule: ScheduleItem) => {
        setCompletingSchedule(schedule);
        setCompleteModalVisible(true);
    };

    // 完成日程
    const handleComplete = async () => {
        try {
            if (completingSchedule) {
                // 后端已修改为不再接收completedAt参数，完成时间由后端自动设置为当前时间
                await completeSchedule(completingSchedule.id);
                Message.success('日程已完成');
                setCompleteModalVisible(false);
                loadSchedules();
            }
        } catch (error) {
            console.error('完成日程出错:', error);
            Message.error('操作失败');
        }
    };

    // 渲染月视图
    const renderMonthView = () => {
        const date = dayjs(currentDate);
        const year = date.year();
        const month = date.month();

        // 获取当月第一天
        const firstDay = dayjs(`${year}-${month + 1}-01`);
        // 获取当月第一天是星期几（0-6）
        const firstDayOfWeek = firstDay.day();
        // 获取当月天数
        const daysInMonth = firstDay.daysInMonth();

        // 计算需要显示的总天数（包括上月和下月的部分日期）
        const totalDays = firstDayOfWeek + daysInMonth + (7 - ((firstDayOfWeek + daysInMonth) % 7 || 7));

        // 生成日期网格数据
        const calendarDays = [];
        for (let i = 0; i < totalDays; i++) {
            let currentDay: dayjs.Dayjs;
            if (i < firstDayOfWeek) {
                // 上月日期
                currentDay = firstDay.subtract(firstDayOfWeek - i, 'day');
            } else if (i < firstDayOfWeek + daysInMonth) {
                // 当月日期
                currentDay = firstDay.add(i - firstDayOfWeek, 'day');
            } else {
                // 下月日期
                currentDay = firstDay.add(i - firstDayOfWeek, 'day');
            }

            // 获取当天的日程
            const daySchedules = schedules.filter(schedule =>
                dayjs(schedule.startTime).format('YYYY-MM-DD') === currentDay.format('YYYY-MM-DD')
            );

            const isToday = currentDay.isSame(dayjs(), 'day');
            const isCurrentMonth = currentDay.month() === month;
            const isWeekend = currentDay.day() === 0 || currentDay.day() === 6;
            const holidays = getHolidays(currentDay.toDate());
            const lunarDateStr = formatLunarDate(currentDay.toDate());

            calendarDays.push(
                <div
                    key={i}
                    className={`calendar-cell ${
                        isToday ? 'calendar-cell-today' : ''
                    } ${
                        !isCurrentMonth ? 'calendar-cell-other-month' : ''
                    } ${
                        holidays.length > 0 ? 'calendar-cell-holiday' : ''
                    } ${
                        isWeekend && isCurrentMonth ? 'calendar-cell-weekend' : ''
                    }`}
                    style={{
                      height: viewType === 'month' ? `${calculateCardHeight()}px` : 'auto'
                    }}
                    onClick={() => {
                        if (isCurrentMonth) {
                            setCurrentDate(currentDay.toDate());
                            setViewType('week');
                        }
                    }}
                    title={currentDay.format('YYYY年MM月DD日')}
                >
                    <div style={{
                        marginBottom: '6px',
                        fontWeight: isToday ? 600 : 500,
                        fontSize: '16px'
                    }}>
                        <span>{currentDay.date()}</span>
                    </div>
                    {(lunarDateStr || holidays.length > 0) && (
                        <div style={{
                            fontSize: '11px',
                            color: 'var(--color-text-3)',
                            marginBottom: '4px',
                            lineHeight: '1.2'
                        }}>
                            {lunarDateStr && <div>{lunarDateStr}</div>}
                            {holidays.map((holiday, idx) => (
                                <div key={idx} className="holiday-tag" style={{
                                    display: 'inline-block',
                                    backgroundColor: '#ffebe6',
                                    color: '#d4380d',
                                    padding: '2px 4px',
                                    borderRadius: '2px',
                                    fontSize: '10px',
                                    marginRight: '2px',
                                    marginTop: '1px'
                                }}>
                                    {holiday}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{maxHeight: '55px', overflow: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'flex-start', marginTop: '8px'}}>
                        {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(status => {
                            const count = daySchedules.filter(s => s.status === status).length;
                            const iconMap = {
                                SCHEDULED: <IconClockCircle style={{fontSize: '13px'}} />,
                                IN_PROGRESS: <IconClockCircle style={{fontSize: '13px', color: '#165dff'}} />,
                                COMPLETED: <IconCheckCircle style={{fontSize: '13px'}} />,
                                CANCELLED: <IconCloseCircle style={{fontSize: '13px'}} />
                            };
                            return count > 0 ? (
                                <Tag
                                    key={status}
                                    color={statusBadgeColorMap[status]}
                                    className="schedule-count-badge"
                                    style={{fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', border: '1px solid'}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    {iconMap[status as keyof typeof iconMap]}
                                    {count}
                                </Tag>
                            ) : null;
                        })}
                    </div>
                </div>
            );
        }

        // 星期标题样式
        const weekHeaderStyle: React.CSSProperties = {
            textAlign: 'center',
            padding: '12px 8px',
            fontWeight: 600,
            color: 'var(--color-text-1)',
            backgroundColor: 'var(--color-bg-2)',
            borderBottom: '2px solid var(--color-primary-light-3)',
            borderRadius: '4px 4px 0 0'
        };

        return (
            <div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px'}}>
                    {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                        <div key={index} style={weekHeaderStyle}>
                            {day}
                        </div>
                    ))}
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px'}}>
                    {calendarDays}
                </div>
            </div>
        );
    };

    // 渲染日历视图
    const renderCalendarView = () => {
        switch (viewType) {
            case 'month':
                return renderMonthView();
            case 'week':
                return renderWeekView();
            case 'year':
                return renderYearView();
            default:
                return renderMonthView();
        }
    };

    // 快速跳转今天
    const goToToday = () => {
        setCurrentDate(new Date());
        Message.success('已跳转至今天');
    };

    // 渲染周视图
    const renderWeekView = () => {
        const date = dayjs(currentDate);
        const weekStart = date.startOf('week');
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            const daySchedules = schedules.filter(schedule =>
                dayjs(schedule.startTime).format('YYYY-MM-DD') === currentDay.format('YYYY-MM-DD')
            ).sort((a, b) => {
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });

            const isToday = currentDay.isSame(dayjs(), 'day');
            const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

            weekDays.push(
                <div key={i} className="week-day-container">
                    <div className="week-day-header">
                        {currentDay.format('YYYY年MM月DD日')} {weekDayNames[currentDay.day()]}
                        {isToday && <Tag style={{marginLeft: '8px', backgroundColor: '#91d5ff', color: '#0050b3', borderColor: '#69b1ff'}}>今天</Tag>}
                    </div>
                    {daySchedules.length > 0 ? (
                            daySchedules.map(schedule => {
                                const statusColors = {
                                    SCHEDULED: { bg: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)', border: '#91caff', text: '#0050b3' },
                                    IN_PROGRESS: { bg: 'linear-gradient(135deg, #e6f7ff 0%, #91caff 100%)', border: '#1890ff', text: '#096dd9' },
                                    COMPLETED: { bg: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)', border: '#7dd3fc', text: '#0369a1' },
                                    CANCELLED: { bg: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', border: '#ffa39e', text: '#cf1322' }
                                };
                                const colorScheme = statusColors[schedule.status as keyof typeof statusColors] || statusColors.SCHEDULED;
                                
                                return (
                                    <div
                                        key={schedule.id}
                                        className="schedule-item"
                                        style={{
                                            background: colorScheme.bg,
                                            border: `1px solid ${colorScheme.border}`,
                                            color: colorScheme.text,
                                            padding: '10px 12px',
                                            marginBottom: '8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal(schedule);
                                        }}
                                        title={`${schedule.title}\n${schedule.descr || ''}\n${dayjs(schedule.startTime).format('HH:mm')}-${dayjs(schedule.endTime).format('HH:mm')}`}
                                    >
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                                            <span style={{fontWeight: 600, fontSize: '13px'}}>{schedule.title}</span>
                                        </div>
                                        <div style={{fontSize: '12px', opacity: 0.85, display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap'}}>
                                                <Tag color={statusBadgeColorMap[schedule.status]} size="small" style={{fontSize: '11px'}} bordered>
                                                    {statusLabelMap[schedule.status]}
                                                </Tag>
                                                <span>🕐 {dayjs(schedule.startTime).format('HH:mm')} - {dayjs(schedule.endTime).format('HH:mm')}</span>
                                            </div>
                                            {schedule.priority && schedule.priority !== 'MEDIUM' && (
                                                <Tag color={priorityColorMap[schedule.priority]} size="small" style={{ fontSize: '11px' }} bordered>
                                                    {priorityOptions.find(o => o.value === schedule.priority)?.label}
                                                </Tag>
                                            )}
                                            {schedule.status === 'SCHEDULED' && (
                                                <Button
                                                    type="primary"
                                                    status="success"
                                                    size="mini"
                                                    className="complete-btn"
                                                    icon={<IconCheckCircle />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openCompleteModal(schedule);
                                                    }}
                                                >
                                                    完成
                                                </Button>
                                            )}
                                        </div>
                                        {schedule.descr && (
                                            <div style={{
                                                fontSize: '12px',
                                                opacity: 0.75,
                                                marginTop: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {schedule.descr}
                                            </div>
                                        )}
                                        {schedule.completedAt && (
                                            <div style={{fontSize: '11px', opacity: 0.7, marginTop: '4px'}}>
                                                ✅ 完成于: {dayjs(schedule.completedAt).format('YYYY-MM-DD HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{
                                color: 'var(--color-text-3)',
                                fontSize: '14px',
                                textAlign: 'center',
                                padding: '20px'
                            }}>
                                暂无日程
                            </div>
                        )}
                </div>
            );
        }

        return <div>{weekDays}</div>;
    };

    // 渲染年视图
    const renderYearView = () => {
        const year = dayjs(currentDate).year();
        const months = [];
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

        for (let month = 0; month < 12; month++) {
            const monthStart = dayjs(`${year}-${month + 1}-01`);

            // 获取该月的日程数量
            const monthScheduleCount = schedules.filter(schedule => {
                const scheduleDate = dayjs(schedule.startTime);
                return scheduleDate.year() === year && scheduleDate.month() === month;
            }).length;

            // 获取该月的不同状态的日程数量
            const completedCount = schedules.filter(schedule => {
                const scheduleDate = dayjs(schedule.startTime);
                return scheduleDate.year() === year &&
                    scheduleDate.month() === month &&
                    schedule.status === 'COMPLETED';
            }).length;

            months.push(
                <div
                    key={month}
                    className="year-month-card"
                    onClick={() => {
                        setCurrentDate(monthStart.toDate());
                        setViewType('month');
                    }}
                >
                    <div className="year-month-title">
                        {year}年{monthNames[month]}
                    </div>
                    <div className="year-month-stats">
                        {monthScheduleCount > 0 ? (
                            <>
                                <Tag color="primary" bordered>{monthScheduleCount} 个日程</Tag>
                                {completedCount > 0 && (
                                    <Tag color="success" bordered>已完成 {completedCount} 个</Tag>
                                )}
                            </>
                        ) : (
                            <span style={{color: 'var(--color-text-3)', fontSize: '14px'}}>本月无日程安排</span>
                        )}
                    </div>
                </div>
            );
        }

        return <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'}}>{months}</div>;
    };

    // 初始加载和日期/视图变化时重新加载数据
    useEffect(() => {
        loadSchedules();
    }, [currentDate, viewType]);

    useEffect(() => {
        loadModels();
    }, []);

    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        // 组件卸载时移除监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="schedule-manager">
            <Layout className="schedule-layout">
                <Content style={{height: '100%'}}>
                    {/* 控制栏 */}
                    <div className="control-bar">
                        <div className="view-switcher">
                            <Button
                                type={viewType === 'year' ? 'primary' : 'default'}
                                onClick={() => handleViewChange('year')}
                            >
                                年
                            </Button>
                            <Button
                                type={viewType === 'month' ? 'primary' : 'default'}
                                onClick={() => handleViewChange('month')}
                            >
                                月
                            </Button>
                            <Button
                                type={viewType === 'week' ? 'primary' : 'default'}
                                onClick={() => handleViewChange('week')}
                            >
                                周
                            </Button>
                        </div>

                        <div className="date-navigation">
                            <Button
                                icon={<IconLeft />}
                                onClick={() => navigateDate('prev')}
                            />
                            <div className="current-date">{formatCurrentDate()}</div>
                            <Button
                                icon={<IconRight />}
                                onClick={() => navigateDate('next')}
                            />
                            <Button
                                onClick={goToToday}
                            >
                                今天
                            </Button>
                            <Button
                                type="primary"
                                icon={<IconPlus/>}
                                onClick={() => openModal()}
                            >
                                新增日程
                            </Button>
                        </div>
                    </div>

                    {/* 日历容器 */}
                    <div className="calendar-container">
                        {loading ? (
                            <div style={{textAlign: 'center', padding: '40px', color: 'var(--color-text-3)'}}>
                                加载中...
                            </div>
                        ) : (
                            renderCalendarView()
                        )}
                    </div>
                </Content>
            </Layout>

            {/* 新增/编辑模态框 */}
            <Modal
                title={isEditMode ? '编辑日程' : '新增日程'}
                visible={modalVisible}
                onOk={handleSave}
                onCancel={() => {
                    setModalVisible(false);
                    handleCancelGenerate();
                }}
                footer={(originNode: any) => {
                    if (isEditMode) {
                        return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button status="danger" onClick={handleDelete}>
                                    删除
                                </Button>
                                <Space>
                                    <Button onClick={() => {
                                        setModalVisible(false);
                                        handleCancelGenerate();
                                    }}>
                                        取消
                                    </Button>
                                    <Button type="primary" onClick={handleSave}>
                                        保存
                                    </Button>
                                </Space>
                            </div>
                        );
                    }
                    return (
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                handleCancelGenerate();
                            }}>
                                取消
                            </Button>
                            <Button type="primary" onClick={handleSave}>
                                保存
                            </Button>
                        </Space>
                    );
                }}
                wrapClassName={isEditMode || generatedEventData ? 'schedule-modal-normal' : 'schedule-modal-wide'}
                maskClosable={false}
                className="schedule-modal"
            >
                {!isEditMode && (
                    <div style={{marginBottom: '20px'}}>
                        {showGeneratePanel && !generatedEventData ? (
                            <div style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                padding: '16px',
                                backgroundColor: 'var(--color-bg-2)',
                                marginBottom: '16px'
                            }}>
                                <div style={{marginBottom: '12px', fontWeight: 600}}>🤖 AI 生成日程</div>
                                <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontWeight: 600 }}>模型</span>
                                    <Select
                                        placeholder="选择模型"
                                        style={{ minWidth: 220 }}
                                        loading={modelsLoading}
                                        value={currentModel || undefined}
                                        allowClear
                                        onChange={(value) => setCurrentModel(value)}
                                        options={models.map((model: any) => ({
                                            label: model.name,
                                            value: model.name,
                                        }))}
                                    />
                                </div>
                                <div style={{marginBottom: '12px'}}>
                                    <TextArea
                                        placeholder="请描述要生成的日程，例如：明天下午3点开会，会议时间持续2小时"
                                        value={generateDescription}
                                        onChange={(value) => setGenerateDescription(value)}
                                        rows={3}
                                        disabled={isGenerating}
                                    />
                                </div>
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={handleStreamGenerateEvent}
                                        loading={isGenerating}
                                        disabled={isGenerating || !generateDescription.trim()}
                                    >
                                        {isGenerating ? '生成中...' : '生成日程'}
                                    </Button>
                                    {isGenerating ? (
                                        <Button onClick={handleCancelGenerate} status="danger">
                                            取消生成
                                        </Button>
                                    ) : (
                                        <Button onClick={handleCancelGenerate}>
                                            手动输入
                                        </Button>
                                    )}
                                </Space>

                                {isGenerating && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        backgroundColor: 'var(--color-bg-1)',
                                        borderRadius: '4px',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        border: '1px solid var(--color-border-2)'
                                    }} ref={streamingContainerRef}>
                                        {showStreamLog && (
                                            <div style={{color: 'var(--color-text-2)', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.6'}}>
                                                <Spin size={12} style={{marginRight: '8px'}} />
                                                {streamingContent || '正在连接AI服务，请稍候...'}
                                            </div>
                                        )}
                                        {!showStreamLog && generatedEventData && (
                                            <div style={{color: 'var(--color-success-6)'}}>✅ 日程已生成</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {generatedEventData && !showEditForm && (
                            <div style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '16px',
                                backgroundColor: 'var(--color-bg-1)'
                            }}>
                                <div style={{fontWeight: 700, fontSize: '16px', marginBottom: '10px'}}>📋 生成结果预览</div>
                                <div style={{marginBottom: '8px'}}>
                                    <div style={{fontWeight: 600}}>标题</div>
                                    <div>{generatedEventData.title || '-'}</div>
                                </div>
                                <div style={{marginBottom: '8px'}}>
                                    <div style={{fontWeight: 600}}>时间</div>
                                    <div>
                                        {generatedEventData.startTime ? dayjs(generatedEventData.startTime).format('YYYY-MM-DD HH:mm') : '-'}
                                        {' '}~{' '}
                                        {generatedEventData.endTime ? dayjs(generatedEventData.endTime).format('YYYY-MM-DD HH:mm') : '-'}
                                    </div>
                                </div>
                                <div style={{marginBottom: '8px'}}>
                                    <div style={{fontWeight: 600}}>状态 / 全天</div>
                                    <div>
                                        <Tag color={statusBadgeColorMap[generatedEventData.status || 'SCHEDULED']} size="small" style={{fontSize: '11px'}} bordered>
                                            {statusLabelMap[generatedEventData.status || 'SCHEDULED']}
                                        </Tag>
                                        {' '}
                                        {generatedEventData.allDay ? <Tag color="blue" size="small" bordered>全天</Tag> : null}
                                    </div>
                                </div>
                                {generatedEventData.descr && (
                                    <div style={{marginBottom: '8px'}}>
                                        <div style={{fontWeight: 600}}>描述</div>
                                        <div style={{whiteSpace: 'pre-wrap'}}>{generatedEventData.descr}</div>
                                    </div>
                                )}
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={() => setShowEditForm(true)}
                                    >
                                        编辑
                                    </Button>
                                    <Button onClick={handleStreamGenerateEvent} disabled={isGenerating}>
                                        重新生成
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </div>
                )}
                {(isEditMode || showEditForm) && (
                <>
                {!isEditMode && generatedEventData && (
                    <div style={{
                        marginBottom: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-success-light-1)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{color: 'var(--color-success-6)', fontSize: '13px'}}>
                            ✨ AI已为您生成日程，可直接保存或修改后保存
                        </span>
                        <Button 
                            size="mini" 
                            type="text"
                            onClick={() => {
                                setShowEditForm(false);
                                setShowGeneratePanel(true);
                                setGeneratedEventData(null);
                            }}
                        >
                            重新生成
                        </Button>
                    </div>
                )}
                <Form ref={formRef} layout="vertical" className="modal-form">
                    <Form.Item
                        label="标题"
                        field="title"
                        rules={[{required: true, message: '请输入标题'}]}
                    >
                        <Input placeholder="请输入日程标题"/>
                    </Form.Item>
                    <Form.Item
                        label="描述"
                        field="descr"
                    >
                        <Input.TextArea placeholder="请输入日程描述" rows={3}/>
                    </Form.Item>
                    <Form.Item
                        label="开始时间"
                        field="startTime"
                        rules={[{required: true, message: '请选择开始时间'}]}
                    >
                        <DatePicker showTime placeholder="请选择开始时间"/>
                    </Form.Item>
                    <Form.Item
                        label="结束时间"
                        field="endTime"
                        rules={[{required: true, message: '请选择结束时间'}]}
                    >
                        <DatePicker showTime placeholder="请选择结束时间"/>
                    </Form.Item>
                    <Form.Item label="全天" field="allDay" triggerPropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        label="状态"
                        field="status"
                        rules={[{required: true, message: '请选择状态'}]}
                    >
                        <Select placeholder="请选择日程状态">
                            <Option value="SCHEDULED">已计划</Option>
                            <Option value="IN_PROGRESS">处理中</Option>
                            <Option value="COMPLETED">已完成</Option>
                            <Option value="CANCELLED">已取消</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="优先级"
                        field="priority"
                    >
                        <Select placeholder="请选择优先级" allowClear>
                            {priorityOptions.map((opt) => (
                                <Option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {isEditMode && currentSchedule?.completedAt && (
                        <Form.Item label="完成时间">
                            <div style={{color: 'var(--color-text-2)'}}>
                                {dayjs(currentSchedule.completedAt).format('YYYY-MM-DD HH:mm:ss')}
                            </div>
                        </Form.Item>
                    )}
                </Form>
                </>
                )}
            </Modal>

            {/* 完成日程模态框 */}
            <Modal
                title="完成日程"
                visible={completeModalVisible}
                onOk={handleComplete}
                onCancel={() => setCompleteModalVisible(false)}
                okText="确认完成"
                cancelText="取消"
            >
                <div style={{marginBottom: '16px'}}>
                    <div style={{fontWeight: 600, marginBottom: '8px'}}>日程: {completingSchedule?.title}</div>
                    <div style={{fontSize: '14px', color: 'var(--color-text-3)'}}>
                        {completingSchedule?.descr}
                    </div>
                </div>
                <div style={{fontSize: '14px', color: 'var(--color-text-3)'}}>
                    确认要将此日程标记为已完成吗？完成时间将自动设置为当前时间。
                </div>
            </Modal>
        </div>
    );
}

export default ScheduleManager;
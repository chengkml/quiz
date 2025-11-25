import React, {useEffect, useState} from 'react';
import {Button, DatePicker, Form, Input, Layout, Message, Modal, Select, Tag,} from '@arco-design/web-react';
import {IconList, IconLeft, IconRight, IconPlus,} from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import './style/index.less';
import {createSchedule, getSchedulesByDateRange, updateSchedule} from './api';

const {Content} = Layout;
const {Option} = Select;

// 视图类型枚举
type ViewType = 'month' | 'week' | 'year';

// 日程数据接口
interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    color: string;
    status: string;
}

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

    // 表单引用
    const formRef = React.useRef<any>(null);

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
            setSchedules(response.data || []);
        } catch (error) {
            Message.error('获取日程数据失败');
            // 模拟数据（如果API调用失败）
            setSchedules([
                {
                    id: '1',
                    title: '项目会议',
                    description: '每周项目进度讨论',
                    startTime: dayjs(currentDate).format('YYYY-MM-DD') + 'T10:00:00',
                    endTime: dayjs(currentDate).format('YYYY-MM-DD') + 'T11:30:00',
                    color: '#1677ff',
                    status: 'COMPLETED'
                },
                {
                    id: '2',
                    title: '团队建设',
                    description: '团队活动日',
                    startTime: dayjs(currentDate).add(2, 'day').format('YYYY-MM-DD') + 'T14:00:00',
                    endTime: dayjs(currentDate).add(2, 'day').format('YYYY-MM-DD') + 'T17:00:00',
                    color: '#52c41a',
                    status: 'PENDING'
                }
            ]);
        } finally {
            setLoading(false);
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
    return Math.max(cardHeight, 80); // 最小高度80px
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

    // 打开新增/编辑模态框
    const openModal = (schedule?: ScheduleItem) => {
        if (schedule) {
            setCurrentSchedule(schedule);
            setIsEditMode(true);
            setTimeout(() => {
                formRef.current?.setFieldsValue?.({
                    title: schedule.title,
                    description: schedule.description,
                    startTime: dayjs(schedule.startTime),
                    endTime: dayjs(schedule.endTime),
                    color: schedule.color,
                    status: schedule.status,
                });
            }, 50);
        } else {
            setCurrentSchedule(null);
            setIsEditMode(false);
            setTimeout(() => formRef.current?.resetFields?.(), 50);
        }
        setModalVisible(true);
    };

    // 保存日程
    const handleSave = async () => {
        try {
            const values = await formRef.current?.validate?.();
            if (values) {
                const payload = {
                    ...values,
                    startTime: dayjs(values.startTime).format('YYYY-MM-DDTHH:mm:ss'),
                    endTime: dayjs(values.endTime).format('YYYY-MM-DDTHH:mm:ss'),
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
            if (error?.fields) return;
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
                currentDay = firstDay.add(i - firstDayOfWeek - daysInMonth + 1, 'day');
            }

            // 获取当天的日程
            const daySchedules = schedules.filter(schedule =>
                dayjs(schedule.startTime).format('YYYY-MM-DD') === currentDay.format('YYYY-MM-DD')
            );

            const isToday = currentDay.isSame(dayjs(), 'day');
            const isCurrentMonth = currentDay.month() === month;

            calendarDays.push(
                <div
                    key={i}
                    className={`calendar-cell ${
                        isToday ? 'calendar-cell-today' : ''
                    } ${
                        !isCurrentMonth ? 'calendar-cell-other-month' : ''
                    }`}
                    style={{
                      height: viewType === 'month' ? `${calculateCardHeight()}px` : 'auto'
                    }}
                    onClick={() => isCurrentMonth && openModal()}
                    title={currentDay.format('YYYY年MM月DD日')}
                >
                    <div style={{
                        marginBottom: '8px',
                        fontWeight: isToday ? 600 : 400,
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>{currentDay.date()}</span>
                        {daySchedules.length > 0 && (
                            <Tag
                                color="primary"
                                style={{fontSize: '10px', padding: '0 4px'}}
                            >
                                {daySchedules.length}
                            </Tag>
                        )}
                    </div>
                    <div style={{maxHeight: '80px', overflow: 'auto'}}>
                        {daySchedules.slice(0, 3).map(schedule => (
                            <div
                                key={schedule.id}
                                className="schedule-item"
                                style={{backgroundColor: schedule.color}}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openModal(schedule);
                                }}
                                title={`${schedule.title}\n${dayjs(schedule.startTime).format('HH:mm')}-${dayjs(schedule.endTime).format('HH:mm')}`}
                            >
                                {dayjs(schedule.startTime).format('HH:mm')} {schedule.title}
                            </div>
                        ))}
                        {daySchedules.length > 3 && (
                            <div style={{
                                fontSize: '11px',
                                color: 'var(--color-text-3)',
                                textAlign: 'center',
                                marginTop: '2px'
                            }}>
                                还有 {daySchedules.length - 3} 个日程
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // 星期标题样式
        const weekHeaderStyle = {
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
            );

            const isToday = currentDay.isSame(dayjs(), 'day');
            const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

            weekDays.push(
                <div key={i} className="week-day-container">
                    <div className="week-day-header">
                        {currentDay.format('YYYY年MM月DD日')} {weekDayNames[currentDay.day()]}
                        {isToday && <Tag color="primary" style={{marginLeft: '8px'}}>今天</Tag>}
                    </div>
                    <div
                        className={`calendar-cell ${
                            isToday ? 'calendar-cell-today' : ''
                        }`}
                        onClick={() => openModal()}
                        style={{minHeight: '150px'}}
                    >
                        {daySchedules.length > 0 ? (
                            daySchedules.map(schedule => (
                                <div
                                    key={schedule.id}
                                    className="schedule-item"
                                    style={{backgroundColor: schedule.color}}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(schedule);
                                    }}
                                    title={`${schedule.title}\n${schedule.description || ''}\n${dayjs(schedule.startTime).format('HH:mm')}-${dayjs(schedule.endTime).format('HH:mm')}`}
                                >
                                    {dayjs(schedule.startTime).format('HH:mm')} {schedule.title}
                                </div>
                            ))
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
                                <Tag color="primary">{monthScheduleCount} 个日程</Tag>
                                {completedCount > 0 && (
                                    <Tag color="success">已完成 {completedCount} 个</Tag>
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
            <Layout>
                <Content>
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
                open={modalVisible}
                onOk={handleSave}
                onCancel={() => setModalVisible(false)}
            >
                <Form ref={formRef} layout="vertical">
                    <Form.Item
                        label="标题"
                        field="title"
                        rules={[{required: true, message: '请输入标题'}]}
                    >
                        <Input placeholder="请输入日程标题"/>
                    </Form.Item>
                    <Form.Item
                        label="描述"
                        field="description"
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
                    <Form.Item
                        label="颜色"
                        field="color"
                        rules={[{required: true, message: '请选择颜色'}]}
                    >
                        <Select placeholder="请选择日程颜色">
                            <Option value="#1677ff">蓝色</Option>
                            <Option value="#52c41a">绿色</Option>
                            <Option value="#faad14">黄色</Option>
                            <Option value="#f5222d">红色</Option>
                            <Option value="#722ed1">紫色</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="状态"
                        field="status"
                        rules={[{required: true, message: '请选择状态'}]}
                    >
                        <Select placeholder="请选择日程状态">
                            <Option value="PENDING">待处理</Option>
                            <Option value="IN_PROGRESS">进行中</Option>
                            <Option value="COMPLETED">已完成</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default ScheduleManager;
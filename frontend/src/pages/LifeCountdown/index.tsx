import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Grid,
  Message,
  Space,
  Spin,
  Tag,
  Typography,
} from '@arco-design/web-react';
import dayjs, { Dayjs } from 'dayjs';
import renderDate from '@/utils/timeUtil';
import {
  generateTodayWarning,
  getCurrentLifeCountdown,
  LifeCountdownProfileDto,
  saveLifeCountdownProfile,
} from './api';
import './style.less';

const { Row, Col } = Grid;
const { Title, Text, Paragraph } = Typography;

interface CountdownParts {
  expired: boolean;
  totalDays: number;
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const formatCalendarDate = (value?: string) => {
  if (!value) return '--';
  return dayjs(value).format('YYYY-MM-DD');
};

const calculateCountdown = (deathDate?: string, nowMs?: number): CountdownParts | null => {
  if (!deathDate || !nowMs) {
    return null;
  }

  const target = dayjs(`${deathDate}T23:59:59`);
  const diffMs = target.valueOf() - nowMs;
  if (diffMs <= 0) {
    return {
      expired: true,
      totalDays: 0,
      years: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalDays = Math.floor(totalSeconds / 86400);
  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: false,
    totalDays,
    years,
    days,
    hours,
    minutes,
    seconds,
  };
};

const padTime = (value: number) => String(value).padStart(2, '0');

const LifeCountdownPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<LifeCountdownProfileDto | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const syncFormWithProfile = (nextProfile?: LifeCountdownProfileDto | null) => {
    form.setFieldsValue({
      deathDate: nextProfile?.deathDate ? dayjs(nextProfile.deathDate) : undefined,
    });
  };

  const loadCurrentProfile = async () => {
    setLoading(true);
    try {
      const response = await getCurrentLifeCountdown();
      const nextProfile = response.data || null;
      setProfile(nextProfile);
      syncFormWithProfile(nextProfile);
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '加载生命倒计时失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const countdown = calculateCountdown(profile?.deathDate, nowMs);

  const handleSave = async () => {
    try {
      const values = await form.validate();
      const deathDate = values.deathDate as Dayjs | undefined;
      if (!deathDate) {
        Message.warning('请选择死亡日期');
        return;
      }

      setSaving(true);
      const response = await saveLifeCountdownProfile({
        deathDate: deathDate.format('YYYY-MM-DD'),
      });
      const nextProfile = response.data || null;
      setProfile(nextProfile);
      syncFormWithProfile(nextProfile);
      Message.success('死亡日期已保存');
    } catch (error: any) {
      if (error?.fields) {
        return;
      }
      Message.error(error?.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWarning = async (forceRefresh: boolean) => {
    if (!profile?.deathDate) {
      Message.warning('请先设置死亡日期');
      return;
    }

    setGenerating(true);
    try {
      const response = await generateTodayWarning({ forceRefresh });
      const warning = response.data;
      setProfile((prev) => ({
        ...(prev || {}),
        deathDate: prev?.deathDate || profile.deathDate,
        todayWarningText: warning?.warningText,
        todayWarningDate: warning?.warningDate,
        todayWarningGeneratedAt: warning?.generatedAt,
        todayWarningModel: warning?.modelName,
      }));

      if (warning?.cached) {
        Message.success('已返回今日缓存警示语');
      } else {
        Message.success(forceRefresh ? '已重新生成今日警示语' : '已生成今日警示语');
      }
    } catch (error: any) {
      Message.error(error?.response?.data?.message || '生成今日警示语失败');
    } finally {
      setGenerating(false);
    }
  };

  const renderCountdownContent = () => {
    if (!profile?.deathDate) {
      return <Empty description="先设定死亡日期，再开始倒数" />;
    }

    if (!countdown) {
      return <Spin />;
    }

    if (countdown.expired) {
      return (
        <div className="life-countdown-expired">
          <Tag color="red">设定日期已到</Tag>
          <Paragraph>
            这一天已经过去。要么重新设定日期，要么立刻处理今天最重要的事。
          </Paragraph>
        </div>
      );
    }

    return (
      <>
        <div className="life-countdown-summary">
          <div>
            <Text type="secondary">目标日期</Text>
            <div className="summary-value">{formatCalendarDate(profile.deathDate)}</div>
          </div>
          <div>
            <Text type="secondary">剩余总天数</Text>
            <div className="summary-value">{countdown.totalDays}</div>
          </div>
          <div>
            <Text type="secondary">今天状态</Text>
            <div className="summary-value">{formatCalendarDate(dayjs().format('YYYY-MM-DD'))}</div>
          </div>
        </div>
        <div className="life-countdown-metrics">
          <div className="metric-card">
            <div className="metric-value">{countdown.years}</div>
            <div className="metric-label">年</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{countdown.days}</div>
            <div className="metric-label">天</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{padTime(countdown.hours)}</div>
            <div className="metric-label">小时</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{padTime(countdown.minutes)}</div>
            <div className="metric-label">分钟</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{padTime(countdown.seconds)}</div>
            <div className="metric-label">秒</div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="life-countdown-page">
      <div className="life-countdown-header">
        <div>
          <Title heading={4}>生命倒计时</Title>
          <Text type="secondary">设定你的死亡日期，看清剩余时间，并用一句话逼自己回到今天。</Text>
        </div>
        <Tag color={profile?.deathDate ? 'blue' : 'gray'}>
          {profile?.deathDate ? '已设定日期' : '未设定日期'}
        </Tag>
      </div>

      <Row gutter={[12, 12]} className="life-countdown-content">
        <Col xs={24} lg={10}>
          <Card bordered={false} className="life-countdown-card">
            <div className="card-header">
              <div>
                <Title heading={6}>死亡日期</Title>
                <Text type="secondary">倒计时按所选日期当天 23:59:59 结束。</Text>
              </div>
              <Button type="primary" loading={saving} onClick={handleSave}>
                保存日期
              </Button>
            </div>
            {loading ? (
              <div className="card-loading">
                <Spin />
              </div>
            ) : (
              <>
                <Form form={form} layout="vertical">
                  <Form.Item
                    field="deathDate"
                    label="死亡日期"
                    rules={[{ required: true, message: '请选择死亡日期' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="YYYY-MM-DD"
                      disabledDate={(current) => Boolean(current && current.isBefore(dayjs().startOf('day')))}
                    />
                  </Form.Item>
                </Form>
                <Descriptions
                  className="life-countdown-descriptions"
                  column={1}
                  data={[
                    {
                      label: '当前设定',
                      value: formatCalendarDate(profile?.deathDate),
                    },
                    {
                      label: '最后更新',
                      value: profile?.updateDate ? renderDate(profile.updateDate) : '--',
                    },
                    {
                      label: '今日文案缓存',
                      value: profile?.todayWarningDate ? formatCalendarDate(profile.todayWarningDate) : '未生成',
                    },
                  ]}
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card bordered={false} className="life-countdown-card life-countdown-main-card">
            <div className="card-header">
              <div>
                <Title heading={6}>剩余时间</Title>
                <Text type="secondary">不是抽象的人生，只是精确减少的今天。</Text>
              </div>
            </div>
            {loading ? (
              <div className="card-loading">
                <Spin />
              </div>
            ) : (
              renderCountdownContent()
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card bordered={false} className="life-countdown-card">
            <div className="card-header">
              <div>
                <Title heading={6}>今日警示语</Title>
                <Text type="secondary">按天缓存。重新生成会覆盖今天的文案。</Text>
              </div>
              <Space>
                <Button
                  type="primary"
                  loading={generating}
                  disabled={!profile?.deathDate || Boolean(countdown?.expired)}
                  onClick={() => handleGenerateWarning(false)}
                >
                  生成今日警示语
                </Button>
                <Button
                  loading={generating}
                  disabled={!profile?.deathDate || Boolean(countdown?.expired)}
                  onClick={() => handleGenerateWarning(true)}
                >
                  重新生成
                </Button>
              </Space>
            </div>

            {loading ? (
              <div className="card-loading">
                <Spin />
              </div>
            ) : profile?.todayWarningText ? (
              <>
                <div className="life-warning-panel">
                  <Paragraph className="life-warning-text">{profile.todayWarningText}</Paragraph>
                </div>
                <Descriptions
                  className="life-countdown-descriptions"
                  column={2}
                  data={[
                    {
                      label: '文案日期',
                      value: formatCalendarDate(profile.todayWarningDate),
                    },
                    {
                      label: '生成时间',
                      value: profile.todayWarningGeneratedAt ? renderDate(profile.todayWarningGeneratedAt) : '--',
                    },
                    {
                      label: '使用模型',
                      value: profile.todayWarningModel || '默认模型',
                    },
                    {
                      label: '适用目标日',
                      value: formatCalendarDate(profile.deathDate),
                    },
                  ]}
                />
              </>
            ) : (
              <Empty description="今天还没有警示语，点上面的按钮生成一条" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LifeCountdownPage;

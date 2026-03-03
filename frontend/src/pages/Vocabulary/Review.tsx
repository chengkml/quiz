import React, { useState, useEffect } from 'react';
import { Button, Message, Card, Space, Result } from '@arco-design/web-react';
import { IconCheckCircle } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { getDueToday, reviewVocabulary, VocabularyCardDto } from './api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './style/index.less';

/**
 * 复习页面
 */
interface ReviewPageProps {
    embedded?: boolean;
    onExit?: () => void;
}

const ReviewPage: React.FC<ReviewPageProps> = ({ embedded = false, onExit }) => {
    const navigate = useNavigate();
    const [cards, setCards] = useState<VocabularyCardDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);

    useEffect(() => {
        loadDueCards();
    }, []);

    const loadDueCards = async () => {
        try {
            setLoading(true);
            const res = await getDueToday();
            setCards(res.data || []);
        } catch (error) {
            Message.error('加载复习任务失败');
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleScore = async (score: number) => {
        if (reviewing) return;
        
        const currentCard = cards[currentIndex];
        
        try {
            setReviewing(true);
            const res = await reviewVocabulary({
                id: currentCard.id,
                score
            });
            
            Message.success(res.data.message);
            
            // 移到下一张卡片
            if (currentIndex < cards.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                // 全部复习完成
                setCurrentIndex(cards.length);
            }
        } catch (error: any) {
            Message.error(error.response?.data?.message || '提交失败');
        } finally {
            setReviewing(false);
        }
    };

    const handleExit = () => {
        if (onExit) {
            onExit();
            return;
        }
        navigate('/vocabulary');
    };

    const handleRestart = () => {
        if (embedded) {
            setCurrentIndex(0);
            setIsFlipped(false);
            loadDueCards();
            return;
        }
        window.location.reload();
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 60 }}>加载中...</div>;
    }

    if (cards.length === 0) {
        return (
            <div className="review-page">
                <Result
                    status="success"
                    title="太棒了！"
                    subTitle="今天没有需要复习的单词"
                    extra={[
                        <Button key="back" type="primary" onClick={handleExit}>
                            返回单词列表
                        </Button>
                    ]}
                />
            </div>
        );
    }

    if (currentIndex >= cards.length) {
        return (
            <div className="review-page">
                <div className="completion-message">
                    <div className="icon">
                        <IconCheckCircle style={{ fontSize: 80, color: '#00b42a' }} />
                    </div>
                    <h2>恭喜完成今日复习！</h2>
                    <p>共复习了 {cards.length} 个单词</p>
                    <Space>
                        <Button type="primary" onClick={handleExit}>
                            返回单词列表
                        </Button>
                        <Button onClick={handleRestart}>
                            再次复习
                        </Button>
                    </Space>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentIndex];

    return (
        <div className={`review-page ${embedded ? 'review-page-embedded' : ''}`}>
            <div className="review-header">
                <div className="review-top-bar">
                    <div className="review-index">
                        {currentIndex + 1} / {cards.length}
                    </div>
                    <div className="review-top-actions">
                        <Space>
                            <Button onClick={handleExit}>
                                退出复习
                            </Button>
                            {currentIndex > 0 && (
                                <Button 
                                    onClick={() => {
                                        setCurrentIndex(prev => prev - 1);
                                        setIsFlipped(false);
                                    }}
                                >
                                    上一个
                                </Button>
                            )}
                            {currentIndex < cards.length - 1 && (
                                <Button 
                                    onClick={() => {
                                        setCurrentIndex(prev => prev + 1);
                                        setIsFlipped(false);
                                    }}
                                >
                                    下一个
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>

            <div className="review-content">
                <div className="review-card-container">
                <Card 
                    className={`review-card ${isFlipped ? 'flipped' : ''}`}
                    onClick={handleFlip}
                >
                    <div className="card-face card-front">
                        {currentCard.word}
                    </div>
                    <div className="card-face card-back">
                        <div className="md-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentCard.mdDefinition || '无释义'}</ReactMarkdown>
                        </div>
                    </div>
                </Card>
                </div>
            </div>
        <div className="review-footer">
            <div className="score-buttons">
                <Button 
                    size="large" 
                    status="danger"
                    onClick={() => handleScore(0)}
                    loading={reviewing}
                >
                    😰 忘光了 (0分)
                </Button>
                <Button 
                    size="large" 
                    status="warning"
                    onClick={() => handleScore(3)}
                    loading={reviewing}
                >
                    🤔 模糊 (3分)
                </Button>
                <Button 
                    size="large" 
                    type="primary"
                    onClick={() => handleScore(5)}
                    loading={reviewing}
                >
                    😄 太简单 (5分)
                </Button>
            </div>
        </div>
        </div>
    );
};

export default ReviewPage;

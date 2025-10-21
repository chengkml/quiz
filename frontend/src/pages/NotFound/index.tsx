import React from 'react';
import { Result, Button } from '@arco-design/web-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/quiz/frame/home');
    };

    const handleGoLogin = () => {
        navigate('/quiz/login');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5'
        }}>
            <Result
                status="404"
                title="页面未找到"
                subTitle="抱歉，您访问的页面不存在、已被移除或您没有访问权限。"
                extra={[
                    <Button key="home" type="primary" onClick={handleGoHome}>
                        返回首页
                    </Button>,
                    <Button key="login" onClick={handleGoLogin}>
                        重新登录
                    </Button>
                ]}
            />
        </div>
    );
};

export default NotFound;
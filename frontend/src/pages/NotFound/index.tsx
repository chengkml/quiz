import React from 'react';
import {Result} from '@arco-design/web-react';

const NotFound: React.FC = () => {

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
                subTitle="抱歉，您访问的页面不存在或已被移除。"
            />
        </div>
    );
};

export default NotFound;
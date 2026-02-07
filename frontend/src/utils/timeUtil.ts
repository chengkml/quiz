const renderDate = (value: string | number | Date) => {
    if (!value) return '--';

    const now = new Date();
    const date = new Date(value);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // 今天
    if (diffDays === 0) {
        if (diffSeconds < 60) {
            return `${diffSeconds}秒前`;
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        } else {
            return `${diffHours}小时前`;
        }
    }
    // 昨天
    else if (diffDays === 1) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `昨天 ${hours}:${minutes}`;
    }
    // 昨天之前
    else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
};

export default renderDate;
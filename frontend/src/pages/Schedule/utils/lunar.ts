// 农历和节日相关工具

// 使用动态导入来兼容模块系统
const Lunar = require('lunar-calendar');

// 中国传统节日映射表 (农历月日 -> 节日名称)
const lunarHolidaysMap: Record<string, string> = {
    '01-01': '春节',
    '01-15': '元宵节',
    '05-05': '端午节',
    '08-15': '中秋节',
    '09-09': '重阳节',
};

// 公历节日映射表 (月-日 -> 节日名称)
const solarHolidaysMap: Record<string, string> = {
    '01-01': '元旦',
    '02-14': '情人节',
    '03-08': '妇女节',
    '03-12': '植树节',
    '04-01': '愚人节',
    '05-01': '劳动节',
    '06-01': '儿童节',
    '07-01': '建党节',
    '08-01': '建军节',
    '09-10': '教师节',
    '10-01': '国庆节',
    '10-31': '万圣节',
    '11-11': '双十一',
    '12-25': '圣诞节',
};

/**
 * 获取农历日期
 * @param date JavaScript Date对象
 * @returns 农历日期对象 { year, month, day, monthName, dayName, isLeap }
 */
export const getLunarDate = (date: Date) => {
    try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // lunar-calendar 的 solarToLunar 方法接收三个参数，返回对象
        const result = Lunar.solarToLunar(year, month, day);
        
        if (result) {
            return {
                year: result.lunarYear,
                month: result.lunarMonth,
                day: result.lunarDay,
                monthName: result.lunarMonthName,
                dayName: result.lunarDayName,
                isLeap: result.lunarLeapMonth === result.lunarMonth,
            };
        }
    } catch (e) {
        console.error('农历转换失败:', e);
    }
    return null;
};

/**
 * 格式化农历日期字符串
 * @param date JavaScript Date对象
 * @returns 格式化的农历日期 如 "正月初一"
 */
export const formatLunarDate = (date: Date): string => {
    const lunar = getLunarDate(date);
    if (!lunar || !lunar.monthName || !lunar.dayName) return '';

    const leapPrefix = lunar.isLeap ? '闰' : '';
    return `${leapPrefix}${lunar.monthName}${lunar.dayName}`;
};

/**
 * 获取公历节日
 * @param date JavaScript Date对象
 * @returns 节日名称，无则返回空字符串
 */
export const getSolarHoliday = (date: Date): string => {
    try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const result = Lunar.solarToLunar(year, month, day);
        // 农历库已经包含公历节日信息
        if (result && result.solarFestival) {
            return result.solarFestival;
        }

        // 如果库没有返回，使用本地映射表
        const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return solarHolidaysMap[key] || '';
    } catch (e) {
        console.error('获取公历节日失败:', e);
        return '';
    }
};

/**
 * 获取农历节日
 * @param date JavaScript Date对象
 * @returns 节日名称，无则返回空字符串
 */
export const getLunarHoliday = (date: Date): string => {
    try {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        const result = Lunar.solarToLunar(year, month, day);
        // 农历库已经包含农历节日信息
        if (result && result.lunarFestival) {
            return result.lunarFestival;
        }

        // 如果库没有返回，使用本地映射表
        const lunar = getLunarDate(date);
        if (!lunar) return '';

        const key = `${String(lunar.month).padStart(2, '0')}-${String(lunar.day).padStart(2, '0')}`;
        return lunarHolidaysMap[key] || '';
    } catch (e) {
        console.error('获取农历节日失败:', e);
        return '';
    }
};

/**
 * 获取日期的所有节日（公历和农历）
 * @param date JavaScript Date对象
 * @returns 节日数组
 */
export const getHolidays = (date: Date): string[] => {
    const holidays: string[] = [];
    const solarHoliday = getSolarHoliday(date);
    const lunarHoliday = getLunarHoliday(date);

    if (solarHoliday) holidays.push(solarHoliday);
    if (lunarHoliday) holidays.push(lunarHoliday);

    return holidays;
};

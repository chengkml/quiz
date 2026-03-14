export interface StatisticsThemeDefinition {
  key: string;
  title: string;
  description: string;
  routePath: string;
}

/**
 * 统计主题注册表（前端路由与展示入口）
 */
export const statisticsThemeRegistry: StatisticsThemeDefinition[] = [
  {
    key: 'question-bank',
    title: '题库统计',
    description: '查看题目规模、学科分布与新增趋势',
    routePath: 'statistics-center/question-bank',
  },
];

export const statisticsThemeRegistryMap = new Map(
  statisticsThemeRegistry.map((theme) => [theme.key, theme]),
);

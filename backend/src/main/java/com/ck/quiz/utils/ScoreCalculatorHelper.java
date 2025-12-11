package com.ck.quiz.utils;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ScoreCalculatorHelper {

    /**
     * Score 计算辅助类。
     *
     * <p>说明：根据传入的规则（ScoreRule 列表）和按块分组的项目记录（items），
     * 逐块匹配规则计算扣分并从初始分 100 中减去。</p>
     *
     * 规则字段说明（在 ScoreRule 中）：
     * - type: 规则对应的块类型（与 items 的 key 对应）
     * - threshold: 允许的最大记录数（超过该值才开始扣分）
     * - deduct: 超出 1 条记录对应的扣分值
     * - weight: 该规则的最大扣分上限
     */
    
    /**
     * 计算总分。
     *
     * @param scoreRules 评分规则列表，用于匹配不同类型的块
     * @param items 按块（key）分组的记录，Map 的 key 为块类型，value 为该块的记录列表
     * @return 计算后的总分（从 100 开始扣分，未对最小值做特别约束）
     */
    public int calculateScore(List<ScoreRule> scoreRules, Map<String, List<Map<String, Object>>> items) {
        // 初始总分
        int totalScore = 100;
        log.info("开始计算分值，初始总分: {}", totalScore);

        // 遍历每个块（items 的每一项）
        Iterator<Map.Entry<String, List<Map<String, Object>>>> it = items.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, List<Map<String, Object>>> entry = it.next();
            String blockKey = entry.getKey(); // 块的类型标识
            List<Map<String, Object>> records = entry.getValue(); // 当前块的记录列表
            int recordCount = records == null ? 0 : records.size();
            log.info("处理块 '{}'，记录数: {}", blockKey, recordCount);

            // 遍历规则列表，找出与当前块类型匹配的规则并应用扣分逻辑
            for (ScoreRule rule : scoreRules) {
                String ruleType = rule.getType();
                if (!blockKey.equals(ruleType)) {
                    continue;
                }
                log.info("  匹配到规则 type='{}'，threshold={}, deduct={}, weight={}", ruleType, rule.getThreshold(), rule.getDeduct(), rule.getWeight());
                // 只有当记录数超过阈值时才会扣分
                if (rule.getThreshold() < recordCount) {
                    int exceed = recordCount - rule.getThreshold();
                    // 按超出数量 * 每条扣分计算初步扣分
                    int deduction = exceed * rule.getDeduct();
                    log.info("    超出数量: {}，初步扣分: {}", exceed, deduction);
                    // 扣分不超过该规则的最大权重（weight）
                    int applied = deduction > rule.getWeight() ? rule.getWeight() : deduction;
                    totalScore -= applied;
                    log.info("    应用扣分: {}，扣分后总分: {}", applied, totalScore);
                } else {
                    log.info("    记录数 {} 未超过阈值 {}，不扣分", recordCount, rule.getThreshold());
                }
            }
        }
        log.info("分值计算结束，最终得分: {}", totalScore);
        return totalScore;
    }

}

package com.ck.quiz.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScoreCalculatorHelperTest {

    private final ScoreCalculatorHelper helper = new ScoreCalculatorHelper();

    @Test
    void calculateScoreAppliesThresholdDeductAndWeightCap() {
        ScoreRule ruleA = new ScoreRule();
        ruleA.setType("A");
        ruleA.setThreshold(1);
        ruleA.setDeduct(10);
        ruleA.setWeight(15);

        ScoreRule ruleB = new ScoreRule();
        ruleB.setType("B");
        ruleB.setThreshold(0);
        ruleB.setDeduct(5);
        ruleB.setWeight(100);

        Map<String, List<Map<String, Object>>> items = new HashMap<>();
        items.put("A", List.of(Map.of("id", 1), Map.of("id", 2), Map.of("id", 3)));
        items.put("B", List.of(Map.of("id", 1), Map.of("id", 2)));
        items.put("C", List.of(Map.of("id", 1), Map.of("id", 2), Map.of("id", 3)));

        int score = helper.calculateScore(List.of(ruleA, ruleB), items);

        // A: exceed 2 -> 20, capped to 15; B: exceed 2 -> 10; C: no rule
        assertEquals(75, score);
    }

    @Test
    void calculateScoreDoesNotDeductWhenUnderThresholdOrNullRecords() {
        ScoreRule rule = new ScoreRule();
        rule.setType("A");
        rule.setThreshold(2);
        rule.setDeduct(10);
        rule.setWeight(50);

        Map<String, List<Map<String, Object>>> items = new HashMap<>();
        items.put("A", List.of(Map.of("id", 1), Map.of("id", 2)));
        items.put("B", null);

        int score = helper.calculateScore(List.of(rule), items);

        assertEquals(100, score);
    }
}

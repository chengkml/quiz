package com.ck.quiz.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HumpHelperTest {

    @Test
    void lineToHumpConvertsSnakeCaseToCamelCase() {
        assertEquals("userName", HumpHelper.lineToHump("USER_NAME"));
        assertEquals("quizId", HumpHelper.lineToHump("quiz_id"));
    }

    @Test
    void humpToLineConvertsCamelCaseToSnakeCase() {
        assertEquals("user_name", HumpHelper.humpToLineList("userName"));
        assertEquals("a_b_c", HumpHelper.humpToLineList("ABC"));
    }

    @Test
    void mapAndListConvertersKeepValues() {
        Map<String, Object> row = new HashMap<>();
        row.put("user_name", "ck");
        row.put("quiz_id", 7L);

        Map<String, Object> camel = HumpHelper.lineToHump(row);
        assertEquals("ck", camel.get("userName"));
        assertEquals(7L, camel.get("quizId"));

        List<Map<String, Object>> listResult = HumpHelper.humpToLineList(List.of(camel));
        assertEquals("ck", listResult.get(0).get("user_name"));
        assertEquals(7L, listResult.get(0).get("quiz_id"));
    }
}

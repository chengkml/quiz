package com.ck.quiz.utils;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class HumpHelper {

    private static Pattern linePattern = Pattern.compile("_(\\w)");

    private static Pattern humpPattern = Pattern.compile("[A-Z]");

    /**
     * 下划线转驼峰
     */
    public static String lineToHump(String str) {
        str = str.toLowerCase();
        Matcher matcher = linePattern.matcher(str);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(sb, matcher.group(1).toUpperCase());
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    public static Map<String, Object> lineToHump(Map<String, Object> map) {
        Iterator<Map.Entry<String, Object>> it = map.entrySet().iterator();
        Map<String, Object> temp = new HashMap<>();
        while (it.hasNext()) {
            Map.Entry<String, Object> e = it.next();
            temp.put(HumpHelper.lineToHump(e.getKey()), e.getValue());
        }
        return temp;
    }

    public static List<Map<String, Object>> lineToHump(List<Map<String, Object>> list) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (Map<String, Object> map : list) {
            res.add(lineToHump(map));
        }
        return res;
    }

    /**
     * 驼峰转下划线,效率比上面高
     */
    public static String humpToLineList(String str) {
        Matcher matcher = humpPattern.matcher(str);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            matcher.appendReplacement(sb, "_" + matcher.group(0).toLowerCase());
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    public static Map<String, Object> humpToLineMap(Map<String, Object> map) {
        Iterator<Map.Entry<String, Object>> it = map.entrySet().iterator();
        Map<String, Object> temp = new HashMap<>();
        while (it.hasNext()) {
            Map.Entry<String, Object> e = it.next();
            temp.put(HumpHelper.humpToLineList(e.getKey()), e.getValue());
        }
        return temp;
    }

    public static List<Map<String, Object>> humpToLineList(List<Map<String, Object>> list) {
        List<Map<String, Object>> res = new ArrayList<>();
        for (Map<String, Object> map : list) {
            res.add(humpToLineMap(map));
        }
        return res;
    }


}

package com.ck.quiz.utils;

import com.xfvape.uid.UidGenerator;

public class IdHelper {

    public static String genUuid() {
        return String.valueOf(SpringContextUtil.getBean(UidGenerator.class).getUID());
    }
}

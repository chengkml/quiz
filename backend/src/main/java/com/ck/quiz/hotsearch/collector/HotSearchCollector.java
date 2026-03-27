package com.ck.quiz.hotsearch.collector;

import com.ck.quiz.hotsearch.dto.HotSearchSourceItem;

import java.util.List;

public interface HotSearchCollector {

    String source();

    List<HotSearchSourceItem> collect();
}

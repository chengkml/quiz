package com.ck.quiz.hotsearch.service;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface HotSearchService {

    HotSearchCollectResultDto collectLatest(String source);

    Page<HotSearchRecordDto> search(HotSearchQueryDto queryDto);

    List<HotSearchRecordDto> latest(String source);

    HotSearchRecordDto getById(String id);
}

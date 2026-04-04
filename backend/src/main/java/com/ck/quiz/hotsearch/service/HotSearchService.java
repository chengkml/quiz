package com.ck.quiz.hotsearch.service;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportRequestDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface HotSearchService {

    HotSearchCollectResultDto importRecords(HotSearchImportRequestDto requestDto);

    Page<HotSearchRecordDto> search(String userId, HotSearchQueryDto queryDto);

    List<HotSearchRecordDto> latest(String userId, String source);

    HotSearchRecordDto getById(String userId, String id);
}

package com.ck.quiz.hotsearch.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicCreateDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicUpdateDto;
import com.ck.quiz.hotsearch.service.HotSearchFollowTopicService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hot-search/follow-topic")
public class HotSearchFollowTopicController extends BaseController<HotSearchFollowTopicCreateDto, HotSearchFollowTopicUpdateDto, HotSearchFollowTopicQueryDto, HotSearchFollowTopicDto> {

    private final HotSearchFollowTopicService hotSearchFollowTopicService;

    public HotSearchFollowTopicController(HotSearchFollowTopicService hotSearchFollowTopicService) {
        this.hotSearchFollowTopicService = hotSearchFollowTopicService;
    }

    @Override
    protected BaseService<HotSearchFollowTopicCreateDto, HotSearchFollowTopicUpdateDto, HotSearchFollowTopicQueryDto, HotSearchFollowTopicDto, ?> getService() {
        return hotSearchFollowTopicService;
    }
}

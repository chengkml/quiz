package com.ck.quiz.hotsearch.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicCreateDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchFollowTopicUpdateDto;
import com.ck.quiz.hotsearch.entity.HotSearchFollowTopic;

public interface HotSearchFollowTopicService extends BaseService<HotSearchFollowTopicCreateDto, HotSearchFollowTopicUpdateDto, HotSearchFollowTopicQueryDto, HotSearchFollowTopicDto, HotSearchFollowTopic> {
}

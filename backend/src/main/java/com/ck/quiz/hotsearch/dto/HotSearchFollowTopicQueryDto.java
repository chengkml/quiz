package com.ck.quiz.hotsearch.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class HotSearchFollowTopicQueryDto extends QueryDto {

    private String topicName;

    private Boolean enabled;
}

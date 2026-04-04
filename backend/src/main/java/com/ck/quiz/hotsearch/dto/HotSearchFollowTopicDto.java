package com.ck.quiz.hotsearch.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class HotSearchFollowTopicDto extends Dto {

    private String topicName;

    private String keywords;

    private Boolean enabled;

    private Integer seq;
}

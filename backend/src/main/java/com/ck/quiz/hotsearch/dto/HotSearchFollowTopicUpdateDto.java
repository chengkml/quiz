package com.ck.quiz.hotsearch.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class HotSearchFollowTopicUpdateDto extends UpdateDto {

    @NotBlank(message = "主题名称不能为空")
    @Size(max = 128, message = "主题名称长度不能超过128个字符")
    private String topicName;

    @Size(max = 4000, message = "关键词长度不能超过4000个字符")
    private String keywords;

    private Boolean enabled;

    private Integer seq;
}

package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class KnowledgeSourceUpdateDto extends UpdateDto {
    private String name;
    private String type;
    private String status;
    @Size(max = 2048, message = "内容长度不能超过2048个字符")
    private String content;
    private String meta;
    private String descr;
    private String language;
}

package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class KnowledgeSourceCreateDto extends CreateDto {
    @NotBlank(message = "知识集ID不能为空")
    private String knowledgeSetId;
    @NotBlank(message = "名称不能为空")
    private String name;
    private String type;
    @Size(max = 2048, message = "内容长度不能超过2048个字符")
    private String content;
    private String meta;
    private String descr;
}

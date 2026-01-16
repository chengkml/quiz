package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.QueryDto;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KnowledgeSetQueryDto extends QueryDto {

    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String status;

    @Size(max = 32, message = "可见性长度不能超过32个字符")
    private String visibility;
}


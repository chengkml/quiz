package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KnowledgeSetUpdateDto extends UpdateDto {

    @Size(max = 128, message = "知识集名称长度不能超过128个字符")
    private String name;

    @Size(max = 512, message = "描述长度不能超过512个字符")
    private String descr;

    @Size(max = 256, message = "标签长度不能超过256个字符")
    private String tags;

    @Size(max = 32, message = "可见性长度不能超过32个字符")
    private String visibility;

    @Size(max = 32, message = "默认语言长度不能超过32个字符")
    private String defaultLanguage;

    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String status;
}


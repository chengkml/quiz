package com.ck.quiz.mindmap.dto;

import com.ck.quiz.base.dto.QueryDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MindMapQueryDto extends QueryDto {

    private String mapName;

}
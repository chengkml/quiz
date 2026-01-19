package com.ck.quiz.mindmap.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import com.ck.quiz.base.dto.Dto;

@Data
@EqualsAndHashCode(callSuper = true)
public class MindMapDto extends Dto {

    private String mapName;

    private String descr;

    private String mapData;
}
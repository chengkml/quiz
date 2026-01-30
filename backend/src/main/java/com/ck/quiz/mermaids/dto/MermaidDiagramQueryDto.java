package com.ck.quiz.mermaids.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MermaidDiagramQueryDto extends QueryDto {

    private String diagramName;

    private String group;
}

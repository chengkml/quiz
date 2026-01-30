package com.ck.quiz.mermaids.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MermaidDiagramDto extends Dto {

    private String diagramName;
    private String description;
    private String diagramData;

}

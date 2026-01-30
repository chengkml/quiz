package com.ck.quiz.mermaids.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MermaidDiagramUpdateDto extends UpdateDto {

    private String diagramName;

    private String description;

    private String diagramData;
}

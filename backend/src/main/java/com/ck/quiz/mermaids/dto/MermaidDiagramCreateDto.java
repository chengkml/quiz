package com.ck.quiz.mermaids.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MermaidDiagramCreateDto extends CreateDto {

    @NotBlank(message = "图名称不能为空")
    private String diagramName;

    private String description;

    private String diagramData;
}

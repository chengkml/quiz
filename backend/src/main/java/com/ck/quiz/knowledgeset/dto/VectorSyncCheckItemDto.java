package com.ck.quiz.knowledgeset.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VectorSyncCheckItemDto {
    private Long count = 0L;
    private List<VectorSyncIssueSampleDto> samples = new ArrayList<>();
}

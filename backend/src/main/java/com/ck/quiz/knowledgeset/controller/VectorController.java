package com.ck.quiz.knowledgeset.controller;

import com.ck.quiz.knowledgeset.dto.VectorSearchDto;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.service.VectorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "向量检索接口")
@RestController
@RequestMapping("/api/vector")
@RequiredArgsConstructor
public class VectorController {

    private final VectorService vectorService;

    @Operation(summary = "向量检索测试")
    @PostMapping("/search")
    public List<VectorSearchResultDto> search(@RequestBody VectorSearchDto searchDto) {
        com.ck.quiz.knowledgeset.dto.VectorSearchFilter filter = com.ck.quiz.knowledgeset.dto.VectorSearchFilter
                .builder()
                .knowledgeSetId(searchDto.getKnowledgeSetId())
                .searchType(searchDto.getSearchType())
                .build();
        return vectorService.search(searchDto.getQuery(), searchDto.getTopK(), searchDto.getModelName(), filter);
    }
}

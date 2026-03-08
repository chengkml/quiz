package com.ck.quiz.knowledgeset.controller;

import com.ck.quiz.knowledgeset.dto.VectorSearchDto;
import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;
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
        VectorSearchFilter filter = VectorSearchFilter.builder()
                .knowledgeSetId(searchDto.getKnowledgeSetId())
                .knowledgeSourceId(searchDto.getKnowledgeSourceId())
                .searchType(searchDto.getSearchType())
                .minScore(searchDto.getMinScore())
                .build();

        Integer topK = searchDto.getTopK() == null || searchDto.getTopK() <= 0 ? 5 : searchDto.getTopK();
        return vectorService.search(searchDto.getQuery(), topK, searchDto.getModelName(), filter);
    }
}

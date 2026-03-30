package com.ck.quiz.hotsearch.controller;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportRequestDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.service.HotSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hot-search")
public class HotSearchController {

    @Autowired
    private HotSearchService hotSearchService;

    @PostMapping("/search")
    public ResponseEntity<Page<HotSearchRecordDto>> search(@RequestBody HotSearchQueryDto queryDto) {
        return ResponseEntity.ok(hotSearchService.search(queryDto));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<HotSearchRecordDto>> latest(@RequestParam(required = false) String source) {
        return ResponseEntity.ok(hotSearchService.latest(source));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable String id) {
        HotSearchRecordDto dto = hotSearchService.getById(id);
        if (dto == null) {
            return ResponseEntity.ok(Map.of("success", false, "message", "记录不存在"));
        }
        return ResponseEntity.ok(Map.of("success", true, "data", dto));
    }

    @PostMapping("/import")
    public ResponseEntity<Object> importRecords(@RequestBody HotSearchImportRequestDto requestDto) {
        HotSearchCollectResultDto result = hotSearchService.importRecords(requestDto);
        return ResponseEntity.ok(Map.of("success", true, "data", result));
    }
}

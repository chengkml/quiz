package com.ck.quiz.hotsearch.controller;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.service.HotSearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
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

    @PostMapping("/collect")
    public ResponseEntity<Object> collect(@RequestBody(required = false) Map<String, Object> body) {
        try {
            String source = body == null ? null : (String) body.get("source");
            HotSearchCollectResultDto result = hotSearchService.collectLatest(source);
            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (Exception e) {
            log.error("手动抓取热搜失败", e);
            return ResponseEntity.ok(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

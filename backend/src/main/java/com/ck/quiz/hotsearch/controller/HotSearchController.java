package com.ck.quiz.hotsearch.controller;

import com.ck.quiz.hotsearch.dto.HotSearchCollectResultDto;
import com.ck.quiz.hotsearch.dto.HotSearchImportRequestDto;
import com.ck.quiz.hotsearch.dto.HotSearchQueryDto;
import com.ck.quiz.hotsearch.dto.HotSearchRecordDto;
import com.ck.quiz.hotsearch.service.HotSearchService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hot-search")
public class HotSearchController {

    private final HotSearchService hotSearchService;

    public HotSearchController(HotSearchService hotSearchService) {
        this.hotSearchService = hotSearchService;
    }

    @PostMapping("/search")
    public ResponseEntity<Page<HotSearchRecordDto>> search(@RequestBody HotSearchQueryDto queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(hotSearchService.search(authentication.getName(), queryDto));
    }

    @GetMapping("/latest")
    public ResponseEntity<List<HotSearchRecordDto>> latest(@RequestParam(required = false) String source) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(hotSearchService.latest(authentication.getName(), source));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getById(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        HotSearchRecordDto dto = hotSearchService.getById(authentication.getName(), id);
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

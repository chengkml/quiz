package com.ck.quiz.mermaids.controller;

import com.ck.quiz.mermaids.dto.MermaidCategoryDTO;
import com.ck.quiz.mermaids.service.MermaidCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mermaids/categories")
@RequiredArgsConstructor
public class MermaidCategoryController {

    private final MermaidCategoryService service;

    @PostMapping("create")
    public ResponseEntity<MermaidCategoryDTO> create(@Valid @RequestBody MermaidCategoryDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<MermaidCategoryDTO> update(@PathVariable(value = "id") String id, @Valid @RequestBody MermaidCategoryDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable(value = "id") String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/get/{id}")
    public ResponseEntity<MermaidCategoryDTO> getById(@PathVariable(value = "id") String id) {
        MermaidCategoryDTO dto = service.findById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("search")
    public ResponseEntity<Page<MermaidCategoryDTO>> list(Pageable pageable) {
        return ResponseEntity.ok(service.list(pageable));
    }
}

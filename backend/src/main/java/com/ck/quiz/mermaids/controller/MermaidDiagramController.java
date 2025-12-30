package com.ck.quiz.mermaids.controller;

import com.ck.quiz.mermaids.dto.MermaidDiagramDTO;
import com.ck.quiz.mermaids.service.MermaidDiagramService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/mermaids/diagrams")
@RequiredArgsConstructor
public class MermaidDiagramController {

    private final MermaidDiagramService service;

    @PostMapping
    public ResponseEntity<MermaidDiagramDTO> create(@Valid @RequestBody MermaidDiagramDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MermaidDiagramDTO> update(@PathVariable("id") String id, @Valid @RequestBody MermaidDiagramDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/data")
    public ResponseEntity<MermaidDiagramDTO> updateDiagramData(@PathVariable("id") String id,
                                                               @RequestBody Map<String, String> payload) {
        String diagramData = payload == null ? null : payload.get("diagramData");
        MermaidDiagramDTO dto = new MermaidDiagramDTO();
        dto.setDiagramData(diagramData);
        MermaidDiagramDTO updated = service.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MermaidDiagramDTO> getById(@PathVariable("id") String id) {
        MermaidDiagramDTO dto = service.findById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<Page<MermaidDiagramDTO>> list(@RequestParam(value = "keyWord", required = false) String keyWord,
                                                      @RequestParam(value = "categoryId", required = false) String categoryId,
                                                      Pageable pageable) {
        return ResponseEntity.ok(service.list(keyWord, categoryId, pageable));
    }
}

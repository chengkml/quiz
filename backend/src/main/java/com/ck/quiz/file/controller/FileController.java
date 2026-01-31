package com.ck.quiz.file.controller;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.entity.FileMetadata;
import com.ck.quiz.file.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Tag(name = "File Management")
@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @Operation(summary = "Upload file")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileMetadata> upload(@RequestParam("file") MultipartFile file,
            @RequestParam(value = "path", defaultValue = "") String path) {
        FileMetadata metadata = fileService.upload(file, path);
        return ResponseEntity.ok(metadata);
    }

    @Operation(summary = "Create folder")
    @PostMapping("/folder")
    public ResponseEntity<FileMetadata> createFolder(@RequestParam("name") String name,
            @RequestParam(value = "path", defaultValue = "") String path) {
        return ResponseEntity.ok(fileService.createFolder(path, name));
    }

    @Operation(summary = "Download file")
    @GetMapping("/download")
    public ResponseEntity<InputStreamResource> download(@RequestParam("id") String id) {
        FileMetadata metadata = fileService.get(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\""
                                + URLEncoder.encode(metadata.getOriginalName(), StandardCharsets.UTF_8) + "\"")
                .contentType(MediaType.parseMediaType(metadata.getContentType() != null ? metadata.getContentType()
                        : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(new InputStreamResource(fileService.download(id)));
    }

    @Operation(summary = "Delete file")
    @DeleteMapping("/delete")
    public ResponseEntity<Void> delete(@RequestParam("id") String id) {
        fileService.delete(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "List files")
    @GetMapping("/list")
    public ResponseEntity<List<FileInfo>> list(@RequestParam(value = "path", defaultValue = "") String path) {
        return ResponseEntity.ok(fileService.list(path));
    }

    @Operation(summary = "Rename file or folder")
    @PutMapping("/rename")
    public ResponseEntity<FileMetadata> rename(@RequestParam("id") String id, @RequestParam("newName") String newName) {
        return ResponseEntity.ok(fileService.rename(id, newName));
    }
}

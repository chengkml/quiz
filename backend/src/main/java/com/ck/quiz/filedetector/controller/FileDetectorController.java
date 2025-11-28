package com.ck.quiz.filedetector.controller;

import com.ck.quiz.filedetector.service.FileTypeDetector;
import com.ck.quiz.utils.IdHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/file/detector")
@Tag(name = "文档类型识别", description = "文档类型识别API")
public class FileDetectorController {

    @Autowired
    private FileTypeDetector fileTypeDetector;

    @PostMapping("/upload")
    @Operation(summary = "上传文档", description = "上传文档并识别")
    public ResponseEntity<FileInfoDto> uploadDocFile(
            @Parameter(description = "文档文件", required = true)
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new FileInfoDto(IdHelper.genUuid(),
                    file.getOriginalFilename(), 0L, "", "unknown"));
        }

        try {
            String mimeType = fileTypeDetector.detect(file);

            // 获取文件扩展名
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".") + 1);
            }

            FileInfoDto result = new FileInfoDto(
                    IdHelper.genUuid(),
                    originalName,
                    file.getSize(),
                    extension,
                    mimeType
            );

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new FileInfoDto(IdHelper.genUuid(),
                    file.getOriginalFilename(), file.getSize(), "", "unknown"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new FileInfoDto(IdHelper.genUuid(),
                    file.getOriginalFilename(), file.getSize(), "", "unknown"
            ));
        }
    }

    // 内部 DTO 类
    record FileInfoDto(
            String id,
            String fileName,
            long size,
            String extension,
            String mimeType
    ) {
    }

}

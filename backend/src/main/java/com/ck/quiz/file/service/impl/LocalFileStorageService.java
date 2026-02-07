package com.ck.quiz.file.service.impl;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
public class LocalFileStorageService implements FileStorageService {

    private final String basePath;

    public LocalFileStorageService(String basePath) {
        this.basePath = basePath;
        init();
    }
    
    private void init() {
        try {
            Files.createDirectories(Paths.get(basePath));
        } catch (IOException e) {
            log.error("Could not initialize storage location", e);
        }
    }

    private Path getFullPath(String path) {
        // Simple sanitization
        if (path.contains("..")) {
            throw new IllegalArgumentException("Invalid path sequence");
        }
        // If path starts with /, remove it to append to basepath
        String relativePath = path.startsWith("/") || path.startsWith("\\") ? path.substring(1) : path;
        return Paths.get(basePath, relativePath).toAbsolutePath().normalize();
    }

    @Override
    public String upload(String path, InputStream inputStream) {
        try {
            Path fullPath = getFullPath(path);
            Files.createDirectories(fullPath.getParent());
            Files.copy(inputStream, fullPath, StandardCopyOption.REPLACE_EXISTING);
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            Path fullPath = getFullPath(path);
            if (!Files.exists(fullPath)) {
                throw new RuntimeException("File not found: " + path);
            }
            return new FileInputStream(fullPath.toFile());
        } catch (FileNotFoundException e) {
            throw new RuntimeException("Failed to read file locally", e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            Path fullPath = getFullPath(path);
            Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file locally", e);
        }
    }

    @Override
    public void move(String sourcePath, String targetPath) {
        try {
            Path sourceFullPath = getFullPath(sourcePath);
            Path targetFullPath = getFullPath(targetPath);
            if (!Files.exists(sourceFullPath)) {
                throw new RuntimeException("File not found: " + sourcePath);
            }
            Files.createDirectories(targetFullPath.getParent());
            Files.move(sourceFullPath, targetFullPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to move file locally", e);
        }
    }

    @Override
    public List<FileInfo> list(String path) {
        try {
            Path fullPath = getFullPath(path);
            if (!Files.exists(fullPath)) {
                 // Return empty list if directory doesn't exist
                 return List.of();
            }
            if (!Files.isDirectory(fullPath)) {
                return List.of();
            }
            try (Stream<Path> stream = Files.list(fullPath)) {
                return stream.map(p -> {
                    File file = p.toFile();
                    String relativePath = path.endsWith("/") ? path + file.getName() : path + "/" + file.getName();
                    if (path.isEmpty() || path.equals("/")) {
                        relativePath = file.getName();
                    }
                    
                    return FileInfo.builder()
                            .name(file.getName())
                            .path(relativePath)
                            .size(file.length())
                            .isDirectory(file.isDirectory())
                            .lastModified(LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(file.lastModified()), ZoneId.systemDefault()))
                            .build();
                }).collect(Collectors.toList());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to list files locally", e);
        }
    }

    @Override
    public boolean exists(String path) {
         Path fullPath = getFullPath(path);
         return Files.exists(fullPath);
    }
}

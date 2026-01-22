package com.ck.quiz.file.service.impl;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.entity.FileMetadata;
import com.ck.quiz.file.repository.FileMetadataRepository;
import com.ck.quiz.file.service.FileService;
import com.ck.quiz.file.service.FileStorageService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.apache.commons.io.FilenameUtils;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final FileStorageService fileStorageService;
    private final FileMetadataRepository fileMetadataRepository;

    @Value("${quiz.file.storage-type:local}")
    private String storageType;

    @Override
    @Transactional
    public FileMetadata upload(MultipartFile file, String path) {
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = FilenameUtils.getExtension(originalFilename);
            
            // Construct storage path
            String uuid = IdHelper.genUuid();
            String storageName = uuid + (extension != null ? "." + extension : "");
            
            String fullPath = path.isEmpty() ? storageName : path + "/" + storageName;
            if (path.endsWith("/")) fullPath = path + storageName;
            if (fullPath.startsWith("/")) fullPath = fullPath.substring(1);

            // Upload to storage
            fileStorageService.upload(fullPath, file.getInputStream());

            // Save metadata
            FileMetadata metadata = new FileMetadata();
            metadata.setId(uuid);
            metadata.setOriginalName(originalFilename);
            metadata.setStoragePath(fullPath);
            metadata.setStorageType(storageType.toUpperCase());
            metadata.setContentType(file.getContentType());
            metadata.setExtension(extension);
            metadata.setSize(file.getSize());
            metadata.setIsFolder(false);
            
            return fileMetadataRepository.save(metadata);

        } catch (Exception e) {
            log.error("Failed to upload file", e);
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    @Transactional
    public FileMetadata createFolder(String path, String name) {
        if (name.contains("/")) throw new IllegalArgumentException("Folder name cannot contain /");

        String fullPath = path.isEmpty() ? name : path + "/" + name;
        if (path.endsWith("/")) fullPath = path + name;
        if (fullPath.startsWith("/")) fullPath = fullPath.substring(1);
        
        // Ensure folder path ends with /
        if (!fullPath.endsWith("/")) fullPath += "/";
        
        // Check if already exists (optional but good)
        // Ignoring for now to keep simple

        FileMetadata metadata = new FileMetadata();
        metadata.setId(IdHelper.genUuid());
        metadata.setOriginalName(name);
        metadata.setStoragePath(fullPath);
        metadata.setStorageType("NONE");
        metadata.setIsFolder(true);
        metadata.setExtension("");
        metadata.setSize(0L);
        
        return fileMetadataRepository.save(metadata);
    }

    @Override
    public InputStream download(String id) {
        FileMetadata metadata = get(id);
        if (Boolean.TRUE.equals(metadata.getIsFolder())) {
            throw new RuntimeException("Cannot download a folder");
        }
        return fileStorageService.download(metadata.getStoragePath());
    }

    @Override
    @Transactional
    public void delete(String id) {
        FileMetadata metadata = get(id);
        
        if (Boolean.TRUE.equals(metadata.getIsFolder())) {
            // Recursive delete
            List<FileMetadata> children = fileMetadataRepository.findByStoragePathStartingWith(metadata.getStoragePath());
            // Sort by length desc to delete deepest children first? Not strictly necessary for DB delete but good practice.
            // Actually JPA delete is fine.
            for (FileMetadata child : children) {
                if (!Boolean.TRUE.equals(child.getIsFolder())) {
                     try {
                        fileStorageService.delete(child.getStoragePath());
                    } catch (Exception e) {
                        log.warn("Failed to delete file from storage: {}", child.getStoragePath(), e);
                    }
                }
                fileMetadataRepository.delete(child);
            }
        } else {
            try {
                fileStorageService.delete(metadata.getStoragePath());
            } catch (Exception e) {
                log.warn("Failed to delete file from storage: {}", metadata.getStoragePath(), e);
            }
            fileMetadataRepository.delete(metadata);
        }
    }

    @Override
    public List<FileInfo> list(String path) {
        String prefix = path == null ? "" : path;
        // Normalize prefix to ensure it ends with / if it is a folder path
        if (!prefix.isEmpty() && !prefix.endsWith("/")) prefix += "/";
        if (prefix.startsWith("/")) prefix = prefix.substring(1);
        
        List<FileMetadata> all = fileMetadataRepository.findByStoragePathStartingWith(prefix);
        
        Map<String, FileInfo> result = new HashMap<>();
        
        for (FileMetadata m : all) {
            String storagePath = m.getStoragePath();
            if (storagePath.equals(prefix)) continue; // Skip self
            
            String relative = storagePath.substring(prefix.length());
            if (relative.isEmpty()) continue;
            
            int slashIndex = relative.indexOf("/");
            
            if (Boolean.TRUE.equals(m.getIsFolder())) {
                // Explicit Folder
                // storagePath is like "A/" (if relative is "A/") or "A/B/" (relative "A/B/")
                
                String[] parts = relative.split("/");
                if (parts.length > 0) {
                    String directChildName = parts[0];
                    if (parts.length == 1) {
                         // Direct child folder
                         result.put(directChildName, convert(m, directChildName));
                    } else {
                         // Nested folder, ensure parent implicit folder exists
                         // e.g. "A/B/", relative "A/B/". parts=["A", "B"].
                         // We are listing root. We see "A".
                         result.putIfAbsent(directChildName, createVirtualFolder(prefix + directChildName + "/", directChildName));
                    }
                }
            } else {
                // File
                if (slashIndex > 0) {
                    // Implicit folder
                    String folderName = relative.substring(0, slashIndex);
                    result.putIfAbsent(folderName, createVirtualFolder(prefix + folderName + "/", folderName));
                } else {
                    // Direct file
                    result.put(relative, convert(m, m.getOriginalName()));
                }
            }
        }
        
        return new ArrayList<>(result.values());
    }

    @Override
    public FileMetadata get(String id) {
        return fileMetadataRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found: " + id));
    }
    
    private FileInfo convert(FileMetadata m, String name) {
        return FileInfo.builder()
                .id(m.getId())
                .name(name)
                .path(m.getStoragePath()) 
                .size(m.getSize())
                .isDirectory(Boolean.TRUE.equals(m.getIsFolder()))
                .lastModified(m.getUpdateDate() != null ? m.getUpdateDate() : m.getCreateDate())
                .build();
    }
    
    private FileInfo createVirtualFolder(String path, String name) {
        return FileInfo.builder()
                .id(null)
                .name(name)
                .path(path)
                .size(0)
                .isDirectory(true)
                .lastModified(null)
                .build();
    }
}

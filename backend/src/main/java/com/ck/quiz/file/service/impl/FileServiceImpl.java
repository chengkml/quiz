package com.ck.quiz.file.service.impl;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.entity.FileMetadata;
import com.ck.quiz.file.repository.FileMetadataRepository;
import com.ck.quiz.file.service.FileService;
import com.ck.quiz.file.service.FileStorageService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

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
        if (file == null) {
            throw new IllegalArgumentException("File is required");
        }

        try {
            String originalFilename = sanitizeFilename(file.getOriginalFilename());
            String extension = FilenameUtils.getExtension(originalFilename);

            String uuid = IdHelper.genUuid();
            String storageName = uuid + ((extension != null && !extension.isBlank()) ? "." + extension : "");
            String fullPath = normalizeDirectoryPath(path) + storageName;

            fileStorageService.upload(fullPath, file.getInputStream());

            FileMetadata metadata = new FileMetadata();
            metadata.setId(uuid);
            metadata.setOriginalName(originalFilename);
            metadata.setStoragePath(fullPath);
            metadata.setStorageType((storageType == null ? "local" : storageType).toUpperCase(Locale.ROOT));
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
        String folderName = validateName(name, "Folder name");
        String parentPath = normalizeDirectoryPath(path);
        String fullPath = parentPath + folderName + "/";

        if (fileMetadataRepository.existsByStoragePath(fullPath)) {
            throw new IllegalArgumentException("Folder already exists");
        }
        ensureNoNameConflict(null, folderName, parentPath);

        FileMetadata metadata = new FileMetadata();
        metadata.setId(IdHelper.genUuid());
        metadata.setOriginalName(folderName);
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
            List<FileMetadata> children = fileMetadataRepository
                    .findByStoragePathStartingWith(ensureDirectoryPath(metadata.getStoragePath()));
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
        String prefix = normalizeDirectoryPath(path);
        List<FileMetadata> all = fileMetadataRepository.findByStoragePathStartingWith(prefix);

        Map<String, FileInfo> result = new HashMap<>();

        for (FileMetadata m : all) {
            String storagePath = m.getStoragePath();
            if (storagePath == null || storagePath.equals(prefix)) {
                continue;
            }

            String relative = storagePath.substring(prefix.length());
            if (relative.isEmpty()) {
                continue;
            }

            int slashIndex = relative.indexOf("/");

            if (Boolean.TRUE.equals(m.getIsFolder())) {
                String[] parts = relative.split("/");
                if (parts.length > 0) {
                    String directChildName = parts[0];
                    if (parts.length == 1) {
                        result.put(directChildName, convert(m, directChildName));
                    } else {
                        result.putIfAbsent(directChildName,
                                createVirtualFolder(prefix + directChildName + "/", directChildName));
                    }
                }
            } else {
                if (slashIndex > 0) {
                    String folderName = relative.substring(0, slashIndex);
                    result.putIfAbsent(folderName, createVirtualFolder(prefix + folderName + "/", folderName));
                } else {
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

    @Override
    @Transactional
    public FileMetadata rename(String id, String newName) {
        String normalizedName = validateName(newName, "Name");

        FileMetadata metadata = get(id);
        if (Objects.equals(metadata.getOriginalName(), normalizedName)) {
            return metadata;
        }

        if (Boolean.TRUE.equals(metadata.getIsFolder())) {
            String oldPath = ensureDirectoryPath(metadata.getStoragePath());
            String parentPath = getParentDirectory(oldPath);
            String newPath = parentPath + normalizedName + "/";

            ensureNoNameConflict(id, normalizedName, parentPath);

            List<FileMetadata> allAffected = fileMetadataRepository.findByStoragePathStartingWith(oldPath);
            for (FileMetadata item : allAffected) {
                String itemOldPath = item.getStoragePath();
                String itemNewPath = newPath + itemOldPath.substring(oldPath.length());
                if (!Boolean.TRUE.equals(item.getIsFolder()) && !Objects.equals(itemOldPath, itemNewPath)) {
                    fileStorageService.move(itemOldPath, itemNewPath);
                }
                item.setStoragePath(itemNewPath);
                if (Objects.equals(item.getId(), id)) {
                    item.setOriginalName(normalizedName);
                }
            }
            fileMetadataRepository.saveAll(allAffected);
            return allAffected.stream().filter(it -> Objects.equals(it.getId(), id)).findFirst().orElse(metadata);
        } else {
            String parentPath = getParentDirectory(metadata.getStoragePath());
            ensureNoNameConflict(id, normalizedName, parentPath);
            metadata.setOriginalName(normalizedName);
            return fileMetadataRepository.save(metadata);
        }
    }

    @Override
    @Transactional
    public void deleteBatch(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        for (String id : new LinkedHashSet<>(ids)) {
            delete(id);
        }
    }

    @Override
    @Transactional
    public void move(List<String> ids, String targetPath) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        String normalizedTarget = normalizeDirectoryPath(targetPath);
        for (String id : new LinkedHashSet<>(ids)) {
            moveSingle(id, normalizedTarget);
        }
    }

    private void moveSingle(String id, String targetPath) {
        FileMetadata metadata = get(id);
        String oldPath = metadata.getStoragePath();
        if (oldPath == null || oldPath.isBlank()) {
            return;
        }

        if (Boolean.TRUE.equals(metadata.getIsFolder())) {
            String normalizedOldPath = ensureDirectoryPath(oldPath);
            String newFolderPath = targetPath + metadata.getOriginalName() + "/";

            if (Objects.equals(normalizedOldPath, newFolderPath)) {
                return;
            }
            if (!targetPath.isEmpty() && targetPath.startsWith(normalizedOldPath)) {
                throw new IllegalArgumentException("Cannot move a folder into itself");
            }

            ensureNoNameConflict(id, metadata.getOriginalName(), targetPath);

            List<FileMetadata> allAffected = fileMetadataRepository.findByStoragePathStartingWith(normalizedOldPath);
            for (FileMetadata item : allAffected) {
                String itemOldPath = item.getStoragePath();
                String itemNewPath = newFolderPath + itemOldPath.substring(normalizedOldPath.length());
                if (!Boolean.TRUE.equals(item.getIsFolder()) && !Objects.equals(itemOldPath, itemNewPath)) {
                    fileStorageService.move(itemOldPath, itemNewPath);
                }
                item.setStoragePath(itemNewPath);
            }
            fileMetadataRepository.saveAll(allAffected);
        } else {
            ensureNoNameConflict(id, metadata.getOriginalName(), targetPath);

            String fileName = oldPath.contains("/")
                    ? oldPath.substring(oldPath.lastIndexOf("/") + 1)
                    : oldPath;
            String newPath = targetPath + fileName;
            if (Objects.equals(oldPath, newPath)) {
                return;
            }
            fileStorageService.move(oldPath, newPath);
            metadata.setStoragePath(newPath);
            fileMetadataRepository.save(metadata);
        }
    }

    private void ensureNoNameConflict(String excludeId, String targetName, String parentPath) {
        String normalizedParent = normalizeDirectoryPath(parentPath);
        List<FileMetadata> candidates = fileMetadataRepository.findByStoragePathStartingWith(normalizedParent);
        for (FileMetadata candidate : candidates) {
            if (excludeId != null && Objects.equals(excludeId, candidate.getId())) {
                continue;
            }

            String directChildName = extractDirectChildName(normalizedParent, candidate);
            if (directChildName != null && Objects.equals(directChildName, targetName)) {
                throw new IllegalArgumentException("Target directory already contains: " + targetName);
            }
        }
    }

    private String extractDirectChildName(String parentPath, FileMetadata metadata) {
        String storagePath = metadata.getStoragePath();
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }

        String normalizedStoragePath = Boolean.TRUE.equals(metadata.getIsFolder())
                ? ensureDirectoryPath(storagePath)
                : normalizeStoragePath(storagePath);

        if (!normalizedStoragePath.startsWith(parentPath)) {
            return null;
        }

        String relative = normalizedStoragePath.substring(parentPath.length());
        if (relative.isEmpty()) {
            return null;
        }

        int slashIndex = relative.indexOf('/');
        if (slashIndex >= 0) {
            return relative.substring(0, slashIndex);
        }
        return metadata.getOriginalName();
    }

    private String sanitizeFilename(String fileName) {
        String normalized = fileName == null ? "" : fileName.trim();
        normalized = FilenameUtils.getName(normalized);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("File name cannot be empty");
        }
        if (normalized.contains("..") || normalized.contains("/") || normalized.contains("\\")) {
            throw new IllegalArgumentException("File name is invalid");
        }
        return normalized;
    }

    private String validateName(String name, String fieldName) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(fieldName + " cannot be empty");
        }
        if (normalized.contains("..") || normalized.contains("/") || normalized.contains("\\")) {
            throw new IllegalArgumentException(fieldName + " is invalid");
        }
        return normalized;
    }

    private String normalizeStoragePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return "";
        }

        String normalized = path.trim().replace('\\', '/');
        while (normalized.contains("//")) {
            normalized = normalized.replace("//", "/");
        }
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        if (normalized.contains("..")) {
            throw new IllegalArgumentException("Path is invalid");
        }
        while (normalized.endsWith("/") && !normalized.isEmpty()) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String normalizeDirectoryPath(String path) {
        String normalized = normalizeStoragePath(path);
        if (normalized.isEmpty()) {
            return "";
        }
        return normalized + "/";
    }

    private String ensureDirectoryPath(String path) {
        String normalized = normalizeStoragePath(path);
        if (normalized.isEmpty()) {
            return "";
        }
        return normalized + "/";
    }

    private String getParentDirectory(String storagePath) {
        String normalized = normalizeStoragePath(storagePath);
        int lastSlash = normalized.lastIndexOf('/');
        if (lastSlash < 0) {
            return "";
        }
        return normalized.substring(0, lastSlash + 1);
    }
}

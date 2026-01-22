package com.ck.quiz.file.service;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.entity.FileMetadata;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

public interface FileService {

    /**
     * Upload and save file metadata
     * @param file The file to upload
     * @param path Directory path to store
     * @return Saved metadata
     */
    FileMetadata upload(MultipartFile file, String path);

    /**
     * Download file by ID
     * @param id Metadata ID
     * @return InputStream of the file
     */
    InputStream download(String id);

    /**
     * Delete file by ID
     * @param id Metadata ID
     */
    void delete(String id);

    /**
     * Create a folder
     * @param path Parent path
     * @param name Folder name
     * @return Created folder metadata
     */
    FileMetadata createFolder(String path, String name);

    /**
     * List files (from DB or Storage - usually DB if we are persisting)
     * @param path Directory path to filter
     * @return List of file info
     */
    List<FileInfo> list(String path);
    
    /**
     * Get file metadata by ID
     */
    FileMetadata get(String id);
}

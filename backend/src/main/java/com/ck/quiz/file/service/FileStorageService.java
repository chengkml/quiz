package com.ck.quiz.file.service;

import com.ck.quiz.file.dto.FileInfo;
import java.io.InputStream;
import java.util.List;

public interface FileStorageService {
    /**
     * Upload a file
     * @param path Relative path (including filename)
     * @param inputStream Content stream
     * @return The accessible path or identifier
     */
    String upload(String path, InputStream inputStream);

    /**
     * Download a file
     * @param path The file path
     * @return Content stream
     */
    InputStream download(String path);

    /**
     * Delete a file
     * @param path The file path
     */
    void delete(String path);

    /**
     * List files in a directory
     * @param path The directory path
     * @return List of file info
     */
    List<FileInfo> list(String path);
    
    /**
     * Check if file exists
     */
    boolean exists(String path);
}

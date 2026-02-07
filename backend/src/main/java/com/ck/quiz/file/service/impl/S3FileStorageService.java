package com.ck.quiz.file.service.impl;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.service.FileStorageService;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String basePath; // Optional prefix

    public S3FileStorageService(S3Client s3Client, String bucketName, String basePath) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.basePath = basePath;
    }
    
    private String getKey(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        if (basePath == null || basePath.isEmpty()) {
            return p;
        }
        String base = basePath.endsWith("/") ? basePath : basePath + "/";
        return base + p;
    }

    @Override
    public String upload(String path, InputStream inputStream) {
        try {
            String key = getKey(path);
            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            
            // Note: Ideally we should stream, but RequestBody.fromInputStream requires content length.
            // For robust large file upload, Multipart Upload is preferred.
            // Here we read into memory for simplicity as per common abstraction.
            byte[] bytes = inputStream.readAllBytes();
            
            s3Client.putObject(putOb, RequestBody.fromBytes(bytes));
            return path;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to S3", e);
        }
    }

    @Override
    public InputStream download(String path) {
        try {
            String key = getKey(path);
            GetObjectRequest getOb = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            return s3Client.getObject(getOb);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download from S3", e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            String key = getKey(path);
            DeleteObjectRequest delOb = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(delOb);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete from S3", e);
        }
    }

    @Override
    public void move(String sourcePath, String targetPath) {
        try {
            String sourceKey = getKey(sourcePath);
            String targetKey = getKey(targetPath);

            CopyObjectRequest copyReq = CopyObjectRequest.builder()
                    .bucket(bucketName)
                    .copySource(bucketName + "/" + sourceKey)
                    .key(targetKey)
                    .build();
            s3Client.copyObject(copyReq);

            DeleteObjectRequest delReq = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(sourceKey)
                    .build();
            s3Client.deleteObject(delReq);
        } catch (Exception e) {
            throw new RuntimeException("Failed to move object in S3", e);
        }
    }

    @Override
    public List<FileInfo> list(String path) {
        try {
            String tempPrefix = getKey(path);
            if (!tempPrefix.isEmpty() && !tempPrefix.endsWith("/")) {
                tempPrefix += "/";
            }
            if ("/".equals(tempPrefix)) tempPrefix = ""; // Root
            
            final String prefix = tempPrefix;
            
            ListObjectsV2Request listReq = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix(prefix)
                    .delimiter("/") // Emulate directories
                    .build();
            
            ListObjectsV2Response res = s3Client.listObjectsV2(listReq);
            
            List<FileInfo> files = new ArrayList<>();
            
            files.addAll(res.contents().stream().map(obj -> {
                String name = obj.key().substring(prefix.length());
                if (name.isEmpty()) return null; // self
                return FileInfo.builder()
                        .name(name)
                        .path(path.endsWith("/") ? path + name : path + "/" + name)
                        .size(obj.size())
                        .isDirectory(false)
                        .lastModified(LocalDateTime.ofInstant(obj.lastModified(), ZoneId.systemDefault()))
                        .build();
            }).filter(java.util.Objects::nonNull).collect(Collectors.toList()));
            
            // Add directories (CommonPrefixes)
            files.addAll(res.commonPrefixes().stream().map(cp -> {
                String name = cp.prefix().substring(prefix.length());
                // remove trailing slash
                if (name.endsWith("/")) name = name.substring(0, name.length() - 1);
                return FileInfo.builder()
                        .name(name)
                        .path(path.endsWith("/") ? path + name : path + "/" + name)
                        .size(0)
                        .isDirectory(true)
                        .lastModified(LocalDateTime.now()) // S3 doesn't track dir mod time easily
                        .build();
            }).collect(Collectors.toList()));
            
            return files;
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to list S3 objects", e);
        }
    }

    @Override
    public boolean exists(String path) {
        try {
             String key = getKey(path);
             HeadObjectRequest headReq = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
             s3Client.headObject(headReq);
             return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
             throw new RuntimeException("Error checking existence on S3", e);
        }
    }
}

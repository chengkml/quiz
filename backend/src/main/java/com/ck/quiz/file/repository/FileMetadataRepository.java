package com.ck.quiz.file.repository;

import com.ck.quiz.file.entity.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {
    List<FileMetadata> findByStoragePathStartingWith(String prefix);

    boolean existsByStoragePath(String storagePath);
}

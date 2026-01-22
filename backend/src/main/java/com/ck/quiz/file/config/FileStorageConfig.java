package com.ck.quiz.file.config;

import com.ck.quiz.config.service.SystemParamService;
import com.ck.quiz.file.service.FileStorageService;
import com.ck.quiz.file.service.impl.LocalFileStorageService;
import com.ck.quiz.file.service.impl.S3FileStorageService;
import com.ck.quiz.file.service.impl.SftpFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class FileStorageConfig {

    private final SystemParamService systemParamService;

    @Bean
    public FileStorageService fileStorageService() {
        String type = getParamValue("quiz.file.storage-type", "local");
        log.info("Initializing FileStorageService with type: {}", type);

        try {
            if ("sftp".equalsIgnoreCase(type)) {
                return createSftpService();
            } else if ("s3".equalsIgnoreCase(type)) {
                return createS3Service();
            } else {
                return createLocalService();
            }
        } catch (Exception e) {
            log.error("Failed to initialize FileStorageService type: {}, falling back to local", type, e);
            return createLocalService();
        }
    }

    private FileStorageService createLocalService() {
        String basePath = getParamValue("quiz.file.local.base-path", "./data/files");
        return new LocalFileStorageService(basePath);
    }

    private FileStorageService createSftpService() {
        String host = getParamValue("quiz.file.sftp.host", "localhost");
        int port = Integer.parseInt(getParamValue("quiz.file.sftp.port", "22"));
        String username = getParamValue("quiz.file.sftp.username", "user");
        String password = getParamValue("quiz.file.sftp.password", "");
        String privateKey = getParamValue("quiz.file.sftp.private-key", "");
        String basePath = getParamValue("quiz.file.sftp.base-path", "/upload");
        
        return new SftpFileStorageService(host, port, username, password, privateKey, basePath);
    }

    private FileStorageService createS3Service() {
        String accessKey = getParamValue("quiz.file.s3.access-key", "minioadmin");
        String secretKey = getParamValue("quiz.file.s3.secret-key", "minioadmin");
        String region = getParamValue("quiz.file.s3.region", "us-east-1");
        String bucket = getParamValue("quiz.file.s3.bucket", "mybucket");
        String endpoint = getParamValue("quiz.file.s3.endpoint", "http://localhost:9000");
        String basePath = getParamValue("quiz.file.s3.base-path", "");

        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(credentials));
        
        if (StringUtils.isNotBlank(endpoint)) {
            builder.endpointOverride(java.net.URI.create(endpoint));
        }
        
        return new S3FileStorageService(builder.build(), bucket, basePath);
    }

    private String getParamValue(String paramName, String defaultValue) {
        try {
            // Check if service is ready (might be null during very early startup, though @RequiredArgsConstructor handles injection)
            // The real issue is if the DB is empty.
            if (systemParamService == null) {
                return defaultValue;
            }
            var param = systemParamService.getParamByName(paramName);
            if (param != null && param.getParamValue() != null) {
                return param.getParamValue();
            }
        } catch (Exception e) {
            // log.warn("Failed to get param {}, using default: {}", paramName, defaultValue);
        }
        return defaultValue;
    }
}

package com.ck.quiz.file.service.impl;

import com.ck.quiz.file.dto.FileInfo;
import com.ck.quiz.file.service.FileStorageService;
import com.jcraft.jsch.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

@Slf4j
public class SftpFileStorageService implements FileStorageService {

    private final String host;
    private final int port;
    private final String username;
    private final String password;
    private final String privateKey;
    private final String basePath;

    public SftpFileStorageService(String host, int port, String username, String password, String privateKey, String basePath) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.privateKey = privateKey;
        this.basePath = basePath;
    }

    private ChannelSftp createChannel() throws JSchException {
        JSch jsch = new JSch();
        if (StringUtils.isNotBlank(privateKey)) {
            jsch.addIdentity(privateKey);
        }
        Session session = jsch.getSession(username, host, port);
        if (StringUtils.isNotBlank(password)) {
            session.setPassword(password);
        }
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        session.connect();
        Channel channel = session.openChannel("sftp");
        channel.connect();
        return (ChannelSftp) channel;
    }

    private void disconnect(ChannelSftp channel) {
        if (channel != null) {
            try {
                if (channel.isConnected()) {
                    channel.disconnect();
                }
                if (channel.getSession().isConnected()) {
                    channel.getSession().disconnect();
                }
            } catch (JSchException e) {
                log.error("Error disconnecting SFTP", e);
            }
        }
    }

    private String getFullPath(String path) {
        String p = path.startsWith("/") ? path.substring(1) : path;
        String full = basePath.endsWith("/") ? basePath + p : basePath + "/" + p;
        return full;
    }

    @Override
    public String upload(String path, InputStream inputStream) {
        ChannelSftp channel = null;
        try {
            channel = createChannel();
            String fullPath = getFullPath(path);
            String parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
            
            // Recursively create directories
            createDirs(channel, parentDir);
            
            channel.put(inputStream, fullPath);
            return path;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to SFTP", e);
        } finally {
            disconnect(channel);
        }
    }
    
    private void createDirs(ChannelSftp channel, String path) {
        if (path == null || path.isEmpty()) return;
        try {
            SftpATTRS attrs = channel.stat(path);
            if (attrs != null) return; // exists
        } catch (SftpException e) {
            if (e.id != ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                // error other than not found
            }
        }

        // Split path and check/create level by level or try recursion
        // Simplest valid approach for absolute paths on sftp:
        String[] folders = path.split("/");
        String currentPath = "";
        if (path.startsWith("/")) currentPath = "/";
        
        for (String folder : folders) {
            if (folder.isEmpty()) continue;
            currentPath = currentPath.endsWith("/") ? currentPath + folder : currentPath + "/" + folder;
            try {
                channel.stat(currentPath);
            } catch (SftpException e) {
                if (e.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                    try {
                        channel.mkdir(currentPath);
                    } catch (SftpException ex) {
                         // ignore if already exists (race condition)
                    }
                }
            }
        }
    }

    @Override
    public InputStream download(String path) {
        ChannelSftp channel = null;
        try {
            channel = createChannel();
            String fullPath = getFullPath(path);
            InputStream is = channel.get(fullPath);
            return new SftpInputStream(is, channel); 
        } catch (Exception e) {
            disconnect(channel);
            throw new RuntimeException("Failed to download from SFTP", e);
        }
    }

    @Override
    public void delete(String path) {
        ChannelSftp channel = null;
        try {
            channel = createChannel();
            String fullPath = getFullPath(path);
            channel.rm(fullPath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete from SFTP", e);
        } finally {
            disconnect(channel);
        }
    }

    @Override
    public List<FileInfo> list(String path) {
        ChannelSftp channel = null;
        try {
            channel = createChannel();
            String fullPath = getFullPath(path);
            Vector<ChannelSftp.LsEntry> list = channel.ls(fullPath);
            List<FileInfo> fileInfos = new ArrayList<>();
            for (ChannelSftp.LsEntry entry : list) {
                if (".".equals(entry.getFilename()) || "..".equals(entry.getFilename())) {
                    continue;
                }
                String relativePath = path.endsWith("/") ? path + entry.getFilename() : path + "/" + entry.getFilename();
                 if (path.isEmpty() || path.equals("/")) {
                    relativePath = entry.getFilename();
                }
                
                fileInfos.add(FileInfo.builder()
                        .name(entry.getFilename())
                        .path(relativePath)
                        .size(entry.getAttrs().getSize())
                        .isDirectory(entry.getAttrs().isDir())
                        .lastModified(LocalDateTime.ofInstant(java.time.Instant.ofEpochSecond(entry.getAttrs().getMTime()), ZoneId.systemDefault()))
                        .build());
            }
            return fileInfos;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list SFTP files", e);
        } finally {
            disconnect(channel);
        }
    }

    @Override
    public boolean exists(String path) {
        ChannelSftp channel = null;
        try {
            channel = createChannel();
            String fullPath = getFullPath(path);
            channel.stat(fullPath);
            return true;
        } catch (SftpException e) {
            if (e.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                return false;
            }
            throw new RuntimeException("Error checking existence on SFTP", e);
        } catch (JSchException e) {
             throw new RuntimeException("SFTP Connection error", e);
        } finally {
            disconnect(channel);
        }
    }
    
    private static class SftpInputStream extends InputStream {
        private final InputStream wrapped;
        private final ChannelSftp channel;
        
        public SftpInputStream(InputStream wrapped, ChannelSftp channel) {
            this.wrapped = wrapped;
            this.channel = channel;
        }
        
        @Override
        public int read() throws IOException {
            return wrapped.read();
        }
        
        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            return wrapped.read(b, off, len);
        }
        
        @Override
        public void close() throws IOException {
            try {
                wrapped.close();
            } finally {
                if (channel != null) {
                    try {
                        channel.disconnect();
                        if (channel.getSession() != null) {
                            channel.getSession().disconnect();
                        }
                    } catch (JSchException e) {
                        // ignore
                    }
                }
            }
        }
    }
}

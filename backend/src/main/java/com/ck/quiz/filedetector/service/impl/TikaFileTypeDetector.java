package com.ck.quiz.filedetector.service.impl;

import com.ck.quiz.filedetector.service.FileTypeDetector;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 使用 Apache Tika 实现的文件类型检测器。
 *
 * <p>
 * Tika 是一个内容解析框架，能够识别非常多的 MIME 类型，并且不依赖文件后缀，
 * 是目前最稳定、识别率最高的 MIME 类型识别方案之一。
 * </p>
 *
 * <p>支持三种输入方式：</p>
 * <ul>
 *     <li>基于文件路径（Path）</li>
 *     <li>基于输入流（InputStream）</li>
 *     <li>基于 MultipartFile（Spring 文件上传）</li>
 * </ul>
 *
 * <p>注意：detect(InputStream) 会消耗输入流，但不会关闭，由调用者管理。</p>
 */
@Component
public class TikaFileTypeDetector implements FileTypeDetector {

    /**
     * Tika 线程安全，可全局使用
     */
    private static final Tika TIKA = new Tika();

    /**
     * 基于磁盘文件进行检测。
     *
     * @param path 文件路径
     * @return MIME 类型，例如 application/pdf
     * @throws Exception IO 错误或识别失败
     */
    @Override
    public String detect(Path path) throws Exception {
        return TIKA.detect(path.toFile());
    }

    /**
     * 基于输入流识别文件 MIME 类型。
     *
     * <p>
     * 注意：Tika 会读取流内容进行识别，因此会消耗流。
     * 调用者需保证传入的是可消费一次的流，并负责关闭流。
     * </p>
     *
     * @param is 输入流
     * @return MIME 类型
     * @throws Exception 读取或解析失败
     */
    @Override
    public String detect(InputStream is) throws Exception {
        return TIKA.detect(is);
    }

    /**
     * 基于 MultipartFile 识别文件类型。
     *
     * <p>
     * 适用于 Spring MVC 文件上传接口。
     * 内部会调用 file.getInputStream()，并复用 detect(InputStream)。
     * </p>
     *
     * @param file MultipartFile 文件
     * @return MIME 类型
     * @throws Exception 读取失败或解析失败
     */
    @Override
    public String detect(MultipartFile file) throws Exception {
        // 不关闭流，由 Spring 管理
        try (InputStream is = file.getInputStream()) {
            return detect(is);
        }
    }
}

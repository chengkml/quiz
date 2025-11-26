package com.ck.quiz.filedetector.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Path;

/**
 * 文件类型识别接口（抽象层）
 *
 * <p>用于基于不同底层实现（如 Apache Tika、魔术数字等）来识别文件的 MIME 类型。</p>
 *
 * <p>本接口提供三类输入源以便适配不同场景：</p>
 * <ul>
 *     <li>基于文件路径（Path）识别 —— 适用于磁盘上的文件。</li>
 *     <li>基于输入流（InputStream）识别 —— 适用于上传流或无需落盘直接识别的场景。</li>
 *     <li>基于 MultipartFile 识别 —— 适用于 Spring Web 上传文件。</li>
 * </ul>
 *
 * <p>MIME 类型示例：</p>
 * <ul>
 *     <li>{@code image/png}</li>
 *     <li>{@code application/pdf}</li>
 *     <li>{@code text/plain}</li>
 * </ul>
 *
 * <p>实现类需保证：</p>
 * <ul>
 *     <li><b>detect(InputStream)</b> 不应关闭传入的流，由调用者负责关闭。</li>
 *     <li>支持流式识别，不要求将文件读入内存。</li>
 *     <li>在无法识别时应返回合理的 fallback，例如 {@code unknown} 或空字符串。</li>
 * </ul>
 */
public interface FileTypeDetector {

    /**
     * 基于文件路径识别文件 MIME 类型。
     *
     * <p>常用于文件已落盘的情况，通过读取磁盘上的内容进行类型判断。</p>
     *
     * @param path 文件路径
     * @return 识别出的 MIME 类型，例如 {@code image/jpeg}，{@code application/pdf}
     * @throws Exception 读取或解析失败时抛出异常
     */
    String detect(Path path) throws Exception;

    /**
     * 基于输入流识别 MIME 类型。
     *
     * <p>适用于文件未落盘的情况，例如文件上传时的流式识别。</p>
     *
     * <p>注意：</p>
     * <ul>
     *     <li>实现类应避免关闭该 InputStream，关闭应由调用者负责。</li>
     *     <li>检测方法通常会消费掉流（读取内容），请在调用方根据场景使用 TeeInputStream 或可复用的流。</li>
     * </ul>
     *
     * @param is 输入流（调用方负责关闭）
     * @return MIME 类型，例如 {@code application/zip}，{@code image/png}
     * @throws Exception 流读取或解析失败时抛出异常
     */
    String detect(InputStream is) throws Exception;

    /**
     * 基于 MultipartFile 识别文件 MIME 类型。
     *
     * <p>适用于 Spring MVC 文件上传接口的便利方法。</p>
     * <p>通常内部会调用 {@link MultipartFile#getInputStream()}，再复用 {@link #detect(InputStream)} 逻辑。</p>
     *
     * <p>注意：</p>
     * <ul>
     *     <li>MultipartFile 可以是内存存储或临时文件存储，具体行为由 Spring 处理。</li>
     *     <li>实现类不应关闭 MultipartFile 提供的流，由 Spring 管理。</li>
     * </ul>
     *
     * @param file Spring 上传的文件对象
     * @return 文件 MIME 类型，例如 {@code application/vnd.ms-excel}
     * @throws Exception 获取流、读取或识别失败时抛出异常
     */
    String detect(MultipartFile file) throws Exception;
}

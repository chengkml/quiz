package com.ck.quiz.script.service.impl;

import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import com.ck.quiz.script.repository.ScriptInfoRepository;
import com.ck.quiz.script.service.ScriptInfoService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.RequiredArgsConstructor;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 脚本信息Service实现
 */
@Service
@RequiredArgsConstructor
public class ScriptInfoServiceImpl implements ScriptInfoService {

    private final ScriptInfoRepository scriptInfoRepository;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    @Override
    @Transactional
    public String createScriptInfo(ScriptInfoCreateDto createDto) {
        // 检查脚本编码是否已存在
        if (scriptInfoRepository.existsByScriptCode(createDto.getScriptCode())) {
            throw new RuntimeException("脚本编码已存在");
        }

        // 转换为实体类
        ScriptInfo entity = convertToEntity(createDto);
        entity.setId(IdHelper.genUuid());

        // 保存实体类
        entity = scriptInfoRepository.save(entity);
        return entity.getId();
    }

    @Override
    public ScriptInfoDto getScriptInfoById(String id) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        return convertToDto(entity);
    }

    @Override
    public ScriptInfoDto getScriptInfoByCode(String scriptCode) {
        ScriptInfo entity = scriptInfoRepository.findByScriptCode(scriptCode)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        return convertToDto(entity);
    }

    @Override
    public Page<ScriptInfoDto> queryScriptInfo(ScriptInfoQueryDto queryDto) {
        // 1. 构造基础SQL
        StringBuilder sql = new StringBuilder("SELECT * FROM script_info WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(*) FROM script_info WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 2. 拼接查询条件
        // 模糊查询：脚本编码 / 名称 / 类型
        JdbcQueryHelper.lowerLike("scriptName", queryDto.getScriptName(),
                " AND (LOWER(script_name) LIKE :scriptName or LOWER(script_code) LIKE :scriptName) ", params, jt, sql, countSql);
        JdbcQueryHelper.lowerLike("scriptType", queryDto.getScriptType(),
                " AND LOWER(script_type) LIKE :scriptType ", params, jt, sql, countSql);

        // 精确匹配：状态
        JdbcQueryHelper.equals("state", queryDto.getState(),
                " AND state = :state ", params, sql, countSql);

        // 3. 排序（默认按创建时间倒序）
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 4. 拼接分页SQL
        int pageNum = queryDto.getPageNum() == null ? 1 : queryDto.getPageNum();
        int pageSize = queryDto.getPageSize() == null ? 10 : queryDto.getPageSize();
        String pageSql = JdbcQueryHelper.getLimitSql(jt, sql.toString(), pageNum - 1, pageSize);

        // 5. 执行查询
        List<Map<String, Object>> rows = jt.queryForList(pageSql, params);

        // 6. 转换为DTO对象
        List<ScriptInfoDto> list = rows.stream().map(row -> {
            ScriptInfoDto dto = new ScriptInfoDto();
            dto.setId((String) row.get("id"));
            dto.setScriptCode((String) row.get("script_code"));
            dto.setScriptName((String) row.get("script_name"));
            dto.setScriptType((String) row.get("script_type"));
            dto.setExecEntry((String) row.get("exec_entry"));
            dto.setFilePath((String) row.get("file_path"));
            dto.setExecCmd((String) row.get("exec_cmd"));
            dto.setDescription((String) row.get("description"));
            dto.setState((String) row.get("state"));
            dto.setCreateUser((String) row.get("create_user"));
            dto.setUpdateUser((String) row.get("update_user"));
            dto.setCreateDate(toLocalDateTime(row.get("create_date")));
            dto.setUpdateDate(toLocalDateTime(row.get("update_date")));
            return dto;
        }).collect(Collectors.toList());

        // 7. 查询总数并封装分页结果
        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, list, pageNum - 1, pageSize);
    }

    /**
     * 时间类型安全转换工具
     */
    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp ts) {
            return ts.toLocalDateTime();
        } else if (value instanceof LocalDateTime ldt) {
            return ldt;
        }
        return null;
    }


    @Override
    @Transactional
    public void updateScriptInfo(ScriptInfoUpdateDto updateDto) {
        // 查询脚本信息是否存在
        ScriptInfo entity = scriptInfoRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));

        // 复制属性（忽略null值）
        BeanUtils.copyProperties(updateDto, entity,
                "id", "scriptCode", "createDate", "createUser");

        // 如果更新状态，需要特殊处理
        if (StringUtils.hasText(updateDto.getState())) {
            entity.setState(ScriptInfo.State.valueOf(updateDto.getState()));
        }
        // 处理脚本类型枚举转换
        if (StringUtils.hasText(updateDto.getScriptType())) {
            entity.setScriptType(ScriptInfo.ScriptType.fromValue(updateDto.getScriptType()));
        }

        // 保存更新
        scriptInfoRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteScriptInfo(String id) {
        // 检查脚本是否存在
        if (!scriptInfoRepository.existsById(id)) {
            throw new RuntimeException("脚本信息不存在");
        }
        // 执行删除
        scriptInfoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void batchDeleteScriptInfo(List<String> ids) {
        // 检查所有ID是否存在
        List<ScriptInfo> entities = scriptInfoRepository.findAllById(ids);
        if (entities.size() != ids.size()) {
            throw new RuntimeException("部分脚本信息不存在");
        }
        // 批量删除
        scriptInfoRepository.deleteAllById(ids);
    }

    @Override
    @Transactional
    public void updateScriptState(String id, String state) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));
        entity.setState(ScriptInfo.State.valueOf(state));
        scriptInfoRepository.save(entity);
    }

    @Override
    public ScriptInfoDto convertToDto(ScriptInfo entity) {
        ScriptInfoDto dto = new ScriptInfoDto();
        BeanUtils.copyProperties(entity, dto);
        // 枚举类型需要特殊处理
        if (entity.getState() != null) {
            dto.setState(entity.getState().name());
        }
        return dto;
    }

    @Override
    public ScriptInfo convertToEntity(ScriptInfoCreateDto createDto) {
        ScriptInfo entity = new ScriptInfo();
        BeanUtils.copyProperties(createDto, entity);
        // 枚举类型需要特殊处理
        if (StringUtils.hasText(createDto.getState())) {
            entity.setState(ScriptInfo.State.valueOf(createDto.getState()));
        }
        // 处理脚本类型枚举转换
        if (StringUtils.hasText(createDto.getScriptType())) {
            entity.setScriptType(ScriptInfo.ScriptType.fromValue(createDto.getScriptType()));
        }
        return entity;
    }


    /**
     * 构建脚本执行命令
     *
     * @param filePath   脚本文件或目录路径
     * @param execEntry  执行入口（main.py / run.sh / xxx.jar / com.xxx.Main）
     * @param scriptType 脚本类型（枚举 ScriptType）
     * @return 最终可执行命令
     */
    @Override
    public String buildCommand(String filePath, String execEntry, ScriptInfo.ScriptType scriptType) {

        if (scriptType == null) {
            throw new IllegalArgumentException("ScriptType cannot be null.");
        }

        // 处理路径末尾“/”
        String normalizedPath = normalizePath(filePath);
        String entry = execEntry == null ? "" : execEntry.trim();

        // 生成执行命令（不含 cd）
        String execCmd = switch (scriptType) {

            // ================== Python ==================
            case PYTHON -> "python " + entry;
            case PYTHON3 -> "python3 " + entry;

            // ================== Shell ==================
            case SHELL -> "bash " + entry;

            // ================== Node ==================
            case NODE -> "node " + entry;

            // ================== Java ==================
            case JAVA_JAR -> {
                if (!entry.endsWith(".jar")) {
                    throw new IllegalArgumentException("JAVA_JAR 类型入口必须是 .jar 文件: " + entry);
                }
                yield "java -jar " + entry;
            }
            case JAVA_CLASS -> {
                // entry 可为：Main / com.example.Main / Main.class / Main.java
                if (entry.endsWith(".class")) {
                    entry = entry.substring(0, entry.length() - 6); // 去掉 .class
                }
                if (entry.endsWith(".java")) {
                    entry = entry.substring(0, entry.length() - 5);
                }
                yield String.format("java -cp \"%s\" %s", normalizedPath, entry);
            }

            // ================== HTTP ==================
            case HTTP -> "HTTP 调用脚本无需本地执行命令（应通过 HTTP 客户端执行）";

            // ================== 纯命令 ==================
            case COMMAND -> entry;

            // ================== 其他未知类型 ==================
            case OTHER -> entry.isBlank() ? "" : entry;
        };

        // HTTP 类型无需 cd
        if (scriptType == ScriptInfo.ScriptType.HTTP) {
            return execCmd;
        }

        // 最终命令：进入脚本目录后执行
        return String.format("cd \"%s\" && %s", normalizedPath, execCmd);
    }

    // 去掉末尾 / 或 \
    private static String normalizePath(String filePath) {
        if (filePath == null) return "";
        String fp = filePath.trim();
        if (fp.endsWith("/") || fp.endsWith("\\")) {
            return fp.substring(0, fp.length() - 1);
        }
        return fp;
    }

    @Override
    public String executeScript(String filePath, String execEntry, ScriptInfo.ScriptType scriptType, String... args) {
        // 1. 构建命令
        String baseCommand = buildCommand(filePath, execEntry, scriptType);
        if (baseCommand == null || baseCommand.isBlank()) {
            throw new IllegalArgumentException("执行命令为空，请检查脚本类型和入口参数");
        }

        // 2. CommandLine 对象
        CommandLine cmdLine = CommandLine.parse(baseCommand);

        // 3. 添加额外参数
        if (args != null) {
            for (String arg : args) {
                cmdLine.addArgument(arg, false);
            }
        }

        // 4. 设置输出流
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
        PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream, errorStream);

        DefaultExecutor executor = new DefaultExecutor();
        executor.setStreamHandler(streamHandler);

        // 5. 执行命令
        int exitCode = 0;
        try {
            exitCode = executor.execute(cmdLine);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        String stdOut = outputStream.toString(StandardCharsets.UTF_8);
        String stdErr = errorStream.toString(StandardCharsets.UTF_8);

        if (exitCode != 0) {
            throw new RuntimeException("脚本执行失败，exitCode=" + exitCode + ", error=" + stdErr);
        }

        return stdOut;
    }
}
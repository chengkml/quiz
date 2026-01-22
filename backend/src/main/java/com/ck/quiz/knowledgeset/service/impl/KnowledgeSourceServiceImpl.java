package com.ck.quiz.knowledgeset.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceUpdateDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;
import com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository;
import com.ck.quiz.knowledgeset.service.KnowledgeSourceService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.service.JobService;
import com.ck.quiz.knowledgeset.job.KnowledgeProcessingJob;
import com.ck.quiz.knowledgeset.service.VectorService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KnowledgeSourceServiceImpl extends BaseServiceImpl<KnowledgeSourceCreateDto, KnowledgeSourceUpdateDto, KnowledgeSourceQueryDto, KnowledgeSourceDto, KnowledgeSource, KnowledgeSourceRepository> implements KnowledgeSourceService {

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private JobService jobService;

    @Autowired
    private VectorService vectorService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected KnowledgeSourceDto newDto() {
        return new KnowledgeSourceDto();
    }

    @Override
    protected KnowledgeSource newModel() {
        return new KnowledgeSource();
    }

    @Override
    @Transactional
    public KnowledgeSourceDto create(KnowledgeSourceCreateDto createDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("用户未登录");
        }
        String userId = authentication.getName();
        KnowledgeSource model = newModel();
        model.setId(com.ck.quiz.utils.IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, model);
        model.setCreateUser(userId);
        model.setStatus("PENDING"); // Default status
        KnowledgeSource saved = repository.save(model);

        // 创建文档处理任务
        if ("FILE".equals(saved.getType())) {
            createDocumentProcessingJob(saved);
        }

        return convertToDto(saved, true);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        KnowledgeSource source = repository.findById(id).orElseThrow(() -> new RuntimeException("知识来源不存在"));
        
        // 删除对应的向量和切片数据
        vectorService.deleteBySourceId(id);
        
        super.delete(userId, id);
    }

    @Override
    @Transactional
    public KnowledgeSourceDto update(String userId, KnowledgeSourceUpdateDto updateDto) {
        KnowledgeSource source = repository.findById(updateDto.getId()).orElseThrow(() -> new RuntimeException("知识来源不存在"));
        
        // 检查是否修改了可能影响向量的内容 (如重新上传了文件，或者修改了切分配置)
        // 假设 UpdateDto 中如果包含 content 且不为空，则认为需要重新处理
        // 或者如果 type 从 FILE 变更为其他（虽然通常 type 不变）
        
        // 简单策略：如果状态重置为 PENDING 或者 content 发生变化，则触发重新处理
        boolean needReprocess = false;
        
        // 复制属性
        BeanUtils.copyProperties(updateDto, source);
        
        // 如果显式设置状态为 PENDING，则重新触发任务
        if ("PENDING".equals(updateDto.getStatus())) {
            needReprocess = true;
        }

        // 保存更新
        KnowledgeSource saved = repository.save(source);
        
        if (needReprocess) {
            // 先清理旧数据
            vectorService.deleteBySourceId(updateDto.getId());
            // 重新创建任务
            if ("FILE".equals(saved.getType())) {
                createDocumentProcessingJob(saved);
            }
        }
        
        return convertToDto(saved, true);
    }

    private void createDocumentProcessingJob(KnowledgeSource source) {
        try {
            JobDto jobDto = new JobDto();
            jobDto.setTaskClass(KnowledgeProcessingJob.class.getName());
            jobDto.setQueueName("knowledge-queue"); // 指定队列
            jobDto.setPriority(10);
            
            Map<String, Object> params = new HashMap<>();
            params.put("sourceId", source.getId());
            params.put("splitMethod", "TOKEN"); // 默认切分方式，可根据 meta 或其他字段配置
            params.put("chunkSize", 500);
            params.put("overlap", 50);
            
            jobDto.setTaskParams(objectMapper.writeValueAsString(params));
            
            jobService.addJob(jobDto);
        } catch (Exception e) {
            throw new RuntimeException("创建文档处理任务失败", e);
        }
    }
    
    @Override
    public Page<KnowledgeSourceDto> search(String userId, KnowledgeSourceQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select ks.*, u.user_name create_user_name from knowledge_source ks left join users u on u.user_id = ks.create_user where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from knowledge_source ks where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        
        JdbcQueryHelper.equals("knowledgeSetId", queryDto.getKnowledgeSetId(), " and ks.knowledge_set_id = :knowledgeSetId ", params, sql, countSql);
        JdbcQueryHelper.lowerLike("nameKey", queryDto.getKeyWord(), " and lower(ks.name) like :nameKey ", params, jdbcTemplate, sql, countSql);
        JdbcQueryHelper.equals("status", queryDto.getStatus(), " and ks.status = :status ", params, sql, countSql);
        JdbcQueryHelper.equals("type", queryDto.getType(), " and ks.type = :type ", params, sql, countSql);
        
        JdbcQueryHelper.order("create_date", "desc", sql);
        
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());
        
        List<KnowledgeSourceDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            KnowledgeSourceDto dto = new KnowledgeSourceDto();
            dto.setId(rs.getString("id"));
            dto.setKnowledgeSetId(rs.getString("knowledge_set_id"));
            dto.setName(rs.getString("name"));
            dto.setType(rs.getString("type"));
            dto.setStatus(rs.getString("status"));
            dto.setContent(rs.getString("content"));
            dto.setMeta(rs.getString("meta"));
            dto.setDescr(rs.getString("descr"));
            dto.setTags(rs.getString("tags"));
            dto.setLanguage(rs.getString("language"));
            
            java.sql.Timestamp createTime = rs.getTimestamp("create_date");
            if (createTime != null) {
                dto.setCreateDate(createTime.toLocalDateTime());
            }
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            
            java.sql.Timestamp updateTime = rs.getTimestamp("update_date");
            if (updateTime != null) {
                dto.setUpdateDate(updateTime.toLocalDateTime());
            }
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });
        
        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }
}

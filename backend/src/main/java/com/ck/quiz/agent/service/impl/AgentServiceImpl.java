package com.ck.quiz.agent.service.impl;

import com.ck.quiz.agent.dto.*;
import com.ck.quiz.agent.entity.Agent;
import com.ck.quiz.agent.entity.AgentTool;
import com.ck.quiz.agent.repository.AgentRepository;
import com.ck.quiz.agent.repository.AgentToolRepository;
import com.ck.quiz.agent.service.AgentService;
import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.mcp.entity.McpTool;
import com.ck.quiz.mcp.repository.McpToolRepository;
import com.ck.quiz.prompt.entity.PromptTemplate;
import com.ck.quiz.prompt.repository.PromptTemplateRepository;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AgentServiceImpl extends
        BaseServiceImpl<AgentCreateDto, AgentUpdateDto, AgentQueryDto, AgentDto, Agent, AgentRepository>
        implements AgentService {

    @Autowired
    private AgentToolRepository agentToolRepository;

    @Autowired
    private McpToolRepository mcpToolRepository;

    @Autowired
    private PromptTemplateRepository promptTemplateRepository;

    @Autowired
    private LLMModelRepository llmModelRepository;

    @Override
    protected AgentDto newDto() {
        return new AgentDto();
    }

    @Override
    protected Agent newModel() {
        return new Agent();
    }

    @Override
    public AgentDto create(AgentCreateDto createDto) {
        Agent agent = newModel();
        agent.setId(IdHelper.genUuid());
        BeanUtils.copyProperties(createDto, agent);
        
        // 设置默认状态
        if (!StringUtils.hasText(agent.getStatus())) {
            agent.setStatus("DRAFT");
        }
        
        // 处理tags字段映射
        if (StringUtils.hasText(createDto.getAgentTags())) {
            agent.setTags(createDto.getAgentTags());
        }
        
        Agent savedAgent = repository.save(agent);
        
        // 保存工具关联
        if (createDto.getToolIds() != null && !createDto.getToolIds().isEmpty()) {
            saveAgentTools(savedAgent.getId(), createDto.getToolIds());
        }
        
        return convertToDto(savedAgent, true);
    }

    @Override
    public AgentDto update(String userId, AgentUpdateDto updateDto) {
        Agent agent = repository.findById(updateDto.getId())
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + updateDto.getId()));
        
        if (agent.getCreateUser() != null && !agent.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update agent: " + updateDto.getId());
        }
        
        BeanUtils.copyProperties(updateDto, agent);
        
        // 处理tags字段映射
        if (StringUtils.hasText(updateDto.getAgentTags())) {
            agent.setTags(updateDto.getAgentTags());
        }
        
        Agent updatedAgent = repository.save(agent);
        
        // 更新工具关联（全量替换）
        if (updateDto.getToolIds() != null) {
            agentToolRepository.deleteByAgentId(updatedAgent.getId());
            if (!updateDto.getToolIds().isEmpty()) {
                saveAgentTools(updatedAgent.getId(), updateDto.getToolIds());
            }
        }
        
        return convertToDto(updatedAgent, true);
    }

    @Override
    public void delete(String userId, String id) {
        Agent agent = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + id));
        
        if (agent.getCreateUser() != null && !agent.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete agent: " + id);
        }
        
        // 删除工具关联
        agentToolRepository.deleteByAgentId(id);
        
        // 删除智能体
        repository.delete(agent);
    }

    @Override
    public Page<AgentDto> search(String userId, AgentQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("select a.* from agent a where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from agent a where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        
        // 关键词搜索
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(a.name) like :keyWord or lower(a.identifier) like :keyWord or lower(a.description) like :keyWord) ",
                params, namedParameterJdbcTemplate, sql, countSql);
        
        // 状态筛选
        if (StringUtils.hasText(queryDto.getStatus())) {
            JdbcQueryHelper.equals("status", queryDto.getStatus(), " and a.status = :status ", params, sql, countSql);
        }
        
        // 分类筛选
        if (StringUtils.hasText(queryDto.getCategory())) {
            JdbcQueryHelper.equals("category", queryDto.getCategory(), " and a.category = :category ", params, sql, countSql);
        }
        
        // 模型筛选
        if (StringUtils.hasText(queryDto.getModelId())) {
            JdbcQueryHelper.equals("modelId", queryDto.getModelId(), " and a.model_id = :modelId ", params, sql, countSql);
        }
        
        JdbcQueryHelper.order("create_date", "desc", sql);
        
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(),
                queryDto.getPageNum(), queryDto.getPageSize());
        
        List<AgentDto> list = namedParameterJdbcTemplate.query(limitSql, params, (rs, rowNum) -> {
            AgentDto dto = new AgentDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setIdentifier(rs.getString("identifier"));
            dto.setDescription(rs.getString("description"));
            dto.setIcon(rs.getString("icon"));
            dto.setCategory(rs.getString("category"));
            dto.setSystemPrompt(rs.getString("system_prompt"));
            dto.setPromptTemplateId(rs.getString("prompt_template_id"));
            dto.setModelId(rs.getString("model_id"));
            dto.setModelConfig(rs.getString("model_config"));
            dto.setStatus(rs.getString("status"));
            dto.setAgentTags(rs.getString("tags"));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null 
                    ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null 
                    ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            
            // 获取工具数量
            dto.setToolCount(getToolCount(dto.getId()));
            
            // 获取关联名称
            loadRelatedNames(dto);
            
            return dto;
        });
        
        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public AgentDto get(String userId, String id) {
        Agent agent = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + id));
        
        AgentDto dto = convertToDto(agent, true);
        
        // 加载工具列表
        dto.setTools(getTools(userId, id));
        
        return dto;
    }

    @Override
    public AgentDto enable(String userId, String id) {
        Agent agent = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + id));
        
        if (agent.getCreateUser() != null && !agent.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to enable agent: " + id);
        }
        
        agent.setStatus("ENABLED");
        Agent savedAgent = repository.save(agent);
        return convertToDto(savedAgent, true);
    }

    @Override
    public AgentDto disable(String userId, String id) {
        Agent agent = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + id));
        
        if (agent.getCreateUser() != null && !agent.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to disable agent: " + id);
        }
        
        agent.setStatus("DISABLED");
        Agent savedAgent = repository.save(agent);
        return convertToDto(savedAgent, true);
    }

    @Override
    public AgentDto duplicate(String userId, String id) {
        Agent source = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + id));
        
        // 复制智能体
        Agent copy = new Agent();
        BeanUtils.copyProperties(source, copy);
        copy.setId(IdHelper.genUuid());
        copy.setName(source.getName() + " (副本)");
        copy.setIdentifier(source.getIdentifier() != null ? source.getIdentifier() + "_copy_" + System.currentTimeMillis() : null);
        copy.setStatus("DRAFT");
        copy.setCreateDate(null);
        copy.setCreateUser(null);
        copy.setUpdateDate(null);
        copy.setUpdateUser(null);
        
        Agent savedCopy = repository.save(copy);
        
        // 复制工具关联
        List<AgentTool> sourceTools = agentToolRepository.findByAgentId(id);
        for (AgentTool sourceTool : sourceTools) {
            AgentTool copyTool = new AgentTool();
            copyTool.setId(IdHelper.genUuid());
            copyTool.setAgentId(savedCopy.getId());
            copyTool.setMcpToolId(sourceTool.getMcpToolId());
            copyTool.setPriority(sourceTool.getPriority());
            copyTool.setConfig(sourceTool.getConfig());
            agentToolRepository.save(copyTool);
        }
        
        return convertToDto(savedCopy, true);
    }

    @Override
    public List<AgentToolDto> getTools(String userId, String agentId) {
        List<AgentTool> agentTools = agentToolRepository.findByAgentIdOrderByPriorityDesc(agentId);
        
        return agentTools.stream().map(at -> {
            AgentToolDto dto = new AgentToolDto();
            dto.setId(at.getId());
            dto.setAgentId(at.getAgentId());
            dto.setMcpToolId(at.getMcpToolId());
            dto.setPriority(at.getPriority());
            dto.setConfig(at.getConfig());
            
            // 加载MCP工具信息
            mcpToolRepository.findById(at.getMcpToolId()).ifPresent(tool -> {
                dto.setMcpToolName(tool.getDisplayName());
                dto.setMcpToolDescription(tool.getDescription());
            });
            
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<AgentToolDto> updateTools(String userId, String agentId, AgentToolBatchDto batchDto) {
        Agent agent = repository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found: " + agentId));
        
        if (agent.getCreateUser() != null && !agent.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to update agent tools: " + agentId);
        }
        
        // 删除现有关联
        agentToolRepository.deleteByAgentId(agentId);
        
        // 创建新关联
        if (batchDto.getTools() != null) {
            for (AgentToolBatchDto.AgentToolItemDto item : batchDto.getTools()) {
                AgentTool agentTool = new AgentTool();
                agentTool.setId(IdHelper.genUuid());
                agentTool.setAgentId(agentId);
                agentTool.setMcpToolId(item.getMcpToolId());
                agentTool.setPriority(item.getPriority() != null ? item.getPriority() : 0);
                agentTool.setConfig(item.getConfig());
                agentToolRepository.save(agentTool);
            }
        }
        
        return getTools(userId, agentId);
    }

    @Override
    public List<AgentDto> listEnabled() {
        List<Agent> agents = repository.findByStatus("ENABLED");
        return agents.stream()
                .map(a -> convertToDto(a, false))
                .collect(Collectors.toList());
    }

    @Override
    public AgentDto convertToDto(Agent model, Boolean loadProps) {
        AgentDto dto = newDto();
        BeanUtils.copyProperties(model, dto);
        dto.setAgentTags(model.getTags());
        
        if (loadProps) {
            // 获取工具数量
            dto.setToolCount(getToolCount(model.getId()));
            
            // 加载关联名称
            loadRelatedNames(dto);
        }
        
        return dto;
    }

    private void saveAgentTools(String agentId, List<String> toolIds) {
        int priority = toolIds.size();
        for (String toolId : toolIds) {
            AgentTool agentTool = new AgentTool();
            agentTool.setId(IdHelper.genUuid());
            agentTool.setAgentId(agentId);
            agentTool.setMcpToolId(toolId);
            agentTool.setPriority(priority--);
            agentToolRepository.save(agentTool);
        }
    }

    private int getToolCount(String agentId) {
        return agentToolRepository.findByAgentId(agentId).size();
    }

    private void loadRelatedNames(AgentDto dto) {
        // 加载提示词模板名称
        if (StringUtils.hasText(dto.getPromptTemplateId())) {
            promptTemplateRepository.findById(dto.getPromptTemplateId())
                    .ifPresent(pt -> dto.setPromptTemplateName(pt.getName()));
        }
        
        // 加载模型名称
        if (StringUtils.hasText(dto.getModelId())) {
            llmModelRepository.findById(dto.getModelId())
                    .ifPresent(m -> dto.setModelName(m.getName()));
        }
    }
}

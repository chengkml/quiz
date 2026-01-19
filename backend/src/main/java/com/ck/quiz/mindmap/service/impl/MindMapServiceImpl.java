package com.ck.quiz.mindmap.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.entity.MindMap;
import com.ck.quiz.mindmap.repository.MindMapRepository;
import com.ck.quiz.mindmap.service.MindMapService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 思维导图管理服务实现类
 */
@Service
public class MindMapServiceImpl extends
        BaseServiceImpl<MindMapCreateDto, MindMapUpdateDto, MindMapQueryDto, MindMapDto, MindMap, MindMapRepository>
        implements MindMapService {

    @Autowired
    private MindMapRepository mindMapRepository;

    @Override
    @Transactional
    public MindMapDto updateMindMapBasicInfo(MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapBasicInfoUpdateDto.getId());
        if (!optionalMindMap.isPresent()) {
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        mindMap.setMapName(mindMapBasicInfoUpdateDto.getMapName());
        mindMap.setDescr(mindMapBasicInfoUpdateDto.getDescr());

        // 设置更新人信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            mindMap.setUpdateUser(authentication.getName());
        }

        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);
        return convertToDto(updatedMindMap, true);
    }

    @Override
    @Transactional
    public MindMapDto updateMindMapData(MindMapDataUpdateDto mindMapDataUpdateDto) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapDataUpdateDto.getId());
        if (!optionalMindMap.isPresent()) {
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        mindMap.setMapData(mindMapDataUpdateDto.getMapData());

        // 设置更新人信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            mindMap.setUpdateUser(authentication.getName());
        }

        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);
        return convertToDto(updatedMindMap, true);
    }

    @Override
    public Page<MindMapDto> search(String userId, MindMapQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.id, m.map_name, m.descr, m.map_data, " +
                        "m.create_date, m.create_user, u.user_name create_user_name, m.update_date, m.update_user " +
                        "FROM mind_map m left join users u on u.user_id = m.create_user ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM mind_map m ");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        sql.append("WHERE m.create_user = :createUser ");
        countSql.append("WHERE m.create_user = :createUser ");

        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());

        // 查询条件
        if (queryDto.getMapName() != null && !queryDto.getMapName().isEmpty()) {
            sql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            countSql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            params.put("mapName", "%" + queryDto.getMapName().toLowerCase() + "%");
        }
        sql.append(" ORDER BY m.create_date DESC ");

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<MindMapDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            MindMapDto dto = new MindMapDto();
            dto.setId(rs.getString("id"));
            dto.setMapName(rs.getString("map_name"));
            dto.setDescr(rs.getString("descr"));
            dto.setMapData(rs.getString("map_data"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        // 获取总数
        Long total = namedParameterJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(list,
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total != null ? total : 0);
    }

    @Override
    protected MindMapDto newDto() {
        return new MindMapDto();
    }

    @Override
    protected MindMap newModel() {
        return new MindMap();
    }

}
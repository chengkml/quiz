package com.ck.quiz.mindmap.service.impl;

import com.ck.quiz.mindmap.dto.MindMapCreateDto;
import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.mindmap.dto.MindMapQueryDto;
import com.ck.quiz.mindmap.dto.MindMapUpdateDto;
import com.ck.quiz.mindmap.entity.MindMap;
import com.ck.quiz.mindmap.repository.MindMapRepository;
import com.ck.quiz.mindmap.service.MindMapService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
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
public class MindMapServiceImpl implements MindMapService {

    @Autowired
    private MindMapRepository mindMapRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public MindMapDto createMindMap(MindMapCreateDto mindMapCreateDto) {
        MindMap mindMap = new MindMap();
        mindMap.setId(IdHelper.genUuid());
        mindMap.setMapName(mindMapCreateDto.getMapName());
        mindMap.setDescription(mindMapCreateDto.getDescription());
        mindMap.setMapData(mindMapCreateDto.getMapData());

        // 设置创建人和拥有者信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String currentUsername = authentication.getName();
            mindMap.setCreateUser(currentUsername);
        }

        mindMap.setCreateDate(LocalDateTime.now());
        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap savedMindMap = mindMapRepository.save(mindMap);
        return convertToDto(savedMindMap);
    }

    @Override
    @Transactional
    public MindMapDto updateMindMap(MindMapUpdateDto mindMapUpdateDto) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapUpdateDto.getId());
        if (!optionalMindMap.isPresent()) {
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        mindMap.setMapName(mindMapUpdateDto.getMapName());
        mindMap.setDescription(mindMapUpdateDto.getDescription());
        mindMap.setMapData(mindMapUpdateDto.getMapData());

        // 设置更新人信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            mindMap.setUpdateUser(authentication.getName());
        }

        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);
        return convertToDto(updatedMindMap);
    }

    @Override
    @Transactional
    public MindMapDto deleteMindMap(String mindMapId) {
        System.out.println("删除思维导图，ID: " + mindMapId);
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapId);
        if (!optionalMindMap.isPresent()) {
            System.out.println("思维导图不存在，ID: " + mindMapId);
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        MindMapDto mindMapDto = convertToDto(mindMap);
        System.out.println("准备删除思维导图: " + mindMap.getMapName());
        mindMapRepository.delete(mindMap);
        System.out.println("思维导图删除成功");
        return mindMapDto;
    }

    @Override
    public MindMapDto getMindMapById(String mindMapId) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapId);
        if (!optionalMindMap.isPresent()) {
            return null;
        }

        return convertToDto(optionalMindMap.get());
    }

    @Override
    public Page<MindMapDto> searchMindMaps(MindMapQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.map_id AS id, m.map_name, m.description, m.map_data, " +
                        "m.create_date, m.create_user, u.user_name create_user_name, m.update_date, m.update_user " +
                        "FROM mind_map m left join user u on u.user_id = m.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM mind_map m "
        );

        sql.append("WHERE 1=1 ");
        countSql.append("WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 查询条件
        if (queryDto.getMapName() != null && !queryDto.getMapName().isEmpty()) {
            sql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            countSql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            params.put("mapName", "%" + queryDto.getMapName().toLowerCase() + "%");
        }

        // 排序
        if (queryDto.getSortColumn() != null && !queryDto.getSortColumn().isEmpty()) {
            sql.append(" ORDER BY m.").append(queryDto.getSortColumn()).append(" ")
                    .append(queryDto.getSortType() != null ? queryDto.getSortType() : "DESC");
        } else {
            sql.append(" ORDER BY m.create_date DESC ");
        }

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        // 查询数据
        List<MindMapDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            MindMapDto dto = new MindMapDto();
            dto.setId(rs.getString("id"));
            dto.setMapName(rs.getString("map_name"));
            dto.setDescription(rs.getString("description"));
            dto.setMapData(rs.getString("map_data"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        // 获取总数
        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(list,
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total != null ? total : 0);
    }


    @Override
    public MindMapDto convertToDto(MindMap mindMap) {
        MindMapDto mindMapDto = new MindMapDto();
        BeanUtils.copyProperties(mindMap, mindMapDto);
        return mindMapDto;
    }
}
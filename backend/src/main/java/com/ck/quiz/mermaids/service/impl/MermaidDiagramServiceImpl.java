package com.ck.quiz.mermaids.service.impl;

import com.ck.quiz.mermaids.dto.MermaidDiagramDTO;
import com.ck.quiz.mermaids.entity.MermaidDiagram;
import com.ck.quiz.mermaids.repository.MermaidDiagramRepository;
import com.ck.quiz.mermaids.service.MermaidDiagramService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MermaidDiagramServiceImpl implements MermaidDiagramService {

    private final MermaidDiagramRepository repository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;
    
    @Autowired
    private com.ck.quiz.mermaids.repository.MermaidCategoryRepository categoryRepository;

    @Override
    public MermaidDiagramDTO create(MermaidDiagramDTO dto) {
        MermaidDiagram e = new MermaidDiagram();
        e.setId(dto.getId() == null ? IdHelper.genUuid() : dto.getId());
        e.setDiagramName(dto.getDiagramName());
        e.setDescription(dto.getDescription());
        e.setDiagramData(dto.getDiagramData());
        e.setCategoryId(dto.getCategoryId());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public MermaidDiagramDTO update(String id, MermaidDiagramDTO dto) {
        MermaidDiagram e = repository.findById(id).orElseThrow(() -> new RuntimeException("Diagram not found"));
        if (dto.getDiagramName() != null) e.setDiagramName(dto.getDiagramName());
        if (dto.getDescription() != null) e.setDescription(dto.getDescription());
        if (dto.getDiagramData() != null) e.setDiagramData(dto.getDiagramData());
        e.setCategoryId(dto.getCategoryId());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MermaidDiagramDTO findById(String id) {
        return repository.findById(id).map(this::toDto).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MermaidDiagramDTO> list(String keyword, String categoryId, Pageable pageable) {
        StringBuilder sql = new StringBuilder("select d.*, c.category_name from mermaid_diagram d left join mermaid_category c on d.category_id = c.category_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from mermaid_diagram d where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 名称/关键字模糊匹配
        JdbcQueryHelper.lowerLike("diagramName", keyword, " and lower(d.diagram_name) like :diagramName ", params, jdbcTemplate, sql, countSql);

        // 分类过滤
        JdbcQueryHelper.equals("categoryId", categoryId, " and d.category_id = :categoryId ", params, sql, countSql);

        // 默认按更新时间降序
        JdbcQueryHelper.order("d.update_date", "desc", sql);

        int pageNum = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), pageNum, pageSize);

        List<MermaidDiagramDTO> dtos = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            MermaidDiagramDTO d = new MermaidDiagramDTO();
            d.setId(rs.getString("diagram_id"));
            d.setDiagramName(rs.getString("diagram_name"));
            d.setDescription(rs.getString("description"));
            d.setDiagramData(rs.getString("diagram_data"));
            d.setCategoryId(rs.getString("category_id"));
            // 从查询结果中获取 categoryName（通过 left join 查询得到）
            try {
                d.setCategoryName(rs.getString("category_name"));
            } catch (Exception ignore) {
            }
            java.sql.Timestamp cts = rs.getTimestamp("create_date");
            if (cts != null) d.setCreateDate(cts.toLocalDateTime());
            d.setCreateUser(rs.getString("create_user"));
            java.sql.Timestamp uts = rs.getTimestamp("update_date");
            if (uts != null) d.setUpdateDate(uts.toLocalDateTime());
            d.setUpdateUser(rs.getString("update_user"));
            return d;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, dtos, pageNum, pageSize);
    }

    private MermaidDiagramDTO toDto(MermaidDiagram e) {
        MermaidDiagramDTO d = new MermaidDiagramDTO();
        d.setId(e.getId());
        d.setDiagramName(e.getDiagramName());
        d.setDescription(e.getDescription());
        d.setDiagramData(e.getDiagramData());
        d.setCategoryId(e.getCategoryId());
        d.setCreateDate(e.getCreateDate());
        d.setCreateUser(e.getCreateUser());
        d.setUpdateDate(e.getUpdateDate());
        d.setUpdateUser(e.getUpdateUser());
        return d;
    }
}

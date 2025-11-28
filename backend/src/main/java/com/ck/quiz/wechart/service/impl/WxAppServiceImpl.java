package com.ck.quiz.wechart.service.impl;

import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.wechart.dto.WxAppCreateDto;
import com.ck.quiz.wechart.dto.WxAppDto;
import com.ck.quiz.wechart.dto.WxAppQueryDto;
import com.ck.quiz.wechart.dto.WxAppUpdateDto;
import com.ck.quiz.wechart.entity.WxApp;
import com.ck.quiz.wechart.repository.WxAppRepository;
import com.ck.quiz.wechart.service.WxAppService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class WxAppServiceImpl implements WxAppService {

    @Autowired
    private WxAppRepository wxAppRepository;

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Override
    public WxApp createWxApp(WxAppCreateDto dto) {
        if (wxAppRepository.existsByAppid(dto.getAppid())) {
            throw new RuntimeException("appid 已存在：" + dto.getAppid());
        }

        WxApp wxApp = new WxApp();
        wxApp.setId(IdHelper.genUuid());
        wxApp.setAppid(dto.getAppid());
        wxApp.setAppSecret(dto.getAppSecret());
        wxApp.setAppName(dto.getAppName());
        wxApp.setCreateTime(LocalDateTime.now());
        wxApp.setUpdateTime(LocalDateTime.now());

        return wxAppRepository.save(wxApp);
    }

    @Override
    public WxApp updateWxApp(WxAppUpdateDto dto) {
        WxApp wxApp = wxAppRepository.findById(dto.getAppId())
                .orElseThrow(() -> new RuntimeException("WxApp 不存在: " + dto.getAppId()));

        if (dto.getAppSecret() != null && !dto.getAppSecret().isEmpty()) {
            wxApp.setAppSecret(dto.getAppSecret());
        }
        if (dto.getAppName() != null && !dto.getAppName().isEmpty()) {
            wxApp.setAppName(dto.getAppName());
        }

        wxApp.setUpdateTime(LocalDateTime.now());
        return wxAppRepository.save(wxApp);
    }

    @Override
    public boolean deleteWxApp(String appId) {
        if (!wxAppRepository.existsById(appId)) {
            return false;
        }
        wxAppRepository.deleteById(appId);
        return true;
    }

    @Override
    public Optional<WxAppDto> getWxAppById(String appId) {
        return wxAppRepository.findById(appId)
                .map(wxApp -> {
                    WxAppDto dto = new WxAppDto();
                    BeanUtils.copyProperties(wxApp, dto);
                    return dto;
                });
    }

    @Override
    public Page<TodoDto> searchTodos(WxAppQueryDto queryDto) {
        // SQL 基础查询
        StringBuilder sql = new StringBuilder("select * from wx_app where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from wx_app where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        int pageSize = queryDto.getLimit();
        int pageNum = queryDto.getOffset() / pageSize;

        // 动态条件
        JdbcQueryHelper.lowerLike("appName", queryDto.getName(), " and lower(app_name) like :appName ", params, namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("update_time", "desc", sql);

        // 分页 SQL
        String pagedSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), pageNum, pageSize);

        // 执行查询
        List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(pagedSql, params);

        // 转换为 TodoDto
        List<TodoDto> dtoList = new java.util.ArrayList<>();
        for (Map<String, Object> row : rows) {
            TodoDto dto = new TodoDto();
            dto.setId((String) row.get("app_id"));
            dto.setTitle((String) row.get("app_name"));
            dto.setDescription((String) row.get("appid"));
            dto.setCreateDate((LocalDateTime) row.get("create_time"));
            dto.setUpdateDate((LocalDateTime) row.get("update_time"));
            dtoList.add(dto);
        }

        // 总数查询
        long total = namedParameterJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        // 返回分页
        return new PageImpl<>(dtoList,
                PageRequest.of(pageNum, pageSize),
                total);
    }

}

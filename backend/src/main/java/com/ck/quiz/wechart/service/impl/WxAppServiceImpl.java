package com.ck.quiz.wechart.service.impl;

import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.wechart.dto.*;
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
import java.util.*;

@Service
public class WxAppServiceImpl implements WxAppService {

    @Autowired
    private WxAppRepository wxAppRepository;

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Override
    public WxApp createWxApp(WxAppCreateDto dto) {
        if (wxAppRepository.existsByAppId(dto.getAppId())) {
            throw new RuntimeException("appid 已存在：" + dto.getAppId());
        }

        WxApp wxApp = new WxApp();
        BeanUtils.copyProperties(dto, wxApp);
        wxApp.setId(IdHelper.genUuid());

        return wxAppRepository.save(wxApp);
    }

    @Override
    public WxApp updateWxApp(WxAppUpdateDto dto) {
        WxApp wxApp = wxAppRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("WxApp 不存在: " + dto.getAppId()));

        if (dto.getAppSecret() != null && !dto.getAppSecret().isEmpty()) {
            wxApp.setAppSecret(dto.getAppSecret());
        }
        if (dto.getAppName() != null && !dto.getAppName().isEmpty()) {
            wxApp.setAppName(dto.getAppName());
        }
        if (dto.getAppDescr() != null && !dto.getAppDescr().isEmpty()) {
            wxApp.setAppDescr(dto.getAppDescr());
        }

        return wxAppRepository.save(wxApp);
    }

    @Override
    public boolean deleteWxApp(String appId) {
        Objects.requireNonNull(appId, "appId 不能为空");
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
    public Page<WxAppDto> searchTodos(WxAppQueryDto queryDto) {
        // SQL 基础查询
        StringBuilder sql = new StringBuilder("select a.*, u.user_name update_user_name from wx_app a left join user u on u.user_id = a.update_user where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from wx_app a where 1=1 ");
        Map<String, Object> params = new HashMap<>();
        int pageSize = queryDto.getLimit();
        int pageNum = queryDto.getOffset() / pageSize;

        // 动态条件
        JdbcQueryHelper.lowerLike("appName", queryDto.getName(), " and (lower(a.app_name) like :appName or lower(a.app_descr) like :appName or lower(a.app_label) like :appName) ", params, namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("a.update_date", "desc", sql);

        // 分页 SQL
        String pagedSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), pageNum, pageSize);

        // 执行查询
        List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(pagedSql, params);

        // 转换为 TodoDto
        List<WxAppDto> dtoList = new java.util.ArrayList<>();
        for (Map<String, Object> row : rows) {
            WxAppDto dto = new WxAppDto();
            dto.setId((String) row.get("id"));
            dto.setAppId((String) row.get("app_id"));
            dto.setAppName((String) row.get("app_name"));
            dto.setAppSecret((String) row.get("app_secret"));
            dto.setAppDescr((String) row.get("app_descr"));
            dto.setCreateDate((LocalDateTime) row.get("create_date"));
            dto.setCreateUser((String) row.get("create_user"));
            dto.setUpdateDate((LocalDateTime) row.get("update_date"));
            dto.setUpdateUser((String) row.get("update_user"));
            dto.setUpdateUserName((String) row.get("update_user_name"));
            dtoList.add(dto);
        }

        // 总数查询
        long total = namedParameterJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        // 返回分页
        return new PageImpl<>(dtoList,
                PageRequest.of(pageNum, pageSize),
                total);
    }

    @Override
    public List<WxAppUserDto> listLoginUsers(String appId) {
        Map<String, Object> params = new HashMap<>();
        params.put("appId", appId);

        List<Map<String, Object>> list =
                HumpHelper.lineToHump(
                        namedParameterJdbcTemplate.queryForList(
                                "select m.*, a.app_name, u.user_name " +
                                        "from wx_user_mapping m " +
                                        "inner join wx_app a on m.app_id = a.app_id " +
                                        "left join user u on u.user_id = m.user_id " +
                                        "where a.app_id = :appId",
                                params
                        )
                );

        List<WxAppUserDto> result = new ArrayList<>();

        for (Map<String, Object> row : list) {
            WxAppUserDto dto = new WxAppUserDto();

            dto.setUserId((String) row.get("userId"));
            dto.setUserName((String) row.get("userName"));
            dto.setAppId((String) row.get("appId"));
            dto.setAppName((String) row.get("appName"));
            dto.setOpenId((String) row.get("openId"));

            Object ct = row.get("createTime");
            if (ct instanceof LocalDateTime) {
                dto.setCreateTime((LocalDateTime) ct);
            } else if (ct instanceof java.sql.Timestamp) {
                dto.setCreateTime(((java.sql.Timestamp) ct).toLocalDateTime());
            }

            result.add(dto);
        }

        return result;
    }


}

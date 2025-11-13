package com.ck.quiz.datasource.service;

import com.ck.quiz.datasource.dto.*;
import com.ck.quiz.datasource.entity.Datasource;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;

/**
 * 数据源管理服务接口
 */
public interface DatasourceService {

    DatasourceDto createDatasource(DatasourceCreateDto createDto);

    DatasourceDto updateDatasource(DatasourceUpdateDto updateDto);

    DatasourceDto deleteDatasource(String id);

    DatasourceDto getDatasourceById(String id);

    Page<DatasourceDto> searchDatasources(DatasourceQueryDto queryDto);

    DatasourceDto convertToDto(Datasource ds);

    /**
     * 测试连接
     */
    Map<String, Object> testConnection(String id);

    /**
     * 采集指定数据源的表结构
     */
    DatabaseSchemaDto collectSchema(String id);

    /**
     * 采集指定数据源的表结构（按指定schema过滤）
     */
    DatabaseSchemaDto collectSchema(String id, String schema);

    /**
     * 获取数据源的可选schema列表（若数据库无schema则返回catalog列表）
     */
    List<String> listSchemas(String id);

    int generateRemarks(String datasourceId, String schema);

    int selectGroup(String datasourceId, String schema);

    void exportToExcel(String datasourceId, String schema, HttpServletResponse response);
}
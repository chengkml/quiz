package com.ck.quiz.datasource.service;

import com.ck.quiz.datasource.dto.DatasourceCreateDto;
import com.ck.quiz.datasource.dto.DatasourceDto;
import com.ck.quiz.datasource.dto.DatasourceQueryDto;
import com.ck.quiz.datasource.dto.DatasourceUpdateDto;
 import com.ck.quiz.datasource.dto.DatabaseSchemaDto;
 import com.ck.quiz.datasource.entity.Datasource;
 import org.springframework.data.domain.Page;

 import java.util.Map;
 import java.util.List;

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
 }
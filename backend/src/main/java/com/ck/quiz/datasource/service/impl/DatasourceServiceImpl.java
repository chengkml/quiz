package com.ck.quiz.datasource.service.impl;

import com.ck.quiz.datasource.dto.*;
import com.ck.quiz.datasource.entity.Datasource;
import com.ck.quiz.datasource.repository.DatasourceRepository;
import com.ck.quiz.datasource.service.DatasourceService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Service
public class DatasourceServiceImpl implements DatasourceService {

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public DatasourceDto createDatasource(DatasourceCreateDto createDto) {
        Datasource ds = new Datasource();
        ds.setId(IdHelper.genUuid());
        ds.setName(createDto.getName());
        ds.setDriver(createDto.getDriver());
        ds.setJdbcUrl(createDto.getJdbcUrl());
        ds.setUsername(createDto.getUsername());
        ds.setPassword(createDto.getPassword());
        ds.setDescription(createDto.getDescription());
        ds.setActive(createDto.getActive());
        ds.setCreateDate(LocalDateTime.now());
        Datasource saved = datasourceRepository.save(ds);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public DatasourceDto updateDatasource(DatasourceUpdateDto updateDto) {
        Datasource ds = datasourceRepository.findById(updateDto.getId())
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + updateDto.getId()));

        if (StringUtils.hasText(updateDto.getName())) {
            ds.setName(updateDto.getName());
        }
        if (StringUtils.hasText(updateDto.getDriver())) {
            ds.setDriver(updateDto.getDriver());
        }
        if (StringUtils.hasText(updateDto.getJdbcUrl())) {
            ds.setJdbcUrl(updateDto.getJdbcUrl());
        }
        if (StringUtils.hasText(updateDto.getUsername())) {
            ds.setUsername(updateDto.getUsername());
        }
        if (updateDto.getPassword() != null) {
            ds.setPassword(updateDto.getPassword());
        }
        if (updateDto.getDescription() != null) {
            ds.setDescription(updateDto.getDescription());
        }
        if (updateDto.getActive() != null) {
            ds.setActive(updateDto.getActive());
        }
        ds.setUpdateDate(LocalDateTime.now());

        Datasource saved = datasourceRepository.save(ds);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public DatasourceDto deleteDatasource(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));
        datasourceRepository.delete(ds);
        return convertToDto(ds);
    }

    @Override
    @Transactional(readOnly = true)
    public DatasourceDto getDatasourceById(String id) {
        return datasourceRepository.findById(id).map(this::convertToDto)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DatasourceDto> searchDatasources(DatasourceQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT ds.ds_id AS id, ds.name, ds.driver, ds.jdbc_url, ds.username, ds.description, ds.active, " +
                        "ds.create_date, ds.create_user, ds.update_date, ds.update_user, u.user_name create_user_name " +
                        "FROM datasource ds LEFT JOIN user u ON u.user_id = ds.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM datasource ds "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("name", queryDto.getName(), " AND LOWER(ds.name) LIKE :name ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getActive() != null) {
            JdbcQueryHelper.equals("active", String.valueOf(queryDto.getActive() ? 1 : 0), " AND ds.active = :active ", params, sql, countSql);
        }

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<DatasourceDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            DatasourceDto dto = new DatasourceDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setDriver(rs.getString("driver"));
            dto.setJdbcUrl(rs.getString("jdbc_url"));
            dto.setUsername(rs.getString("username"));
            dto.setDescription(rs.getString("description"));
            dto.setActive(rs.getBoolean("active"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        Page<DatasourceDto> page = new PageImpl<>(list, org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                jdbcTemplate.queryForObject(countSql.toString(), params, Long.class));
        return page;
    }

    @Override
    public DatasourceDto convertToDto(Datasource ds) {
        DatasourceDto dto = new DatasourceDto();
        dto.setId(ds.getId());
        dto.setName(ds.getName());
        dto.setDriver(ds.getDriver());
        dto.setJdbcUrl(ds.getJdbcUrl());
        dto.setUsername(ds.getUsername());
        dto.setDescription(ds.getDescription());
        dto.setActive(ds.getActive());
        dto.setCreateDate(ds.getCreateDate());
        dto.setCreateUser(ds.getCreateUser());
        dto.setUpdateDate(ds.getUpdateDate());
        dto.setUpdateUser(ds.getUpdateUser());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> testConnection(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        Map<String, Object> res = new HashMap<>();
        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());
        try (Connection conn = tmp.getConnection()) {
            res.put("success", true);
            res.put("databaseType", JdbcQueryHelper.getDatabaseType(tmp));
        } catch (Exception e) {
            res.put("success", false);
            res.put("error", e.getMessage());
        }
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public DatabaseSchemaDto collectSchema(String id) {
        return collectSchema(id, null);
    }

    @Override
    @Transactional(readOnly = true)
    public DatabaseSchemaDto collectSchema(String id, String schema) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());

        DatabaseSchemaDto result = new DatabaseSchemaDto();
        try (Connection conn = tmp.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            result.setProductName(meta.getDatabaseProductName());
            result.setProductVersion(meta.getDatabaseProductVersion());
            result.setDriverName(meta.getDriverName());
            result.setDriverVersion(meta.getDriverVersion());
            String dbType = JdbcQueryHelper.getDatabaseType(tmp);
            result.setDatabaseType(dbType);

            String catalogToUse = null;
            String schemaToUse = null;
            if (StringUtils.hasText(schema)) {
                // MySQL/MariaDB 使用 catalog 作为库选择；其他数据库使用 schema
                String low = dbType == null ? "" : dbType.toLowerCase();
                boolean useCatalog = low.contains("mysql") || low.contains("mariadb");
                if (useCatalog) {
                    catalogToUse = schema;
                } else {
                    schemaToUse = schema;
                }
            }

            List<TableSchemaDto> tables = new ArrayList<>();
            // 采集所有类型为TABLE的对象，schema与catalog均使用通配
            try (ResultSet rs = meta.getTables(catalogToUse, schemaToUse, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    TableSchemaDto table = new TableSchemaDto();
                    table.setTableCat(rs.getString("TABLE_CAT"));
                    table.setTableSchem(rs.getString("TABLE_SCHEM"));
                    table.setTableName(rs.getString("TABLE_NAME"));
                    table.setTableType(rs.getString("TABLE_TYPE"));
                    table.setRemarks(rs.getString("REMARKS"));

                    // 主键集合
                    List<String> pks = new ArrayList<>();
                    try (ResultSet pkRs = meta.getPrimaryKeys(rs.getString("TABLE_CAT"), rs.getString("TABLE_SCHEM"), rs.getString("TABLE_NAME"))) {
                        while (pkRs.next()) {
                            String pkCol = pkRs.getString("COLUMN_NAME");
                            if (pkCol != null) {
                                pks.add(pkCol);
                            }
                        }
                    }

                    // 列集合
                    List<ColumnSchemaDto> columns = new ArrayList<>();
                    try (ResultSet colRs = meta.getColumns(rs.getString("TABLE_CAT"), rs.getString("TABLE_SCHEM"), rs.getString("TABLE_NAME"), "%")) {
                        while (colRs.next()) {
                            ColumnSchemaDto col = new ColumnSchemaDto();
                            col.setColumnName(colRs.getString("COLUMN_NAME"));
                            col.setDataType(colRs.getString("TYPE_NAME"));
                            col.setColumnSize(getInt(colRs, "COLUMN_SIZE"));
                            col.setDecimalDigits(getInt(colRs, "DECIMAL_DIGITS"));
                            col.setNullable("YES".equalsIgnoreCase(colRs.getString("IS_NULLABLE")) || colRs.getInt("NULLABLE") == DatabaseMetaData.columnNullable);
                            col.setDefaultValue(colRs.getString("COLUMN_DEF"));
                            col.setPrimaryKey(pks.contains(col.getColumnName()));
                            col.setRemarks(colRs.getString("REMARKS"));
                            columns.add(col);
                        }
                    }

                    table.setColumns(columns);
                    tables.add(table);
                }
            }

            result.setTables(tables);
        } catch (Exception e) {
            throw new RuntimeException("采集表结构失败: " + e.getMessage(), e);
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listSchemas(String id) {
        Datasource ds = datasourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("数据源不存在，ID: " + id));

        DriverManagerDataSource tmp = new DriverManagerDataSource();
        if (StringUtils.hasText(ds.getDriver())) {
            tmp.setDriverClassName(ds.getDriver());
        }
        tmp.setUrl(ds.getJdbcUrl());
        tmp.setUsername(ds.getUsername());
        tmp.setPassword(ds.getPassword());

        List<String> schemas = new ArrayList<>();
        try (Connection conn = tmp.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            // 先尝试获取schema
            try (ResultSet rs = meta.getSchemas()) {
                while (rs.next()) {
                    String name = rs.getString("TABLE_SCHEM");
                    if (StringUtils.hasText(name)) {
                        schemas.add(name);
                    }
                }
            }
            // 如果没有schema，尝试catalog作为schema选项
            if (schemas.isEmpty()) {
                try (ResultSet rs = meta.getCatalogs()) {
                    while (rs.next()) {
                        String name = rs.getString(1);
                        if (StringUtils.hasText(name)) {
                            schemas.add(name);
                        }
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("获取schema列表失败: " + e.getMessage(), e);
        }
        return schemas;
    }

    private Integer getInt(ResultSet rs, String column) {
        try {
            int v = rs.getInt(column);
            return rs.wasNull() ? null : v;
        } catch (Exception e) {
            return null;
        }
    }
}
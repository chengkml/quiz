package com.ck.quiz.utils;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @Title: SqlHelper
 * @Description: sql拼接工具类
 * @Author: Chengkai
 * @Date: 2019/12/12 16:35
 * @Version: 1.0
 */
@org.springframework.stereotype.Component
public class JdbcQueryHelper {

    private static final Logger LOG = LoggerFactory.getLogger(JdbcQueryHelper.class);

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile("\\b(and|exec|insert|select|drop|grant|alter|delete|update|count|chr|mid|master|truncate|case|sleep|char|declare|or|where|union|limit|from|substr|for)\\b");

    public static void equals(String name, String param, StringBuilder sb, String sqlSegment, Map<String, Object> params) {
        if (StringUtils.isNotBlank(param)) {
            sb.append(sqlSegment);
            params.put(name, param);
        }
    }

    public static void equals(String name, String param, String sqlSegment, Map<String, Object> params, StringBuilder... sbs) {
        if (StringUtils.isNotBlank(param)) {
            for (StringBuilder sb : sbs) {
                sb.append(sqlSegment);
            }
            params.put(name, param);
        }
    }

    public static void in(String name, List<String> pars, StringBuilder sb, String sqlSegment, Map<String, Object> params) {
        if (pars != null && !pars.isEmpty()) {
            sb.append(sqlSegment);
            params.put(name, pars);
        }
    }

    public static void in(String name, List<String> pars, String sqlSegment, Map<String, Object> params, StringBuilder... sbs) {
        if (pars != null && !pars.isEmpty()) {
            for (StringBuilder sb : sbs) {
                sb.append(sqlSegment);
            }
            params.put(name, pars);
        }
    }

    public static void lowerLike(String name, String param, StringBuilder sb, String sqlSegment,
                                 Map<String, Object> params, NamedParameterJdbcTemplate jt) {
        String dbType = getDatabaseType(jt.getJdbcTemplate().getDataSource());
        if (StringUtils.isNotBlank(param)) {
            if ("mysql".equalsIgnoreCase(dbType)) {
                param = param.replaceAll("\\/", "//").replaceAll("\\%", "/%").replaceAll("_", "/_").replaceAll("\\\\", "/\\\\");
                sqlSegment = sqlSegment.replaceAll(name, name + " escape '\\/'");
            } else if ("oracle".equalsIgnoreCase(dbType)) {
                param = param.replaceAll("\\\\", "\\\\\\\\").replaceAll("\\%", "\\\\%").replaceAll("_", "\\\\_");
                sqlSegment = sqlSegment.replaceAll(name, name + " escape chr(92 USING NCHAR_CS)");
            } else {
                LOG.warn("暂不支持对数据库类型为“{}”的模糊查询sql进行特殊字符处理！", dbType);
            }
            sb.append(sqlSegment);
            params.put(name, '%' + param.toLowerCase() + '%');
        }
    }

    public static void lowerLike(String name, String param, String sqlSegment,
                                 Map<String, Object> params, NamedParameterJdbcTemplate jt, StringBuilder... sbs) {
        String dbType = getDatabaseType(jt.getJdbcTemplate().getDataSource());
        if (StringUtils.isNotBlank(param)) {
            if ("mysql".equalsIgnoreCase(dbType)) {
                param = param.replaceAll("\\/", "//").replaceAll("\\%", "/%").replaceAll("_", "/_").replaceAll("\\\\", "/\\\\");
                sqlSegment = sqlSegment.replaceAll(name, name + " escape '\\/'");
            } else if ("oracle".equalsIgnoreCase(dbType)) {
                param = param.replaceAll("\\\\", "\\\\\\\\").replaceAll("\\%", "\\\\%").replaceAll("_", "\\\\_");
                sqlSegment = sqlSegment.replaceAll(name, name + " escape chr(92 USING NCHAR_CS)");
            } else {
                LOG.warn("暂不支持对数据库类型为“{}”的模糊查询sql进行特殊字符处理！", dbType);
            }
            for (StringBuilder sb : sbs) {
                sb.append(sqlSegment);
            }
            params.put(name, '%' + param.toLowerCase() + '%');
        }
    }

    public static void datetimeBetween(String fieldName, String startName, Date startTime, String endName, Date endTime,
                                       Map<String, Object> params, NamedParameterJdbcTemplate jt, StringBuilder... sbs) {
        String dsType = getDatabaseType(jt.getJdbcTemplate().getDataSource());
        if (startTime != null && endTime != null) {
            for (StringBuilder sb : sbs) {
                if (dsType.equals("mysql") || dsType.equals("postgresql")) {
                    sb.append("and ").append(fieldName).append(" between :").append(startName).append(" and :").append(endName).append(" ");
                } else if (dsType.equals("oracle") || dsType.equals("dm")) {
                    sb.append("and (").append(fieldName).append(" > to_date(:").append(startName).append(",'yyyy-mm-dd hh24:mi:ss') and ").append(fieldName).append("<to_date(:").append(endName).append(",'yyyy-mm-dd hh24:mi:ss')) ");
                } else {
                    LOG.warn("暂不支持对数据库类型为“{}”的sql进行日期特殊处理！", dsType);
                }
            }
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            params.put(startName, sdf.format(startTime));
            params.put(endName, sdf.format(endTime));
        }
    }

    public static String getLimitSql(NamedParameterJdbcTemplate jt, String listSql, int pageNum, int pageSize) {
        String dbType = getDatabaseType(jt.getJdbcTemplate().getDataSource());
        switch (dbType) {
            case "oracle":
                return getOracleLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "dm":
                return getOracleLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "mysql":
                return getMysqlLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "postgresql":
                return getPgLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            default:
                return "";
        }
    }

    public static String getLimitSql(NamedParameterJdbcTemplate jt, String listSql, long pageNum, long pageSize) {
        String dbType = getDatabaseType(jt.getJdbcTemplate().getDataSource());
        switch (dbType) {
            case "oracle":
                return getOracleLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "dm":
                return getOracleLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "mysql":
                return getMysqlLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            case "postgresql":
                return getPgLimitSQL(listSql, pageSize, pageNum * pageSize, null);
            default:
                return "";
        }
    }

    public static String getDatabaseType(DataSource dataSource) {
        String driverName = "";
        Connection con = DataSourceUtils.getConnection(dataSource);
        try {
            DatabaseMetaData dbmd = con.getMetaData();
            driverName = dbmd.getDriverName();
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            DataSourceUtils.releaseConnection(con, dataSource);
        }
        String result = "";
        Pattern pattern = Pattern.compile(".*(db2|oracle|mysql|sql server|hive|teradata|gbase|vertica|postgresql|dm).*");
        Matcher m = pattern.matcher(driverName.toLowerCase());
        if (m.matches()) {
            result = m.group(1);
        } else {
            result = driverName;
        }
        return result.replace(" ", "");
    }

    public static String getOracleLimitSQL(String sql, int limit, int start, String orderColumn) {
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder("select * from (select t.*,rownum as pseudo_column_rownum from (");
        limitSQL.append(sql);

        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }

        limitSQL.append(") t ");
        if (orderColumn != null && orderColumn.length() >= 0) {
            limitSQL.append(" order by " + orderColumn + "");
        }
        limitSQL.append(") t2 where pseudo_column_rownum between ").append(start + 1).append(" and ").append(start + limit);
        return limitSQL.toString();
    }

    public static String getOracleLimitSQL(String sql, long limit, long start, String orderColumn) {
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder("select * from (select t.*,rownum as pseudo_column_rownum from (");
        limitSQL.append(sql);

        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }

        limitSQL.append(") t ");
        if (orderColumn != null && orderColumn.length() >= 0) {
            limitSQL.append(" order by " + orderColumn + "");
        }
        limitSQL.append(") t2 where pseudo_column_rownum between ").append(start + 1).append(" and ").append(start + limit);
        return limitSQL.toString();
    }

    public static String getMysqlLimitSQL(String sql, int limit, int start, String orderColumn) {
        if (orderColumn == null || orderColumn.length() == 0) {
            orderColumn = "1";
        }
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder(sql);
        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }
        limitSQL.append(" limit ").append(start).append(" , ").append(limit);
        return limitSQL.toString();
    }

    public static String getMysqlLimitSQL(String sql, long limit, long start, String orderColumn) {
        if (orderColumn == null || orderColumn.length() == 0) {
            orderColumn = "1";
        }
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder(sql);
        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }
        limitSQL.append(" limit ").append(start).append(" , ").append(limit);
        return limitSQL.toString();
    }

    public static String getPgLimitSQL(String sql, int limit, int start, String orderColumn) {
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder(sql);
        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }
        limitSQL.append(" limit ").append(limit).append(" offset ").append(start);
        return limitSQL.toString();
    }

    public static String getPgLimitSQL(String sql, long limit, long start, String orderColumn) {
        sql = sql.trim();
        StringBuilder limitSQL = new StringBuilder(sql);
        if (sql.endsWith(";")) {
            limitSQL.delete(limitSQL.length() - 1, limitSQL.length());
        }
        limitSQL.append(" limit ").append(limit).append(" offset ").append(start);
        return limitSQL.toString();
    }

    public static Page toPage(NamedParameterJdbcTemplate jt, String countSql, Map<String, Object> params, List objListt, int pageNum, int pageSize) {
        return new PageImpl(objListt, PageRequest.of(pageNum, pageSize), jt.queryForObject(countSql, params, Long.class));
    }

    public static void order(String sortColumn, String sortType, StringBuilder sb) {
        if (StringUtils.isNotBlank(sortColumn)) {
            if (SQL_INJECTION_PATTERN.matcher(sortColumn.toLowerCase()).find()) {
                throw new RuntimeException("SQL Injection attack detected");
            }
            sb.append(" order by ").append(sortColumn);
            if (StringUtils.isNotBlank(sortType) && sortType.equals("desc")) {
                sb.append(" desc");
            } else {
                sb.append(" asc");
            }
        }
    }

    public static String explainSql(String explainSql, Map<String, Object> sqlParams) {
        Iterator<Map.Entry<String, Object>> it = sqlParams.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Object> e = it.next();
            try {
                if (e.getValue() instanceof List) {
                    explainSql = explainSql.replaceAll(":" + e.getKey(), "'" + String.join("','", (List) e.getValue()) + "'");
                } else if (e.getValue() instanceof Integer) {
                    explainSql = explainSql.replaceAll(":" + e.getKey(), "'" + (Integer) e.getValue() + "'");
                } else {
                    explainSql = explainSql.replaceAll(":" + e.getKey(), "'" + (String) e.getValue() + "'");
                }
            } catch (Exception err) {
                err.printStackTrace();
            }
        }
        return explainSql;
    }
}


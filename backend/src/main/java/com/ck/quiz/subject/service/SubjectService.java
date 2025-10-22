package com.ck.quiz.subject.service;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * 学科管理服务接口
 * <p>
 * 定义了学科相关的核心业务操作，包括增删改查、唯一性校验等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface SubjectService {

    /**
     * 创建学科
     *
     * @param subjectCreateDto 学科创建信息（包含学科名、描述等）
     * @return 创建成功后的学科信息
     */
    SubjectDto createSubject(SubjectCreateDto subjectCreateDto);

    /**
     * 更新学科
     *
     * @param subjectUpdateDto 学科更新信息（包含学科ID和待更新字段）
     * @return 更新后的学科信息
     */
    SubjectDto updateSubject(SubjectUpdateDto subjectUpdateDto);

    /**
     * 删除学科
     *
     * @param subjectId 学科ID
     * @return 被删除的学科信息（可用于前端回显或确认）
     */
    SubjectDto deleteSubject(String subjectId);

    /**
     * 根据ID获取学科信息
     *
     * @param subjectId 学科ID
     * @return 对应的学科信息，如果不存在可返回 null 或抛异常
     */
    SubjectDto getSubjectById(String subjectId);

    /**
     * 根据学科名称获取学科信息
     *
     * @param subjectName 学科名称
     * @return 对应的学科信息
     */
    SubjectDto getSubjectByName(String subjectName);

    /**
     * 分页查询学科列表
     *
     * @param queryDto 查询条件（支持学科名、分页参数等）
     * @return 分页封装的学科列表
     */
    Page<SubjectDto> searchSubjects(SubjectQueryDto queryDto);

    /**
     * 获取所有学科列表
     *
     * @return 所有学科的集合
     */
    List<SubjectDto> getAllSubjects();

    List<SubjectDto> getUserSubjects(String userId);

    /**
     * 检查学科名称是否已存在
     *
     * @param subjectName      学科名称
     * @param excludeSubjectId 排除的学科ID（用于更新时排除自身）
     * @return 是否存在同名学科
     */
    boolean isSubjectNameExists(String subjectName, String excludeSubjectId);

    /**
     * 将实体对象转换为DTO对象
     *
     * @param subject 学科实体对象
     * @return 学科DTO对象
     */
    SubjectDto convertToDto(Subject subject);

    List<SubjectDto> getAllUserSubjects(String name);

    void initSubjectQuestions(String subjectId, int questionNum);

    /**
     * 导出学科列表为Excel文件
     *
     * @param response HTTP响应对象
     */
    void exportSubjects(HttpServletResponse response);

    /**
     * 从Excel文件导入学科列表
     *
     * @param file Excel文件
     * @return 导入结果信息
     */
    Map<String, Object> importSubjects(MultipartFile file);
}
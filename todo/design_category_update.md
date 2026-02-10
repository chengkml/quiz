# Design Document: Category Management - Add Subject Info

## Context
The Category Management page (`frontend/src/pages/Category/index.tsx`) displays a list of categories. The table columns include "所属学科" (Subject Name), binding to the `subjectName` field. However, the current backend implementation for the search API does not populate `subjectName` or `subjectLabel` in the returned DTOs, causing the column to be empty (or undefined).

## Objectives
- Populate `subjectName` and `subjectLabel` in the `CategoryDto` returned by the `/api/category/search` endpoint.
- Ensure the Category Management list displays the Subject Name correctly.

## Impact Analysis

### Frontend
- **File**: `frontend/src/pages/Category/index.tsx`
- **Current State**: The table definition expects `subjectName` in the data source.
- **Changes**: No changes required in frontend code if the API returns the data.

### Backend
- **Endpoint**: `POST /api/category/search`
- **Controller**: `com.ck.quiz.category.controller.CategoryController`
- **Service**: `com.ck.quiz.category.service.impl.CategoryServiceImpl`
- **Entity**: `com.ck.quiz.category.entity.Category`
- **DTO**: `com.ck.quiz.category.dto.CategoryDto`

## Technical Design

### 1. DTO Verification
Checked `CategoryDto.java`. It already contains:
```java
private String subjectName;
private String subjectLabel;
```
No changes needed here.

### 2. Service Logic Update
Modify `CategoryServiceImpl.search` method.

**Current Logic**:
1. Builds SQL query for `Category` table.
2. Executes query to get `List<Category>`.
3. Converts entities to DTOs using `convertToDtos(categories)`.
4. Returns paginated result.

**New Logic**:
1. Execute query to get `List<Category>`.
2. Convert to `List<CategoryDto>`.
3. **Enhancement**:
    - Extract unique `subjectId`s from the DTO list.
    - Batch query `Subject` table (using `SubjectRepository` or `SubjectService`) to fetch subject details (id, name, label).
    - Map the subject name and label back to the corresponding `CategoryDto` objects.
4. Return paginated result with enriched DTOs.

### 3. Implementation Details
In `CategoryServiceImpl.java`:

```java
@Override
public Page<CategoryDto> search(String userId, CategoryQueryDto queryDto) {
    // ... existing SQL building code ...

    List<Category> categories = namedParameterJdbcTemplate.query(/*...*/);

    List<CategoryDto> categoryDtos = convertToDtos(categories);

    // New logic to populate subject info
    populateSubjectInfo(categoryDtos);

    return JdbcQueryHelper.toPage(
            namedParameterJdbcTemplate,
            countSql.toString(),
            params,
            categoryDtos,
            queryDto.getPageNum(),
            queryDto.getPageSize());
}

private void populateSubjectInfo(List<CategoryDto> dtos) {
    if (dtos == null || dtos.isEmpty()) return;

    Set<String> subjectIds = dtos.stream()
            .map(CategoryDto::getSubjectId)
            .filter(StringUtils::hasText)
            .collect(Collectors.toSet());

    if (subjectIds.isEmpty()) return;

    // Assuming subjectRepository exists or using subjectService
    List<Subject> subjects = subjectRepository.findAllById(subjectIds);
    Map<String, Subject> subjectMap = subjects.stream()
            .collect(Collectors.toMap(Subject::getId, Function.identity()));

    for (CategoryDto dto : dtos) {
        if (StringUtils.hasText(dto.getSubjectId())) {
            Subject subject = subjectMap.get(dto.getSubjectId());
            if (subject != null) {
                dto.setSubjectName(subject.getName());
                dto.setSubjectLabel(subject.getLabel());
            }
        }
    }
}
```

## Risks
- N+1 problem: Avoided by using batch fetch (`findAllById` or `IN` clause).
- Null pointers: Handle cases where subjectId is null or subject not found.

## Tasks
1. Update `CategoryServiceImpl` to inject `SubjectRepository` (if not already available) or use `namedParameterJdbcTemplate` to query subjects.
2. Implement the population logic in `search` method.

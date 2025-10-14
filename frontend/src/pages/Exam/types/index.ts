// 试卷状态枚举
export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

// 试卷题目DTO
export interface ExamQuestionDto {
  id?: string;
  examId?: string;
  questionId: string;
  questionOrder: number;
  score: number;
  questionContent?: string;
  questionType?: string;
  questionDifficulty?: string;
  createDate?: string;
  createUser?: string;
  updateDate?: string;
  updateUser?: string;
}

// 试卷题目创建DTO
export interface ExamQuestionCreateDto {
  questionId: string;
  questionOrder: number;
  score: number;
}

// 试卷DTO
export interface ExamDto {
  id: string;
  name: string;
  description?: string;
  totalScore: number;
  durationMinutes?: number;
  status: ExamStatus;
  questions?: ExamQuestionDto[];
  createDate?: string;
  createUser?: string;
  updateDate?: string;
  updateUser?: string;
}

// 试卷创建DTO
export interface ExamCreateDto {
  name: string;
  description?: string;
  totalScore: number;
  durationMinutes?: number;
  status?: ExamStatus;
  questions?: ExamQuestionCreateDto[];
}

// 试卷更新DTO
export interface ExamUpdateDto {
  id: string;
  name?: string;
  description?: string;
  totalScore?: number;
  durationMinutes?: number;
  status?: ExamStatus;
  questions?: ExamQuestionCreateDto[];
}

// 试卷查询参数DTO
export interface ExamQueryDto {
  keyWord?: string;           // 关键字（名称/描述模糊查询）
  status?: ExamStatus;        // 试卷状态
  createUser?: string;        // 创建人
  pageNum?: number;           // 页码（后端从0开始）
  pageSize?: number;          // 每页大小
  sortColumn?: string;        // 排序字段
  sortType?: 'asc' | 'desc';  // 排序方向
}

// 分页响应接口
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 表格列配置接口
export interface TableColumn {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
}

// 分页配置接口
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showTotal?: boolean;
  showJumper?: boolean;
  showPageSize?: boolean;
}

// 模态框Props接口
export interface ModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

// 试卷详情模态框Props
export interface ExamDetailModalProps extends ModalProps {
  record: ExamDto | null;
}

// 试卷新增模态框Props
export interface ExamAddModalProps extends ModalProps {
  // 可以添加特定的props
}

// 试卷编辑模态框Props
export interface ExamEditModalProps extends ModalProps {
  record: ExamDto | null;
}

// 试卷删除确认模态框Props
export interface ExamDeleteModalProps extends ModalProps {
  record: ExamDto | null;
}

// 试卷题目管理Props
export interface ExamQuestionManagerProps extends ModalProps {
  examId: string;
  examName: string;
}

// 状态选项接口
export interface StatusOption {
  label: string;
  value: ExamStatus;
}

// 表单引用接口
export interface FormRef {
  current: any;
}

// 考试提交答案DTO
export interface ExamSubmitAnswerDto {
  examQuestionId: string;
  answers: string[]; // 不同题型均按字符串数组提交（单选/简答为单元素）
}

// 考试提交DTO
export interface ExamSubmitDto {
  userId: string;
  answers: ExamSubmitAnswerDto[];
}

// 考试结果-题目级别DTO
export interface ExamResultAnswerDto {
  examQuestionId: string;
  correct: boolean;
  score: number;
  userAnswers: string[];
  standardAnswers?: string[];
}

// 考试结果DTO
export interface ExamResultDto {
  totalScore: number;
  correctCount: number;
  submitTime: string;
  answers: ExamResultAnswerDto[];
}
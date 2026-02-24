# 需求设计: 艾宾浩斯单词记忆系统 (Spaced Repetition Vocabulary)

## 1. 需求背景

### 1.1 功能目标
构建一个基于艾宾浩斯遗忘曲线的单词记忆系统，采用 **SuperMemo-2 (SM-2)** 算法实现智能间隔重复学习。核心特性包括：
- **智能复习调度**：根据掌握程度动态计算下次复习时间
- **灵活数据管理**：完整的单词 CRUD 功能，支持搜索、筛选、归档
- **富文本释义**：使用 Markdown 编写美观的单词解释和笔记

### 1.2 用户场景
- **学习者**：添加单词，通过每日复习任务逐步掌握词汇
- **自定义调度**：对于临时遗忘的单词可随时重置学习状态
- **知识归档**：已完全掌握的单词可归档，减少不必要的重复复习

### 1.3 SM-2 算法核心原理

**核心变量**：
- **复习计数 ($n$)**：该单词连续被记对的次数
- **简易度因子 ($EF$)**：表示单词难度，初始值 2.5，范围 [1.3, ∞)
- **复习间隔 ($I$)**：距离下次复习的天数

**评分机制 ($q$)**：每次复习时用户打分 0-5
- 5 = 完美（秒杀）
- 4 = 正确（犹豫后想起）
- 3 = 勉强（费劲想起，伴有错误）
- 2 = 错误（但看答案觉得面熟）
- 1 = 错误（完全没印象）
- 0 = 彻底遗忘

**间隔计算规则**：
- 第 1 次记对：$I(1) = 1$ 天
- 第 2 次记对：$I(2) = 6$ 天
- 第 3+ 次记对：$I(n) = I(n-1) \times EF$
- **若 $q < 3$**：$n$ 重置为 0，下次复习间隔设为 1 天

**简易度更新公式**：
$$EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$$
- 打 4-5 分，$EF$ 增加 → 间隔拉大
- 打 0-2 分，$EF$ 减小 → 高频复习
- **硬性约束**：$EF \geq 1.3$

---

## 2. 总体方案

### 2.1 涉及模块
| 模块 | 说明 |
|------|------|
| VocabularyCard (新增) | 单词卡片核心模块 |
| ReviewLog (新增) | 复习记录模块 |
| MdConvert (现有，可选) | Markdown 渲染支持 |

### 2.2 核心业务流程

```
┌─────────────────────────────────────────────────────────────────┐
│                 VocabularyCard (单词卡片)                        │
├─────────────────────────────────────────────────────────────────┤
│  - word: 单词                                                    │
│  - mdDefinition: Markdown 格式释义                                │
│  - easinessFactor: 简易度因子 (EF, 默认 2.5)                      │
│  - interval: 复习间隔 (天)                                        │
│  - repetition: 连续记对次数 (n)                                   │
│  - nextReviewDate: 下次复习日期                                   │
│  - archived: 是否归档 (已完全掌握的单词不再参与复习)                │
│  - tags: 分类标签 (如：TOEFL, GRE, 技术词汇)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ReviewLog (复习记录)                           │
├─────────────────────────────────────────────────────────────────┤
│  - vocabularyCardId: 关联的单词ID                                │
│  - reviewDate: 复习日期时间                                       │
│  - score: 评分 (0-5)                                             │
│  - efBefore: 复习前的简易度因子                                   │
│  - efAfter: 复习后的简易度因子                                    │
│  - nextIntervalDays: 下次复习间隔天数                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 核心特性
1. **每日复习任务**: 查询 `nextReviewDate <= 今天` 且 `archived = false` 的单词
2. **评分反馈**: 根据 SM-2 算法更新 EF、interval、nextReviewDate
3. **一键重置**: 将单词的 `repetition = 0`, `easinessFactor = 2.5`, `nextReviewDate = 明天`
4. **筛选归档**: 支持按熟练度、添加日期、标签筛选，已掌握词可归档

---

## 3. 后端设计 (Spring Boot)

### 3.1 数据库设计

#### 3.1.1 VocabularyCard 实体
```java
@Entity
@Table(name = "vocabulary_card", indexes = {
    @Index(name = "idx_vocab_next_review", columnList = "next_review_date"),
    @Index(name = "idx_vocab_archived", columnList = "archived"),
    @Index(name = "idx_vocab_tags", columnList = "tags"),
    @Index(name = "idx_vocab_word", columnList = "word")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Comment("单词卡片表")
public class VocabularyCard extends Model {

    @Column(length = 128, nullable = false)
    @Comment("单词")
    private String word;

    @Column(columnDefinition = "TEXT")
    @Comment("Markdown格式释义")
    private String mdDefinition;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2) DEFAULT 2.50")
    @Comment("简易度因子 (1.3 ~ 无穷)")
    private Double easinessFactor;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @Comment("复习间隔天数")
    private Integer interval;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @Comment("连续记对次数")
    private Integer repetition;

    @Comment("下次复习日期")
    private LocalDate nextReviewDate;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Comment("是否已归档")
    private Boolean archived;

    @Column(length = 256)
    @Comment("分类标签，逗号分隔")
    private String tags;

    @Comment("总复习次数")
    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalReviewCount;

    @Comment("最后一次评分 (0-5)")
    @Column(columnDefinition = "INTEGER")
    private Integer lastScore;
}
```

#### 3.1.2 ReviewLog 实体
```java
@Entity
@Table(name = "review_log", indexes = {
    @Index(name = "idx_review_card_id", columnList = "vocabulary_card_id"),
    @Index(name = "idx_review_date", columnList = "review_date")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Comment("复习记录表")
public class ReviewLog extends Model {

    @Column(name = "vocabulary_card_id", length = 32, nullable = false)
    @Comment("单词卡片ID")
    private String vocabularyCardId;

    @Comment("复习时间")
    @Column(nullable = false)
    private LocalDateTime reviewDate;

    @Column(nullable = false)
    @Comment("评分 (0-5)")
    private Integer score;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2)")
    @Comment("复习前简易度因子")
    private Double efBefore;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2)")
    @Comment("复习后简易度因子")
    private Double efAfter;

    @Column(nullable = false)
    @Comment("下次复习间隔天数")
    private Integer nextIntervalDays;
}
```

### 3.2 接口设计 (Controller)

#### 3.2.1 单词卡片管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/vocabulary/create` | 创建单词卡片 |
| POST | `/vocabulary/update` | 更新单词卡片 |
| DELETE | `/vocabulary/delete/{id}` | 删除单词卡片 |
| POST | `/vocabulary/search` | 搜索/筛选单词（支持分页、按熟练度/标签筛选）|
| GET | `/vocabulary/{id}` | 获取单词详情 |
| POST | `/vocabulary/archive/{id}` | 归档单词 |
| POST | `/vocabulary/reset/{id}` | 重置单词学习状态 |0

#### 3.2.2 复习相关
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/vocabulary/due-today` | 获取今日待复习单词列表 |
| POST | `/vocabulary/review` | 提交复习评分，更新学习状态 |
| GET | `/vocabulary/statistics` | 获取学习统计（总词数、待复习数、掌握度分布）|

#### 3.2.3 复习记录
| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/review-log/list/{cardId}` | 获取某单词的复习历史 |

### 3.3 核心类和方法

#### VocabularyCardController
```java
@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
@Tag(name = "单词卡片管理", description = "艾宾浩斯单词记忆系统")
public class VocabularyCardController {
    
    private final VocabularyCardService vocabularyCardService;
    
    @PostMapping("/create")
    @Operation(summary = "创建单词卡片")
    public VocabularyCardDto create(@RequestBody VocabularyCardCreateDto dto);
    
    @PostMapping("/update")
    @Operation(summary = "更新单词卡片")
    public VocabularyCardDto update(@RequestBody VocabularyCardUpdateDto dto);
    
    @DeleteMapping("/delete/{id}")
    @Operation(summary = "删除单词卡片")
    public void delete(@PathVariable String id);
    
    @PostMapping("/search")
    @Operation(summary = "搜索/筛选单词")
    public Page<VocabularyCardDto> search(@RequestBody VocabularyCardQueryDto queryDto);
    
    @GetMapping("/{id}")
    @Operation(summary = "获取单词详情")
    public VocabularyCardDto getById(@PathVariable String id);
    
    @PostMapping("/archive/{id}")
    @Operation(summary = "归档单词")
    public void archive(@PathVariable String id);
    
    @PostMapping("/reset/{id}")
    @Operation(summary = "重置学习状态")
    public void reset(@PathVariable String id);
    
    @GetMapping("/due-today")
    @Operation(summary = "获取今日待复习单词")
    public List<VocabularyCardDto> getDueToday();
    
    @PostMapping("/review")
    @Operation(summary = "提交复习评分")
    public ReviewResultDto review(@RequestBody ReviewRequestDto dto);
    
    @GetMapping("/statistics")
    @Operation(summary = "学习统计")
    public StatisticsDto getStatistics();
}
```

#### VocabularyCardService
```java
@Service
public interface VocabularyCardService {
    
    /**
     * SM-2 算法核心实现
     * @param card 单词卡片
     * @param score 评分 (0-5)
     * @return 更新后的卡片
     */
    VocabularyCard updateByScore(VocabularyCard card, int score);
    
    /**
     * 获取今日待复习单词列表
     */
    List<VocabularyCardDto> getDueToday(String userId);
    
    /**
     * 重置单词学习状态
     */
    void reset(String cardId);
    
    /**
     * 归档单词
     */
    void archive(String cardId);
    
    /**
     * 获取学习统计数据
     */
    StatisticsDto getStatistics(String userId);
}
```

#### SM-2 算法实现示例 (VocabularyCardServiceImpl)
```java
@Override
@Transactional
public VocabularyCard updateByScore(VocabularyCard card, int score) {
    // 记录复习前状态
    Double efBefore = card.getEasinessFactor();
    
    // 1. 更新简易度因子 (EF)
    double newEF = card.getEasinessFactor() + 
        (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    newEF = Math.max(1.3, newEF); // 确保 EF >= 1.3
    card.setEasinessFactor(newEF);
    
    // 2. 更新复习计数和间隔
    if (score < 3) {
        // 答错了，重置
        card.setRepetition(0);
        card.setInterval(1);
    } else {
        // 答对了
        int n = card.getRepetition() + 1;
        card.setRepetition(n);
        
        if (n == 1) {
            card.setInterval(1);
        } else if (n == 2) {
            card.setInterval(6);
        } else {
            card.setInterval((int) Math.ceil(card.getInterval() * newEF));
        }
    }
    
    // 3. 计算下次复习日期
    LocalDate nextReview = LocalDate.now().plusDays(card.getInterval());
    card.setNextReviewDate(nextReview);
    
    // 4. 更新统计信息
    card.setTotalReviewCount(card.getTotalReviewCount() + 1);
    card.setLastScore(score);
    
    // 5. 保存复习记录
    ReviewLog log = new ReviewLog();
    log.setId(IdHelper.genUuid());
    log.setVocabularyCardId(card.getId());
    log.setReviewDate(LocalDateTime.now());
    log.setScore(score);
    log.setEfBefore(efBefore);
    log.setEfAfter(newEF);
    log.setNextIntervalDays(card.getInterval());
    reviewLogRepository.save(log);
    
    // 6. 保存更新后的卡片
    return vocabularyCardRepository.save(card);
}
```

### 3.4 DTO 设计

#### VocabularyCardDto
```java
@Data
public class VocabularyCardDto {
    private String id;
    private String word;
    private String mdDefinition;
    private Double easinessFactor;
    private Integer interval;
    private Integer repetition;
    private LocalDate nextReviewDate;
    private Boolean archived;
    private String tags;
    private Integer totalReviewCount;
    private Integer lastScore;
    private LocalDateTime createDate;
    private LocalDateTime updateDate;
}
```

#### VocabularyCardQueryDto
```java
@Data
public class VocabularyCardQueryDto {
    private String keyword; // 模糊搜索单词
    private String tags; // 按标签筛选
    private Boolean archived; // 是否归档
    private Integer minRepetition; // 最小复习次数（熟练度筛选）
    private Integer maxRepetition;
    private LocalDate createDateStart; // 按添加日期筛选
    private LocalDate createDateEnd;
    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "createDate";
    private String sortDirection = "desc";
}
```

#### ReviewRequestDto
```java
@Data
public class ReviewRequestDto {
    private String cardId;
    private Integer score; // 0-5
}
```

#### StatisticsDto
```java
@Data
public class StatisticsDto {
    private Long totalWords; // 总单词数
    private Long dueToday; // 今日待复习
    private Long archived; // 已归档
    private Map<String, Long> repetitionDistribution; // 熟练度分布 (0次, 1-2次, 3-5次, 6+次)
    private Map<String, Long> efDistribution; // 简易度分布 (1.3-1.9, 2.0-2.4, 2.5+)
}
```

---

## 4. 前端设计 (React + Arco Design)

### 4.1 页面位置
```
frontend/src/pages/Vocabulary/
├── index.tsx             # 单词列表页
├── components/
│   ├── AddEditModal.tsx  # 新增/编辑单词弹窗
│   ├── ReviewCard.tsx    # 复习卡片组件
│   └── StatisticsPanel.tsx # 统计面板
├── api/index.ts          # API 定义
└── style/index.less      # 样式文件
```

### 4.2 组件设计

#### 4.2.1 单词列表页 (index.tsx)
**功能**:
- 使用 `DataManager` 组件展示单词列表
- 支持搜索、筛选（按标签、熟练度、归档状态）
- 操作按钮：编辑、删除、重置、归档
- 顶部显示统计卡片（总词数、待复习数）

**核心代码结构**:
```tsx
const VocabularyPage: React.FC = () => {
    const columns = [
        { title: '单词', dataIndex: 'word', width: 150 },
        { 
            title: 'Markdown释义', 
            dataIndex: 'mdDefinition',
            render: (text) => <MarkdownPreview content={text} />
        },
        { 
            title: '熟练度', 
            dataIndex: 'repetition',
            render: (n) => <Tag color={getColorByRepetition(n)}>连对{n}次</Tag>
        },
        { 
            title: '下次复习', 
            dataIndex: 'nextReviewDate',
            render: (date) => dayjs(date).format('YYYY-MM-DD')
        },
        { title: '间隔天数', dataIndex: 'interval' },
        { title: '简易度', dataIndex: 'easinessFactor', render: (ef) => ef.toFixed(2) },
        { 
            title: '操作', 
            render: (_, record) => (
                <>
                    <Button onClick={() => handleEdit(record)}>编辑</Button>
                    <Button onClick={() => handleReset(record.id)}>重置</Button>
                    <Button onClick={() => handleArchive(record.id)}>
                        {record.archived ? '取消归档' : '归档'}
                    </Button>
                </>
            )
        }
    ];

    return (
        <div>
            <StatisticsPanel />
            <DataManager
                columns={columns}
                fetchData={getVocabularyList}
                // 筛选表单配置
                filters={[
                    { type: 'input', field: 'keyword', label: '搜索单词' },
                    { type: 'select', field: 'archived', label: '状态', options: archivedOptions },
                    { type: 'select', field: 'tags', label: '标签', options: tagOptions }
                ]}
            />
        </div>
    );
};
```

#### 4.2.2 复习页面 (ReviewPage.tsx)
**功能**:
- 展示今日待复习单词
- 卡片式翻转交互（正面：单词 / 反面：释义）
- 评分按钮 (0-5 分)：
  - 0: 彻底遗忘
  - 3: 模糊
  - 5: 太简单
- 显示进度条（已复习/总数）

**核心代码结构**:
```tsx
const ReviewPage: React.FC = () => {
    const [cards, setCards] = useState<VocabularyCardDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleScore = async (score: number) => {
        await reviewVocabulary({ cardId: currentCard.id, score });
        // 移到下一张卡片
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
    };

    return (
        <div className="review-container">
            <Progress percent={(currentIndex / cards.length) * 100} />
            <ReviewCard 
                word={currentCard.word}
                definition={currentCard.mdDefinition}
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)}
            />
            {isFlipped && (
                <div className="score-buttons">
                    <Button onClick={() => handleScore(0)}>忘光了 (0)</Button>
                    <Button onClick={() => handleScore(3)}>模糊 (3)</Button>
                    <Button onClick={() => handleScore(5)}>太简单 (5)</Button>
                </div>
            )}
        </div>
    );
};
```

#### 4.2.3 新增/编辑弹窗 (AddEditModal.tsx)
**功能**:
- 输入单词
- Markdown 编辑器（可实时预览）
- 标签选择

**核心代码**:
```tsx
const AddEditModal: React.FC = ({ visible, record, onOk, onCancel }) => {
    const [form] = Form.useForm();
    const [mdContent, setMdContent] = useState('');

    return (
        <Modal visible={visible} onOk={() => form.submit()} onCancel={onCancel}>
            <Form form={form}>
                <Form.Item label="单词" name="word" rules={[{ required: true }]}>
                    <Input placeholder="输入单词" />
                </Form.Item>
                <Form.Item label="释义" name="mdDefinition">
                    <MarkdownEditor 
                        value={mdContent}
                        onChange={setMdContent}
                        placeholder="### [单词]\n---\n- **释义**: \n- **例句**: \n  > Example"
                    />
                </Form.Item>
                <Form.Item label="标签" name="tags">
                    <Select mode="tags" placeholder="添加标签">
                        <Option value="TOEFL">TOEFL</Option>
                        <Option value="GRE">GRE</Option>
                        <Option value="技术词汇">技术词汇</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};
```

### 4.3 API 定义 (api/index.ts)

```typescript
import axios from '@/core/src/http';

export interface VocabularyCardDto {
    id: string;
    word: string;
    mdDefinition: string;
    easinessFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: string;
    archived: boolean;
    tags: string;
    totalReviewCount: number;
    lastScore: number;
}

export interface VocabularyCardQueryDto {
    keyword?: string;
    tags?: string;
    archived?: boolean;
    minRepetition?: number;
    maxRepetition?: number;
    page?: number;
    size?: number;
}

export interface ReviewRequestDto {
    cardId: string;
    score: number;
}

export const getVocabularyList = (params: VocabularyCardQueryDto) =>
    axios.post('/vocabulary/search', params);

export const createVocabulary = (data: Partial<VocabularyCardDto>) =>
    axios.post('/vocabulary/create', data);

export const updateVocabulary = (data: Partial<VocabularyCardDto>) =>
    axios.post('/vocabulary/update', data);

export const deleteVocabulary = (id: string) =>
    axios.delete(`/vocabulary/delete/${id}`);

export const archiveVocabulary = (id: string) =>
    axios.post(`/vocabulary/archive/${id}`);

export const resetVocabulary = (id: string) =>
    axios.post(`/vocabulary/reset/${id}`);

export const getDueToday = () =>
    axios.get('/vocabulary/due-today');

export const reviewVocabulary = (data: ReviewRequestDto) =>
    axios.post('/vocabulary/review', data);

export const getStatistics = () =>
    axios.get('/vocabulary/statistics');
```

### 4.4 路由配置
在 `frontend/src/router/index.tsx` 中添加：
```tsx
{
    path: '/vocabulary',
    component: VocabularyPage,
    meta: { title: '单词学习', icon: 'icon-book' }
},
{
    path: '/vocabulary/review',
    component: ReviewPage,
    meta: { title: '今日复习', icon: 'icon-calendar' }
}
```

---

## 5. 实施步骤 (Action Plan)

### 阶段 1: 后端基础开发
1. **[Backend]** 创建 VocabularyCard 和 ReviewLog 实体类
   - 路径: `backend/src/main/java/com/ck/quiz/vocabulary/entity/`
   - 添加必要的索引和注释

2. **[Backend]** 创建 Repository 接口
   - `VocabularyCardRepository.java`
   - `ReviewLogRepository.java`
   - 添加自定义查询方法（如 `findByNextReviewDateBeforeAndArchivedFalse`）

3. **[Backend]** 创建 DTO 类
   - 路径: `backend/src/main/java/com/ck/quiz/vocabulary/dto/`
   - `VocabularyCardDto`, `VocabularyCardCreateDto`, `VocabularyCardUpdateDto`, `VocabularyCardQueryDto`
   - `ReviewRequestDto`, `ReviewResultDto`, `StatisticsDto`

4. **[Backend]** 实现 VocabularyCardService
   - 路径: `backend/src/main/java/com/ck/quiz/vocabulary/service/impl/VocabularyCardServiceImpl.java`
   - **核心方法**: `updateByScore()` 实现 SM-2 算法

5. **[Backend]** 创建 VocabularyCardController
   - 路径: `backend/src/main/java/com/ck/quiz/vocabulary/controller/VocabularyCardController.java`
   - 实现所有 REST 端点

6. **[Skill]** 运行 **Java 编译检查** 确保后端编译通过

### 阶段 2: 前端界面开发
7. **[Frontend]** 创建页面目录结构
   - `frontend/src/pages/Vocabulary/`
   - `api/index.ts`, `index.tsx`, `components/`

8. **[Frontend]** 定义 API 接口
   - `api/index.ts` 中定义所有 TypeScript 类型和 API 函数

9. **[Frontend]** 实现单词列表页
   - 使用 `DataManager` 组件
   - 集成搜索、筛选、归档功能

10. **[Frontend]** 实现复习页面
    - 卡片翻转效果
    - 评分按钮交互
    - 进度条显示

11. **[Frontend]** 实现新增/编辑弹窗
    - Markdown 编辑器集成
    - 实时预览功能

12. **[Frontend]** 添加路由配置
    - 在 `router/index.tsx` 中注册新路由

13. **[Skill]** 运行 **前端编译检查** 确保 TypeScript 和 Webpack 构建通过

### 阶段 3: 联调与优化
14. **[Full Stack]** 联调测试
    - 测试单词 CRUD 功能
    - 测试 SM-2 算法准确性
    - 测试复习流程完整性

15. **[Backend]** 添加数据验证
    - 评分范围验证 (0-5)
    - 单词唯一性验证

16. **[Frontend]** 优化用户体验
    - 添加加载状态
    - 优化 Markdown 渲染性能
    - 添加快捷键支持（空格翻卡片，数字键评分）

### 阶段 4: 提交与验收
17. **[Skill]** 调用 **Git 提交助手** 提交代码
    - Message: `feat(vocabulary): 实现艾宾浩斯单词记忆系统`

18. **[Doc]** 更新 `todo.md` 将任务移至 **已完成 (Done)** 区域

19. **[Conditional]** 检查 `todo.md` 若所有任务完成则执行 `git push`

---

## 6. 技术细节与注意事项

### 6.1 Markdown 编辑器集成
推荐使用 `@uiw/react-md-editor` 或 `react-markdown` + `react-simplemde-editor` 组合：
```bash
npm install @uiw/react-md-editor
```

### 6.2 日期计算
使用 `java.time.LocalDate` (后端) 和 `dayjs` (前端)：
```java
// 后端
LocalDate nextReview = LocalDate.now().plusDays(card.getInterval());
```
```typescript
// 前端
import dayjs from 'dayjs';
const formatted = dayjs(date).format('YYYY-MM-DD');
```

### 6.3 性能优化
- 添加数据库索引（`next_review_date`, `archived`, `tags`）
- 前端分页加载（默认每页 20 条）
- Markdown 渲染使用懒加载

### 6.4 扩展功能（可选）
- **发音功能**: 集成 TTS API (如 Google Text-to-Speech)
- **图片支持**: Markdown 中嵌入图片链接
- **例句高亮**: 在释义中支持语法高亮
- **导入导出**: 支持 CSV/Excel 批量导入单词

---

## 7. 验收标准

### 7.1 功能验收
- ✅ 能创建、编辑、删除单词
- ✅ Markdown 释义正常渲染
- ✅ 复习评分后正确更新 EF、Interval、NextReviewDate
- ✅ 今日复习列表准确显示 `nextReviewDate <= 今天` 的单词
- ✅ 归档功能正常，归档单词不出现在复习列表
- ✅ 重置功能能将单词恢复到初始状态
- ✅ 统计数据准确（总词数、待复习数、熟练度分布）

### 7.2 技术验收
- ✅ 后端编译通过 (`BUILD SUCCESSFUL`)
- ✅ 前端构建无 TypeScript 错误
- ✅ API 响应时间 < 500ms
- ✅ 数据库查询使用了索引优化

### 7.3 用户体验
- ✅ 复习页面翻卡流畅（无卡顿）
- ✅ Markdown 编辑器支持实时预览
- ✅ 操作反馈及时（成功/失败提示）

---

## 8. 参考资料

- [SuperMemo-2 算法详解](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
- [Anki 官方文档](https://docs.ankiweb.net/)
- [Markdown 编辑器选型](https://github.com/uiwjs/react-md-editor)

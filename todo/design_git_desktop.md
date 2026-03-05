# 需求设计: Git 桌面管理 (GitHub Desktop 功能)

## 1. 需求背景

日常开发中需频繁切换到外部 Git 客户端查看变更、提交代码、管理分支等。为提升开发效率，希望在系统内嵌一套 **类 GitHub Desktop** 的 Git 可视化管理功能，让用户在 Web 界面即可完成常见的 Git 操作。

**核心特性：支持管理多个 Git 仓库**——用户可在系统中添加、切换任意本地仓库，统一管理所有项目的 Git 操作。

### 核心目标

| 目标 | 说明 |
|------|------|
| **多仓库管理** | 添加/移除/切换多个本地 Git 仓库，持久化仓库列表 |
| **仓库概览** | 展示当前分支、最近提交历史、远端同步状态 |
| **变更管理** | 查看工作区文件变更(diff)、暂存(stage)、取消暂存(unstage) |
| **提交操作** | 填写提交信息并提交(commit)，支持修改上次提交(amend) |
| **分支管理** | 创建、切换、删除本地分支，查看远程分支 |
| **远端同步** | 推送(push)、拉取(pull/fetch) |
| **提交历史** | 可视化 commit 日志，支持查看任意 commit 的 diff |
| **冲突处理** | 拉取/合并出现冲突时提示用户手动解决 |

---

## 2. 总体方案

### 涉及模块

| 层级 | 新增模块 | 说明 |
|------|----------|------|
| **后端** | `git` | 新增 Git 操作模块（Entity/Service/Controller），含仓库管理 + Git 操作 |
| **前端** | `pages/GitDesktop` | 新增 Git Desktop 页面（含仓库列表侧边栏） |
| **前端** | `services/gitService.ts` | 新增 Git API 调用层 |

### 核心逻辑

```
┌──────────────────────────────────────────────────────────────────┐
│                        前端 (React)                              │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ 仓库列表   │ │ 变更面板  │ │ 提交面板  │ │  历史/分支面板   │  │
│  │ (侧边栏)   │ │          │ │          │ │                  │  │
│  └─────┬──────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘  │
│        │             │            │               │              │
│        └─────────────┼────────────┼───────────────┘              │
│                      │ REST API (带 repoId)                      │
├──────────────────────┼───────────────────────────────────────────┤
│                   后端 (Spring Boot)                              │
│  ┌───────────────────▼────────────────────────────┐              │
│  │         GitRepoController (仓库管理 CRUD)       │              │
│  │  /api/git/repos                                │              │
│  └───────────────────┬────────────────────────────┘              │
│  ┌───────────────────▼────────────────────────────┐              │
│  │         GitController (Git 操作)                │              │
│  │  /api/git/repos/{repoId}/status                │              │
│  │  /api/git/repos/{repoId}/diff                  │              │
│  │  /api/git/repos/{repoId}/commit                │              │
│  │  /api/git/repos/{repoId}/branches              │              │
│  │  /api/git/repos/{repoId}/push | pull           │              │
│  │  /api/git/repos/{repoId}/log                   │              │
│  └───────────────────┬────────────────────────────┘              │
│  ┌───────────────────▼────────────────────────────┐              │
│  │  GitRepositoryManager (JGit Repository 缓存池) │              │
│  │  根据 repoId 动态获取/缓存 JGit Repository     │              │
│  └───────────────────┬────────────────────────────┘              │
│  ┌───────────────────▼────────────────────────────┐              │
│  │         GitService (JGit 操作实现)              │              │
│  └────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### 技术选型

| 方案 | 说明 | 推荐 |
|------|------|------|
| **JGit** (纯 Java Git 库) | 无需系统安装 git，跨平台，API 丰富 | ✅ **推荐** |
| **ProcessBuilder 调用 git CLI** | 依赖系统 git，需处理命令行输出解析 | 备选 |

> **推荐使用 JGit**：`org.eclipse.jgit`，Spring Boot 生态兼容良好，无外部依赖。

---

## 3. 后端设计 (Spring Boot)

### 3.1 新增依赖

在 `backend/build.gradle` 中新增：

```groovy
// JGit - Pure Java Git implementation
implementation 'org.eclipse.jgit:org.eclipse.jgit:7.1.0.202411261347-r'
implementation 'org.eclipse.jgit:org.eclipse.jgit.ssh.jsch:7.1.0.202411261347-r'
```

### 3.2 数据库设计

> 与之前的纯操作型不同，多仓库方案需要 **一张数据库表** 来持久化仓库注册信息。

#### 新增表: `quiz_git_repository`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT PK | 主键 (UID Generator) |
| `name` | VARCHAR(100) | 仓库显示名称 (如 "quiz", "my-project") |
| `local_path` | VARCHAR(500) | 本地绝对路径 (如 `d:/idea_repo/quiz`) |
| `remote_url` | VARCHAR(500) | 远程仓库 URL (自动从 .git/config 读取，可选) |
| `default_branch` | VARCHAR(100) | 默认分支 (默认 "master") |
| `description` | VARCHAR(500) | 仓库描述 (可选) |
| `sort_order` | INT | 排序顺序 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |
| `created_by` | BIGINT | 创建用户 |

#### Entity

```java
@Entity
@Table(name = "quiz_git_repository")
public class GitRepository extends BaseEntity {
    private String name;
    private String localPath;
    private String remoteUrl;
    private String defaultBranch;
    private String description;
    private Integer sortOrder;
}
```

### 3.3 数据模型 (DTO)

#### 仓库管理 DTO

| DTO 类 | 用途 | 字段 |
|--------|------|------|
| `GitRepoDto` | 仓库信息 | `id`, `name`, `localPath`, `remoteUrl`, `defaultBranch`, `description`, `isValid`(路径是否存在), `currentBranch` |
| `GitRepoCreateRequest` | 添加仓库请求 | `name`, `localPath`, `description` |

#### Git 操作 DTO

| DTO 类 | 用途 | 字段 |
|--------|------|------|
| `GitStatusDto` | 工作区状态 | `repoId`, `repoName`, `currentBranch`, `ahead`, `behind`, `changedFiles: List<FileChangeDto>`, `isClean` |
| `FileChangeDto` | 单文件变更 | `filePath`, `changeType`(ADD/MODIFY/DELETE/UNTRACKED), `staged`(boolean) |
| `GitDiffDto` | 文件 diff | `filePath`, `oldContent`, `newContent`, `diffContent`(unified diff 文本) |
| `GitCommitRequest` | 提交请求 | `message`, `filesToStage: List<String>`, `amend`(boolean) |
| `GitCommitDto` | 提交记录 | `commitId`, `shortId`, `message`, `author`, `authorEmail`, `date`, `parentIds` |
| `GitBranchDto` | 分支信息 | `name`, `isRemote`, `isCurrent`, `trackingBranch`, `aheadCount`, `behindCount` |
| `GitPushPullResult` | 推送/拉取结果 | `success`, `message`, `hasConflicts`, `conflictFiles: List<String>` |
| `GitLogRequest` | 日志查询 | `branch`, `page`, `size`, `keyword`(搜索提交信息) |

### 3.4 接口设计 (API)

#### 3.4.1 仓库管理 API

基路径: `/api/git/repos`

| 方法 | 路径 | 说明 | 入参 | 出参 |
|------|------|------|------|------|
| GET | `/` | 仓库列表 | - | `List<GitRepoDto>` |
| POST | `/` | 添加仓库 | `GitRepoCreateRequest` | `GitRepoDto` |
| PUT | `/{repoId}` | 更新仓库信息 | `GitRepoCreateRequest` | `GitRepoDto` |
| DELETE | `/{repoId}` | 移除仓库 (仅移除注册，不删本地文件) | - | 成功/失败 |
| POST | `/{repoId}/validate` | 校验仓库路径有效性 | - | `{ valid, message }` |
| POST | `/clone` | 克隆远程仓库 | `cloneUrl`, `localPath`, `name` | `GitRepoDto` |

#### 3.4.2 Git 操作 API

基路径: `/api/git/repos/{repoId}`

> 所有操作 API 都以 `{repoId}` 为路径参数，指定操作的目标仓库。

| 方法 | 路径 | 说明 | 入参 | 出参 |
|------|------|------|------|------|
| GET | `/status` | 获取工作区状态 | - | `GitStatusDto` |
| GET | `/diff` | 查看文件 diff | `filePath`, `staged`(boolean) | `GitDiffDto` |
| POST | `/stage` | 暂存文件 | `filePaths: List<String>` | `GitStatusDto` |
| POST | `/unstage` | 取消暂存 | `filePaths: List<String>` | `GitStatusDto` |
| POST | `/stage-all` | 暂存全部 | - | `GitStatusDto` |
| POST | `/unstage-all` | 取消暂存全部 | - | `GitStatusDto` |
| POST | `/commit` | 提交 | `GitCommitRequest` | `GitCommitDto` |
| POST | `/discard` | 丢弃文件变更 | `filePaths: List<String>` | `GitStatusDto` |
| GET | `/log` | 提交历史 | `branch`, `page`, `size`, `keyword` | `Page<GitCommitDto>` |
| GET | `/log/{commitId}` | 单次提交详情 | `commitId` | `GitCommitDto` + diff 列表 |
| GET | `/branches` | 分支列表 | - | `List<GitBranchDto>` |
| POST | `/branches` | 创建分支 | `branchName`, `startPoint` | `GitBranchDto` |
| POST | `/checkout` | 切换分支 | `branchName` | `GitStatusDto` |
| DELETE | `/branches/{name}` | 删除分支 | `name` | 成功/失败 |
| POST | `/push` | 推送 | `remoteName`(默认origin), `force`(boolean) | `GitPushPullResult` |
| POST | `/pull` | 拉取 | `remoteName`, `rebase`(boolean) | `GitPushPullResult` |
| POST | `/fetch` | 获取远程更新 | `remoteName` | `GitPushPullResult` |
| POST | `/merge` | 合并分支 | `sourceBranch` | `GitPushPullResult` |
| GET | `/stash` | 储藏列表 | - | `List<StashDto>` |
| POST | `/stash` | 创建储藏 | `message` | `StashDto` |
| POST | `/stash/pop` | 弹出储藏 | `stashIndex` | `GitStatusDto` |

### 3.5 核心类

| 文件路径 | 类名 | 角色 |
|----------|------|------|
| `git/entity/GitRepository.java` | `GitRepository` | 仓库注册实体 |
| `git/repository/GitRepositoryRepo.java` | `GitRepositoryRepo` | JPA Repository |
| `git/controller/GitRepoController.java` | `GitRepoController` | 仓库管理 CRUD 端点 |
| `git/controller/GitController.java` | `GitController` | Git 操作 REST 端点 |
| `git/service/GitRepoService.java` | `GitRepoService` | 仓库管理业务逻辑 |
| `git/service/GitService.java` | `GitService` | Git 操作接口定义 |
| `git/service/impl/GitRepoServiceImpl.java` | `GitRepoServiceImpl` | 仓库管理实现 |
| `git/service/impl/GitServiceImpl.java` | `GitServiceImpl` | JGit 操作实现 |
| `git/service/GitRepositoryManager.java` | `GitRepositoryManager` | JGit Repository 缓存池管理 |
| `git/dto/*.java` | 各 DTO | 数据传输对象 |

### 3.6 关键实现说明

#### JGit Repository 缓存池（多仓库核心）

不再使用单例 Bean，而是通过 `GitRepositoryManager` 按需加载和缓存 JGit Repository：

```java
@Component
public class GitRepositoryManager {
    // repoId -> JGit Repository 缓存
    private final ConcurrentHashMap<Long, Repository> cache = new ConcurrentHashMap<>();

    /**
     * 根据 repoId 获取 JGit Repository，有缓存则复用，否则动态打开
     */
    public Repository getRepository(Long repoId, String localPath) throws IOException {
        return cache.computeIfAbsent(repoId, id -> {
            return new FileRepositoryBuilder()
                .setGitDir(new File(localPath, ".git"))
                .build();
        });
    }

    /** 移除仓库时清除缓存 */
    public void evict(Long repoId) {
        Repository repo = cache.remove(repoId);
        if (repo != null) repo.close();
    }
}
```

#### GitService 接口签名（带 repoId）

```java
public interface GitService {
    GitStatusDto getStatus(Long repoId);
    GitDiffDto getDiff(Long repoId, String filePath, boolean staged);
    GitStatusDto stageFiles(Long repoId, List<String> filePaths);
    GitCommitDto commit(Long repoId, GitCommitRequest request);
    List<GitBranchDto> getBranches(Long repoId);
    GitPushPullResult push(Long repoId, String remoteName, boolean force);
    // ... 其它方法均带 repoId
}
```

#### 仓库路径安全校验

```java
/** 添加仓库时校验 */
public void validateRepoPath(String localPath) {
    File gitDir = new File(localPath, ".git");
    if (!gitDir.exists() || !gitDir.isDirectory()) {
        throw new BusinessException("路径不是有效的 Git 仓库: " + localPath);
    }
    // 防止路径穿越
    Path normalized = Paths.get(localPath).toAbsolutePath().normalize();
    // 可选：限制在允许的根目录下
}
```

#### 安全性考虑

- **权限控制**: Git 操作 API 应仅允许管理员角色访问，在 `SecurityConfig` 中配置 `/api/git/**` 的角色限制
- **操作审计**: commit/push/pull 等写操作记录到系统日志(`SysLog`)
- **路径安全**: 添加仓库时校验路径合法性，防止路径穿越攻击
- **仓库隔离**: 每个仓库操作使用独立的 JGit Repository 实例，互不干扰
- **并发控制**: 同一仓库的写操作通过 `ReentrantLock`（按 repoId）串行化

---

## 4. 前端设计 (React + Arco Design)

### 4.1 页面位置

```
frontend/src/pages/GitDesktop/
├── index.tsx                    # 主页面入口 (仓库列表 + 操作区)
├── style/
│   └── index.module.css         # 页面样式
├── components/
│   ├── RepoList.tsx             # 左侧侧边栏：仓库列表
│   ├── RepoAddModal.tsx         # 添加/克隆仓库弹窗
│   ├── FileChangeList.tsx       # 变更文件列表
│   ├── DiffViewer.tsx           # 文件 diff 展示
│   ├── CommitPanel.tsx          # 提交信息输入 & 提交按钮
│   ├── BranchSelector.tsx       # 分支切换下拉
│   ├── CommitHistory.tsx        # 提交历史列表
│   ├── CommitDetail.tsx         # 提交详情 (点击历史条目)
│   ├── SyncStatus.tsx           # 同步状态指示器 (ahead/behind)
│   ├── BranchManager.tsx        # 分支管理弹窗
│   └── StashManager.tsx         # 储藏管理弹窗
└── hooks/
    └── useGitOperations.ts      # 封装 Git API 调用 & 状态管理
```

### 4.2 页面布局

```
┌──────────────────────────────────────────────────────────────────────┐
│  [📦 quiz ▼]  [🔀 master ▼]  ← → Fetch origin   [⬆ Push 2]        │ ← 顶部工具栏
├───────────┬──────────────┬───────────────────────────┬───────────────┤
│  仓库列表  │  Changes (5) │                           │ History       │
│  ───────  │  ──────────  │                           │ ──────────   │
│  📦 quiz  │  ☑ M app.tsx │  --- a/src/app.tsx        │ abc1234      │
│  ● active │  ☑ A new.ts  │  +++ b/src/app.tsx        │ feat: xxx    │
│           │  ☐ D old.ts  │  @@ -12,6 +12,8 @@       │ 2h ago       │
│  📦 blog  │              │   import React ...        │              │
│           │              │  -const old = true;       │ def5678      │
│  📦 tools │              │  +const old = false;      │ fix: yyy     │
│           │──────────────│  +const added = 1;        │ 5h ago       │
│           │ Summary      │                           │              │
│  ─────── │ [__________] │                           │              │
│  [+ 添加] │ Description  │                           │              │
│           │ [__________] │                           │              │
│           │ [Commit ✓]   │                           │              │
└───────────┴──────────────┴───────────────────────────┴───────────────┘
```

### 4.3 组件设计

#### 仓库列表侧边栏 (`RepoList`)

| 功能 | 说明 |
|------|------|
| 仓库列表 | 展示所有注册的仓库，高亮当前选中仓库 |
| 状态指示 | 每个仓库旁显示：当前分支、未提交变更数 |
| 添加仓库 | 底部 `+` 按钮 → 弹窗填写路径或克隆 URL |
| 右键菜单 | 移除仓库、在资源管理器中打开、编辑仓库信息 |
| 切换仓库 | 点击仓库项 → 右侧操作区刷新为该仓库的状态 |

#### 添加仓库弹窗 (`RepoAddModal`)

- **Tab 1: 添加本地仓库** — 输入本地路径 (支持文件夹选择)，自动校验是否为有效 Git 仓库
- **Tab 2: 克隆远程仓库** — 输入 URL + 本地保存路径，后台执行 `git clone`

#### 顶部工具栏

| 元素 | 组件 | 功能 |
|------|------|------|
| 仓库切换 | `Select` | 快速切换当前仓库 (与侧边栏同步) |
| 分支选择器 | `BranchSelector` | `Select` 下拉切换分支 |
| Fetch 按钮 | `Button` | 触发 fetch |
| Push/Pull 按钮 | `Button` with `Badge` | 显示 ahead/behind 数，触发 push/pull |
| 分支管理 | `Button → Modal` | 创建/删除分支、查看远程分支 |

#### 变更文件列表 (`FileChangeList`)

- 使用 `Checkbox.Group` + 自定义列表项
- 文件图标根据 `changeType` 显示不同颜色标识：
  - 🟢 A (Added) | 🟡 M (Modified) | 🔴 D (Deleted) | ⚪ ? (Untracked)
- 支持全选、反选
- 右键菜单：丢弃变更(discard)、在文件管理器中打开

#### Diff 查看器 (`DiffViewer`)

- 使用 `react-diff-viewer-continued` 或自行基于 `<pre>` 渲染 unified diff
- 支持切换 **行内对比 (inline)** 和 **左右对比 (split)** 模式
- 语法高亮：根据文件扩展名选择高亮语言
- 大文件折叠提示

#### 提交面板 (`CommitPanel`)

- `Input` 输入 summary (必填，限 72 字符)
- `TextArea` 输入详细描述 (选填)
- `Checkbox` 勾选 amend (修改上次提交)
- `Button` 提交按钮，disabled 条件：无暂存文件 或 summary 为空

#### 提交历史 (`CommitHistory`)

- 使用 `List` 或 `Timeline` 展示
- 每条记录显示：短 hash、提交信息、作者、相对时间
- 支持搜索/过滤提交信息
- 点击条目 → 右侧/弹窗展示该次提交的 diff 详情
- 分页加载 (`useGitOperations` 管理 `page`/`size`)

### 4.4 API 调用层

#### `frontend/src/services/gitService.ts`

```typescript
import request from '@/core/src/request';

const BASE = '/api/git/repos';

export const gitService = {
  // ===== 仓库管理 =====
  listRepos: () => request.get(BASE),
  addRepo: (data: GitRepoCreateRequest) => request.post(BASE, data),
  updateRepo: (repoId: number, data: GitRepoCreateRequest) =>
    request.put(`${BASE}/${repoId}`, data),
  removeRepo: (repoId: number) => request.delete(`${BASE}/${repoId}`),
  validateRepo: (repoId: number) =>
    request.post(`${BASE}/${repoId}/validate`),
  cloneRepo: (data: { cloneUrl: string; localPath: string; name: string }) =>
    request.post(`${BASE}/clone`, data),

  // ===== Git 操作 (均以 repoId 为前缀) =====
  getStatus: (repoId: number) =>
    request.get(`${BASE}/${repoId}/status`),
  getDiff: (repoId: number, filePath: string, staged: boolean) =>
    request.get(`${BASE}/${repoId}/diff`, { params: { filePath, staged } }),
  stageFiles: (repoId: number, filePaths: string[]) =>
    request.post(`${BASE}/${repoId}/stage`, { filePaths }),
  unstageFiles: (repoId: number, filePaths: string[]) =>
    request.post(`${BASE}/${repoId}/unstage`, { filePaths }),
  stageAll: (repoId: number) =>
    request.post(`${BASE}/${repoId}/stage-all`),
  unstageAll: (repoId: number) =>
    request.post(`${BASE}/${repoId}/unstage-all`),
  commit: (repoId: number, data: GitCommitRequest) =>
    request.post(`${BASE}/${repoId}/commit`, data),
  discardFiles: (repoId: number, filePaths: string[]) =>
    request.post(`${BASE}/${repoId}/discard`, { filePaths }),
  getLog: (repoId: number, params: GitLogRequest) =>
    request.get(`${BASE}/${repoId}/log`, { params }),
  getCommitDetail: (repoId: number, commitId: string) =>
    request.get(`${BASE}/${repoId}/log/${commitId}`),
  getBranches: (repoId: number) =>
    request.get(`${BASE}/${repoId}/branches`),
  createBranch: (repoId: number, branchName: string, startPoint?: string) =>
    request.post(`${BASE}/${repoId}/branches`, { branchName, startPoint }),
  checkout: (repoId: number, branchName: string) =>
    request.post(`${BASE}/${repoId}/checkout`, { branchName }),
  deleteBranch: (repoId: number, name: string) =>
    request.delete(`${BASE}/${repoId}/branches/${name}`),
  push: (repoId: number, force?: boolean) =>
    request.post(`${BASE}/${repoId}/push`, { force }),
  pull: (repoId: number, rebase?: boolean) =>
    request.post(`${BASE}/${repoId}/pull`, { rebase }),
  fetch: (repoId: number) =>
    request.post(`${BASE}/${repoId}/fetch`),
};
```

### 4.5 状态管理

使用 **Local State** (React Hook)，无需 Redux。核心状态封装在 `useGitOperations` 中：

```typescript
const useGitOperations = () => {
  // ===== 仓库层 =====
  const [repos, setRepos] = useState<GitRepoDto[]>([]);
  const [activeRepoId, setActiveRepoId] = useState<number | null>(null);

  // ===== 当前仓库 Git 状态 =====
  const [status, setStatus] = useState<GitStatusDto | null>(null);
  const [branches, setBranches] = useState<GitBranchDto[]>([]);
  const [commitLog, setCommitLog] = useState<GitCommitDto[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<GitDiffDto | null>(null);
  const [loading, setLoading] = useState(false);

  // 切换仓库时自动加载该仓库的 status/branches
  useEffect(() => {
    if (activeRepoId) {
      refreshStatus(activeRepoId);
      loadBranches(activeRepoId);
    }
  }, [activeRepoId]);
  // ...
};
```

### 4.6 路由注册

在 `frontend/src/router/index.tsx` 的 `protectedPages` 数组中新增：

```typescript
{ path: "git-desktop", element: <GitDesktopPage />, requiredPath: "git-desktop" },
```

---

## 5. 实施步骤 (Action Plan)

### Phase 1: 后端基础 — 仓库管理 + Git 核心操作

1. **[Backend]** 在 `build.gradle` 添加 JGit 依赖
2. **[Backend]** 创建 `git/entity/GitRepository.java` — 仓库实体
3. **[Backend]** 创建 `git/repository/GitRepositoryRepo.java` — JPA Repository
4. **[Backend]** 创建 DTO 类 (`git/dto/` 目录下所有 DTO)
5. **[Backend]** 创建 `git/service/GitRepositoryManager.java` — JGit Repository 缓存池
6. **[Backend]** 创建 `git/service/GitRepoService.java` + 实现 — 仓库 CRUD
7. **[Backend]** 创建 `git/service/GitService.java` + 实现 — Git 操作核心
8. **[Backend]** 创建 `git/controller/GitRepoController.java` — 仓库管理端点
9. **[Backend]** 创建 `git/controller/GitController.java` — Git 操作端点
10. **[Skill]** 运行 Java 编译检查

### Phase 2: 前端页面 — 仓库管理 + 变更提交

11. **[Frontend]** 创建 `services/gitService.ts` — API 调用层
12. **[Frontend]** 创建 `pages/GitDesktop/hooks/useGitOperations.ts` — 状态管理
13. **[Frontend]** 创建 `pages/GitDesktop/components/RepoList.tsx` — 仓库列表侧边栏
14. **[Frontend]** 创建 `pages/GitDesktop/components/RepoAddModal.tsx` — 添加仓库弹窗
15. **[Frontend]** 创建 `pages/GitDesktop/components/FileChangeList.tsx` — 文件变更列表
16. **[Frontend]** 创建 `pages/GitDesktop/components/DiffViewer.tsx` — Diff 查看器
17. **[Frontend]** 创建 `pages/GitDesktop/components/CommitPanel.tsx` — 提交面板
18. **[Frontend]** 创建 `pages/GitDesktop/index.tsx` — 主页面布局
19. **[Frontend]** 在 `router/index.tsx` 注册路由
20. **[Skill]** 运行前端编译检查

### Phase 3: 前端页面 — 分支 & 历史

21. **[Frontend]** 创建 `BranchSelector.tsx` — 分支切换
22. **[Frontend]** 创建 `CommitHistory.tsx` — 提交历史列表
23. **[Frontend]** 创建 `CommitDetail.tsx` — 提交详情
24. **[Frontend]** 创建 `SyncStatus.tsx` — Push/Pull 状态
25. **[Frontend]** 创建 `BranchManager.tsx` — 分支管理弹窗
26. **[Skill]** 运行前端编译检查

### Phase 4: 进阶功能

27. **[Frontend]** 创建 `StashManager.tsx` — 储藏管理
28. **[Backend]** 添加 stash 相关 API 实现
29. **[Backend]** 添加克隆仓库接口实现 (`/clone`)
30. **[Backend]** 添加操作审计日志
31. **[Backend]** 配置 SecurityConfig 角色权限
32. **[Skill]** 全量编译检查 (前后端)

---

## 6. 风险与注意事项

| 风险 | 影响 | 缓解方案 |
|------|------|----------|
| JGit SSH 认证配置 | push/pull 到远端时需认证 | 使用本机 SSH Key 或在仓库配置中存储 Token |
| 大仓库性能 | diff/log 操作可能慢 | 分页加载、限制 diff 文件大小、后端异步处理 |
| 多仓库 Repository 缓存内存 | 同时打开过多仓库占内存 | LRU 淘汰策略，闲置超时自动关闭 |
| 并发操作冲突 | 多个用户同时操作同一仓库 | 按 repoId 加锁 (`ConcurrentHashMap<Long, ReentrantLock>`) |
| 仓库路径失效 | 用户删除/移动了本地仓库 | 访问时动态校验，标记为无效并提示 |
| 文件编码问题 | 非 UTF-8 文件 diff 显示乱码 | 检测文件编码，二进制文件标记为不可 diff |
| 破坏性操作 | discard/force push 不可逆 | 前端二次确认弹窗，后端操作前自动 stash |
| 克隆大仓库耗时 | clone 操作可能很久 | 异步执行 + WebSocket 推送进度 |

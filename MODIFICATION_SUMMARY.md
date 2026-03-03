# 题库页面 AI 生成题目功能修改总结

## 修改目标
参考知识点页面（Prompt）的实现方式，将题库页面（Question）的 AI 生成题目功能中的知识点改为知识点标题，并增加知识点内容编辑器。

## 修改文件

### 1. `/frontend/src/pages/Question/index.tsx`

#### 主要修改列表：

1. **导入 Monaco Editor**
   - 添加 `import Editor from "@monaco-editor/react";`
   - 用于创建 MarkdownEditor 组件

2. **创建 MarkdownEditor 组件**
   - 参考 Prompt 页面的实现
   - 高度为 300px（比 Prompt 的 400px 略小）
   - 支持 Markdown 语言高亮
   - 配置 minimap、行号、自动换行等选项

3. **状态管理修改**
   - 删除 `knowledge` 状态（原来用于存储知识点描述）
   - 添加 `knowledgeTitle` 状态（存储知识点标题）
   - 添加 `knowledgeContent` 状态（存储知识点内容）
   - 保留 `knowledgeDescrDisabled` 和 `editKnowledgeDescrDisabled` 状态（用于控制表单字段是否禁用）

4. **生成表单字段修改**
   - 将原来的单个 "知识点" TextArea 字段改为：
     - "知识点标题" Input 字段
     - "知识点内容" MarkdownEditor 组件
   - 知识点内容编辑器使用 `render` 属性来正确绑定值和处理变化

5. **生成对话框"确定"按钮逻辑修改**
   - 从表单中获取 `knowledgeTitle` 的值
   - 从表单中获取 `knowledgeContent` 的值
   - 分别保存到 `knowledgeTitle` 和 `knowledgeContent` 状态
   - 然后调用表单提交

6. **handleGenerateSubmit 函数修改**
   - 删除了清空 `knowledgeTitle` 和 `knowledgeContent` 状态的代码
   - 这样可以保留用户输入的值供后续保存题目时使用

7. **handleRetryGenerate 函数修改**
   - 删除了清空 `knowledgeTitle` 和 `knowledgeContent` 状态的代码
   - 重试生成时保留知识点信息

8. **handleSaveSelectedQuestions 函数修改**
   - 移除了对 `knowledge` 状态的引用
   - 添加了知识点创建逻辑：
     - 当 `knowledgeTitle` 和 `knowledgeContent` 都有值时，创建新的知识点
     - 知识点名称：`knowledgeTitle`
     - 知识点描述：`knowledgeContent`
     - 关联到指定的学科和分类
   - 保存后清空 `knowledgeTitle` 和 `knowledgeContent` 状态

9. **handleCancelSave 函数修改**
   - 添加了清空 `knowledgeTitle` 和 `knowledgeContent` 状态的代码
   - 确保取消保存时完全重置状态

### 2. `/frontend/src/pages/Question/api/index.ts`

#### 修改内容：

1. **generateQuestionsStreamUrl 函数修改**
   - 添加对 `knowledgeTitle` 参数的支持
   - 添加对 `knowledgeContent` 参数的支持
   - 保持向后兼容性，如果有 `knowledgeDescr` 也会发送
   - 参数顺序：knowledgeTitle -> knowledgeContent -> knowledgeDescr -> num -> modelName

## 使用流程

1. 用户打开 AI 生成题目对话框
2. 选择学科和分类
3. 输入知识点标题（必填）
4. 在 Markdown 编辑器中输入知识点内容（必填）
5. 选择模型和生成数量
6. 点击"确定"按钮
7. 系统根据提供的知识点标题和内容生成题目
8. 生成完成后，用户可以选择保存的题目
9. 点击"保存选中题目"
10. 系统创建新的知识点，并将其关联到保存的题目

## 技术相关

### MarkdownEditor 组件特性
- 使用 Monaco Editor 作为实现基础
- 支持 Markdown 语法高亮
- 自动换行（wordWrap: on）
- 禁用 minimap 和行号显示
- 字体大小 14px

### API 参数变化
- 原参数：`knowledgeDescr` (字符串，知识点描述)
- 新参数：
  - `knowledgeTitle` (字符串，知识点标题)
  - `knowledgeContent` (字符串，知识点内容，Markdown 格式)

### 向后兼容性
- 后端 API 需要支持新的 `knowledgeTitle` 和 `knowledgeContent` 参数
- 保留了对 `knowledgeDescr` 的支持以维持向后兼容

## 后端需求

后端 `/api/question/generate/stream` 接口需要支持以下参数：
- `knowledgeTitle`：知识点标题（新增）
- `knowledgeContent`：知识点内容，Markdown 格式（新增）
- `knowledgeDescr`：知识点描述（保持向后兼容）
- `num`：生成题目数量
- `modelName`：模型名称

## 修改完成日期
2026年3月3日

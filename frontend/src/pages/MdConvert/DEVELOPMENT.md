# MD转换工具开发文档

## 项目结构

```
frontend/src/pages/MdConvert/
├── index.tsx           # 主组件（React + TypeScript）
├── index.less          # 样式文件（Less）
└── README.md           # 使用指南

frontend/src/services/
└── mdConvertService.ts # API 服务层

backend/src/main/java/com/ck/quiz/mdconvert/
├── controller/
│   └── MdConvertController.java  # REST API 控制器
├── dto/
│   └── MdConvertRequest.java     # 请求数据传输对象
└── service/
    └── MdConvertService.java     # 业务逻辑服务
```

## 功能模块

### 1. 前端组件 (MdConvert)

#### 主要特性
- **Markdown 输入**：大文本区域用于粘贴或输入 Markdown 内容
- **文件名配置**：分别为 Word 和 PDF 设置自定义文件名
- **实时 HTML 预览**：转换后即时显示 HTML 渲染效果
- **多格式导出**：支持 Word、PDF、HTML 三种格式
- **快速指南**：右侧显示功能说明和支持信息

#### 核心函数

```typescript
// 转换为 HTML（预览）
handleConvertToHtml(): Promise<void>

// 转换为 Word (DOCX)
handleConvertToWord(): Promise<void>

// 转换为 PDF
handleConvertToPdf(): Promise<void>

// 复制 HTML 代码
handleCopyHtmlResult(): void

// 下载 HTML 文件
handleDownloadHtml(): void

// 加载示例内容
loadSampleMd(): void

// 清空所有输入
handleClear(): void
```

### 2. 前端服务层 (mdConvertService.ts)

提供三个主要的 API 接口：

```typescript
// 转换为 HTML
convertMarkdownToHtml(data: MdConvertHtmlRequest): Promise<MdConvertHtmlResponse>

// 转换为 Word
convertMarkdownToWord(data: MdConvertRequest): Promise<ArrayBuffer>

// 转换为 PDF
convertMarkdownToPdf(data: MdConvertRequest): Promise<ArrayBuffer>
```

### 3. 后端控制器 (MdConvertController.java)

REST API 端点：

- `POST /api/md-convert/to-html` - 转换为 HTML
- `POST /api/md-convert/to-word` - 转换为 Word
- `POST /api/md-convert/to-pdf` - 转换为 PDF

### 4. 后端服务层 (MdConvertService.java)

核心转换逻辑：

```java
// 将 Markdown 转换为 HTML
public String convertToHtml(String mdContent)

// 将 Markdown 转换为 Word (DOCX)
public byte[] convertToWord(String mdContent, String fileName)

// 将 Markdown 转换为 PDF
public byte[] convertToPdf(String mdContent, String fileName)
```

## 技术方案

### Markdown 解析
- **库**：Flexmark (com.vladsch.flexmark:flexmark-all:0.64.8)
- **用途**：解析 Markdown 文本为 AST（抽象语法树）
- **优势**：功能完整，支持 CommonMark 和扩展语法

### HTML 生成
- **实现**：Flexmark 内置 HtmlRenderer
- **特点**：直接从 AST 渲染为 HTML
- **样式**：在前端使用 CSS 进行样式化

### Word 生成
- **库**：Apache POI (org.apache.poi:poi-ooxml:5.2.5)
- **格式**：OOXML (.docx)
- **实现**：逐行解析 Markdown，转换为 Word 段落和格式

### PDF 生成
- **库**：OpenHTML2PDF (org.openhtmltopdf:openhtmltopdf-core:1.0.10)
- **流程**：Markdown → HTML → PDF
- **优势**：支持复杂的 CSS 样式，生成质量高

## API 文档

### 请求/响应格式

#### HTML 转换请求
```json
{
  "mdContent": "# 标题\n\n段落内容"
}
```

#### HTML 转换响应
```json
{
  "success": true,
  "message": "转换成功",
  "data": "<h1>标题</h1>\n<p>段落内容</p>"
}
```

#### Word/PDF 转换请求
```json
{
  "mdContent": "# 标题\n\n段落内容",
  "fileName": "my-document"
}
```

#### Word/PDF 转换响应
```
二进制文件数据 (application/vnd.openxmlformats-officedocument.wordprocessingml.document 或 application/pdf)
```

## 样式系统 (index.less)

### 布局结构
- 主容器：`.md-convert-container`
- 主布局：`.md-convert-layout`（Grid 二列布局）
- 左列：输入区域（Markdown 输入 + 配置 + 操作按钮）
- 右列：结果区域（HTML 预览 + 快速指南）

### 关键样式类

```less
.md-convert-container        // 整体容器
.md-convert-layout           // 主布局区域
.input-card                  // Markdown 输入卡片
.config-card                 // 配置卡片
.result-card                 // 结果展示卡片
.guide-card                  // 快速指南卡片
.html-preview                // HTML 预览容器
.html-code                   // HTML 代码显示
.loading-state               // 加载状态
.empty-state                 // 空状态
```

### 响应式设计

- **1200px 以上**：二列布局，完整功能
- **768px - 1200px**：优化布局，调整卡片大小
- **576px 以下**：单列布局，竖排显示

## 扩展和自定义

### 1. 添加新的 Markdown 语法支持

在 `MdConvertService.java` 的构造函数中配置 Flexmark 选项：

```java
MutableDataSet options = new MutableDataSet();
options.set(Parser.EXTENSIONS, 
    Arrays.asList(
        TablesExtension.create(),
        StrikethroughExtension.create(),
        // 添加更多扩展
    ));
```

### 2. 自定义 Word 样式

在 `addParagraphToDocument` 方法中修改段落和文本格式：

```java
XWPFParagraph paragraph = document.createParagraph();
paragraph.setStyle("CustomStyle");
XWPFRun run = paragraph.createRun();
run.setFontSize(12);
run.setFontFamily("宋体");
```

### 3. 自定义 PDF 样式

在 `wrapHtmlWithStyles` 方法中添加或修改 CSS：

```java
"body { font-family: Arial, sans-serif; }"
```

### 4. 优化转换性能

- 对大文件进行分块处理
- 异步转换，使用消息队列
- 缓存转换结果

## 已知限制

1. **Word 转换**：复杂的嵌套结构可能不完全支持
2. **图片处理**：网络图片需要完整 URL，本地路径可能无法访问
3. **特殊字符**：某些特殊 Unicode 字符可能不被完全支持
4. **表格支持**：HTML 表格比 Markdown 表格功能更完整
5. **性能**：大文件（>50MB）转换可能较慢

## 测试清单

- [ ] HTML 转换和预览功能
- [ ] Word 导出功能
- [ ] PDF 导出功能
- [ ] 自定义文件名功能
- [ ] 示例加载功能
- [ ] 清空功能
- [ ] 错误处理
- [ ] 响应式布局
- [ ] 复制代码功能
- [ ] 下载文件功能

## 部署和集成

### 前端部署
```bash
cd frontend
npm install
npm run build
```

### 后端部署
```bash
cd backend
./gradlew clean build
java -jar build/libs/quiz-1.0.0.jar
```

### 环境配置

在 `application.yml` 中配置 API 基础 URL：

```yaml
quiz:
  api:
    base-url: http://localhost:8080/quiz
```

## 常见问题排查

### 1. 转换失败，提示"502 Bad Gateway"
- 检查后端服务是否运行
- 查看后端日志获取详细错误信息
- 确保前端 API 地址配置正确

### 2. PDF 转换超时
- 减小 Markdown 文件大小
- 检查网络连接
- 增加后端超时时间配置

### 3. 文件下载失败
- 检查浏览器下载权限
- 查看浏览器控制台是否有错误
- 确认文件名不包含特殊字符

## 相关资源

- [Flexmark GitHub](https://github.com/vsch/flexmark-java)
- [Apache POI 文档](https://poi.apache.org/)
- [OpenHTML2PDF](https://github.com/danfickle/openhtmltopdf)
- [Markdown 规范](https://spec.commonmark.org/)

---

**最后更新**：2024年12月
**维护者**：开发团队

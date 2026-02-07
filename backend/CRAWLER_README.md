# WebMagic 爬虫管理功能

## 功能概述

基于现有的调度功能，集成 WebMagic 框架开发的爬虫管理功能，实现可配置的爬虫任务，支持定时和手动触发。

## 功能特性

### 1. 爬虫配置管理
- **可视化配置**: 通过 Web 界面配置爬虫参数
- **灵活的提取规则**: 支持 XPath、CSS选择器、正则表达式、JSONPath 等多种提取方式
- **请求控制**: 配置线程数、重试次数、请求间隔、超时时间等
- **自定义请求头**: 支持配置 User-Agent、Headers、Cookies 等
- **数据管道**: 支持数据库存储和控制台输出

### 2. 任务集成
- **完全集成调度系统**: 爬虫任务已集成到现有的 Job 和 CronTask 系统
- **手动触发**: 在爬虫管理页面手动触发爬虫任务
- **定时执行**: 可将爬虫任务配置为定时任务，按 Cron 表达式定期执行
- **队列执行**: 支持将爬虫任务放入队列异步执行

### 3. 结果管理
- **数据存储**: 爬取的数据自动存储到数据库
- **结果查看**: 在页面中查看爬取结果
- **关联任务**: 每个结果关联到具体的任务 ID

## 技术架构

### 后端

#### 核心类
1. **WebMagicCrawlerJob** (com.ck.quiz.crawler.job.WebMagicCrawlerJob)
   - 继承 `AbstractAsyncJob`
   - 实现爬虫任务的执行逻辑
   - 支持参数化配置

2. **GenericPageProcessor** (com.ck.quiz.crawler.processor.GenericPageProcessor)
   - 通用页面处理器
   - 根据配置动态提取数据
   - 支持多种提取规则

3. **DatabasePipeline** (com.ck.quiz.crawler.pipeline.DatabasePipeline)
   - 数据存储管道
   - 将爬取结果存入数据库

#### 数据模型
- **crawler_config**: 爬虫配置表
- **crawler_result**: 爬虫结果表

#### REST API
- `GET /api/crawler/config/list` - 获取爬虫配置列表
- `GET /api/crawler/config/{id}` - 获取爬虫配置详情
- `POST /api/crawler/config/save` - 保存爬虫配置
- `POST /api/crawler/config/delete` - 删除爬虫配置
- `POST /api/crawler/trigger/{crawlerConfigId}` - 触发爬虫任务
- `GET /api/crawler/results/{crawlerConfigId}` - 获取爬虫结果

### 前端

#### 页面组件
- **CrawlerManager** (frontend/src/pages/Crawler/index.tsx)
  - 爬虫配置管理界面
  - 支持增删改查
  - 可触发爬虫任务
  - 可查看爬取结果

## 使用说明

### 1. 数据库初始化

执行以下 SQL 脚本初始化数据表：

```sql
-- 位于 backend/sql/crawler_config_table.sql
-- 位于 backend/sql/crawler_result_table.sql
```

### 2. 创建爬虫配置

在爬虫管理页面点击"新增爬虫"，填写以下配置：

#### 基本配置
- **名称**: 爬虫唯一标识
- **标签**: 爬虫描述
- **起始URL**: 爬取的起始页面
- **URL匹配模式**: JSON数组格式，定义需要爬取的URL正则表达式

#### 请求配置
- **线程数**: 并发线程数 (1-10)
- **重试次数**: 请求失败重试次数 (0-10)
- **请求间隔**: 两次请求之间的间隔时间(毫秒)
- **超时时间**: 请求超时时间(毫秒)
- **字符集**: 页面字符编码 (默认 UTF-8)
- **User-Agent**: 浏览器标识

#### HTTP 配置
- **请求头**: JSON格式的HTTP请求头
  ```json
  {
    "Accept": "text/html",
    "Accept-Language": "zh-CN,zh;q=0.9"
  }
  ```

- **Cookies**: JSON格式的Cookie
  ```json
  {
    "sessionId": "xxx",
    "token": "yyy"
  }
  ```

#### 提取规则
使用 JSON 格式定义数据提取规则：

```json
{
  "title": "xpath://title/text()",
  "content": "css:.article-content",
  "author": "regex:作者：(.*?)<",
  "price": "json:$.data.price"
}
```

支持的提取方式：
- `xpath:` - XPath 表达式
- `css:` - CSS 选择器
- `regex:` - 正则表达式
- `json:` - JSONPath (用于 API 接口)

#### 数据管道
- **database**: 存储到数据库 (推荐)
- **console**: 控制台输出 (用于调试)

### 3. 触发爬虫任务

#### 方式一：手动触发
1. 在爬虫配置列表找到目标爬虫
2. 点击操作菜单中的"触发爬虫"
3. 设置最大爬取页数 (0表示不限制)
4. 确认触发

#### 方式二：通过 Job 管理
1. 进入 Job 管理页面
2. 创建新任务，选择任务类型"WebMagic爬虫任务"
3. 配置任务参数：
   ```json
   {
     "crawlerConfigId": "爬虫配置ID",
     "maxPageCount": 100
   }
   ```
4. 提交任务

#### 方式三：配置定时任务
1. 进入定时任务管理页面
2. 创建新的定时任务
3. 选择任务类型"WebMagic爬虫任务"
4. 设置 Cron 表达式 (如: `0 0 2 * * ?` 表示每天凌晨2点执行)
5. 配置任务参数 (同方式二)
6. 启用定时任务

### 4. 查看爬取结果

1. 在爬虫配置列表点击操作菜单中的"查看结果"
2. 弹窗显示该爬虫的所有爬取记录
3. 包含URL、标题、任务ID、爬取时间等信息
4. 可查看提取的详细数据

### 5. 监控任务执行

通过 Job 管理页面查看任务执行状态：
- **PENDING**: 等待执行
- **RUNNING**: 正在执行
- **SUCCESS**: 执行成功
- **FAILED**: 执行失败

每个任务都有对应的日志文件，位于 `logs/CRAWLER-{jobId}.log`

## 配置示例

### 示例1：爬取新闻网站文章

```json
{
  "name": "news-crawler",
  "label": "新闻网站爬虫",
  "startUrl": "https://news.example.com",
  "urlPatterns": "[\"https://news\\.example\\.com/article/.*\"]",
  "threadCount": 3,
  "retryTimes": 3,
  "sleepTime": 2000,
  "timeoutMillis": 10000,
  "charset": "UTF-8",
  "extractRules": "{\"title\":\"xpath://h1[@class='title']/text()\",\"content\":\"css:.article-content\",\"author\":\"xpath://span[@class='author']/text()\",\"publishTime\":\"xpath://time[@class='time']/text()\"}",
  "pipelineType": "database",
  "state": "1"
}
```

### 示例2：爬取API接口数据

```json
{
  "name": "api-crawler",
  "label": "API数据爬虫",
  "startUrl": "https://api.example.com/data",
  "threadCount": 1,
  "retryTimes": 5,
  "sleepTime": 1000,
  "extractRules": "{\"id\":\"json:$.data.id\",\"name\":\"json:$.data.name\",\"value\":\"json:$.data.value\"}",
  "headers": "{\"Accept\":\"application/json\",\"Authorization\":\"Bearer token123\"}",
  "pipelineType": "database",
  "state": "1"
}
```

### 示例3：爬取需要登录的网站

```json
{
  "name": "member-crawler",
  "label": "会员网站爬虫",
  "startUrl": "https://member.example.com/dashboard",
  "urlPatterns": "[\"https://member\\.example\\.com/.*\"]",
  "threadCount": 2,
  "cookies": "{\"sessionId\":\"abc123\",\"userId\":\"12345\"}",
  "headers": "{\"User-Agent\":\"Mozilla/5.0...\"}",
  "extractRules": "{\"title\":\"css:h2.title\",\"content\":\"css:div.content\"}",
  "pipelineType": "database",
  "state": "1"
}
```

## 注意事项

1. **遵守 robots.txt**: 爬取网站前请查看目标网站的 robots.txt 文件
2. **控制爬取速度**: 合理设置请求间隔，避免对目标网站造成压力
3. **处理反爬措施**: 某些网站可能有反爬虫机制，需要配置合适的 User-Agent 和请求头
4. **数据量控制**: 对于大规模爬取，建议设置 maxPageCount 限制页数
5. **日志查看**: 爬虫执行过程中的详细日志会记录在 logs 目录下
6. **法律合规**: 确保爬取行为符合相关法律法规和网站使用条款

## 扩展开发

### 自定义 PageProcessor

如果需要更复杂的页面处理逻辑，可以创建自定义的 PageProcessor：

```java
@Component
public class CustomPageProcessor implements PageProcessor {
    private Site site = Site.me()
        .setRetryTimes(3)
        .setSleepTime(1000);

    @Override
    public void process(Page page) {
        // 自定义处理逻辑
    }

    @Override
    public Site getSite() {
        return site;
    }
}
```

### 自定义 Pipeline

创建自定义的数据处理管道：

```java
public class CustomPipeline implements Pipeline {
    @Override
    public void process(ResultItems resultItems, Task task) {
        // 自定义数据处理
    }
}
```

然后在 WebMagicCrawlerJob 中使用自定义组件。

## 依赖版本

- WebMagic Core: 0.9.1
- WebMagic Extension: 0.9.1
- Spring Boot: 3.5.6
- Java: 17

## 故障排查

### 问题1：爬虫无法启动
- 检查数据库表是否创建成功
- 检查爬虫配置是否正确
- 查看日志文件获取详细错误信息

### 问题2：数据未被提取
- 检查提取规则是否正确
- 使用浏览器开发者工具确认页面结构
- 尝试使用 console 管道输出查看原始数据

### 问题3：爬取速度慢
- 增加线程数
- 减少 sleepTime
- 检查网络连接

### 问题4：被目标网站封禁
- 增加请求间隔 (sleepTime)
- 配置更真实的 User-Agent
- 使用代理 IP (需要扩展开发)

## 后续优化方向

1. **代理IP池**: 支持配置代理IP池，避免IP被封
2. **分布式爬取**: 支持多机分布式爬虫
3. **增量爬取**: 支持只爬取新增或更新的内容
4. **结果导出**: 支持将爬取结果导出为 CSV、Excel 等格式
5. **可视化统计**: 爬取进度和结果的可视化展示
6. **智能去重**: 基于内容的智能去重
7. **JS渲染**: 支持爬取需要 JavaScript 渲染的页面

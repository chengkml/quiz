
---

# 学科管理页面设计文档（前端，选项卡 + 卡片）

## 一、页面概述

**页面名称**：学科管理

**功能描述**：

* 页面使用选项卡 (`Tabs`) 展示不同学科类型或分类（如理科、文科等，可按接口返回动态生成）
* 每个选项卡显示该类学科的卡片列表
* 卡片展示学科基本信息及统计信息（分类数量、题目数量）
* 支持分页展示学科列表
* 卡片可点击下钻进入学科详情页面
* 提供新增、编辑、删除操作

**技术栈**：

* ReactJS
* Arco Design 组件库
* axios / fetch 进行接口请求

---

## 二、页面布局

```
+--------------------------------------------------------+
| [新增学科按钮]                                         |
+--------------------------------------------------------+
| Tabs: [理科] [文科] [其他...]                          |
+--------------------------------------------------------+
| [卡片1] [卡片2] [卡片3] [卡片4]                       |
| [卡片5] [卡片6] ...                                   |
+--------------------------------------------------------+
| 分页组件                                              |
+--------------------------------------------------------+
```

### 2.1 卡片布局

每张卡片信息包括：

* **标题**：学科名称
* **描述**：学科编码 + 学科描述
* **统计信息**：分类数量、题目数量
* **操作按钮**：编辑、删除
* **点击区域**：卡片整体可点击，跳转学科详情页面

---

## 三、组件设计

### 3.1 选项卡 (`Tabs`)

* 顶部 `Tabs` 展示学科分类
* 默认选中第一个选项卡
* 选项卡切换时，刷新对应分类的学科列表

### 3.2 卡片列表

* 使用 `Row` + `Col` 网格布局
* `Card` 展示单个学科信息
* `extra` 区域放置操作按钮
* 点击卡片主体区域跳转学科详情

### 3.3 分页组件

* 使用 Arco Design 的 `Pagination`
* 支持页码切换、每页条数调整

### 3.4 按钮设计

* **新增学科**：页面顶部按钮，弹出新增表单
* **编辑学科**：卡片右上角编辑按钮，弹出编辑表单
* **删除学科**：卡片右上角删除按钮，弹出确认框

---

## 四、交互逻辑

### 4.1 选项卡切换

* 点击不同选项卡，触发接口请求，加载对应学科列表
* 支持分页切换

### 4.2 卡片点击

* 点击卡片主体区域，跳转到学科详情页面
* 可通过 `react-router` 路由传递学科 ID

### 4.3 分页加载

* 页面初始化加载第一个选项卡第一页学科
* 分页变化时刷新当前选项卡列表

### 4.4 新增/编辑/删除

* 新增：弹出表单，提交后刷新当前选项卡列表
* 编辑：点击卡片编辑按钮，弹出表单，提交后刷新
* 删除：点击删除按钮，弹出确认框，确认后刷新

---

## 五、前端示例代码（核心部分）

```jsx
import { Tabs, Row, Col, Card, Button, Pagination, Typography, Message } from '@arco-design/web-react';
import { IconEdit, IconDelete } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { TabPane } = Tabs;

function SubjectTabs({ tabData, subjectsData, onTabChange, onPageChange, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <>
      <Tabs type="card" onChange={onTabChange}>
        {tabData.map(tab => (
          <TabPane key={tab.id} title={tab.name}>
            <Row gutter={[16, 16]}>
              {subjectsData.map(subject => (
                <Col key={subject.id} span={6}>
                  <Card
                    bordered
                    hoverable
                    title={subject.name}
                    extra={
                      <div>
                        <Button size="small" shape="circle" icon={<IconEdit />} onClick={() => onEdit(subject)} />
                        <Button
                          size="small"
                          shape="circle"
                          status="danger"
                          style={{ marginLeft: 8 }}
                          icon={<IconDelete />}
                          onClick={() => onDelete(subject)}
                        />
                      </div>
                    }
                    onClick={() => navigate(`/subject/${subject.id}`)}
                  >
                    <Text type="secondary">编码: {subject.code}</Text>
                    <br />
                    <Text>{subject.descr}</Text>
                    <br />
                    <Text type="secondary">
                      分类数量: {subject.categoryCount || 0} | 题目数量: {subject.questionCount || 0}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            <Pagination
              style={{ marginTop: 16, textAlign: 'right' }}
              current={subjectsData.pageNum + 1}
              total={subjectsData.total}
              pageSize={subjectsData.pageSize}
              onChange={(current, size) => onPageChange(current - 1, size)}
            />
          </TabPane>
        ))}
      </Tabs>
    </>
  );
}
```

---

## 六、样式规范

* 卡片间距使用 `gutter` 设置
* 卡片标题使用默认样式，编码和统计信息使用 `Text type="secondary"`
* 操作按钮间距保持 8px
* 卡片宽度自适应，每行显示数量根据屏幕宽度调整
* 卡片悬浮时有 hover 效果
* 点击卡片主体区域跳转，按钮不触发跳转

---

## 七、注意事项

1. **分页接口**需提供总条数、当前页数据
2. **统计信息**由接口返回或前端合并计算
3. **操作确认**：删除操作必须弹出确认框
4. **响应式布局**：保证移动端和桌面端显示合理
5. **选项卡数据**需接口提供学科分类信息

---

## 八、可扩展功能

* 卡片上显示更多统计信息（例如错题率、学习人数）
* 点击分类数量或题目数量跳转到对应列表
* 支持学科搜索和排序
* 支持选项卡动态增删

---

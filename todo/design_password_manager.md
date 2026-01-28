# 需求设计: 个人密码管理器 (Password Manager)

## 1. 需求背景
用户需要一个安全的地方存储个人账号密码（如网站登录、应用密钥等）。系统需提供加密存储功能，确保数据库管理员也无法直接查看明文密码。仅用户本人（通过界面操作）可解密查看。

## 2. 总体方案
*   **涉及模块**: `PasswordManager` (New)
*   **核心逻辑**:
    *   后端负责数据的加密存储与解密读取。
    *   前端提供增删改查界面，以及“一键复制”或“显示/隐藏”密码的交互。
    *   **加密策略**: 使用 AES-256 对密码字段进行加密。密钥(Secret Key)暂时配置在后端配置文件中（简化版方案）。*注：更高级方案是由用户主密码派生密钥，但当前架构无主密码输入环节，故采用系统密钥加密。*

## 3. 后端设计 (Spring Boot)
*   **包结构**: `com.ck.quiz.password`
*   **加密工具**: `com.ck.quiz.utils.EncryptUtil` (新增) - 提供 AES 加解密方法。
*   **实体 (Entity)**: `com.ck.quiz.password.entity.PasswordEntry`
    *   `title`: 标题 (Site name)
    *   `username`: 用户名
    *   `encryptedPassword`: 加密后的密码 (数据库存密文)
    *   `url`: 网站地址
    *   `category`: 分组/分类
    *   `remark`: 备注
*   **接口 (API)**:
    *   `POST /api/password/create` (入参明文 -> 存密文)
    *   `PUT /api/password/update`
    *   `POST /api/password/search` (只返回脱敏或加密的密码? 建议返回空或掩码，点击"查看"时再请求明文接口)
    *   `GET /api/password/decrypt/{id}` (单独获取明文密码，需验证 `createUser`)
    *   `DELETE /api/password/delete/{id}`

## 4. 前端设计 (React + Arco Design)
*   **页面位置**: `src/pages/PasswordManager/index.tsx`
*   **路由**: `/password/manager` (需确认菜单配置)
*   **交互**:
    *   列表页: 使用 `DataManager`。密码列显示 `******`。
    *   操作:
        *   **查看/复制**: 点击“眼睛”图标，调用 `/decrypt` 接口获取明文，并提供复制按钮。
        *   **新增/编辑**: 弹窗表单。编辑时密码框默认留空（不回显明文，除非用户重新输入）。

## 5. 实施步骤 (Action Plan)
1.  **[Backend] 工具类**: 创建 `EncryptUtil` (AES算法).
2.  **[Backend] 业务层**: 创建 `PasswordEntry` 实体, Repository, Service, Controller。
    *   Service 需在 save 前 encrypt，在 decrypt 接口中 decrypt。
3.  **[Skill] 编译检查**: 运行 Java 编译检查。
4.  **[Frontend] 页面开发**: 创建 `src/pages/PasswordManager`。
    *   配置 API。
    *   实现列表与弹窗。
    *   实现解密查看逻辑 (Table Action Column -> IconEye -> Fetch decrypt -> Modal/Copy).
5.  **[Skill] 编译检查**: 运行前端构建检查。

## 6. 数据结构预览
```java
@Data
public class PasswordEntry extends Model {
    private String title;
    private String username;
    private String encryptedPassword; // 数据库列名 password_data
    private String url;
    private String remark;
}
```

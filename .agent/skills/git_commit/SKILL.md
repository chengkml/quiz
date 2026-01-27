---
name: Git 提交助手
description: 辅助进行代码规范提交，自动化 Git 提交流程
---

此技能用于标准化 Git 提交流程，确保提交信息清晰且符合规范。

## 流程步骤

1. **检查状态**
   先执行 `git status` 查看当前修改的文件。

2. **查看变更**
   执行 `git diff` 或 `git diff --cached` 了解具体修改内容，以便生成准确的 commit message。

3. **添加文件**
   根据需求执行 `git add <file>` 或 `git add .`。
   *注意：请确认不要提交不必要的临时文件或敏感配置文件。*

4. **生成提交信息 (Conventional Commits)**
   提交信息必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。
   格式: `<type>(<scope>): <description>`

   **常用 Type:**
   *   `feat`: 新功能
   *   `fix`: 修复 Bug
   *   `docs`: 文档变更
   *   `style`: 代码格式调整（不影响逻辑）
   *   `refactor`: 代码重构
   *   `perf`: 性能优化
   *   `test`: 测试相关
   *   `chore`: 构建/工具链相关/依赖更新

   **示例:**
   *   `feat(user): add login functionality`
   *   `fix(table): resolve sorting issue in data manager`
   *   `docs(readme): update installation guide`

5. **执行提交**
   ```bash
   git commit -m "feat(module): your message here"
   ```

6. **推送代码 (可选)**
   如果用户明确要求或流程需要推送到远程仓库：
   ```bash
   git push
   ```

## 注意事项
*   在提交前，建议使用其他 Skill (如前端/Java编译检查) 确保代码无误。
*   避免一次性提交过多无关的修改，尽量保持原子性提交(Atomic Commit)。

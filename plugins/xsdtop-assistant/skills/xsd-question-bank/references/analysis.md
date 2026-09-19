# 题库分析参考

只在需要分析题库结构、标签覆盖、题目完整性，或老师明确要求生成 SQL 时读取本文件。普通分析的查询结果只用于内部处理，默认答复不主动出现下面的表名、字段名或 SQL；老师明确索要 SQL、导入脚本或修复脚本时，应按 Skill 的 SQL 工作流提供必要的技术细节。

## 数据口径

- 学科编号：物理 1、数学 2、化学 3。单科密钥以密钥资料里的学科为准；通用密钥（编号 0）按老师本次要操作的学科确定。
- 正常题目：`question.is_deleted = 0`。
- 题目与标签关系：`question_label`。
- 可用标签：`label.deleted = 0 AND label.status = 1`。
- 标签类型：1 阶段或体系，2 章节或目录，3 知识点。

所有题目、题单和标签查询都必须包含当前学科条件。不要查询与老师问题无关的姓名、手机号、邮箱等个人信息。

## 常用分析顺序

老师询问题库或标签整体情况时，优先得到：

1. 正常题目总数。
2. 有标签题目数、无标签题目数及覆盖率。
3. 正在使用的标签数量。
4. 平均每题标签数。
5. 三类标签的数量与题目分布。
6. 高频标签前 20 名。
7. 题量过少但仍在使用的知识点标签。
8. 缺答案、解析或选项的题目数量。

优先使用 `COUNT`、条件聚合与分组查询。明细查询必须添加明确条件和 `LIMIT`，不要拉取整表后在本地计数。

## 可复用查询骨架

下面的 `{subjectId}` 必须替换成本次操作的学科编号（单科密钥即密钥资料里的学科）。

```sql
SELECT COUNT(*) AS total
FROM question
WHERE subject = {subjectId} AND is_deleted = 0
```

```sql
SELECT l.id, l.name, l.type, COUNT(DISTINCT ql.question_id) AS question_count
FROM label l
LEFT JOIN question_label ql ON ql.label_id = l.id
LEFT JOIN question q ON q.id = ql.question_id
  AND q.subject = {subjectId} AND q.is_deleted = 0
WHERE l.subject = {subjectId} AND l.deleted = 0 AND l.status = 1
GROUP BY l.id, l.name, l.type
ORDER BY question_count DESC
LIMIT 50
```

如果数据库报列名或关系不匹配，根据只读报错修正查询。`query_question_bank` 中不要尝试任何写语句或事务语句；老师明确要求时，可以基于已经核实的结构生成写 SQL，交由老师在插件外导入或执行。

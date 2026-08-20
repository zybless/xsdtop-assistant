# 题库分析参考

只在需要分析题库结构、标签覆盖或题目完整性时读取本文件。查询结果只用于内部分析，最终答复不得出现下面的表名、字段名或 SQL。

## 数据口径

- 当前学科由密钥资料决定：物理为 1，数学为 2。
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

下面的 `{subjectId}` 必须替换成密钥资料里的学科编号。

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

如果数据库报列名或关系不匹配，根据只读报错修正查询；不要尝试任何写语句或事务语句。

# 题目录入结构

## 流程不变量

- 一次最多 200 道题。
- 新题单默认隐藏，老师核对后自行公开。
- 图片单批最多 20 张，只支持 JPG、PNG、WEBP、GIF，单张不超过 10MB。
- 每次修改题目内容后必须重新空跑校验。
- 正式录入只能使用最近一次空跑返回的校验编号。

## 顶层结构

```json
{
  "newList": {
    "title": "2026届高三期末卷",
    "description": "",
    "nodeId": 0,
    "publicVisible": false
  },
  "questionListIds": [],
  "labelIds": [],
  "questions": []
}
```

- `questions` 必填，数组顺序就是题单顺序。
- `newList` 可选；提供时必须有不超过 100 字的标题。
- `questionListIds` 可选，只能挂到密钥绑定老师有权维护的题单。
- `labelIds` 是整批统一标签，与每题标签取并集。

## 单题结构

```json
{
  "content": "题干，使用 Markdown；公式用 $...$，图片用 ![](链接)",
  "type": 1,
  "title": "可省略",
  "source": "卷名 第1题",
  "options": [
    { "content": "选项内容", "isCorrect": 1, "sort": 1 }
  ],
  "answers": [
    { "answer": "答案内容", "blankIndex": 0 }
  ],
  "analyses": ["解析正文"],
  "labelIds": [],
  "metricScores": [
    { "metricId": 1, "score": 6 }
  ]
}
```

`content` 和 `type` 必填。建议始终填写来源，格式为“卷名 第 N 题”，便于查重与归并。标题留空时由后端使用来源补齐。

## 题型规则

| type | 题型 | 答案位置 | 必须满足 |
|---|---|---|---|
| 1 | 单选 | `options` | 至少两个选项，恰好一个正确项 |
| 2 | 多选 | `options` | 至少两个选项，至少一个正确项 |
| 3 | 判断 | `answers` | 恰好一条；正确写字符串 `1`，错误写字符串 `0` |
| 4 | 填空 | `answers` | 至少一条；多个空从 `blankIndex: 0` 连续编号 |
| 5 | 解答 | `answers` | 尽量提供参考答案 |

- 选择题不要提供 `answers`；非选择题不要提供 `options`。
- `sort` 可按选项数组顺序从 1 开始；`isCorrect` 只能是 0 或 1。
- 不得把判断题答案写成“正确”“错误”“true”或“false”。

## 标签与评分

不确定时留空，不要猜测。

评分维度固定为：1 难度、2 计算量、3 创新度、4 推荐度、5 优雅度。每项分数必须是 1 至 10 的整数，可以只填有把握的维度。

## 解读空跑结果

- `NEW`：新题。
- `EXISTING`：题库已有，正式录入时复用并补充来源或解析。
- `BATCH_DUPLICATE`：本批内部重复，正式录入时跳过。
- `NO_HASH`：题面过短或主要由图片组成，无法预判重复。

把这些状态翻译成中文告诉老师，不要把英文状态原样展示。

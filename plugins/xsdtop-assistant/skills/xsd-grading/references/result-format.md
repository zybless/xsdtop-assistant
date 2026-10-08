# 单份阅卷结果格式

保存到资料包的 `results/<submissionId>.json`。文件中只放结果，不包含提交编号、满分、总分、批次或版本；工具从资料包读取这些定位信息。

```json
{
  "model": "unknown",
  "reportMd": "# 测评分析报告\n\n本次作答的主要表现……",
  "overallComment": "能建立方程，单位换算需要更仔细。",
  "strengths": ["受力方向判断正确"],
  "weaknesses": ["单位换算遗漏"],
  "suggestions": ["每步计算标明单位"],
  "items": [
    {
      "itemNo": 1,
      "score": 3,
      "judge": 3,
      "answerState": "ANSWERED",
      "reason": "列式正确，但将厘米直接代入米制公式。",
      "studentAnswer": "学生原始作答的忠实转写",
      "rootCause": "未统一量纲",
      "topicDirection": "匀变速直线运动",
      "didWell": "建立了正确的位移关系",
      "toImprove": "先转换为国际单位后再代入",
      "pageNos": [1]
    },
    {
      "itemNo": 2,
      "score": null,
      "judge": null,
      "answerState": "UNREADABLE",
      "reason": "关键分母笔迹无法辨认，须回看清晰原件。",
      "pageNos": [2]
    }
  ]
}
```

示例中的3分只有在网站第1题满分大于3时才成立；应按真实题单填写所有题目。分数最多两位小数，不能依赖数据库替你四舍五入。纯评测所有 `score` 省略或为 null。

必填：`model`（1—64个英文字母、数字或 `_.:/-`）、`reportMd`（最多30000字）、`overallComment`（最多3000字）、`items`（1—200项）。每题必填 `itemNo`、`answerState`、`reason`（最多1000字），以及已判题的 `judge`、计分题的 `score`。

可选的每题字段：`studentAnswer`（最多6000字）、`rootCause`、`didWell`、`toImprove`（各2000字）、`topicDirection`（500字）、`referenceDoubt`（2000字，只向教师展示）、`pageNos`（实际原始答卷页码，从1开始）。优势、短板与建议各最多20条，每条1000字。未确定的描述可以省略，不补造。

工具和服务端同时拒绝漏题、增题、重复题号、超满分、得分判定不一致，以及把识别异常写成零分。存在待复核题时，整卷总分暂留空；逐题已确定结果和诊断仍保存，供教师继续复核。

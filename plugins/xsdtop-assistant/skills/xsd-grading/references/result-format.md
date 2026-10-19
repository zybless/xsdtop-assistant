# 单份阅卷结果格式

保存到资料包的 `results/<submissionId>.json`。文件中只放结果，不包含提交编号、满分、总分、批次或版本；工具从资料包读取这些定位信息。

```json
{
  "model": "unknown",
  "reportMd": "# 测评分析报告\n\n## 整体情况\n\n你能根据质量和加速度选用牛顿第二定律，第1题需要核对最后的乘法。第2题关键笔迹无法辨认，暂不作能力判断。\n\n## 逐题分析\n\n### 第1题\n\n你写出了正确的关系 $F=ma$，但将 $2\\times3$ 算成了5。保留原来的列式，重新计算可得 $F=6\\,\\mathrm{N}$。\n\n### 第2题\n\n关键分母无法辨认，请提供清晰原件后复核。\n\n## 后续练习\n\n先重算第1题，再练习2道给定质量与加速度求力的基础题；每次先口算估计结果，再核对乘法和单位。",
  "overallComment": "能选用牛顿第二定律，第1题最后的乘法需要核对。第2题暂待清晰原件复核。",
  "strengths": ["能用质量和加速度建立力的关系（见第1题）"],
  "weaknesses": ["列式后出现乘法错误（见第1题）"],
  "suggestions": ["重算第1题，再做2道已知质量与加速度求力的基础题，先估计结果再核对乘法与单位。"],
  "items": [
    {
      "itemNo": 1,
      "score": 3,
      "judge": 3,
      "answerState": "ANSWERED",
      "reason": "选用了正确的关系，但将2×3算成了5。",
      "studentAnswer": "F=ma=2×3=5N",
      "topicDirection": "牛顿第二定律",
      "didWell": "写出了关系 $F=ma$，并代入了质量与加速度。",
      "toImprove": "复算 $2\\times3$；保持原来的列式，正确结果为 $F=6\\,\\mathrm{N}$。",
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

示例仅演示结构与公式转义，不是评分细则；第1题的3分必须符合真实给分依据且满分大于3。应按真实题单填写所有题目。分数最多两位小数，不能依赖数据库替你四舍五入。纯评测所有 `score` 省略或为 null。

必填：`model`（1—64个英文字母、数字或 `_.:/-`）、`reportMd`（最多30000字）、`overallComment`（最多3000字）、`items`（1—200项）。每题必填 `itemNo`、`answerState`、`reason`（最多1000字），以及已判题的 `judge`、计分题的 `score`。

可选的每题字段：`studentAnswer`（最多6000字）、`rootCause`、`didWell`、`toImprove`（各2000字）、`topicDirection`（500字）、`referenceDoubt`（2000字，只向教师展示）、`pageNos`（实际原始答卷页码，从1开始）。优势、短板与建议各最多20条，每条1000字。以上是协议容量，不是推荐字数；结构可选不代表应省去已能确认的诊断，内容要求见 [report-quality.md](report-quality.md)。未确定的描述可以省略，不补造；当前协议不接受 `analysis`、`subItems`、`writing` 等网站内部字段。

`reportMd` 是面向学生和家长的完整正文；`overallComment`、列表与逐题字段还会用于网站的分析卡片，两者依据应一致。不要把 `referenceDoubt`、教师裁决请求或批改内部讨论复制进正文。

JSON 文件中的 `\\` 表示字符串里的一个反斜杠，例如 `"$\\frac{1}{2}$"` 解析后才是 `$\frac{1}{2}$`。使用 `JSON.stringify`、`json.dump` 等序列化器保存真实字符串，不手拼 JSON，不全局替换反斜杠。把 `\frac` 直接写进 JSON 字面量会把 `\f` 解析为控制字符；这种损坏必须修正后再校验。转写学生作答时保留原有错误和不确定性，美化公式不得改成正确答案。

工具和服务端同时拒绝漏题、增题、重复题号、超满分、得分判定不一致，以及把识别异常写成零分。存在待复核题时，整卷总分暂留空；逐题已确定结果和诊断仍保存，供教师继续复核。

本地 `validate_*_grading_results` 保留 `successes`、`failures`、`pending`，另返回 `reports` 数组，每项为 `{submissionId, previewPath, qualityPath, quality: {errors, warnings}}`，生成 `quality/<submissionId>.json` 与 `previews/<submissionId>.html`。确定的公式或文本损坏会阻断该份远端校验和提交；缺少诊断的警告用于补齐可确认内容，不要求编造。改稿后重新校验并查看预览。质量结果与预览是本地辅助文件，不添加到上传 JSON 的结果字段中。

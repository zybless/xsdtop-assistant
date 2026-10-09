<p align="center">
  <img src="./plugins/xsdtop-assistant/assets/logo.png" width="112" alt="xsdtop 助手">
</p>

<h1 align="center">xsdtop 助手</h1>

<p align="center">一个连接本地 AI 助手与真实业务能力的轻量插件。</p>

<p align="center"><sub>Codex · Claude Code · DeepSeek Harness</sub></p>

## 简介

这是一个面向真实业务场景的多客户端插件实现。它使用 Skill 描述工作方式，通过 MCP 提供确定的工具边界，并以访问密钥控制权限。

当前发行版覆盖物理、数学与化学内容工作流，支持查询整理、分组与容器管理、题目和题单编辑、批量公开隐藏、图片上传、录入前校验和确认入库。相同结构可以继续承载新的业务能力，也可以作为设计本地 AI 插件时的实现参考。

从 0.3.0 起支持通用密钥：一把密钥可操作物理、数学、化学任一学科，每次写操作由助手明确指定学科；单科密钥用法不变。旧版插件会拒绝通用密钥，请先更新。

从 0.3.1 起识别老师在网站「我的题库 → AI 密钥」自助签发的私库密钥：录题与传图落在老师自己的私人题库，题单只能新建或追加本人私题单，不能查库、不能操作公共题库。

从 0.4.0 起，PDF、Word、PPT 和图片录题由插件在本机直接调用 MinerU 精准解析接口：自动上传文档、等待解析、下载并解压 Markdown 与配图，不再需要打开网页手动上传和复制结果，也无需安装 MinerU、Python 或 uvx。

从 0.5.0 起，助手在文档录题时会读取网站当前学科的启用标签树，逐题建议标签和难度、计算量、创新度、推荐度、优雅度。录题空跑会核对标签并返回逐题预览；老师确认后入库。证据不足的项目留空，网站复用已有题时保留原评分。

### 设计特点

- 一套插件同时适配 Codex、Claude Code 与 DeepSeek Harness。
- Skill 负责告诉 AI 怎样工作，MCP 负责提供稳定、受控的操作出口。
- 客户端只保存访问密钥，权限和数据边界由服务端最终校验。
- 删除操作必须明确确认，题目和题单的完整覆盖编辑会先读取并保留未修改内容。
- 新能力按 Skill 和工具扩展，不需要为每个客户端重写业务逻辑。

## 班级与集训营本地阅卷（0.7.1）

支持班级作业、班级测评和集训营测评：批量下载原卷、答案解析、评分依据与学生原始答卷，由当前 Codex / 本地 Agent 查看、批改并生成报告，再把逐题分数或对错、AI 原判、证据和报告回写网站。这条流程不调用网站 AI；推理是否联网取决于所用客户端和模型。

1. 网站部署配套版本后，管理员在「AI 开放通道 → 修改绑定与能力 → 本地阅卷」中绑定教师，勾选班级或集训营的下载、回写能力；保存后原密钥继续可用。教师也可在「我的题库 → AI 密钥」自助开通。旧密钥不自动授权，班级下载需要有效管理权限、回写需要负责人权限，集训营需要助教及以上权限。
2. 更新插件并新建会话，配置密钥后提供作业或测评网址，或说：“下载这个班级的作业到本机，逐份批改，并把成绩和报告回写网站。”只要求下载或试批时不写入成绩。
3. 助手依次下载、查看原始答卷、保存本地结果、校验、回写。操作规则与结果格式见 [本地阅卷技能](plugins/xsdtop-assistant/skills/xsd-grading/SKILL.md)。

每批最多100份答卷、题单最多200题，单文件64MB、资料总量500MB，超限时分批。默认下载未批答卷，重阅需指定提交；已人工复核或正在批改的答卷会跳过。没有上传解析时生成含答案与配图的教师版 PDF。看不清、缺页或题号无法匹配时留待复核，总分保持空值；网站拒绝漏题、超分、过期快照和覆盖教师复核。下载中断或回写响应丢失时，保留原目录继续，使用同一批次重试。

0.7.1 修复同一 MCP 服务并发下载、校验同一目录时批次不一致和校验记录丢失的问题。不同会话或 MCP 进程使用各自目录。

跨班级/营队按任务分别下载。需先部署配套网站再使用插件，推送本仓库不会自动部署网站。接口、并发与隔离测试说明见 [实现说明](docs/camp-grading-design.md)。真实手写阅卷准确率仍须与教师金标准对比验证。

## 安装

<details open>
<summary><strong>Codex 桌面端（推荐）</strong></summary>

1. 打开 Codex 左侧的「插件」。
2. 点击右上角「添加」，选择「添加市场」。
3. 在「来源」中粘贴以下任意一个地址。

   - GitHub：`zybless/xsdtop-assistant`
   - Gitee：`https://gitee.com/zybless/xsdtop-assistant.git`

4. 点击「添加市场」，进入 `xsdtop` 市场。
5. 找到 `xsdtop 助手`，点击「安装插件」。

安装完成后新建一个任务，对 Codex 说：`配置 xsdtop 访问密钥`。

</details>

<details>
<summary><strong>Codex CLI</strong></summary>

本节仅适用于已经安装 Codex CLI 的用户。先在系统终端添加市场：

使用 GitHub：

```bash
codex plugin marketplace add zybless/xsdtop-assistant
```

无法访问 GitHub 时，使用 Gitee：

```bash
codex plugin marketplace add https://gitee.com/zybless/xsdtop-assistant.git
```

随后在系统终端运行 `codex`，进入 Codex 后输入 `/plugins`，从 `xsdtop` 市场安装 `xsdtop 助手`。安装完成后新建一个会话，再配置访问密钥。

</details>

<details open>
<summary><strong>Claude Code Desktop（推荐）</strong></summary>

1. 打开 Claude Code Desktop，并进入一个本地 Code 会话。
2. 在 Claude Code 的输入框中输入以下任意一条命令，只需添加一次市场。

   使用 GitHub：

   ```text
   /plugin marketplace add zybless/xsdtop-assistant
   ```

   无法访问 GitHub 时，使用 Gitee：

   ```text
   /plugin marketplace add https://gitee.com/zybless/xsdtop-assistant.git
   ```

3. 点击输入框旁边的「+」，选择「Plugins」→「Add plugin」。
4. 找到 `xsdtop 助手`，选择用户级安装，以便在所有本地项目中使用。
5. 如果安装结果提示运行 `/reload-plugins`，在当前输入框中执行该命令。

以上 `/plugin` 命令输入在 Claude Code Desktop 的会话中，不是在系统终端中执行。安装完成后新建一个会话，对 Claude Code 说：`配置 xsdtop 访问密钥`。

</details>

<details>
<summary><strong>Claude Code CLI</strong></summary>

以下命令在系统终端中执行。

使用 GitHub：

```bash
claude plugin marketplace add zybless/xsdtop-assistant
claude plugin install xsdtop-assistant@xsdtop
```

无法访问 GitHub 时，使用 Gitee：

```bash
claude plugin marketplace add https://gitee.com/zybless/xsdtop-assistant.git
claude plugin install xsdtop-assistant@xsdtop
```

</details>

<details>
<summary><strong>DeepSeek Harness</strong></summary>

请先安装 Node.js、pnpm 和当前版本的 DeepSeek Harness。以下命令在系统终端中执行。

使用 GitHub：

```bash
dsh plugin --profile web add github:zybless/xsdtop-assistant
```

无法访问 GitHub 时，使用 Gitee：

```bash
dsh plugin --profile web add git+https://gitee.com/zybless/xsdtop-assistant.git
```

安装成功后重启 `dsh web`，再新建一个任务，对 DSH 说：`配置 xsdtop 访问密钥`。

插件按 DSH Profile 安装。上面的命令安装到 `web` Profile；如果使用其他 Profile，请把 `web` 替换成对应名称。安装包会自动注册 xsdtop Skill 和 MCP 服务，不需要克隆仓库或手工编辑 `cordis.patch.yml`。

如果平时通过 `npx @deepseek-ai/dsh` 启动 DSH，请同样替换上述命令开头的 `dsh`。卸载命令如下，执行后也需要重启对应 Profile：

```bash
dsh plugin --profile web remove @xsdtop/xsdtop-assistant
```

</details>

## 文档录题（无需安装 MinerU）

1. 第一次从文档录题时，助手会给出 [MinerU Token 管理](https://mineru.net/apiManage/token) 的创建步骤。创建个人 Token 后发给助手，插件先向 MinerU 校验（不消耗解析额度），通过后只保存在本机，不会回显。
2. 之后直接提供试卷文件即可。插件把本机文档上传到 MinerU 精准解析接口（默认 `vlm` 模型，开启公式与表格识别），扫描件会开启 OCR；解析完成后把 `full.md` 和 `images/` 解压到文档旁边的“文件名_mineru”文件夹。
3. 大文档一次等不完时，助手会用返回的任务编号继续获取结果，不会重复提交。
4. 助手对照原文校对题目与公式，从网站标签树匹配标签并按统一标尺评估五项指标，上传配图并空跑校验。老师审核逐题建议并确认后正式入库。

本插件只使用精准解析，不使用免密快速模式。单个文档不超过 200MB，支持 PDF、DOC/DOCX、PPT/PPTX、PNG、JPG/JPEG；解析额度按老师的 MinerU 账号计算。MinerU 密钥默认保存在 `~/.xsdtop-assistant/mineru.json`（Windows 为 `%APPDATA%\xsdtop-assistant\mineru.json`），也可以用环境变量 `MINERU_API_TOKEN` 提供。

## 更新

桌面端用户在插件管理页更新或重新安装插件即可。命令行用户可以先刷新市场，再重新安装插件。更新后新建会话。

从 0.3.x 升级到 0.4.0 时，插件不再注册名为 `mineru` 的远程 MCP；若曾手动添加过同名 `mineru` MCP，请先核对其来源并停用或移除，避免助手继续走网页上传流程或调用本地 `uvx`。以前在 MinerU 网页里填写过的 Token 不会自动带过来，更新后第一次解析文档时按提示配置一次即可。市场的 Git 下载方式未改变。

Codex CLI：

```bash
codex plugin marketplace upgrade xsdtop
codex plugin add xsdtop-assistant@xsdtop
```

Claude Code CLI：

```bash
claude plugin marketplace update xsdtop
claude plugin install xsdtop-assistant@xsdtop
```

DeepSeek Harness：

```bash
dsh plugin --profile web update @xsdtop/xsdtop-assistant
```

更新完成后请重启对应的 DSH Profile，并新建会话，使新版 Skill 和工具生效。

## 安全

- 访问密钥仅保存在使用者本机，请勿提交到任何仓库或发送给他人。
- 个人 MinerU Token 经 MinerU 校验后只保存在本机配置文件（权限 600），不写入插件文件；文档只上传到 MinerU 官方解析接口。插件不会自动打开浏览器。
- 正式录入前必须先完成空跑校验，并由使用者明确确认。
- 权限、学科和可用功能全部由服务端校验，插件不能自行扩大权限。

## 镜像

- [GitHub](https://github.com/zybless/xsdtop-assistant)
- [Gitee](https://gitee.com/zybless/xsdtop-assistant)

本仓库提供跨客户端插件的发行结构与可安装示例；核心服务与开发源码不在本仓库公开。

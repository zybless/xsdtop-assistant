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

从 0.2.2 起，PDF、Word 和扫描图片录题直接连接 MinerU 远程 MCP，用户无需安装 MinerU、Python 或 uvx。本地文件通过 MinerU 官方网页上传，在网页填写个人 Token 后进行精准解析，再把 Markdown 或结果包带回对话录题。

### 设计特点

- 一套插件同时适配 Codex、Claude Code 与 DeepSeek Harness。
- Skill 负责告诉 AI 怎样工作，MCP 负责提供稳定、受控的操作出口。
- 客户端只保存访问密钥，权限和数据边界由服务端最终校验。
- 删除操作必须明确确认，题目和题单的完整覆盖编辑会先读取并保留未修改内容。
- 新能力按 Skill 和工具扩展，不需要为每个客户端重写业务逻辑。

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

1. 在对话中提供试卷或请求录题，助手会获取 MinerU 官方上传网页的临时链接。
2. 打开链接，上传文件，或填写可访问的文档 URL。
3. 在 **API Token** 输入框填写个人密钥，扫描件勾选 **Enable OCR**，再点击 **Parse Documents**。密钥在 [MinerU Token 管理](https://mineru.net/apiManage/token) 创建。
4. 解析完成后，使用 **Copy Markdown** 将结果带回对话；有配图时，优先提供 **Download ZIP** 下载的结果包。
5. 助手整理题目并进行空跑校验，老师确认后正式入库。

本插件要求精准解析，请填写有效的个人 Token，不要使用免密快速模式。远程服务不能读取电脑上的文件路径，网页解析结果也不会自动回到对话。上传链接中的临时 `token` 用于进入上传页面，不是个人 API Token。

Codex、Claude 和 DeepSeek Harness 均已内置远程连接，不需要额外粘贴 MCP 配置。本机环境变量不代表远端已经鉴权；`get_mineru_recording_setup` 的 `configured: null` 表示本机无法判断远端状态，并不会阻止获取上传链接。只有独立确认当前远程连接的个人 Token 与精准模式均生效时，才直接调用 URL 解析工具，否则也通过上述官方网页填写 Token 解析。

## 更新

桌面端用户在插件管理页更新或重新安装插件即可。命令行用户可以先刷新市场，再重新安装插件。更新后新建会话。

从旧版升级时，若曾手动添加过同名 `mineru` MCP，请先核对其来源，停用或移除多余的旧配置，避免继续调用本地 `uvx`。本次更新改变 MinerU 接入方式，市场的 Git 下载方式未改变。

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
- 文档通过 MinerU 官方网页上传并解析，个人 MinerU Token 直接填写在该网页，不需要发送到对话或写入插件文件；插件不会自动打开浏览器。
- 正式录入前必须先完成空跑校验，并由使用者明确确认。
- 权限、学科和可用功能全部由服务端校验，插件不能自行扩大权限。

## 镜像

- [GitHub](https://github.com/zybless/xsdtop-assistant)
- [Gitee](https://gitee.com/zybless/xsdtop-assistant)

本仓库提供跨客户端插件的发行结构与可安装示例；核心服务与开发源码不在本仓库公开。

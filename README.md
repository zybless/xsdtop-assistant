<p align="center">
  <img src="./plugins/xsdtop-assistant/assets/logo.png" width="112" alt="xsdtop 助手">
</p>

<h1 align="center">xsdtop 助手</h1>

<p align="center">一个连接本地 AI 助手与真实业务能力的轻量插件。</p>

<p align="center"><sub>Codex · Claude Code · DeepSeek Harness</sub></p>

## 简介

这是一个面向真实业务场景的多客户端插件实现。它使用 Skill 描述工作方式，通过 MCP 提供确定的工具边界，并以访问密钥控制权限。

当前发行版首先覆盖数学与物理内容工作流，支持查询整理、图片上传、录入前校验和确认入库。相同结构可以继续承载新的业务能力，也可以作为设计本地 AI 插件时的实现参考。

### 设计特点

- 一套插件同时适配 Codex、Claude Code 与 DeepSeek Harness。
- Skill 负责告诉 AI 怎样工作，MCP 负责提供稳定、受控的操作出口。
- 客户端只保存访问密钥，权限和数据边界由服务端最终校验。
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

克隆 GitHub 或 Gitee 仓库，然后参考 [`dsh/cordis.example.yml`](./plugins/xsdtop-assistant/dsh/cordis.example.yml) 配置插件目录与 MCP 服务。

</details>

## 更新

桌面端用户在插件管理页更新或重新安装插件即可。命令行用户可以先刷新市场，再重新安装插件。

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

更新完成后请新建会话，使新版 Skill 和工具生效。

## 安全

- 访问密钥仅保存在使用者本机，请勿提交到任何仓库或发送给他人。
- 正式录入前必须先完成空跑校验，并由使用者明确确认。
- 权限、学科和可用功能全部由服务端校验，插件不能自行扩大权限。

## 镜像

- [GitHub](https://github.com/zybless/xsdtop-assistant)
- [Gitee](https://gitee.com/zybless/xsdtop-assistant)

本仓库提供跨客户端插件的发行结构与可安装示例；核心服务与开发源码不在本仓库公开。

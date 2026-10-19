# handout-lab 接入

以 `CodexPlugin/xsdtop-studio/skills/handout-lab/` 为唯一维护与打包来源，保留其中全部文件；`.claude` 目录仅为仓库内旧路径兼容入口，不能作为发行来源。插件包仅包含 `xsd-handout-lab` 授权入口，完整技能及配套脚本从私有 COS 下载。

## 使用链路

每次收到制作、继续、修改、验收、上线或排障请求，入口调用 `prepare_handout_lab` → `GET /api/ai-open/handout-lab/bundle`。后台检查现有 AI 密钥启用状态、有效期、`handout-lab:use` 能力及绑定账号状态，再返回当前版本、SHA-256 和十分钟有效的 COS 签名地址；响应禁止缓存。

MCP 成功鉴权后才检查本地缓存，逐文件核对指纹并拒绝符号链接。文件不变时复用缓存，否则下载、校验并解压到访问密钥配置同目录的 `skills/handout-lab/<版本>-<SHA256>/`。每次请求重新鉴权，拒绝或网络失败均停止使用，不返回旧路径；每帧动画或渲染过程不轮询。下载文件时不向 COS 转发网站密钥，签名地址不返回给模型、不存入缓存记录。

后台使用现有密钥管理的「教学制作 → 讲义动画演示」开关，必须绑定可用账号。自助签发入口不提供此能力，后端亦拒绝自助开通。沿用现有 `ai_query_key.scopes`，没有建表、改表、Redis 或服务器生成动画的改动。

缓存中的原版主文件和脚本字节不变。入口只说明路径映射：原文中的 `.claude/skills/handout-lab/` 指向返回的资源目录，业务工程路径仍相对当前 xsdtop 工程。原版的前端依赖、发版顺序与上线授权继续适用。

## 打包与 COS

在主工程根目录执行：

```bash
python3 CodexPlugin/tools/package_handout_lab.py --version 1.0.1 --output-dir /tmp/xsdtop-handout-lab-1.0.1
```

生成 `bundle.zip` 与包含逐文件指纹的 `bundle.json`。0.9.0配套新包使用1.0.1或更高新版本；不得覆盖已有版本对象。固定 ZIP 元数据，重复打包结果一致。默认版本为 `1.0.0`；修改来源文件后使用 `--version` 指定新版本。

上传使用现有私有桶，凭据从环境变量 `TENCENT_COS_SECRET_ID`、`TENCENT_COS_SECRET_KEY` 读取：

```bash
python3 CodexPlugin/tools/package_handout_lab.py \
  --output-dir /tmp/xsdtop-handout-lab-1.0.1 \
  --version 1.0.1 --upload --bucket <私有桶名称> --region <地域>
```

上传到 `assistant-skills/handout-lab/1.0.1/bundle.zip`。脚本拒绝公共 ACL；同版本存在且内容不同时拒绝覆盖。上传后回读核对 SHA-256，并验证匿名 HEAD 返回 403。不要将完整技能目录或 ZIP 复制进公共插件发行仓库。

后端配置环境变量，值来自 `bundle.json`：

```text
AI_HANDOUT_LAB_BUNDLE_VERSION=1.0.1
AI_HANDOUT_LAB_BUNDLE_OBJECT_KEY=assistant-skills/handout-lab/1.0.1/bundle.zip
AI_HANDOUT_LAB_BUNDLE_SHA256=<bundle.json 中的 sha256>
```

三个配置不完整时接口拒绝领取。先上传 COS、配置并部署后端，再部署后台勾选项、发布插件；旧密钥不自动获得新能力。插件发行版本为 `0.9.0`，按既有发行流程同步 GitHub、Gitee 市场仓库，源码修改不会自动发布。用户更新插件后新建会话。

## 验证

后端覆盖绑定账号、撤销能力、禁用/停用检查、自助开通拒绝、未配置拒绝及固定对象签名。插件覆盖缓存命中后重新鉴权、撤权与断网停止、并发下载合并、校验失败、目录越界、资源上限、stdio MCP 拒绝链路，以及真实实现全部文件的逐字节打包、仓库外解包后资源完整性验证。前端覆盖能力勾选、绑定提示和自助入口不开放。

## 历史发行记录（2026-10-16，插件0.8.0）

- COS 已上传并验证：`ap-shanghai` / `xsd-1328885690` / `assistant-skills/handout-lab/1.0.0/bundle.zip`。
- 包大小 18,640 字节，原版 8 个文件均逐字节保留。
- ZIP SHA-256：`248d9f51c54dcde2a5dec539812136b789d93e5248cf309febb3c3255d22c325`。
- 已实测匿名 HEAD 返回 403，签名 URL 下载成功，整包与逐文件指纹均一致。
- 网站前后端已部署提交 `9b2bd4930`，三个 COS 配置已生效，两个容器健康检查通过。
- 生产构建执行后端 5,407 项测试，零失败、20 项跳过（排除数据库测试组）；前端 2,369 项测试全部通过，类型检查、构建通过。插件 38 项相关测试及发行仓库 9 项检查通过。
- 真实后台与发行插件 stdio MCP 联调：未开通时拒绝；勾选「讲义动画演示」保存后成功领取，原版 8 个文件指纹一致；再次调用复用缓存；取消勾选保存后，即使缓存仍在也拒绝，且不返回技能路径。
- 联调结束后测试密钥已恢复原来的 13 项能力，未保留临时开通权限，也未禁用或重签密钥。
- 公共插件仅分发授权入口、MCP 和说明，打包检查排除了完整技能与 ZIP。[插件发行仓库](https://github.com/zybless/xsdtop-assistant) 与 [Gitee 镜像](https://gitee.com/zybless/xsdtop-assistant) 的版本为 `0.8.0`。

## 当前发行记录（2026-10-19，插件0.9.0）

- 私有COS对象：`ap-shanghai` / `xsd-1328885690` / `assistant-skills/handout-lab/1.0.1/bundle.zip`，保留1.0.0旧对象。
- 真实Studio实现共14个文件，ZIP SHA-256：`9bb9be70caf0ccac2bfff34f37ac8245376c21455da6b9bd51fa18665f05c15c`。
- 上传后回读校验一致，匿名HEAD返回403；完整技能与ZIP未进入公共发行包。
- 生产后端的版本、对象键及SHA-256配置均已更新，使用原镜像重建后健康检查通过；原私有配置已在服务器保存受限权限备份。
- 生产profile已核实协议2。插件63项测试与发行仓库10项检查全部通过，npm安装包在仓库外完成合成阅卷下载、报告校验及离线公式预览验收。
- 本次没有调整任何密钥能力，也没有执行生产录题或成绩回写。

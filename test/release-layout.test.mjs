import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const packageManifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
const pluginRoot = new URL('plugins/xsdtop-assistant/', root)

test('DSH bundle declares a complete installable layer', async () => {
  const patchPath = packageManifest.dsh?.bundle?.patch
  assert.equal(patchPath, './plugins/xsdtop-assistant/dsh/cordis.patch.yml')

  const patch = await readFile(new URL(patchPath, root), 'utf8')
  assert.match(patch, /^- insert:/m)
  assert.match(patch, /id: xsdtop-skill-filesystem/)
  assert.match(patch, /name: '@deepseek-ai\/dsh-skill-filesystem'/)
  assert.match(patch, /providerName: xsdtop/)
  assert.match(patch, /id: xsdtop-mcp/)
  assert.match(patch, /name: '@deepseek-ai\/dsh-mcp-client'/)
  assert.match(patch, /toolCallTimeoutMs: 180000/)
  assert.doesNotMatch(patch, /xsdtop-mineru-mcp|mcp\.mineru\.net/)
  assert.match(patch, /'MINERU_API_TOKEN'/)
  assert.doesNotMatch(patch, /uvx|mineru-open-mcp/)
  assert.match(patch, /node_modules\/@xsdtop\/xsdtop-assistant/)
  assert.doesNotMatch(patch, /XSDTOP_PLUGIN_ROOT|cordis\.example/)

  await access(new URL('skills/xsd-question-bank/SKILL.md', pluginRoot))
  await access(new URL('mcp-server/dist/server.mjs', pluginRoot))
})

test('client manifests share the release version', async () => {
  const codex = JSON.parse(await readFile(new URL('.codex-plugin/plugin.json', pluginRoot), 'utf8'))
  const claude = JSON.parse(await readFile(new URL('.claude-plugin/plugin.json', pluginRoot), 'utf8'))
  assert.equal(codex.version, packageManifest.version)
  assert.equal(claude.version, packageManifest.version)
  const marketplace = JSON.parse(await readFile(new URL('.claude-plugin/marketplace.json', root), 'utf8'))
  assert.equal(marketplace.plugins.find(plugin => plugin.name === codex.name).version, packageManifest.version)
})

test('MinerU parsing runs through the local xsdtop server with the teacher token', async () => {
  const mcp = JSON.parse(await readFile(new URL('.mcp.json', pluginRoot), 'utf8'))
  assert.deepEqual(Object.keys(mcp.mcpServers), ['xsdtop'])
  assert.ok(mcp.mcpServers.xsdtop.env_vars.includes('MINERU_API_TOKEN'))

  const skill = await readFile(new URL('skills/xsd-question-bank/SKILL.md', pluginRoot), 'utf8')
  for (const tool of ['get_mineru_recording_setup', 'configure_mineru_token', 'parse_document_with_mineru', 'get_mineru_parse_result']) {
    assert.match(skill, new RegExp(`\`${tool}\``))
  }
  assert.match(skill, /Never use or suggest Flash\/free mode/)
  assert.match(skill, /Never repeat, log, or include the token/)
  assert.match(skill, /never open a browser automatically/i)
  assert.doesNotMatch(skill, /open_upload_ui|mcp\.mineru\.net/)

  const agent = await readFile(new URL('skills/xsd-question-bank/agents/openai.yaml', pluginRoot), 'utf8')
  assert.doesNotMatch(agent, /value: "mineru"|mcp\.mineru\.net/)

  const server = await readFile(new URL('mcp-server/dist/server.mjs', pluginRoot), 'utf8')
  for (const tool of ['configure_mineru_token', 'clear_mineru_token', 'parse_document_with_mineru', 'get_mineru_parse_result']) {
    assert.ok(server.includes(tool), `server is missing ${tool}`)
  }
  assert.ok(server.includes('https://mineru.net/api/v4'))
})

test('document metadata workflow ships the label tool and scoring guidance', async () => {
  const skill = await readFile(new URL('skills/xsd-question-bank/SKILL.md', pluginRoot), 'utf8')
  const guidance = await readFile(new URL('skills/xsd-question-bank/references/question-metadata.md', pluginRoot), 'utf8')
  const server = await readFile(new URL('mcp-server/dist/server.mjs', pluginRoot), 'utf8')
  assert.match(skill, /list_question_labels/)
  for (const metric of ['难度', '计算量', '创新度', '推荐度', '优雅度']) {
    assert.ok(guidance.includes(`| ${metric} |`), `missing ${metric} rubric`)
  }
  assert.ok(server.includes('list_question_labels'))
  assert.ok(server.includes('/api/label/all/subject/'))
})

test('committed MCP server is valid Node.js', () => {
  const server = fileURLToPath(new URL('mcp-server/dist/server.mjs', pluginRoot))
  const result = spawnSync(process.execPath, ['--check', server], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

test('SQL remains hidden by default and is provided on explicit request', async () => {
  const skill = await readFile(new URL('skills/xsd-question-bank/SKILL.md', pluginRoot), 'utf8')
  const server = await readFile(new URL('mcp-server/dist/server.mjs', pluginRoot), 'utf8')

  assert.match(skill, /Keep implementation details internal by default/)
  assert.match(skill, /When the teacher explicitly asks for SQL[\s\S]*provide it/)
  assert.match(skill, /Do not refuse merely because the answer exposes database table names/)
  assert.match(skill, /Return complete executable SQL/)
  assert.doesNotMatch(skill, /must not expose database table names, field names, SQL/)

  assert.match(server, /\\u9ed8\\u8ba4\\u4e0d\\u4e3b\\u52a8\\u63d0\\u53ca/i)
  assert.match(server, /\\u63d0\\u4f9b\\u5b8c\\u6574\\u53ef\\u6267\\u884c SQL/i)
})

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
})

test('MinerU uses the local stdio MCP without browser upload or bearer auth', async () => {
  const mcp = JSON.parse(await readFile(new URL('.mcp.json', pluginRoot), 'utf8'))
  const mineru = mcp.mcpServers?.mineru
  assert.equal(mineru?.command, 'uvx')
  assert.deepEqual(mineru?.args, ['mineru-open-mcp'])
  assert.ok(mineru?.env_vars?.includes('MINERU_API_TOKEN'))
  assert.ok(mineru?.startup_timeout_sec >= 120)
  assert.equal(mineru?.url, undefined)
  assert.equal(mineru?.bearer_token_env_var, undefined)

  const skill = await readFile(new URL('skills/xsd-question-bank/SKILL.md', pluginRoot), 'utf8')
  assert.match(skill, /call MinerU `parse_documents` directly/)
  assert.match(skill, /never open a browser automatically/i)
  assert.doesNotMatch(skill, /call the MinerU `open_upload_ui` tool/)

  const agent = await readFile(new URL('skills/xsd-question-bank/agents/openai.yaml', pluginRoot), 'utf8')
  assert.match(agent, /value: "mineru"[\s\S]*transport: "stdio"/)
  assert.doesNotMatch(agent, /transport: "streamable-http"/)
})

test('committed MCP server is valid Node.js', () => {
  const server = fileURLToPath(new URL('mcp-server/dist/server.mjs', pluginRoot))
  const result = spawnSync(process.execPath, ['--check', server], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

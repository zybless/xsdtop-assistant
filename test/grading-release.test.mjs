import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const plugin = new URL('plugins/xsdtop-assistant/', root)
const gradingTools = ['list_camp_assessments', 'download_camp_grading_package', 'validate_camp_grading_results', 'commit_camp_grading_results', 'list_class_grading_tasks', 'download_class_grading_package', 'validate_class_grading_results', 'commit_class_grading_results']

test('release includes the local grading skill and result contract', async () => {
  const skill = await readFile(new URL('skills/xsd-grading/SKILL.md', plugin), 'utf8')
  const format = await readFile(new URL('skills/xsd-grading/references/result-format.md', plugin), 'utf8')
  for (const tool of gradingTools) assert.ok(skill.includes(tool), `missing skill tool ${tool}`)
  assert.ok(format.includes('UNREADABLE'))
  assert.ok(format.includes('"score": null'))
  assert.ok(skill.includes('无需重复询问'))
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.ok(manifest.files.includes('plugins/xsdtop-assistant/skills'))
  assert.ok(manifest.files.includes('docs/camp-grading-design.md'))
})

test('distributed stdio MCP advertises grading tools and the explicit commit boundary', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('mcp-server/dist/server.mjs', plugin))], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, XSDTOP_ACCESS_KEY: '', MINERU_API_TOKEN: '' }
  })
  const lines = createInterface({ input: child.stdout })
  const pending = new Map()
  let sequence = 0
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk.toString() })
  lines.on('line', line => {
    const message = JSON.parse(line)
    const waiter = pending.get(message.id)
    if (waiter) {
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)))
      else waiter.resolve(message.result)
    }
  })
  child.on('exit', code => {
    for (const waiter of pending.values()) waiter.reject(new Error(`MCP exited ${code}: ${stderr}`))
    pending.clear()
  })
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
  const timer = setTimeout(() => child.kill(), 8000)
  try {
    const initialized = await request('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'release-smoke', version: '1' } })
    assert.equal(initialized.serverInfo.version, JSON.parse(await readFile(new URL('package.json', root), 'utf8')).version)
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    const listed = await request('tools/list', {})
    for (const name of gradingTools) assert.ok(listed.tools.some(tool => tool.name === name), `missing runtime tool ${name}`)
    for (const name of ['search_questions', 'get_question']) {
      const tool = listed.tools.find(tool => tool.name === name)
      assert.ok(tool, `missing teacher query tool ${name}`)
      assert.equal(tool.annotations.readOnlyHint, true)
      assert.equal(tool.annotations.destructiveHint, false)
    }
    const labelPreview = listed.tools.find(tool => tool.name === 'validate_label_import')
    const labelCommit = listed.tools.find(tool => tool.name === 'commit_label_import')
    assert.ok(labelPreview, 'missing label import preview')
    assert.ok(labelCommit, 'missing label import commit')
    assert.equal(labelPreview.annotations.readOnlyHint, true)
    assert.equal(labelPreview.inputSchema.properties.nodes.maxItems, 5000)
    assert.ok(labelPreview.inputSchema.properties.path)
    assert.equal(labelCommit.annotations.idempotentHint, true)
    assert.deepEqual(labelCommit.inputSchema.required, ['validationId'])
    for (const name of ['get_label_edit_snapshot', 'preview_label_delete']) {
      const tool = listed.tools.find(tool => tool.name === name)
      assert.ok(tool, `missing label management tool ${name}`)
      assert.equal(tool.annotations.readOnlyHint, true)
    }
    const editLabel = listed.tools.find(tool => tool.name === 'update_label')
    assert.ok(editLabel.inputSchema.required.includes('expectedVersion'))
    assert.ok(editLabel.inputSchema.required.includes('name'))
    const deleteLabel = listed.tools.find(tool => tool.name === 'delete_label')
    assert.equal(deleteLabel.inputSchema.properties.confirm.const, true)
    assert.deepEqual(deleteLabel.inputSchema.required, ['validationId', 'confirm'])
    assert.equal(deleteLabel.inputSchema.properties.labelId, undefined)
    assert.equal(deleteLabel.annotations.destructiveHint, true)
    assert.equal(deleteLabel.annotations.idempotentHint, true)
    for (const family of ['camp', 'class']) {
      const commit = listed.tools.find(tool => tool.name === `commit_${family}_grading_results`)
      assert.equal(commit.inputSchema.properties.confirm.const, true)
      assert.equal(commit.annotations.destructiveHint, true)
      assert.equal(listed.tools.find(tool => tool.name === `validate_${family}_grading_results`).annotations.destructiveHint, false)
    }
    const download = listed.tools.find(tool => tool.name === 'download_class_grading_package')
    assert.ok(download.inputSchema.required.includes('taskType'))
    assert.deepEqual(download.inputSchema.properties.taskType.enum, ['assessments', 'homeworks'])
  } finally {
    clearTimeout(timer)
    lines.close()
    child.kill()
  }
})

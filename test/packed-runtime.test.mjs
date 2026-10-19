import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('packed plugin downloads grading guidance and renders formulas without source or node_modules', { timeout: 20000 }, async (t) => {
  const temporary = await mkdtemp(join(tmpdir(), 'xsdtop-packed-runtime-'))
  t.after(() => rm(temporary, { recursive: true, force: true }))
  const pack = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), encoding: 'utf8'
  })
  assert.equal(pack.status, 0, pack.stderr)
  const packed = JSON.parse(pack.stdout)[0]
  const files = packed.files.map(file => file.path)
  for (const asset of ['report-guidelines.md', 'report-preview.css', 'report-preview-LICENSES.txt']) {
    assert.ok(files.includes(`plugins/xsdtop-assistant/mcp-server/dist/${asset}`), `missing ${asset}`)
  }
  assert.equal(files.some(path => path.includes('/node_modules/') || path.includes('/mcp-server/src/')), false)
  const extract = spawnSync('tar', ['-xzf', join(temporary, packed.filename), '-C', temporary], { encoding: 'utf8' })
  assert.equal(extract.status, 0, extract.stderr)
  const basis = 'b'.repeat(64)
  const snapshot = 'c'.repeat(64)
  const route = '/api/ai-open/grading/1/camps/1/assessments/2'
  const profile = { protocolVersion: 2, keyName: 'release fixture', subjectId: 1, subjectName: '物理', scopes: ['camp-grading:read', 'camp-grading:import'] }
  const requests = []
  const http = createServer(async (request, response) => {
    let body = ''
    for await (const chunk of request) body += chunk
    requests.push({ path: request.url, method: request.method, body })
    const json = data => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ code: 200, data })) }
    if (request.url === '/api/ai-open/profile') return json(profile)
    if (request.url === `${route}/package`) return json({
      schemaVersion: 1, campId: 1, assessmentId: 2, subjectId: 1, title: '安装包验收', scoreEnabled: true,
      basisVersion: basis, referenceMd: '# 第1题\n答案 $F=ma$，满分5分', extraPrompt: null,
      rubricItems: [{ itemNo: 1, maxScore: 5 }], paperPath: `${route}/files/paper?version=${basis}`, analysisPath: null,
      submissions: [{ submissionId: 4, displayName: '合成样本', answerFileName: 'answer.pdf', snapshotVersion: snapshot,
        answerPath: `${route}/submissions/4/answer-file?version=${snapshot}` }],
      skippedSubmissionIds: [], remainingSubmissionCount: 0
    })
    if (request.url.startsWith(`${route}/files/`) || request.url.includes('/answer-file?')) {
      response.setHeader('Content-Type', 'application/pdf'); return response.end('%PDF-1.4\nsynthetic fixture')
    }
    if (request.url === `${route}/submissions/4/results`) {
      assert.equal(JSON.parse(body).dryRun, true)
      return json({ recordId: null, dryRun: true, replayed: false, totalScore: 3, needsReviewCount: 0 })
    }
    response.statusCode = 404; response.end()
  })
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => http.close(resolve)))
  const child = spawn(process.execPath, [join(temporary, 'package/plugins/xsdtop-assistant/mcp-server/dist/server.mjs')], {
    cwd: temporary, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env,
      NODE_PATH: '', XSDTOP_ACCESS_KEY: 'xsdq_' + 'a'.repeat(32), XSDTOP_CONFIG: join(temporary, 'config.json'),
      XSDTOP_API_BASE_URL: `http://127.0.0.1:${http.address().port}`, MINERU_API_TOKEN: '' }
  })
  const lines = createInterface({ input: child.stdout })
  const pending = new Map()
  let sequence = 0
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk })
  lines.on('line', line => {
    const message = JSON.parse(line)
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)))
    else waiter.resolve(message.result)
  })
  child.on('exit', code => {
    for (const waiter of pending.values()) waiter.reject(new Error(`MCP exited ${code}: ${stderr}`))
    pending.clear()
  })
  const timer = setTimeout(() => child.kill(), 15000)
  t.after(() => { clearTimeout(timer); lines.close(); child.kill() })
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
  const tool = async (name, args) => {
    const result = await request('tools/call', { name, arguments: args })
    assert.equal(result.isError, undefined, JSON.stringify(result))
    return JSON.parse(result.content.find(block => block.type === 'text').text)
  }
  const init = await request('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'packed-runtime', version: '1' } })
  assert.equal(init.serverInfo.version, packed.version)
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  assert.equal((await tool('get_access_profile', {})).protocolCompatible, true)
  const outputDir = join(temporary, 'grading')
  assert.equal((await tool('download_camp_grading_package', { campId: 1, assessmentId: 2, outputDir })).completed, true)
  assert.match(await readFile(join(outputDir, 'report-guidelines.md'), 'utf8'), /报告/)
  await writeFile(join(outputDir, 'results/4.json'), JSON.stringify({ model: 'release-fixture',
    reportMd: '# 本次诊断\n\n## 第1题\n已列出 $F=ma$，代入时遗漏单位。\n\n## 订正建议\n按单位检查后重算本题。',
    overallComment: '列式正确，需检查单位。', suggestions: ['重新代入并核查单位。'],
    items: [{ itemNo: 1, score: 3, judge: 3, answerState: 'ANSWERED', reason: '列出 $F=ma$，代入单位有误。',
      studentAnswer: '写出 $F=ma$。', topicDirection: '牛顿第二定律', toImprove: '统一单位后重新代入。', pageNos: [1] }]
  }))
  const validated = await tool('validate_camp_grading_results', { packageDir: outputDir })
  assert.deepEqual(validated.failures, [])
  assert.equal(validated.successes.length, 1)
  const preview = await readFile(validated.reports[0].previewPath, 'utf8')
  assert.match(preview, /class="katex"/)
  assert.match(preview, /data:font\/woff2;base64,/)
  assert.equal(requests.filter(request => request.method === 'POST').length, 1)
  assert.equal((await tool('inspect_grading_package', { packageDir: outputDir })).counts.validated, 1)
})

const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync, readdirSync } = require('node:fs')
const { join } = require('node:path')
const { gzipSync } = require('node:zlib')
const ejs = require('ejs')
const { transformSync } = require('esbuild')
const { runInNewContext } = require('node:vm')
const resume = require('../src/config.json')
const exhibit = require('../src/exhibit.json')

const html = readFileSync(join(__dirname, '../dist/index.html'), 'utf8')

test('static résumé preserves every experience, highlight, and education entry without JavaScript', () => {
  const ids = [...html.matchAll(/<details class="experience-record" id="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, resume.exp.length)
  assert.equal(new Set(ids).size, ids.length)
  const main = html.slice(html.indexOf('<main>'), html.indexOf('</main>'))
  for (const experience of resume.exp) {
    for (const text of [experience.company, experience.occupation, experience.description, ...(experience.highlights ?? [])]) {
      assert.ok(main.includes(ejs.escapeXML(text)), `Missing résumé fact: ${text}`)
    }
  }
  for (const education of resume.edu) {
    for (const text of [education.school, education.degree, ...education.descriptions]) {
      assert.ok(main.includes(ejs.escapeXML(text)), `Missing education fact: ${text}`)
    }
  }
  for (const capability of resume.capabilities) {
    assert.ok(main.includes(ejs.escapeXML(capability.items.join(' / '))))
  }
  assert.ok(html.includes(`href="mailto:${resume.info.email.user}@${resume.info.email.host}"`))
})

test('every station and capability evidence link resolves to a real résumé chapter', () => {
  const ids = new Set([...html.matchAll(/<details class="experience-record" id="([^"]+)"/g)].map((match) => match[1]))
  const stations = new Set(exhibit.stations.map((station) => station.id))
  for (const station of exhibit.stations) {
    assert.ok(ids.has(station.record), `Invalid station chapter: ${station.record}`)
    assert.ok(html.includes(`href="#${station.record}" data-station="${station.id}"`))
  }
  for (const filter of exhibit.filters) {
    assert.ok(filter.records.length > 0)
    for (const id of filter.records) assert.ok(ids.has(id), `Invalid evidence chapter: ${id}`)
    for (const id of filter.stations) assert.ok(stations.has(id), `Invalid evidence station: ${id}`)
    assert.ok(html.includes(`data-filter="${filter.id}" aria-pressed="false"`))
  }
})

test('chronological milestones cover each role once and render their personal stories', () => {
  const ids = [...html.matchAll(/<details class="experience-record" id="([^"]+)"/g)].map((match) => match[1])
  const covered = exhibit.stations.flatMap((station) => station.records)
  assert.deepEqual([...covered].sort(), [...ids].sort())
  for (const [index, station] of exhibit.stations.entries()) {
    assert.ok(station.records.includes(station.record), 'Entry point must belong to its milestone')
    if (index) assert.ok(station.startYear > exhibit.stations[index - 1].startYear)
    const article = html.split(`data-milestone="${station.id}"`)[1]?.split('</a>')[0]
    assert.ok(article?.includes(ejs.escapeXML(station.summary)), `Missing career story: ${station.id}`)
    assert.ok(article?.includes(ejs.escapeXML(station.subtitle)), `Missing companies: ${station.id}`)
    assert.ok(article?.includes(ejs.escapeXML(station.period)), `Missing career dates: ${station.id}`)
  }
  const initialStory = html.split('id="chapter-dock"')[1]?.split('<nav class="route-map"')[0]
  assert.ok(initialStory?.includes(ejs.escapeXML(exhibit.stations[0].summary)))
  assert.ok(initialStory?.includes(ejs.escapeXML(exhibit.stations[0].proof)))
})

test('production assets are locally bundled and stay within the compressed transfer budget', () => {
  const directory = join(__dirname, '../dist/static')
  const scripts = readdirSync(directory).filter((file) => file.endsWith('.js'))
  assert.ok(scripts.includes('main.js'))
  assert.ok(scripts.some((file) => file.startsWith('scene-')), '3D should load in a separate chunk')
  const bytes = scripts.reduce((total, file) => total + gzipSync(readFileSync(join(directory, file))).byteLength, 0)
  assert.ok(bytes < 1024 * 1024, `JavaScript transfer budget exceeded: ${bytes} bytes`)
  assert.ok(!/<script[^>]+src="https?:/.test(html), 'No runtime dependency on a third-party script CDN')
  assert.doesNotThrow(() => JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]))
})

test('free travel stays on the route and selects the nearest career signal', () => {
  const source = readFileSync(join(__dirname, '../src/journey.ts'), 'utf8')
  const compiled = transformSync(source, { loader: 'ts', format: 'cjs' }).code
  const module = { exports: {} }
  runInNewContext(compiled, { module, exports: module.exports })
  const { clampJourneyProgress, nearestSignal } = module.exports
  assert.equal(clampJourneyProgress(-100), 0.018)
  assert.equal(clampJourneyProgress(100), 0.94)
  assert.equal(clampJourneyProgress(0.5), 0.5)
  assert.deepEqual([0.14, 0.34, 0.61, 0.9].map(nearestSignal), [0, 1, 2, 3])
  assert.throws(() => clampJourneyProgress(NaN), /must be finite/)
  assert.throws(() => nearestSignal(Infinity), /must be finite/)
})

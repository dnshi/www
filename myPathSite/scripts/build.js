const { mkdir, readFile, writeFile, copyFile } = require('fs/promises')
const path = require('path')
const ejs = require('ejs')
const esbuild = require('esbuild')
const { gzipSync } = require('zlib')
const config = require('../src/config.json')
const exhibit = require('../src/exhibit.json')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

async function build() {
  const [css, template] = await Promise.all([
    readFile(path.join(root, 'src/main.css'), 'utf8'),
    readFile(path.join(root, 'src/index.html'), 'utf8')
  ])

  const records = config.exp.map((record) => ({
    ...record,
    id: `${record.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}-${record.period.slice(0, 4)}`
  }))
  const recordIds = new Set(records.map((record) => record.id))
  const stationIds = new Set(exhibit.stations.map((station) => station.id))
  for (const reference of [
    ...exhibit.stations.map((station) => station.record),
    ...exhibit.stations.flatMap((station) => station.records),
    ...exhibit.filters.flatMap((filter) => filter.records)
  ]) {
    if (!recordIds.has(reference)) throw new Error(`Unknown experience in exhibit: ${reference}`)
  }
  for (const reference of exhibit.filters.flatMap((filter) => filter.stations)) {
    if (!stationIds.has(reference)) throw new Error(`Unknown station in exhibit: ${reference}`)
  }
  const milestoneRecords = exhibit.stations.flatMap((station) => station.records)
  if (new Set(milestoneRecords).size !== milestoneRecords.length
    || records.some((record) => !milestoneRecords.includes(record.id))) {
    throw new Error('Each experience must belong to exactly one career milestone')
  }
  for (const [index, station] of exhibit.stations.entries()) {
    if (!station.records.includes(station.record)) throw new Error(`Milestone entry point is not a member: ${station.id}`)
    if (index && station.startYear <= exhibit.stations[index - 1].startYear) throw new Error('Career milestones must be chronological')
  }
  const html = ejs.render(template, {
    ...config,
    records,
    exhibit,
    css,
    personJson: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Dean Shi',
      jobTitle: config.exp[0].occupation,
      url: 'https://deanshi.com/',
      sameAs: config.info.labels.filter((label) => ['github', 'linkedin'].includes(label.id)).map((label) => label.url),
      description: config.meta.description
    }).replace(/</g, '\\u003c')
  })

  await mkdir(dist, { recursive: true })
  await Promise.all([
    writeFile(path.join(dist, 'index.html'), html),
    copyFile(path.join(root, 'src/og.svg'), path.join(dist, 'og.svg')),
    esbuild.build({
      entryPoints: [path.join(root, 'src/main.ts')],
      outdir: path.join(dist, 'static'),
      bundle: true,
      splitting: true,
      format: 'esm',
      target: 'es2022',
      minify: true,
      metafile: true
    }).then(async (result) => {
      let total = 0
      for (const file of Object.keys(result.metafile.outputs)) {
        total += gzipSync(await readFile(file)).byteLength
      }
      console.log(`JavaScript transfer budget: ${(total / 1024).toFixed(1)} KiB gzip / 1024 KiB`)
      if (total > 1024 * 1024) throw new Error('JavaScript exceeds the 1 MiB gzip budget')
    })
  ])
}

build().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

const { mkdir, readFile, writeFile, copyFile } = require('fs/promises')
const path = require('path')
const ejs = require('ejs')
const config = require('../src/config.json')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

async function build() {
  const [css, template] = await Promise.all([
    readFile(path.join(root, 'src/main.css'), 'utf8'),
    readFile(path.join(root, 'src/index.html'), 'utf8')
  ])

  const html = ejs.render(template, {
    ...config,
    css
  })

  await mkdir(dist, { recursive: true })
  await Promise.all([
    writeFile(path.join(dist, 'index.html'), html),
    copyFile(path.join(root, 'src/og.svg'), path.join(dist, 'og.svg'))
  ])
}

build().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

const gulp = require('gulp')
const ejs = require('gulp-ejs')
const stylus = require('gulp-stylus')
const htmlmin = require('gulp-htmlmin')
const autoprefixer = require('gulp-autoprefixer')
const del = require('del')
const { readFile } = require('fs')
const { promisify } = require('util')
const config = require('./src/config.json')

const readFileAsync = promisify(readFile)

// Compile EJS
gulp.task('ejs', ['clean', 'stylus'], async () => {
  config.css = await readFileAsync('./dist/static/main.css', 'utf8')
  return gulp.src('./src/index.ejs')
    .pipe(ejs(config, {}, { ext: '.html' }))
    .pipe(htmlmin({ removeComments: true, collapseWhitespace: true, removeAttributeQuotes: true }))
    .pipe(gulp.dest('./dist'))
})

// Compile stylus to css file
gulp.task('stylus', ['clean'], () =>
  gulp.src('./src/main.styl')
    .pipe(stylus({ compress: true }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./dist/static'))
)

// Clean dist
gulp.task('clean', (cb) => del('./dist', cb))

// Build
gulp.task('default', ['ejs'])

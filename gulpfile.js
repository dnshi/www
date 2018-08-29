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
async function runEJS() {
  config.css = await readFileAsync('./dist/static/main.css', 'utf8')
  return gulp.src('./src/index.ejs')
    .pipe(ejs(config, {}, { ext: '.html' }))
    .pipe(htmlmin({ removeComments: true, collapseWhitespace: true, removeAttributeQuotes: true }))
    .pipe(gulp.dest('./dist'))
}

// Compile stylus to css file
function runStylus() {
  return gulp.src('./src/main.styl')
    .pipe(stylus({ compress: true }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./dist/static'))
}

// Clean dist
const clean = () => del('./dist')

// Export modules
exports.clean = clean;
exports.runStylus = runStylus;
exports.runEJS = runEJS;

// Run task
const build = gulp.series(clean, runStylus, runEJS);
gulp.task('build', build);

// Build
gulp.task('default', build)

const gulp = require('gulp')
const ejs = require('gulp-ejs')
const stylus = require('gulp-stylus')
const htmlmin = require('gulp-htmlmin')
const {
  readFile
} = require('fs')
const {
  promisify
} = require('util')
const config = require('./src/config.json')

const readFileAsync = promisify(readFile)

// Compile EJS
async function runEJS() {
  config.css = await readFileAsync('./dist/static/main.css', 'utf8')
  return gulp.src('./src/index.html')
    .pipe(ejs(config))
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
    }))
    .pipe(gulp.dest('./dist'))
}

// Compile stylus to css file
function runStylus() {
  return gulp.src('./src/main.styl')
    .pipe(stylus({
      compress: true
    }))
    .pipe(gulp.dest('./dist/static'))
}

// Export modules
exports.runStylus = runStylus;
exports.runEJS = runEJS;

// Run task
const build = gulp.series(runStylus, runEJS);
gulp.task('build', build);

// Build
gulp.task('default', build)

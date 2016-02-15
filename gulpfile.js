const
gulp = require('gulp'),
ejs = require('gulp-ejs'),
stylus = require('gulp-stylus'),
htmlmin = require('gulp-htmlmin'),
autoprefixer = require('gulp-autoprefixer'),
del = require('del'),
fs = require('fs'),
config = require('./src/config.json');

// Compile EJS
gulp.task('ejs', ['clean', 'stylus'], () => {
  fs.readFile('./dist/static/main.css', 'utf8', (err, data) =>
    err ? console.log(err) : config.css = data
  );

  return gulp.src('./src/index.ejs')
    .pipe(ejs(config))
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true, removeAttributeQuotes: true}))
    .pipe(gulp.dest('./dist'));
});

// Compile stylus to css file
gulp.task('stylus', ['clean'], () =>
  gulp.src('./src/main.styl')
    .pipe(stylus({ compress: true }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./dist/static'))
);

// Clean dist
gulp.task('clean', (cb) => del('./dist', cb));

// Build
gulp.task('default', ['ejs']);

const
gulp = require('gulp'),
ejs = require('gulp-ejs'),
stylus = require('gulp-stylus'),
minifyHTML = require('gulp-minify-html'),
autoprefixer = require('gulp-autoprefixer'),
del = require('del'),
fs = require('fs'),
config = require('./config.json');

// Compile EJS
gulp.task('ejs', ['clean', 'stylus'], () => {
  fs.readFile('./dist/static/main.css', 'utf8', (err, data) =>
    err ? console.log(err) : config.css = data
  );

  return gulp.src('./index.ejs')
    .pipe(ejs(config))
    .pipe(minifyHTML({ conditionals: true, spare: true }))
    .pipe(gulp.dest('./dist'));
});

// Compile CSS from stylus files
gulp.task('stylus', ['clean'], () =>
  gulp.src('./static/main.styl')
    .pipe(stylus({ compress: true }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(gulp.dest('./dist/static'))
);

// Clean dist
gulp.task('clean', (cb) => del('./dist', cb));

// Build
gulp.task('default', ['ejs']);

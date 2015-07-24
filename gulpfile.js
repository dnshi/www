var gulp = require('gulp');
var ejs = require('gulp-ejs');
var stylus = require('gulp-stylus');
var minifyHTML = require('gulp-minify-html');
var autoprefixer = require('gulp-autoprefixer');
var ghPages = require('gulp-gh-pages');
var del = require('del');
var fs = require('fs');
var config = require('./config.json');

// Compile EJS
gulp.task('ejs', ['clean', 'stylus'], function () {
    fs.readFile('./dist/static/main.css', 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        config.css = data;
    });

    return gulp.src('./index.ejs')
        .pipe(ejs(config))
        .pipe(minifyHTML({
            conditionals: true,
            spare: true
        }))
        .pipe(gulp.dest('./dist'));
});

// Compile CSS from stylus files
gulp.task('stylus', ['clean'], function () {
    return gulp.src('./static/main.styl')
        .pipe(stylus({ compress: true }))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(gulp.dest('./dist/static'));
});

// Copy png files to dist
gulp.task('copy', ['clean'], function () {
    return gulp.src('./static/*.png')
        .pipe(gulp.dest('./dist/static'));
});

gulp.task('cname', ['default'], function () {
    return gulp.src('./CNAME')
        .pipe(gulp.dest('./dist'));
});

// Clean dist
gulp.task('clean', (function () {
    var triggered = false;
    return function (cb) {
        triggered ? cb() : triggered = !del('./dist', cb);
    };
})());

// Deploy to Github Pages
gulp.task('deploy', ['cname'], function () {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});

// Build
gulp.task('default', ['ejs', 'copy']);

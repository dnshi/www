var gulp = require('gulp');
var ejs = require('gulp-ejs');
var stylus = require('gulp-stylus');
var minifyHTML = require('gulp-minify-html');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');

// Compile EJS
gulp.task('ejs', ['clean'], function () {
    return gulp.src('./index.ejs')
        .pipe(ejs(require('./config.json')))
        .pipe(minifyHTML({
            conditionals: true,
            spare: true
        }))
        .pipe(gulp.dest('./dist'));
});

// Compile CSS from stylus files
gulp.task('stylus', ['clean'], function () {
    return gulp.src('./static/main.styl')
        .pipe(stylus({
            compress: true
        }))
        .pipe(autoprefixer({
            cascade: false
        }))
        .pipe(gulp.dest('./dist/static'));
});

// Copy png files to dist
gulp.task('copy', ['clean'], function () {
    return gulp.src('./static/*.png')
        .pipe(gulp.dest('./dist/static'));
});

// Clean dist
gulp.task('clean', (function () {
    var triggered = false;
    return function (cb) {
        triggered ? cb() : triggered = !del('./dist', cb);
    };
})());

// Build
gulp.task('default', ['ejs', 'stylus', 'copy']);

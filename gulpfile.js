var gulp = require('gulp');
var ejs = require('gulp-ejs');
var stylus = require('gulp-stylus');
var minifyHTML = require('gulp-minify-html');

// Compile EJS
gulp.task('ejs', function () {
    return gulp.src('./index.ejs')
        .pipe(ejs(require('./config.json')))
        .pipe(minifyHTML({
            conditionals: true,
            spare: true
        }))
        .pipe(gulp.dest('./dist'));
});

// Compile CSS from stylus files
gulp.task('stylus', function () {
    return gulp.src('./main.styl')
        .pipe(stylus({
            compress: true
        }))
        .pipe(gulp.dest('./dist'));
});

// Build
gulp.task('default', ['ejs', 'stylus']);

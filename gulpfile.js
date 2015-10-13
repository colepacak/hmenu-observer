var gulp = require('gulp');
var sass = require('gulp-sass');
var livereload = require('gulp-livereload');
var sourcemaps = require('gulp-sourcemaps');
var concat = require("gulp-concat");
var browserify = require('browserify');
var babelify= require('babelify');
var util = require('gulp-util');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');

gulp.task('build', function() {
  browserify('./src/js/horizontal-menu.js', { debug: true })
    .add(require.resolve('babel/polyfill'))
    .transform(babelify)
    .bundle()
    .on('error', util.log.bind(util, 'Browserify Error'))
    .pipe(source('./js/horizontal-menu.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
});

gulp.task('sass', function () {
    gulp.src('src/sass/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({errLogToConsole: true}))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('dist/css'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    livereload.listen({host: null});
    gulp.watch('src/sass/**/*.scss', ['sass']);
    gulp.watch('src/js/**/*.js', ['build']);
    gulp.watch('dist/css/**/*.css').on('change', livereload.changed);
});

// Default task
gulp.task('default', ['sass', 'watch', 'build']);

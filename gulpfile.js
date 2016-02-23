var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var babel = require('babelify');
var brfs = require('brfs');

function compile () {
  var bundler = browserify('./index.js', {'debug': true}).transform(babel).transform(brfs, {'global': true});

  bundler.bundle()
    .on('error', function onError (err) {
      console.error(err); this.emit('end');
    })
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({'loadMaps': true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./build'));

  return;
}

gulp.task('build', function b () {
  return compile();
});

gulp.task('default', ['build']);

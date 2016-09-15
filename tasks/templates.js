var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({lazy: true}),
    vinylPaths = require('vinyl-paths'),
    del = require('del'),
    templates = require('./templates'),
    filter = require('gulp-filter'),
    lazyPipe = require('lazypipe'),
    touch = require('touch');

var pipes = {
    jade: lazyPipe().pipe($.jade, {})
};

module.exports = {
    buildTemplates: buildTemplates,
    watchTemplates: watchTemplates,
    watchStyles: watchStyles
};

function buildTemplates(config) {
    var jade_filter = filter('**/*.jade', {restore: true}),
        destDir = 'dist', stream;

    stream = gulp.src(['src/**/*.jade', 'src/components/**/*.html']).pipe($.plumber());

    if (!config.compile) {
        return stream.pipe(jade_filter).
            pipe($.changed(destDir, {extension: '.html'})).
            pipe(pipes.jade()).
            pipe(jade_filter.restore).
            pipe(gulp.dest(destDir));
    }

    return stream.pipe(pipes.jade()).
        pipe($.angularTemplatecache({module: 'mtc-shop', root: '/'})).
        pipe(gulp.dest('dist'));
}

function watchTemplates() {
    var deletedOnly = fileEvents('unlink'),
        addedChangedOnly = fileEvents('add', 'change');

    return $.watch(['src/**/*.jade']).
        pipe(deletedOnly).
        pipe($.rename(function(file) {
            file.dirname = '../../dist/' + file.dirname;
            file.extname = '.html';
            return file;
        })).
        pipe(vinylPaths(del)).
        pipe(deletedOnly.restore).
        pipe(addedChangedOnly).
        pipe(pipes.jade()).
        pipe(gulp.dest('dist')).
        pipe(addedChangedOnly.restore).
        on('data', function() {
            touch('dist/update', {force: true});
        });
}

function watchStyles() {
    var deletedOnly = fileEvents('unlink'),
        addedChangedOnly = fileEvents('add', 'change');

    return $.watch(['src/**/*.css']).
        pipe(deletedOnly).
        pipe($.rename(function(file) {
            file.dirname = '../../dist/' + file.dirname;
            return file;
        })).
        pipe(vinylPaths(del)).
        pipe(deletedOnly.restore).
        pipe(addedChangedOnly).
        pipe(gulp.dest('dist')).
        pipe(addedChangedOnly.restore);
}

function fileEvents() {
    var passEvents = Array.prototype.slice.call(arguments);

    return filter(function(file) {
        return passEvents.indexOf(file.event) > -1;
    }, {restore: true});
}
